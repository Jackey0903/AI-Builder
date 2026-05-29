# Implementation Plan

## Architecture

```text
Computer Chrome app
  - microphone recording
  - Web Audio sampling and playback
  - motif capture
  - melody generation
  - Web Serial connection

USB serial
  - button events up
  - LED commands down

ESP32-S3 firmware
  - debounced buttons
  - serial parser
  - WS2812B animations
```

## Desktop Modules

- `src/audio/audioEngine.ts`: Web Audio recording decode, pitch-shift playback, fallback oscillator tones.
- `src/audio/melody.ts`: short deterministic melody generation from motif.
- `src/hooks/useSerialDevice.ts`: Web Serial connection, line parser, writer.
- `src/content/soundLibrary.ts`: teammate-editable sound preset registry.
- `src/content/presetMelodies.ts`: teammate-editable preset phrase registry.
- `src/App.tsx`: UI state, hardware event routing, playback flow.

## Firmware Modules

The firmware is a single Arduino sketch for speed:

- Button definitions and debounce.
- Serial line parsing.
- FastLED LED states and note color mapping.

## Demo Script

1. Launch the desktop app.
2. Connect the ESP32-S3.
3. Record a short vocal sample.
4. Press hardware notes to prove physical input.
5. Press generate to play the motif expansion.
6. Show the LED ring following notes.

## Content Handoff

The sound library and preset melody files are intentionally isolated. The content team can add files and metadata without touching:

- ESP32 firmware.
- Serial protocol.
- Recording logic.
- LED command handling.

Use `CONTENT_HANDOFF.md` as the shared parameter contract.

