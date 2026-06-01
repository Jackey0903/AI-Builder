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
  /**
   * 八度偏移（相对于默认中音区）。
   *  0  = 默认（不偏移）
   * -1  = 低一个八度（简谱中数字下方有点）
   *  1  = 高一个八度（简谱中数字上方有点，如 "i"）
   */
  octave?: number;
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
  /**
   * 若提供，"Play Preset" 时会先从该 URL 加载 BGM 进行实时音高提取，
   * 提取结果覆盖 events 字段（events 作为备用）。
   */
  bgmUrl?: string;
  backingFile?: string;
  backingGain?: number;
  backingStartMs?: number;
  backingLoop?: boolean;
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
