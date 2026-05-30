# AI Builder Sound Instrument MVP

This repository turns the original activity concept into a buildable MVP:

- A browser-based desktop console records a short sound, maps it into a 7-note playable instrument, generates a short melody from a user motif, and sends light commands to hardware.
- An ESP32-S3 controller reads 9 physical buttons and controls a WS2812B LED ring over USB serial.
- The MVP intentionally avoids distributing official game audio or artwork. Any IP-themed assets should be user-provided or replaced with original placeholders before public posting.

## Project Layout

```text
.
├── desktop-app/                 # Vite + React desktop console
│   ├── public/sounds/           # Teammate-owned sound files go here
│   └── src/content/             # Sound preset and melody preset metadata
├── firmware/esp32-s3-controller # ESP32-S3 Arduino/PlatformIO firmware
├── docs/                        # MVP scope, wiring, protocol, implementation notes
├── DFRobot 完整采购清单.md       # Hardware purchase list for the current MVP
└── 洛克王国精灵声音 DIY 演奏小乐器.md
```

## Quick Start

```bash
cd desktop-app
npm install
npm run dev
```

Open the printed localhost URL in Chrome. Web Serial requires Chrome/Edge and a secure context; Vite localhost is valid.

## Test Without Hardware

The app can be tested before the ESP32-S3 and buttons arrive.

1. Run the desktop app:

   ```bash
   cd desktop-app
   npm install
   npm run dev
   ```

2. Open `http://localhost:5173/` in Chrome or Edge.
3. In **Sound Library**, choose one of the uploaded samples. Start with `圆号鱼多采样`, which combines low/mid/high single-syllable layers.
4. Click **Load Preset**.
5. Use **Key Root** to compare C/D/E/F/G/A/B roots without hardware.
6. Play notes with the on-screen keys or keyboard `1-7`.
7. Click **Generate Melody** to test melody generation with the selected sound.

Current recommendation for testing: start with `圆号鱼多采样`, then compare the single-layer presets `圆号鱼发音4`, `圆号鱼发音2`, and `圆号鱼发音5低音`. The older long melody/ensemble files can load, but they are more likely to sound like multiple syllables and are less ideal as the main playable key timbre.

## MVP Flow

1. Connect ESP32-S3 over USB.
2. Click **Connect Hardware** in the desktop app.
3. Record a 3-5 second sound from the computer microphone.
4. Play notes from the physical buttons or on-screen keys.
5. Press **Generate** to turn the recent 2-8 note motif into a short melody.
6. The app plays audio while the ESP32-S3 lights the LED ring.

## Hardware Purchase

Use `DFRobot 完整采购清单.md` as the current purchase list. The selected buttons are DFRobot Gravity digital big button modules: 7 yellow note buttons, 1 red record button, and 1 green generate button. These modules output `HIGH` when pressed, and the firmware is configured for high-level button triggering.

## Team Split

Implementation side:

- Desktop app flow and UI.
- Recording, pitch-shift playback, and fallback generation.
- ESP32 serial protocol and LED/button firmware.
- Wiring and setup documentation.

Content side:

- Add audio files to `desktop-app/public/sounds/`.
- Register playable sound presets in `desktop-app/src/content/soundLibrary.ts`.
- For one character/timbre, prefer several short low/mid/high single-syllable samples so the app can choose the closest layer before pitch shifting.
- Edit preset phrases in `desktop-app/src/content/presetMelodies.ts`.
- Follow `docs/CONTENT_HANDOFF.md` for file formats and parameter names.
- Chinese handoff note: `docs/TEAM_SPLIT_CN.md`.

## Verification

```bash
cd desktop-app
npm run build
```

Firmware verification requires PlatformIO or Arduino IDE with FastLED installed.
