import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tuning, TUNINGS } from './types';
import { cn } from '@/lib/utils';

interface TuningSelectorProps {
  selectedTuning: Tuning;
  onTuningChange: (tuning: Tuning) => void;
}

export const TuningSelector = ({ selectedTuning, onTuningChange }: TuningSelectorProps) => {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground text-center">Tunings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {TUNINGS.map((tuning) => (
          <Button
            key={tuning.name}
            variant={selectedTuning.name === tuning.name ? "default" : "outline"}
            className={cn(
              "w-full justify-start transition-smooth",
              selectedTuning.name === tuning.name 
                ? "bg-primary text-primary-foreground border-primary" 
                : "bg-secondary/50 text-secondary-foreground border-border hover:bg-secondary hover:text-secondary-foreground"
            )}
            onClick={() => onTuningChange(tuning)}
          >
            <div className="flex flex-col items-start">
              <span className="font-semibold">{tuning.name}</span>
              <span className="text-xs opacity-80">
                {tuning.notes.join(' - ')}
              </span>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};