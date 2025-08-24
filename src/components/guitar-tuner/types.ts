export interface Tuning {
  name: string;
  notes: string[];
  frequencies: number[];
}

export interface TuningStatus {
  note: string;
  frequency: number;
  cents: number;
  isInTune: boolean;
  isSharp: boolean;
  isFlat: boolean;
}

export const TUNINGS: Tuning[] = [
  {
    name: "Standard",
    notes: ["E", "A", "D", "G", "B", "E"],
    frequencies: [82.41, 110.00, 146.83, 196.00, 246.94, 329.63]
  },
  {
    name: "Eb Tuning",
    notes: ["Eb", "Ab", "Db", "Gb", "Bb", "Eb"],
    frequencies: [77.78, 103.83, 138.59, 185.00, 233.08, 311.13]
  },
  {
    name: "Open G",
    notes: ["D", "G", "D", "G", "B", "D"],
    frequencies: [73.42, 98.00, 146.83, 196.00, 246.94, 293.66]
  },
  {
    name: "Open E",
    notes: ["E", "B", "E", "G#", "B", "E"],
    frequencies: [82.41, 123.47, 164.81, 207.65, 246.94, 329.63]
  },
  {
    name: "Open D",
    notes: ["D", "A", "D", "F#", "A", "D"],
    frequencies: [73.42, 110.00, 146.83, 185.00, 220.00, 293.66]
  },
  {
    name: "DADGAD",
    notes: ["D", "A", "D", "G", "A", "D"],
    frequencies: [73.42, 110.00, 146.83, 196.00, 220.00, 293.66]
  }
];