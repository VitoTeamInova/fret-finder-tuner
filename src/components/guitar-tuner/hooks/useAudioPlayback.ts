import { useCallback } from 'react';

export const useAudioPlayback = () => {
  const playTone = useCallback((frequency: number, duration: number = 1000) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'sine';

      // Smooth attack and release to avoid clicking
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration / 1000);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);

      // Clean up
      oscillator.addEventListener('ended', () => {
        oscillator.disconnect();
        gainNode.disconnect();
        audioContext.close();
      });
    } catch (error) {
      console.warn('Audio playback not supported:', error);
    }
  }, []);

  return { playTone };
};