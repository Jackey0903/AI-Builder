import type { SoundPreset } from '../types';

export const SOUND_FILE_REQUIREMENTS = {
  preferredFormat: 'wav',
  acceptedFormats: ['wav', 'mp3', 'webm', 'ogg'],
  sampleRate: '44100Hz or 48000Hz',
  channels: 'mono preferred, stereo accepted',
  idealLength: '0.3s-1.2s',
  maxLength: '3s',
  naming: 'lowercase-kebab-case, for example cat-meow-c4.wav'
} as const;

export const SOUND_PRESETS: SoundPreset[] = [
  {
    id: 'yuanhaoyu-multisample',
    name: '圆号鱼多采样',
    description: 'Low/mid/high sample layers for one timbre. The player automatically picks the closest layer to reduce pitch-shift artifacts.',
    samples: [
      {
        id: 'low',
        name: '低音层',
        file: '/sounds/yuanhaoyu-voice-low.wav',
        baseNote: 'C',
        trimStartMs: 0,
        trimEndMs: 235,
        gain: 1.18,
        role: 'low'
      },
      {
        id: 'mid',
        name: '中音层',
        file: '/sounds/yuanhaoyu-voice-mid.wav',
        baseNote: 'E',
        trimStartMs: 0,
        trimEndMs: 277,
        gain: 1.12,
        role: 'mid'
      },
      {
        id: 'high',
        name: '高音层',
        file: '/sounds/yuanhaoyu-voice-high.wav',
        baseNote: 'A',
        trimStartMs: 0,
        trimEndMs: 405,
        gain: 1.08,
        role: 'high'
      }
    ],
    enabled: true,
    credit: 'Team uploaded low/mid/high single-syllable samples; confirm usage rights before public release.',
    tags: ['character', 'multi-sample', 'recommended']
  },
  {
    id: 'yuanhaoyu-voice-4',
    name: '圆号鱼发音4',
    description: 'Best current single-syllable candidate: one clean attack, short duration, strong level.',
    file: '/sounds/yuanhaoyu-voice-high.wav',
    baseNote: 'C',
    trimStartMs: 0,
    trimEndMs: 405,
    gain: 1.08,
    enabled: true,
    credit: 'Team uploaded single-syllable sample; confirm usage rights before public release.',
    tags: ['character', 'single-syllable', 'recommended']
  },
  {
    id: 'yuanhaoyu-voice-2',
    name: '圆号鱼发音2',
    description: 'Clean single-syllable sample with lower pitch; useful for comparison.',
    file: '/sounds/yuanhaoyu-voice-mid.wav',
    baseNote: 'C',
    trimStartMs: 0,
    trimEndMs: 277,
    gain: 1.12,
    enabled: true,
    credit: 'Team uploaded single-syllable sample; confirm usage rights before public release.',
    tags: ['character', 'single-syllable', 'comparison']
  },
  {
    id: 'yuanhaoyu-voice-low',
    name: '圆号鱼发音5低音',
    description: 'Short low-voice-labelled sample. Good comparison for a lower character timbre.',
    file: '/sounds/yuanhaoyu-voice-low.wav',
    baseNote: 'C',
    trimStartMs: 0,
    trimEndMs: 235,
    gain: 1.18,
    enabled: true,
    credit: 'Team uploaded single-syllable sample; confirm usage rights before public release.',
    tags: ['character', 'single-syllable', 'low']
  },
  {
    id: 'yuanhaoyu',
    name: '圆号鱼',
    description: 'Short leading fragment from the uploaded single-character audio. Best first candidate for playable note timbre.',
    file: '/sounds/圆号鱼.wav',
    baseNote: 'C',
    trimStartMs: 0,
    trimEndMs: 950,
    gain: 0.95,
    enabled: true,
    credit: 'Team uploaded sample; confirm usage rights before public release.',
    tags: ['character', 'single', 'bright']
  },
  {
    id: 'yuanhaoyu-ensemble',
    name: '圆号鱼合奏',
    description: 'Ensemble melody source. Usable for comparison, but less ideal as a playable key timbre.',
    file: '/sounds/圆号鱼合奏.wav',
    baseNote: 'C',
    trimStartMs: 0,
    trimEndMs: 900,
    gain: 1,
    enabled: true,
    credit: 'Team uploaded sample; confirm usage rights before public release.',
    tags: ['ensemble', 'melody', 'comparison']
  },
  {
    id: 'xuanguang-didi',
    name: '炫光迪迪',
    description: 'Long phrase sample. Use a short leading fragment only; full file is too long for key playback.',
    file: '/sounds/炫光迪迪.wav',
    baseNote: 'C',
    trimStartMs: 0,
    trimEndMs: 850,
    gain: 0.82,
    enabled: true,
    credit: 'Team uploaded sample; confirm usage rights before public release.',
    tags: ['character', 'long', 'comparison']
  },
  {
    id: 'houmaizai',
    name: '猴麦仔',
    description: 'Long phrase sample with lower dominant tone. Better as a fun comparison preset than the main demo timbre.',
    file: '/sounds/猴麦仔.wav',
    baseNote: 'C',
    trimStartMs: 0,
    trimEndMs: 900,
    gain: 0.9,
    enabled: true,
    credit: 'Team uploaded sample; confirm usage rights before public release.',
    tags: ['character', 'long', 'comparison']
  },
  {
    id: 'lilayao',
    name: '里拉鳐',
    description: 'Shorter active fragments with a sharper tone. Good candidate for a distinctive toy-like timbre.',
    file: '/sounds/里拉鳐.wav',
    baseNote: 'C',
    trimStartMs: 0,
    trimEndMs: 950,
    gain: 1,
    enabled: true,
    credit: 'Team uploaded sample; confirm usage rights before public release.',
    tags: ['character', 'single', 'sharp']
  }
];

export const enabledSoundPresets = SOUND_PRESETS.filter((preset) => preset.enabled);
