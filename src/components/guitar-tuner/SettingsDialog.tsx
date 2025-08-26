import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { ThemeMode } from './hooks/useUserSettings';
import type { Tuning } from './types';
import { Settings as SettingsIcon } from 'lucide-react';

interface SettingsDialogProps {
  tunings: Tuning[];
  defaultTuningName: string;
  onDefaultTuningChange: (name: string) => void;
  theme: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  precisionCents: number; // 0..8
  onPrecisionChange: (val: number) => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  tunings,
  defaultTuningName,
  onDefaultTuningChange,
  theme,
  onThemeChange,
  precisionCents,
  onPrecisionChange,
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <SettingsIcon className="w-4 h-4" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Default tuning */}
          <div className="grid gap-2">
            <Label htmlFor="default-tuning">Default Tuning</Label>
            <Select value={defaultTuningName} onValueChange={onDefaultTuningChange}>
              <SelectTrigger id="default-tuning" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tunings.map((t) => (
                  <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Used on app start.</p>
          </div>

          {/* Theme */}
          <div className="grid gap-2">
            <Label htmlFor="theme-mode">Theme</Label>
            <Select value={theme} onValueChange={(v) => onThemeChange(v as ThemeMode)}>
              <SelectTrigger id="theme-mode" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Precision */}
          <div className="grid gap-2">
            <Label>Precision (cents)</Label>
            <div className="flex items-center gap-3">
              <Slider
                value={[precisionCents]}
                min={0}
                max={8}
                step={1}
                onValueChange={(vals) => onPrecisionChange(vals[0] ?? 0)}
                className="w-56"
              />
              <div className="w-12 text-sm font-mono text-center">±{precisionCents}¢</div>
            </div>
            <p className="text-xs text-muted-foreground">Defines when a note counts as “in tune”.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
