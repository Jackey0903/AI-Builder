# Content Handoff: Sound Library and Preset Melodies

This splits work cleanly between implementation and content.

## Content Team Owns

### 1. Sound Files

Put audio files in:

```text
desktop-app/public/sounds/
```

Recommended file format:

| Field | Requirement |
|---|---|
| Format | `.wav` preferred; `.mp3`, `.webm`, `.ogg` accepted |
| Sample rate | 44.1kHz or 48kHz |
| Channels | Mono preferred, stereo accepted |
| Length | 0.3s-1.2s ideal, 3s maximum |
| Filename | lowercase kebab-case, for example `cat-meow-c4.wav`; keep the registered app path ASCII when possible |
| Rights | Team-owned, user-recorded, or explicitly authorized only |

### 2. Sound Preset Metadata

Register files in:

```text
desktop-app/src/content/soundLibrary.ts
```

Single-sample parameter contract:

| Parameter | Type | Meaning |
|---|---|---|
| `id` | string | Stable lowercase id |
| `name` | string | Display name |
| `description` | string | Short usage note |
| `file` | string | Browser path, usually `/sounds/name.wav` |
| `baseNote` | `C/D/E/F/G/A/B` | The note of the original sample; use `C` if unknown |
| `baseSemitoneOffset` | number | Optional measured pitch relative to C4, such as `-3` for A3 or `5` for F4 |
| `trimStartMs` | number | Optional manual start trim |
| `trimEndMs` | number | Optional manual end trim |
| `gain` | number | Optional volume multiplier, usually `0.6-1.1` |
| `enabled` | boolean | Set true only after the file exists |
| `credit` | string | Source/permission note |
| `tags` | string[] | Optional search/group labels |

For one character/timbre, a multi-sample preset is preferred when you have several clean short syllables. The app will pick a stable layer for the requested note/root before pitch shifting, which reduces the double-syllable and compressed-sound effect.

```ts
{
  id: 'yuanhaoyu-multisample',
  name: '圆号鱼双采样',
  description: 'Current main demo timbre using 发音5低音 and 发音2.',
  samples: [
    {
      id: 'low',
      name: '发音5低音',
      file: '/sounds/yuanhaoyu-voice-low.wav',
      baseNote: 'A',
      baseSemitoneOffset: -3,
      trimStartMs: 0,
      trimEndMs: 235,
      gain: 1.18,
      role: 'low'
    },
    {
      id: 'mid',
      name: '发音2',
      file: '/sounds/yuanhaoyu-voice-mid.wav',
      baseNote: 'F',
      baseSemitoneOffset: 5,
      trimStartMs: 0,
      trimEndMs: 277,
      gain: 1.12,
      role: 'mid'
    }
  ],
  enabled: true,
  credit: 'Team recording',
  tags: ['character', 'dual-sample', 'recommended']
}
```

Multi-sample layer contract:

| Parameter | Type | Meaning |
|---|---|---|
| `id` | string | Stable layer id, such as `low`, `mid`, `high` |
| `name` | string | Display/debug name |
| `file` | string | Browser path, usually `/sounds/name.wav` |
| `baseNote` | `C/D/E/F/G/A/B` | The nearest pitch of this sample; use listening/tuner judgement |
| `baseSemitoneOffset` | number | Optional measured pitch relative to C4, such as `-3` for A3 or `5` for F4 |
| `trimStartMs` | number | Optional manual start trim |
| `trimEndMs` | number | Optional manual end trim |
| `gain` | number | Optional volume multiplier |
| `role` | `low/mid/high/single/phrase` | Human-readable layer role |

### 3. Preset Melodies

Edit:

```text
desktop-app/src/content/presetMelodies.ts
```

Melody event contract:

| Parameter | Type | Meaning |
|---|---|---|
| `note` | `C/D/E/F/G/A/B` | Note to play |
| `durationMs` | number | Duration in milliseconds |
| `velocity` | number | Volume/strength from `0` to `1` |

Recommended phrase length for demo presets: 5-15 seconds.

## Implementation Team Owns

- Web app flow.
- Hardware serial bridge.
- LED command protocol.
- Recording and pitch-shift playback.
- Rule-based generation fallback.
- Wiring and firmware docs.

## Integration Rule

Content can be added without changing the hardware firmware or serial protocol. If a new content parameter is needed, add it to this document first so both sides use the same language.
