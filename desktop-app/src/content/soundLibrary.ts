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
    // YIN 实测基频 552Hz ≈ C#5（semitone=1）。
    // 原配置 baseSemitoneOffset=5（F）导致音阶偏移4半音（C键响G#而非C）。
    // 修正为 1（C#），C键=C5, D=D5, E=E5, ..., B=B5。
    description: 'Clean single-syllable sample, C#5（552Hz），baseSemitoneOffset=1 修正基准。',
    file: '/sounds/yuanhaoyu-voice-mid.wav',
    baseNote: 'C',
    baseSemitoneOffset: 1,
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
    enabled: false,
    credit: 'Team uploaded sample; confirm usage rights before public release.',
    tags: ['character', 'long', 'comparison']
  },
  {
    id: 'houmaizai',
    name: '猴麦仔',
    // 实测基频 E4（~658Hz），采样 149ms，全段有声（RMS 0.25→0.55，峰值在 50ms）。
    // baseSemitoneOffset=4（E）：引擎将样本从 E 映射到标准音阶，C键=C4，D=D4，E=E4原声，以此类推。
    // 注意：此值不能改为 0，否则 C 键会响 E4（整个音阶上移4半音）。
    description: '猴麦仔单音采样（149ms），基频 E4（658Hz），baseSemitoneOffset=4 固定基准，音头干净无气音。',
    file: '/sounds/原声合集/猴麦仔原声.wav',
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
    description: '恶魔叮单音采样（405ms），pYIN 检测 A5（870Hz），置信度 69%。经两轮谱减法降噪去除气息底噪，发音结实无气感，baseSemitoneOffset=9。',
    file: '/sounds/恶魔叮/恶魔叮采样_clean.wav',
    baseNote: 'A',
    baseSemitoneOffset: 9,
    trimStartMs: 0,
    trimEndMs: 0,
    gain: 0.85,
    enabled: true,
    credit: 'Team uploaded sample; confirm usage rights before public release.',
    tags: ['character', 'single', 'sharp', 'ding']
  },
  {
    id: 'beng-squirrel-adult',
    name: '蹦床松鼠',
    // 成年版：384ms，D5（约590Hz），baseSemitoneOffset=+14
    // 包络：0ms即有声(RMS≈0.13)，60~120ms主体爆发，360ms后静音
    description: '蹦床松鼠成年采样（384ms），基频 D5，厚实饱满，全段有声无需裁切。',
    file: '/sounds/蹦床松鼠/蹦床松鼠（成年）.wav',
    baseNote: 'D',
    baseSemitoneOffset: 14,
    trimStartMs: 0,
    trimEndMs: 0,
    gain: 1.0,
    enabled: false,
    credit: 'Team uploaded sample; confirm usage rights before public release.',
    tags: ['character', 'bouncy', 'squirrel', 'adult']
  },
  {
    id: 'beng-squirrel-young',
    name: '蹦床松鼠幼',
    // 幼年版：213ms，F#5（约740Hz），baseSemitoneOffset=+18
    // 包络：0ms几乎静音(RMS≈0.001)，70ms峰值，200ms快速衰减
    description: '蹦床松鼠幼年采样（213ms），基频 F#5，短促活泼，高音清脆。',
    file: '/sounds/蹦床松鼠/蹦床松鼠（幼年）.wav',
    baseNote: 'F',
    baseSemitoneOffset: 18,
    trimStartMs: 0,
    trimEndMs: 0,
    gain: 1.0,
    enabled: false,
    credit: 'Team uploaded sample; confirm usage rights before public release.',
    tags: ['character', 'bouncy', 'squirrel', 'young', 'high']
  }
];

export const enabledSoundPresets = SOUND_PRESETS.filter((preset) => preset.enabled);
