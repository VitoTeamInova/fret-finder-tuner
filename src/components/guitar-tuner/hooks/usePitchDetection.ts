import { useState, useEffect, useRef, useCallback } from 'react';
import { TuningStatus } from '../types';

export const usePitchDetection = (isActive: boolean) => {
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
    // Based on Chris Wilson's autocorrelation pitch detection
    const SIZE = buffer.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) {
      const val = buffer[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return -1; // too little signal

    // Remove DC offset
    let mean = 0;
    for (let i = 0; i < SIZE; i++) mean += buffer[i];
    mean /= SIZE;
    for (let i = 0; i < SIZE; i++) buffer[i] -= mean;

    let bestOffset = -1;
    let bestCorrelation = 0;
    let foundGoodCorrelation = false;
    const MIN_SAMPLES = 2;      // corresponds to ~22kHz upper bound
    const MAX_SAMPLES = Math.floor(SIZE / 2);
    const correlations = new Array(MAX_SAMPLES).fill(0);

    for (let offset = MIN_SAMPLES; offset < MAX_SAMPLES; offset++) {
      let correlation = 0;
      for (let i = 0; i < MAX_SAMPLES; i++) {
        correlation += buffer[i] * buffer[i + offset];
      }
      correlations[offset] = correlation;
      if (correlation > 0.9 && correlation > bestCorrelation) {
        foundGoodCorrelation = true;
        bestCorrelation = correlation;
        bestOffset = offset;
      }
    }

    if (!foundGoodCorrelation) return -1;

    // Interpolation for better accuracy
    const shift = (correlations[bestOffset + 1] - correlations[bestOffset - 1]) / (2 * (2 * correlations[bestOffset] - correlations[bestOffset + 1] - correlations[bestOffset - 1]));
    const period = bestOffset + shift;

    return sampleRate / period;
  }, []);

  const detectPitch = useCallback(() => {
    if (!analyserRef.current || !audioContextRef.current) return;
    
    const bufferLength = analyserRef.current.fftSize;
    const buffer = new Float32Array(bufferLength);
    
    analyserRef.current.getFloatTimeDomainData(buffer);
    
    const frequency = autoCorrelate(buffer, audioContextRef.current.sampleRate);
    
    if (frequency > 50 && frequency < 1500) { // Valid instrument range
      const note = noteFromFrequency(frequency);
      
      // Find the closest target frequency for this note
      const A4 = 440;
      const noteNumber = Math.round(12 * Math.log2(frequency / A4)) + 69;
      const targetFrequency = A4 * Math.pow(2, (noteNumber - 69) / 12);
      
      const cents = getCentsFromFrequency(frequency, targetFrequency);
      const isInTune = Math.abs(cents) <= 10;
      const isSharp = cents > 10;
      const isFlat = cents < -10;
      
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
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 4096;
      analyserRef.current.smoothingTimeConstant = 0.1;
      
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