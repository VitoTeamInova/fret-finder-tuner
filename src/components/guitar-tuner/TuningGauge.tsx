import React from 'react';
import { cn } from '@/lib/utils';

interface TuningGaugeProps {
  cents?: number;
  isActive: boolean;
}

export const TuningGauge: React.FC<TuningGaugeProps> = ({ cents = 0, isActive }) => {
  // Clamp cents to -50 to +50 range for display
  const clampedCents = Math.max(-50, Math.min(50, cents));
  
  // Convert cents to angle (0 degrees = center, -90 to +90 range)
  const angle = -(clampedCents / 50) * 90;
  
  // Determine color based on how close to center
  const getColor = () => {
    if (!isActive) return 'text-muted-foreground';
    const absCents = Math.abs(clampedCents);
    if (absCents <= 5) return 'text-success';
    if (absCents <= 15) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="relative w-48 h-24 flex items-end justify-center">
      {/* Gauge background arc */}
      <svg
        width="192"
        height="96"
        viewBox="0 0 192 96"
        className="absolute"
      >
        {/* Background arc */}
        <path
          d="M 16 80 A 80 80 0 0 1 176 80"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-border"
        />
        
        {/* Tick marks */}
        {[-40, -20, 0, 20, 40].map((tick, index) => {
          const tickAngle = (tick / 50) * 90 + 90; // Convert to SVG angle
          const x1 = 96 + 70 * Math.cos((tickAngle * Math.PI) / 180);
          const y1 = 80 - 70 * Math.sin((tickAngle * Math.PI) / 180);
          const x2 = 96 + 60 * Math.cos((tickAngle * Math.PI) / 180);
          const y2 = 80 - 60 * Math.sin((tickAngle * Math.PI) / 180);
          
          return (
            <line
              key={tick}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth={tick === 0 ? "3" : "2"}
              className={tick === 0 ? "text-success" : "text-muted-foreground"}
            />
          );
        })}
        
        {/* Needle */}
        {isActive && (
          <g>
            <line
              x1="96"
              y1="80"
              x2={96 + 60 * Math.cos(((angle + 90) * Math.PI) / 180)}
              y2={80 - 60 * Math.sin(((angle + 90) * Math.PI) / 180)}
              stroke="currentColor"
              strokeWidth="3"
              className={cn("transition-all duration-200", getColor())}
            />
            <circle
              cx="96"
              cy="80"
              r="5"
              fill="currentColor"
              className={getColor()}
            />
          </g>
        )}
      </svg>
      
      {/* Center indicator */}
      <div className="absolute bottom-0 w-1 h-4 bg-success"></div>
      
      {/* Labels */}
      <div className="absolute bottom-0 left-0 text-sm text-muted-foreground">♭</div>
      <div className="absolute bottom-0 right-0 text-sm text-muted-foreground">♯</div>
      
      {/* Cents display */}
      {isActive && (
        <div className="absolute -bottom-8 text-sm font-mono text-center w-full">
          <span className={getColor()}>
            {cents > 0 ? '+' : ''}{Math.round(cents)}¢
          </span>
        </div>
      )}
    </div>
  );
};