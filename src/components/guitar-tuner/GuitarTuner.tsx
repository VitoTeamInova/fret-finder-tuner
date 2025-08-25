import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Mic, MicOff, HelpCircle, ArrowUpDown } from 'lucide-react';
import { GuitarString } from './GuitarString';
import { useAudioPermission } from './hooks/useAudioPermission';
import { usePitchDetection } from './hooks/usePitchDetection';
import { useAudioPlayback } from './hooks/useAudioPlayback';
import { TUNINGS, Tuning, TuningStatus } from './types';
import { cn } from '@/lib/utils';
import { MicWaveform } from './MicWaveform';
import { TuningGauge } from './TuningGauge';

export const GuitarTuner = () => {
  const [selectedTuning, setSelectedTuning] = useState<Tuning>(TUNINGS[0]);
  const [selectedString, setSelectedString] = useState<number>(0);
  const [isListening, setIsListening] = useState(false);
  const [isReversed, setIsReversed] = useState(false);
  const [displayPitch, setDisplayPitch] = useState<TuningStatus | null>(null);
  
  const { hasPermission, isRequesting, requestPermission } = useAudioPermission();
  const currentPitch = usePitchDetection(isListening && hasPermission === true);
  const { playTone, playSuccess } = useAudioPlayback();

  const inTuneRef = useRef(false);
  const lastBeepNoteRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isListening || !currentPitch) return;
    const abs = Math.abs(currentPitch.cents);
    const noteKey = `${currentPitch.note}`;
    if (abs <= 5) {
      if (!inTuneRef.current || lastBeepNoteRef.current !== noteKey) {
        playSuccess();
        inTuneRef.current = true;
        lastBeepNoteRef.current = noteKey;
      }
    } else {
      inTuneRef.current = false;
    }
  }, [isListening, currentPitch, playSuccess]);

  // Keep last detected pitch to avoid UI flicker
  useEffect(() => {
    if (currentPitch) {
      setDisplayPitch(currentPitch);
    }
  }, [currentPitch]);

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
    const targetFrequency = selectedTuning.frequencies[selectedString];
    
    // Calculate cents difference for the selected string
    const cents = Math.round(1200 * Math.log2(currentPitch.frequency / targetFrequency));
    
    return {
      ...currentPitch,
      cents,
      isMatch: currentPitch.note === targetNote
    };
  };

  const handleStringSelect = (index: number) => {
    setSelectedString(index);
    const frequency = selectedTuning.frequencies[index];
    playTone(frequency, 1000); // Play tone for 1 second
  };

  const displayedNotes = isReversed ? [...selectedTuning.notes].reverse() : selectedTuning.notes;
  const displayedFreqs = isReversed ? [...selectedTuning.frequencies].reverse() : selectedTuning.frequencies;

  return (
    <div className="min-h-screen bg-wood-gradient">
      {/* Header */}
      <div className="bg-card/95 border-b border-border backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                TeamInova Guitar Tuner
              </h1>
              <p className="text-muted-foreground text-sm">
                Professional guitar tuning with multiple tuning options
              </p>
            </div>
            
            <div className="flex items-center gap-4 flex-wrap">
              {/* Tuning Selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Tuning:</span>
                <Select
                  value={selectedTuning.name}
                  onValueChange={(value) => {
                    const tuning = TUNINGS.find(t => t.name === value);
                    if (tuning) {
                      setSelectedTuning(tuning);
                      setSelectedString(0);
                    }
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TUNINGS.map((tuning) => (
                      <SelectItem key={tuning.name} value={tuning.name}>
                        {tuning.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* String Order Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsReversed(!isReversed)}
                className="flex items-center gap-2"
              >
                <ArrowUpDown className="w-4 h-4" />
                {isReversed ? "High→Low" : "Low→High"}
              </Button>

              {/* Instructions Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Help
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>How to Use TeamInova Guitar Tuner</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 text-sm">
                    <div>
                      <h4 className="font-semibold text-foreground">Getting Started</h4>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                        <li>Select your desired tuning from the dropdown</li>
                        <li>Click "Start Tuning" to enable microphone access</li>
                        <li>Click on a string note to hear its target pitch</li>
                        <li>Play the string on your guitar and watch the feedback</li>
                      </ol>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-foreground">Tuning Feedback</h4>
                      <div className="space-y-2 ml-2">
                        <div className="flex items-center gap-2">
                          <span className="text-success text-lg">✓</span>
                          <span className="text-muted-foreground">Perfect tune</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-guitar-string-sharp text-lg">♯</span>
                          <span className="text-muted-foreground">Too high (sharp) - tune down</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-guitar-string-flat text-lg">♭</span>
                          <span className="text-muted-foreground">Too low (flat) - tune up</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-guitar-string-active text-sm font-mono">±10¢</span>
                          <span className="text-muted-foreground">Fine tuning (cents off)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Microphone Button */}
              <Button
                variant={isListening ? "destructive" : "default"}
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
                    Start Tuning
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        <Card className="bg-guitar-fretboard border-border shadow-2xl">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              {/* Tuning Gauge */}
              <div className="flex-shrink-0">
                <TuningGauge 
                  cents={displayPitch?.cents ?? 0}
                  isActive={isListening}
                />
              </div>
              
              {/* Tuning Title */}
              <CardTitle className="text-xl text-foreground text-center flex-1">
                {selectedTuning.name} Tuning - {isReversed ? "High to Low" : "Low to High"}
              </CardTitle>
              
              {/* Waveform */}
              <div className="flex-shrink-0">
                {isListening && (
                  <div className="w-32 h-12">
                    <MicWaveform isActive={isListening} height={48} />
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-8">
            <div className="space-y-4">
              {displayedNotes.map((note, displayIndex) => {
                const actualIndex = isReversed ? selectedTuning.notes.length - 1 - displayIndex : displayIndex;
                return (
                  <GuitarString
                    key={`${selectedTuning.name}-${actualIndex}-${isReversed}`}
                    note={note}
                    targetFrequency={displayedFreqs[displayIndex]}
                    stringIndex={actualIndex}
                    isSelected={selectedString === actualIndex}
                    onSelect={() => handleStringSelect(actualIndex)}
                    tuningStatus={selectedString === actualIndex ? getMatchingStringForPitch() : null}
                  />
                );
              })}
            </div>
            
            {isListening && (
              <div className="mt-6 p-3 bg-card/50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Detected Note</div>
                    <div className="text-xl font-bold text-primary">
                      {displayPitch ? displayPitch.note : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Frequency</div>
                    <div className="text-sm font-mono text-foreground">
                      {displayPitch ? `${displayPitch.frequency.toFixed(1)} Hz` : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Cents offset</div>
                    <div className="text-sm font-mono">
                      {displayPitch ? (
                        <span className={
                          Math.abs(displayPitch.cents) <= 5
                            ? "text-success"
                            : Math.abs(displayPitch.cents) <= 15
                              ? "text-warning"
                              : "text-destructive"
                        }>
                          {displayPitch.cents > 0 ? '+' : ''}{displayPitch.cents}¢
                        </span>
                      ) : '—'}
                    </div>
                  </div>
                </div>

                <div className="mt-2 text-center text-sm">
                  {!displayPitch ? (
                    <span className="text-muted-foreground">Listening…</span>
                  ) : Math.abs(displayPitch.cents) <= 5 ? (
                    <div className="flex items-center justify-center gap-2 text-success">
                      <span>✓</span>
                      <span className="font-semibold">Perfect tune!</span>
                    </div>
                  ) : displayPitch.cents > 0 ? (
                    <div className="flex items-center justify-center gap-2 text-guitar-string-sharp">
                      <span>♯</span>
                      <span>Too high (sharp) - tune down</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-guitar-string-flat">
                      <span>♭</span>
                      <span>Too low (flat) - tune up</span>
                    </div>
                  )}
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  );
};