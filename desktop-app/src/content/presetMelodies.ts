import type { PresetMelody } from '../types';

export const PRESET_MELODIES: PresetMelody[] = [
  {
    id: 'login-scene-bgm',
    name: '场景-登陆 BGM',
    description: 'Auto-extracted lead line from the uploaded login scene BGM for the Yuanhaoyu timbre demo.',
    style: 'bright',
    root: 'F',
    events: [
      { note: 'F', durationMs: 300, velocity: 0.96 },
      { note: 'A', durationMs: 300, velocity: 0.78 },
      { note: 'C', durationMs: 600, velocity: 0.78 },
      { note: 'E', durationMs: 300, velocity: 0.78 },
      { note: 'C', durationMs: 300, velocity: 0.96 },
      { note: 'E', durationMs: 900, velocity: 0.74 },
      { note: 'C', durationMs: 900, velocity: 0.74 },
      { note: 'C', durationMs: 300, velocity: 0.78 },
      { note: 'E', durationMs: 600, velocity: 0.96 },
      { note: 'G', durationMs: 300, velocity: 0.78 },
      { note: 'F', durationMs: 600, velocity: 0.78 },
      { note: 'G', durationMs: 300, velocity: 0.78 },
      { note: 'E', durationMs: 900, velocity: 0.92 },
      { note: 'E', durationMs: 600, velocity: 0.78 },
      { note: 'C', durationMs: 300, velocity: 0.78 },
      { note: 'G', durationMs: 300, velocity: 0.78 },
      { note: 'C', durationMs: 300, velocity: 0.96 },
      { note: 'G', durationMs: 300, velocity: 0.78 },
      { note: 'C', durationMs: 300, velocity: 0.78 },
      { note: 'G', durationMs: 900, velocity: 0.74 },
      { note: 'G', durationMs: 900, velocity: 0.92 },
      { note: 'G', durationMs: 900, velocity: 0.74 },
      { note: 'G', durationMs: 300, velocity: 0.78 }
    ]
  },
  {
    id: 'peter-avenue-bgm',
    name: '彼得大道 BGM',
    description: 'Auto-extracted lead line from the uploaded Peter Avenue BGM WAV for the Yuanhaoyu timbre demo.',
    style: 'soft',
    root: 'F',
    events: [
      { note: 'C', durationMs: 900, velocity: 0.92 },
      { note: 'D', durationMs: 600, velocity: 0.78 },
      { note: 'E', durationMs: 300, velocity: 0.78 },
      { note: 'D', durationMs: 300, velocity: 0.78 },
      { note: 'E', durationMs: 900, velocity: 0.92 },
      { note: 'D', durationMs: 300, velocity: 0.78 },
      { note: 'C', durationMs: 300, velocity: 0.78 },
      { note: 'D', durationMs: 600, velocity: 0.78 },
      { note: 'C', durationMs: 900, velocity: 0.92 },
      { note: 'E', durationMs: 900, velocity: 0.74 },
      { note: 'D', durationMs: 300, velocity: 0.78 },
      { note: 'C', durationMs: 300, velocity: 0.78 },
      { note: 'F', durationMs: 900, velocity: 0.92 },
      { note: 'F', durationMs: 900, velocity: 0.74 },
      { note: 'G', durationMs: 300, velocity: 0.78 },
      { note: 'B', durationMs: 300, velocity: 0.78 },
      { note: 'D', durationMs: 600, velocity: 0.96 },
      { note: 'B', durationMs: 300, velocity: 0.78 },
      { note: 'F', durationMs: 300, velocity: 0.78 },
      { note: 'C', durationMs: 600, velocity: 0.78 },
      { note: 'E', durationMs: 300, velocity: 0.96 },
      { note: 'G', durationMs: 300, velocity: 0.78 },
      { note: 'D', durationMs: 300, velocity: 0.78 },
      { note: 'E', durationMs: 300, velocity: 0.78 },
      { note: 'C', durationMs: 300, velocity: 0.96 },
      { note: 'A', durationMs: 300, velocity: 0.78 },
      { note: 'C', durationMs: 600, velocity: 0.78 }
    ]
  },
  {
    id: 'opening-hop',
    name: 'Opening Hop',
    description: 'Short upbeat demo phrase for the first stage presentation.',
    style: 'bright',
    events: [
      { note: 'C', durationMs: 240, velocity: 0.95 },
      { note: 'E', durationMs: 240, velocity: 0.9 },
      { note: 'G', durationMs: 360, velocity: 1 },
      { note: 'E', durationMs: 240, velocity: 0.86 },
      { note: 'F', durationMs: 240, velocity: 0.92 },
      { note: 'A', durationMs: 360, velocity: 1 },
      { note: 'G', durationMs: 480, velocity: 0.9 },
      { note: 'C', durationMs: 520, velocity: 1 }
    ]
  },
  {
    id: 'soft-call',
    name: 'Soft Call',
    description: 'Gentle call-and-response preset for softer voice samples.',
    style: 'soft',
    events: [
      { note: 'C', durationMs: 480, velocity: 0.7 },
      { note: 'D', durationMs: 480, velocity: 0.72 },
      { note: 'E', durationMs: 720, velocity: 0.8 },
      { note: 'G', durationMs: 480, velocity: 0.76 },
      { note: 'E', durationMs: 480, velocity: 0.68 },
      { note: 'D', durationMs: 720, velocity: 0.7 },
      { note: 'C', durationMs: 900, velocity: 0.82 }
    ]
  },
  {
    id: 'button-dance',
    name: 'Button Dance',
    description: 'Fast rhythmic preset for LED sync testing.',
    style: 'electro',
    events: [
      { note: 'C', durationMs: 150, velocity: 1 },
      { note: 'G', durationMs: 150, velocity: 0.92 },
      { note: 'C', durationMs: 150, velocity: 0.9 },
      { note: 'A', durationMs: 300, velocity: 1 },
      { note: 'F', durationMs: 150, velocity: 0.9 },
      { note: 'E', durationMs: 150, velocity: 0.88 },
      { note: 'D', durationMs: 150, velocity: 0.86 },
      { note: 'G', durationMs: 300, velocity: 1 },
      { note: 'C', durationMs: 450, velocity: 1 }
    ]
  }
];
