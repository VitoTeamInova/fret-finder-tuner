import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TuningStatus } from './types';
import { cn } from '@/lib/utils';

interface GuitarStringProps {
  note: string;
  targetFrequency: number;
  stringIndex: number;
  isSelected: boolean;
  onSelect: () => void;
  tuningStatus?: TuningStatus | null;
  isDetected?: boolean; // When this note is currently being played
  isTuned?: boolean; // When this note is tuned and should stay lit
}

export const GuitarString = ({ 
  note, 
  stringIndex, 
  isSelected, 
  onSelect, 
  tuningStatus,
  isDetected = false,
  isTuned = false
}: GuitarStringProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const getStringStatus = () => {
    if (isTuned) return 'tuned';
    if (isDetected && tuningStatus?.isInTune) return 'tuned';
    if (isDetected && tuningStatus?.isSharp) return 'sharp';
    if (isDetected && tuningStatus?.isFlat) return 'flat';
    if (isDetected) return 'detecting';
    if (!tuningStatus || !isSelected) return 'default';
    if (tuningStatus.isInTune) return 'tuned';
    if (tuningStatus.isSharp) return 'sharp';
    if (tuningStatus.isFlat) return 'flat';
    return 'detecting';
  };

  const getStatusColor = () => {
    const status = getStringStatus();
    switch (status) {
      case 'tuned': return 'border-guitar-string-tuned bg-guitar-string-tuned/20';
      case 'sharp': return 'border-guitar-string-sharp bg-guitar-string-sharp/20';
      case 'flat': return 'border-guitar-string-flat bg-guitar-string-flat/20';
      case 'detecting': return 'border-guitar-string-active bg-guitar-string-active/20';
      default: return (isSelected || isDetected) ? 'border-guitar-string-active bg-guitar-string-active/10' : 'border-guitar-string';
    }
  };

  const getStringWidth = () => {
    // Thicker strings for lower notes (higher string index)
    const baseWidth = 2;
    const additionalWidth = stringIndex * 0.5;
    return baseWidth + additionalWidth;
  };

  const getFeedbackDisplay = () => {
    if (!tuningStatus || !isSelected) return null;
    
    if (tuningStatus.isInTune) {
      return <span className="text-success font-bold">✓</span>;
    }
    
    if (Math.abs(tuningStatus.cents) >= 50) {
      return (
        <span className={tuningStatus.isSharp ? "text-guitar-string-sharp" : "text-guitar-string-flat"}>
          {tuningStatus.isSharp ? "♯" : "♭"}
        </span>
      );
    }
    
    return (
      <span className={cn(
        "text-sm font-mono",
        tuningStatus.cents > 0 ? "text-guitar-string-sharp" : "text-guitar-string-flat"
      )}>
        {tuningStatus.cents > 0 ? "+" : ""}{tuningStatus.cents}¢
      </span>
    );
  };

  return (
    <div className="relative flex items-center w-full mb-4">
      {/* Note circle */}
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "w-12 h-12 rounded-full mr-3 flex-shrink-0 text-sm font-bold transition-bounce z-10",
          getStatusColor(),
          isSelected && "scale-110 shadow-lg",
          isHovered && "scale-105"
        )}
        onClick={onSelect}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {note}
      </Button>
      
      {/* String line */}
      <div className="relative flex-1 flex items-center">
        <div 
          className={cn(
            "w-full bg-metal-gradient rounded-full transition-smooth shadow-sm",
            isSelected ? "shadow-md" : "",
            getStringStatus() === 'tuned' && "shadow-guitar-string-tuned/50",
            getStringStatus() === 'sharp' && "shadow-guitar-string-sharp/50",
            getStringStatus() === 'flat' && "shadow-guitar-string-flat/50",
            isDetected && "animate-pulse"
          )}
          style={{ height: `${getStringWidth()}px` }}
        />
        
        {/* Fret markers - simple lines */}
        {[3, 5, 7, 9, 12, 15, 17, 19].map((fret) => (
          <div
            key={fret}
            className="hidden"
            style={{ left: `${(fret / 24) * 100}%` }}
          />
        ))}
      </div>
      
      {/* Tuning feedback */}
      {isSelected && (
        <div className="ml-3 w-16 flex justify-center items-center text-lg">
          {getFeedbackDisplay()}
        </div>
      )}
    </div>
  );
};