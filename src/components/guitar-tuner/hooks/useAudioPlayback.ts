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

  const playSuccess = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.connect(g);
      g.connect(ctx.destination);

      // Two quick beeps (e.g., 880Hz then 1175Hz)
      const now = ctx.currentTime;
      g.gain.setValueAtTime(0, now);

      // First beep
      o.frequency.setValueAtTime(880, now);
      g.gain.linearRampToValueAtTime(0.15, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

      // Second beep slightly higher
      o.frequency.setValueAtTime(1175, now + 0.16);
      g.gain.linearRampToValueAtTime(0.15, now + 0.17);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.30);

      o.start(now);
      o.stop(now + 0.35);

      o.addEventListener('ended', () => {
        o.disconnect();
        g.disconnect();
        ctx.close();
      });
    } catch (error) {
      console.warn('Audio playback not supported:', error);
    }
  }, []);

  return { playTone, playSuccess };
};