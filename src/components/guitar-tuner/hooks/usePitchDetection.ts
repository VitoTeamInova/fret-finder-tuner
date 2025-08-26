import { useState, useEffect, useRef, useCallback } from 'react';
import { TuningStatus } from '../types';

export const usePitchDetection = (isActive: boolean, toleranceCents: number = 10, micSensitivity: number = 0.01) => {
  const [currentPitch, setCurrentPitch] = useState<TuningStatus | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const noteFromFrequency = useCallback((frequency: number): string => {
    const A4 = 440;
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    if (frequency <= 0) return '';
    
    const noteNumber = Math.round(12 * Math.log2(frequency / A4)) + 69;
    const noteIndex = (noteNumber - 12) % 12;
    
    return notes[noteIndex < 0 ? noteIndex + 12 : noteIndex];
  }, []);

  const getCentsFromFrequency = useCallback((frequency: number, targetFrequency: number): number => {
    if (frequency <= 0 || targetFrequency <= 0) return 0;
    return Math.round(1200 * Math.log2(frequency / targetFrequency));
  }, []);

  const autoCorrelate = useCallback((buffer: Float32Array, sampleRate: number): number => {
    // Improved autocorrelation with adaptive sensitivity and windowing
    const SIZE = buffer.length;

    // Root-mean-square to estimate signal level
    let rms = 0;
    for (let i = 0; i < SIZE; i++) {
      const val = buffer[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);

    // Map micSensitivity (0.001..0.1) so higher values mean lower threshold (more sensitive)
    const sensNorm = Math.min(1, Math.max(0, (micSensitivity - 0.001) / (0.1 - 0.001)));
    const levelThreshold = 0.012 - sensNorm * 0.010; // ranges ~0.012 (low) -> ~0.002 (high)
    if (rms < levelThreshold) return -1;

    // Remove DC offset
    let mean = 0;
    for (let i = 0; i < SIZE; i++) mean += buffer[i];
    mean /= SIZE;
    for (let i = 0; i < SIZE; i++) buffer[i] -= mean;

    // Apply Hann window to reduce spectral leakage
    const N = SIZE - 1;
    for (let i = 0; i < SIZE; i++) {
      const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N);
      buffer[i] *= w;
    }

    let bestOffset = -1;
    let bestCorrelation = 0;
    const MIN_SAMPLES = 2;
    const MAX_SAMPLES = Math.floor(SIZE / 2);
    const correlations = new Array(MAX_SAMPLES).fill(0);

    for (let offset = MIN_SAMPLES; offset < MAX_SAMPLES; offset++) {
      let correlation = 0;
      for (let i = 0; i < MAX_SAMPLES; i++) {
        correlation += buffer[i] * buffer[i + offset];
      }
      correlations[offset] = correlation;
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }
    }

    if (bestOffset === -1 || bestCorrelation < 1e-6) return -1;

    // Parabolic interpolation around the peak for sub-sample accuracy
    const prev = correlations[bestOffset - 1] ?? 0;
    const next = correlations[bestOffset + 1] ?? 0;
    const denom = 2 * (2 * correlations[bestOffset] - next - prev) || 1;
    const shift = (next - prev) / denom;
    const period = bestOffset + shift;

    const freq = sampleRate / period;
    return isFinite(freq) && freq > 0 ? freq : -1;
  }, [micSensitivity]);

  const detectPitch = useCallback(() => {
    if (!analyserRef.current || !audioContextRef.current) return;
    
    const bufferLength = analyserRef.current.fftSize;
    const buffer = new Float32Array(bufferLength);
    
    analyserRef.current.getFloatTimeDomainData(buffer);
    
    const frequency = autoCorrelate(buffer, audioContextRef.current.sampleRate);
    
    if (frequency > 40 && frequency < 2000) { // Extended range for high E and B strings
      const note = noteFromFrequency(frequency);
      
      // Find the closest target frequency for this note
      const A4 = 440;
      const noteNumber = Math.round(12 * Math.log2(frequency / A4)) + 69;
      const targetFrequency = A4 * Math.pow(2, (noteNumber - 69) / 12);
      
      const cents = getCentsFromFrequency(frequency, targetFrequency);
      const isInTune = Math.abs(cents) <= toleranceCents;
      const isSharp = cents > toleranceCents;
      const isFlat = cents < -toleranceCents;
      
      setCurrentPitch({
        note,
        frequency,
        cents,
        isInTune,
        isSharp,
        isFlat
      });
    } else {
      setCurrentPitch(null);
    }
    
    if (isActive) {
      animationFrameRef.current = requestAnimationFrame(detectPitch);
    }
  }, [isActive, autoCorrelate, noteFromFrequency, getCentsFromFrequency]);

  const startDetection = useCallback(async () => {
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false
        }
      });
      
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);

      // Prefilter to improve pitch detection (reduce rumble and hiss)
      const highpass = audioContextRef.current.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 70;

      const lowpass = audioContextRef.current.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 1500;

      source.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 16384; // Larger FFT for better high frequency resolution
      analyserRef.current.smoothingTimeConstant = 0.01; // Less smoothing for responsiveness
      
      detectPitch();
    } catch (error) {
      console.error('Error starting pitch detection:', error);
    }
  }, [detectPitch]);

  const stopDetection = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    analyserRef.current = null;
    setCurrentPitch(null);
  }, []);

  useEffect(() => {
    if (isActive) {
      startDetection();
    } else {
      stopDetection();
    }
    
    return () => stopDetection();
  }, [isActive, startDetection, stopDetection]);

  return currentPitch;
};