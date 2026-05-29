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
| Filename | lowercase kebab-case, for example `cat-meow-c4.wav` |
| Rights | Team-owned, user-recorded, or explicitly authorized only |

### 2. Sound Preset Metadata

Register files in:

```text
desktop-app/src/content/soundLibrary.ts
```

Parameter contract:

| Parameter | Type | Meaning |
|---|---|---|
| `id` | string | Stable lowercase id |
| `name` | string | Display name |
| `description` | string | Short usage note |
| `file` | string | Browser path, usually `/sounds/name.wav` |
| `baseNote` | `C/D/E/F/G/A/B` | The note of the original sample; use `C` if unknown |
| `trimStartMs` | number | Optional manual start trim |
| `trimEndMs` | number | Optional manual end trim |
| `gain` | number | Optional volume multiplier, usually `0.6-1.1` |
| `enabled` | boolean | Set true only after the file exists |
| `credit` | string | Source/permission note |
| `tags` | string[] | Optional search/group labels |

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

