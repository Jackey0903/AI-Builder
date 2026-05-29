# MVP Scope

## Goal

Build a stable demo that proves the core interaction:

```text
record sound on computer -> map to 7 notes -> play with physical keys -> generate melody -> sync LEDs
```

## Included

- Computer microphone recording.
- 7-note sampling by pitch shifting the captured sound.
- On-screen note buttons and keyboard fallback.
- ESP32-S3 physical note buttons over USB serial.
- ESP32-S3 record and generate buttons.
- WS2812B LED feedback for notes, recording, generation, playback, and idle state.
- Rule-based melody generation from a short motif.
- Original/placeholder visual character in the UI.
- Teammate-editable sound preset and melody preset registries.

## Explicitly Deferred

- Built-in official game audio, official sprites, or full character database.
- Hardware microphone, amplifier, speaker, SD card, battery, Bluetooth.
- Cloud accounts, sharing, upload, or publishing.
- Full AI music model. MVP uses deterministic rule/template logic so the demo is fast and reliable.
- Public release of official game content without authorization.

## Risk Review

- **IP risk:** Do not bundle official game assets unless permission is granted. Use user-provided samples or original placeholders.
- **Demo risk:** Audio recording and Web Serial both require Chrome permissions. Keep keyboard fallback available.
- **Hardware risk:** Use USB power and low LED brightness. Avoid battery and Bluetooth for first demo.
- **Scope risk:** Do not add full asset library or complex editing before the MVP flow works end to end.

## Success Criteria

- The desktop app runs locally with `npm run dev`.
- A user can record a sound and play all seven notes.
- Physical button messages trigger the same app actions as on-screen controls.
- Generated melodies play without requiring external services.
- ESP32 firmware has a clear pin map and serial protocol.
- Content teammates can add sound files and preset melodies without changing implementation code outside `src/content`.
