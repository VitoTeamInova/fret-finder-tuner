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
    const SIZE = buffer.length;
    const rms = Math.sqrt(buffer.reduce((sum, val) => sum + val * val, 0) / SIZE);
    
    if (rms < 0.01) return -1; // Not enough signal
    
    let r1 = 0;
    let r2 = SIZE - 1;
    const threshold = 0.2;
    
    // Find the first point where amplitude crosses threshold
    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buffer[i]) < threshold) {
        r1 = i;
        break;
      }
    }
    
    // Find the last point where amplitude crosses threshold
    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(buffer[SIZE - i]) < threshold) {
        r2 = SIZE - i;
        break;
      }
    }
    
    const correlations = new Array(r2 - r1);
    
    for (let i = 0; i < correlations.length; i++) {
      let correlation = 0;
      
      for (let j = 0; j < correlations.length; j++) {
        correlation += Math.abs(buffer[j] - buffer[j + i]);
      }
      
      correlations[i] = correlation;
    }
    
    let minCorrelation = 1;
    let minIndex = -1;
    
    for (let i = 0; i < correlations.length; i++) {
      if (correlations[i] < minCorrelation) {
        minCorrelation = correlations[i];
        minIndex = i;
      }
    }
    
    return minIndex > 0 ? sampleRate / (r1 + minIndex) : -1;
  }, []);

  const detectPitch = useCallback(() => {
    if (!analyserRef.current || !audioContextRef.current) return;
    
    const bufferLength = analyserRef.current.fftSize;
    const buffer = new Float32Array(bufferLength);
    
    analyserRef.current.getFloatTimeDomainData(buffer);
    
    const frequency = autoCorrelate(buffer, audioContextRef.current.sampleRate);
    
    if (frequency > 60 && frequency < 1000) { // Guitar frequency range
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
      analyserRef.current.smoothingTimeConstant = 0.3;
      
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