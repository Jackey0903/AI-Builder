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
