export type Note = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';

export type MelodyStyle = 'bright' | 'soft' | 'electro';

export interface NoteDefinition {
  note: Note;
  label: string;
  solfege: string;
  key: string;
  color: string;
  frequency: number;
  semitoneOffset: number;
}

export interface MelodyEvent {
  note: Note;
  durationMs: number;
  velocity: number;
}

export interface SoundSampleLayer {
  id: string;
  name: string;
  file: string;
  baseNote: Note;
  baseSemitoneOffset?: number;
  trimStartMs?: number;
  trimEndMs?: number;
  gain?: number;
  role?: 'low' | 'mid' | 'high' | 'single' | 'phrase';
}

export interface SoundPreset {
  id: string;
  name: string;
  description: string;
  file?: string;
  baseNote?: Note;
  baseSemitoneOffset?: number;
  trimStartMs?: number;
  trimEndMs?: number;
  gain?: number;
  samples?: SoundSampleLayer[];
  enabled: boolean;
  credit: string;
  tags: string[];
}

export interface PresetMelody {
  id: string;
  name: string;
  description: string;
  style: MelodyStyle;
  root?: Note;
  events: MelodyEvent[];
}

export interface SerialLine {
  direction: 'in' | 'out' | 'system';
  message: string;
  at: number;
}

declare global {
  interface Navigator {
    serial?: Serial;
  }

  interface Serial {
    requestPort(): Promise<SerialPort>;
    getPorts(): Promise<SerialPort[]>;
  }

  interface SerialPort {
    readable: ReadableStream<Uint8Array> | null;
    writable: WritableStream<Uint8Array> | null;
    open(options: SerialOptions): Promise<void>;
    close(): Promise<void>;
  }

  interface SerialOptions {
    baudRate: number;
  }
}
