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
    id: 'starter-chirp',
    name: 'Starter Chirp',
    description: 'Placeholder slot for a short team-owned creature voice sample.',
    file: '/sounds/starter-chirp-c4.wav',
    baseNote: 'C',
    trimStartMs: 0,
    trimEndMs: 900,
    gain: 0.9,
    enabled: false,
    credit: 'Replace with a team-owned or authorized sound file before enabling.',
    tags: ['placeholder', 'creature']
  }
];

export const enabledSoundPresets = SOUND_PRESETS.filter((preset) => preset.enabled);

