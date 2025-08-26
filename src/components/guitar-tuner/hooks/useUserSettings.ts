import { useEffect, useMemo, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

export interface UserSettings {
  defaultTuningName: string;
  theme: ThemeMode;
  precisionCents: number; // 0..8
  micSensitivity: number; // 0.001..0.1
}

const STORAGE_KEY = 'guitar-tuner-settings';

const getInitial = (): UserSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<UserSettings>;
      return {
        defaultTuningName: parsed.defaultTuningName ?? 'Standard',
        theme: (parsed.theme as ThemeMode) ?? 'dark',
        precisionCents: Math.min(8, Math.max(0, Number(parsed.precisionCents ?? 5))),
        micSensitivity: Math.min(0.1, Math.max(0.001, Number(parsed.micSensitivity ?? 0.01)))
      };
    }
  } catch {}
  return { defaultTuningName: 'Standard', theme: 'dark', precisionCents: 5, micSensitivity: 0.01 };
};

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings>(() => getInitial());

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [settings.theme]);

  const api = useMemo(() => ({
    settings,
    setDefaultTuningName: (name: string) => setSettings((s) => ({ ...s, defaultTuningName: name })),
    setTheme: (mode: ThemeMode) => setSettings((s) => ({ ...s, theme: mode })),
    setPrecisionCents: (val: number) => setSettings((s) => ({ ...s, precisionCents: Math.min(8, Math.max(0, Math.round(val))) })),
    setMicSensitivity: (val: number) => setSettings((s) => ({ ...s, micSensitivity: Math.min(0.1, Math.max(0.001, val)) })),
  }), [settings]);

  return api;
}
