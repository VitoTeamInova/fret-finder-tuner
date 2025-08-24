import { useEffect, useRef } from 'react';

interface MicWaveformProps {
  isActive: boolean;
  height?: number;
}

export const MicWaveform = ({ isActive, height = 80 }: MicWaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = async () => {
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            channelCount: 1,
          },
        });

        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 2048;
        analyserRef.current.smoothingTimeConstant = 0.2;

        const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
        source.connect(analyserRef.current);

        const bufferLength = analyserRef.current.fftSize;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
          if (!canvasRef.current || !analyserRef.current) return;

          analyserRef.current.getByteTimeDomainData(dataArray);

          const canvas = canvasRef.current;
          const dpr = window.devicePixelRatio || 1;
          const width = canvas.clientWidth * dpr;
          const h = height * dpr;

          if (canvas.width !== width) canvas.width = width;
          if (canvas.height !== h) canvas.height = h;

          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          // Clear
          ctx.clearRect(0, 0, width, h);

          // Background
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.fillRect(0, 0, width, h);

          // Center line
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 1 * dpr;
          ctx.beginPath();
          ctx.moveTo(0, h / 2);
          ctx.lineTo(width, h / 2);
          ctx.stroke();

          // Waveform
          ctx.lineWidth = 2 * dpr;
          ctx.strokeStyle = '#10b981';
          ctx.beginPath();

          const sliceWidth = width / bufferLength;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0 - 1.0; // [-1, 1]
            const y = v * (h / 2) + h / 2;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);

            x += sliceWidth;
          }

          ctx.stroke();

          rafRef.current = requestAnimationFrame(draw);
        };

        draw();
      } catch (e) {
        console.error('Waveform init failed:', e);
      }
    };

    if (isActive) start();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      analyserRef.current = null;
    };
  }, [isActive, height]);

  return (
    <div className="bg-card/50 border border-border rounded-md p-2">
      <canvas ref={canvasRef} style={{ width: '100%', height }} />
    </div>
  );
};
