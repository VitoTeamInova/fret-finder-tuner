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
  const angle = (clampedCents / 50) * 90;
  
  // Determine color based on how close to center
  const getColor = () => {
    if (!isActive) return 'text-muted-foreground';
    const absCents = Math.abs(clampedCents);
    if (absCents <= 5) return 'text-success';
    if (absCents <= 15) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="relative w-24 h-12 flex items-end justify-center">
      {/* Gauge background arc */}
      <svg
        width="96"
        height="48"
        viewBox="0 0 96 48"
        className="absolute"
      >
        {/* Background arc */}
        <path
          d="M 8 40 A 40 40 0 0 1 88 40"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-border"
        />
        
        {/* Tick marks */}
        {[-40, -20, 0, 20, 40].map((tick, index) => {
          const tickAngle = (tick / 50) * 90 + 90; // Convert to SVG angle
          const x1 = 48 + 35 * Math.cos((tickAngle * Math.PI) / 180);
          const y1 = 40 - 35 * Math.sin((tickAngle * Math.PI) / 180);
          const x2 = 48 + 30 * Math.cos((tickAngle * Math.PI) / 180);
          const y2 = 40 - 30 * Math.sin((tickAngle * Math.PI) / 180);
          
          return (
            <line
              key={tick}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth={tick === 0 ? "2" : "1"}
              className={tick === 0 ? "text-success" : "text-muted-foreground"}
            />
          );
        })}
        
        {/* Needle */}
        {isActive && (
          <g>
            <line
              x1="48"
              y1="40"
              x2={48 + 30 * Math.cos(((angle + 90) * Math.PI) / 180)}
              y2={40 - 30 * Math.sin(((angle + 90) * Math.PI) / 180)}
              stroke="currentColor"
              strokeWidth="2"
              className={cn("transition-all duration-200", getColor())}
            />
            <circle
              cx="48"
              cy="40"
              r="3"
              fill="currentColor"
              className={getColor()}
            />
          </g>
        )}
      </svg>
      
      {/* Center indicator */}
      <div className="absolute bottom-0 w-0.5 h-2 bg-success"></div>
      
      {/* Labels */}
      <div className="absolute bottom-0 left-0 text-xs text-muted-foreground">♭</div>
      <div className="absolute bottom-0 right-0 text-xs text-muted-foreground">♯</div>
      
      {/* Cents display */}
      {isActive && (
        <div className="absolute -bottom-6 text-xs font-mono text-center">
          <span className={getColor()}>
            {cents > 0 ? '+' : ''}{cents.toFixed(0)}¢
          </span>
        </div>
      )}
    </div>
  );
};