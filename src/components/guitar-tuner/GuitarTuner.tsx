import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { TuningSelector } from './TuningSelector';
import { GuitarString } from './GuitarString';
import { useAudioPermission } from './hooks/useAudioPermission';
import { usePitchDetection } from './hooks/usePitchDetection';
import { TUNINGS, Tuning } from './types';
import { cn } from '@/lib/utils';

export const GuitarTuner = () => {
  const [selectedTuning, setSelectedTuning] = useState<Tuning>(TUNINGS[0]);
  const [selectedString, setSelectedString] = useState<number>(0);
  const [isListening, setIsListening] = useState(false);
  
  const { hasPermission, isRequesting, requestPermission } = useAudioPermission();
  const currentPitch = usePitchDetection(isListening && hasPermission === true);

  const handleStartListening = async () => {
    if (hasPermission === null || hasPermission === false) {
      const granted = await requestPermission();
      if (granted) {
        setIsListening(true);
      }
    } else {
      setIsListening(!isListening);
    }
  };

  const getMatchingStringForPitch = () => {
    if (!currentPitch) return null;
    
    const targetNote = selectedTuning.notes[selectedString];
    return currentPitch.note === targetNote ? currentPitch : null;
  };

  return (
    <div className="min-h-screen bg-wood-gradient p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-2">
            Guitar Tuner
          </h1>
          <p className="text-muted-foreground text-lg">
            Professional guitar tuning with multiple tuning options
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Fretboard Section */}
          <div className="xl:col-span-3">
            <Card className="bg-guitar-fretboard border-border shadow-2xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-foreground flex items-center justify-center gap-4">
                  {selectedTuning.name} Tuning
                  <Button
                    variant={isListening ? "destructive" : "default"}
                    size="sm"
                    onClick={handleStartListening}
                    disabled={isRequesting}
                    className={cn(
                      "transition-bounce",
                      isListening && "animate-pulse"
                    )}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-4 h-4 mr-2" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 mr-2" />
                        {hasPermission === null ? "Start Tuning" : "Listen"}
                      </>
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-8">
                <div className="space-y-4">
                  {selectedTuning.notes.map((note, index) => (
                    <GuitarString
                      key={`${selectedTuning.name}-${index}`}
                      note={note}
                      targetFrequency={selectedTuning.frequencies[index]}
                      stringIndex={index}
                      isSelected={selectedString === index}
                      onSelect={() => setSelectedString(index)}
                      tuningStatus={selectedString === index ? getMatchingStringForPitch() : null}
                    />
                  ))}
                </div>
                
                {isListening && currentPitch && (
                  <div className="mt-8 p-4 bg-card/50 rounded-lg text-center">
                    <div className="text-sm text-muted-foreground mb-2">
                      Detected: <span className="font-mono text-foreground">{currentPitch.frequency.toFixed(1)} Hz</span>
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      {currentPitch.note}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tuning Selector */}
          <div className="xl:col-span-1">
            <TuningSelector
              selectedTuning={selectedTuning}
              onTuningChange={(tuning) => {
                setSelectedTuning(tuning);
                setSelectedString(0);
              }}
            />
            
            {/* Instructions */}
            <Card className="mt-6 bg-card/80 border-border">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">How to Use</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>1. Select your desired tuning</p>
                <p>2. Click "Start Tuning" to enable microphone</p>
                <p>3. Click on a string note to tune that string</p>
                <p>4. Play the string and watch the feedback:</p>
                <div className="ml-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-success">✓</span>
                    <span>In tune</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-guitar-string-sharp">♯</span>
                    <span>Too high (sharp)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-guitar-string-flat">♭</span>
                    <span>Too low (flat)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-guitar-string-active">±10¢</span>
                    <span>Fine tuning</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};