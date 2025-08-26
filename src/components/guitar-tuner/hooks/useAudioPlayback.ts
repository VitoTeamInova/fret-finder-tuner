import { useCallback } from 'react';

export const useAudioPlayback = () => {
  const playTone = useCallback((tuningName: string, note: string, octave: string) => {
    try {
      // Convert tuning name to filename format
      const tuningSlug = tuningName.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/♭/g, 'b');
      
      const fileName = `${tuningSlug}-${note.toLowerCase()}${octave}.mp3`;
      const audioPath = `/audio/strings/${fileName}`;
      
      const audio = new Audio(audioPath);
      audio.volume = 0.7;
      
      audio.play().catch(error => {
        console.warn('Could not play audio file:', audioPath, error);
        // Fallback to synthetic tone
        playFallbackTone(note, octave);
      });
    } catch (error) {
      console.warn('Audio playback not supported:', error);
    }
  }, []);

  const playFallbackTone = useCallback((note: string, octave: string) => {
    try {
      // Convert note to frequency for fallback
      const noteFreqs: { [key: string]: number } = {
        'c': 261.63, 'd': 293.66, 'e': 329.63, 'f': 349.23,
        'g': 391.95, 'a': 440.00, 'b': 493.88,
        'db': 277.18, 'eb': 311.13, 'gb': 369.99, 'ab': 415.30, 'bb': 466.16
      };
      
      const baseFreq = noteFreqs[note.toLowerCase()] || 440;
      const octaveMultiplier = Math.pow(2, parseInt(octave) - 4);
      const frequency = baseFreq * octaveMultiplier;

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
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1);

      // Clean up
      oscillator.addEventListener('ended', () => {
        oscillator.disconnect();
        gainNode.disconnect();
        audioContext.close();
      });
    } catch (error) {
      console.warn('Fallback audio not supported:', error);
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