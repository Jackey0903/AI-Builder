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
    id: 'yuanhaoyu-voice-2',
    name: '圆号鱼',
    description: 'Clean single-syllable sample with lower pitch; useful for comparison.',
    file: '/sounds/yuanhaoyu-voice-mid.wav',
    baseNote: 'F',
    baseSemitoneOffset: 5,
    trimStartMs: 0,
    trimEndMs: 277,
    gain: 1.12,
    enabled: true,
    credit: 'Team uploaded single-syllable sample; confirm usage rights before public release.',
    tags: ['character', 'single-syllable']
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
    enabled: false,
    credit: 'Team uploaded sample; confirm usage rights before public release.',
    tags: ['character', 'single', 'disabled']
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
    enabled: false,
    credit: 'Team uploaded sample; confirm usage rights before public release.',
    tags: ['ensemble', 'melody', 'disabled']
  },
  {
    id: 'xuanguang-didi',
    name: '炫光迪迪',
    description: 'Long phrase sample. Use a short leading fragment only; full file is too long for key playback.',
    file: '/sounds/炫光迪迪.wav',
    baseNote: 'C',
    baseSemitoneOffset: 0,
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
    description: '猴麦仔单音采样（149ms），基频约 E4（324Hz），baseSemitoneOffset=4 固定基准，音头干净无气音。',
    file: '/sounds/猴麦仔/猴麦仔采样.wav',
    baseNote: 'E',
    baseSemitoneOffset: 4,
    trimStartMs: 0,
    trimEndMs: 0,
    gain: 0.9,
    enabled: true,
    credit: 'Team uploaded sample; confirm usage rights before public release.',
    tags: ['character', 'single']
  },
  {
    id: 'lilayao',
    name: '里拉鳐',
    description: '里拉鳐单音节采样，音色清脆。实测录音音高 A3（-3 半音），用 baseSemitoneOffset 固定基准，避免跨 root 八度跳变。',
    file: '/sounds/里拉鳐音节/里拉鳐音节1.wav',
    baseNote: 'A',
    baseSemitoneOffset: -3,
    trimStartMs: 0,
    trimEndMs: 0,
    gain: 1,
    enabled: true,
    credit: 'Team uploaded sample; confirm usage rights before public release.',
    tags: ['character', 'single', 'sharp']
  },
  {
    id: 'xiaoya',
    name: '小夜',
    description: '小夜音色，柔和温润。实测录音音高 E4（+4 半音），用 baseSemitoneOffset 固定基准，避免跨 root 八度跳变。',
    file: '/sounds/小夜/小夜.wav',
    baseNote: 'E',
    baseSemitoneOffset: 4,
    trimStartMs: 0,
    trimEndMs: 0,
    gain: 1,
    enabled: true,
    credit: 'Team uploaded sample; confirm usage rights before public release.',
    tags: ['character', 'soft', 'lyrical']
  },
  {
    id: 'emoding',
    name: '恶魔叮',
    description: '恶魔叮战斗采样（1451ms），主体爆发在 240~400ms（峰值最高），前 100ms 为低幅过渡，trimStartMs=100 跳过。基频约 D#6（1231Hz），baseSemitoneOffset=27 固定基准。',
    file: '/sounds/恶魔叮/恶魔叮战斗.wav',
    baseNote: 'D',   // 实际基频 D#6；精确偏移由 baseSemitoneOffset:27 控制
    baseSemitoneOffset: 27,
    trimStartMs: 100,
    trimEndMs: 0,
    gain: 0.8,
    enabled: true,
    credit: 'Team uploaded sample; confirm usage rights before public release.',
    tags: ['character', 'single', 'sharp', 'ding', 'battle']
  }
];

export const enabledSoundPresets = SOUND_PRESETS.filter((preset) => preset.enabled);
