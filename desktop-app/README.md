# Desktop App

Browser-based MVP console for the AI Builder sound instrument.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:5173/` in Chrome or Edge.

## No-Hardware Audio Test

Hardware is optional for testing the uploaded sounds.

1. Start the app with `npm run dev`.
2. Open `http://localhost:5173/`.
3. Select a sound in **Sound Library**.
4. Click **Load Preset**.
5. Use on-screen keys or keyboard `1-7` to play notes.
6. Use **Generate Melody** to test a short generated melody.

Recommended order:

| Sound | Use |
|---|---|
| `圆号鱼发音4` | First choice for main playable timbre; clean single syllable |
| `圆号鱼发音2` | Good comparison; clean single syllable with lower pitch |
| `圆号鱼发音5低音` | Low-labelled comparison sample |
| `圆号鱼` | Older long sample; can sound like multiple syllables |
| `里拉鳐` | Sharp and distinctive comparison |
| `圆号鱼合奏` | Comparison only; more like a phrase/ensemble |
| `猴麦仔` | Comparison only; long source file |
| `炫光迪迪` | Comparison only; long and loud source file |

## Browser Requirements

- Microphone recording uses `navigator.mediaDevices.getUserMedia`.
- Hardware connection uses Web Serial, available in Chrome/Edge.
- The app still works without hardware through on-screen buttons and keyboard shortcuts.

## Content Integration

Sound file drop zone:

```text
public/sounds/
```

Sound metadata:

```text
src/content/soundLibrary.ts
```

Preset melodies:

```text
src/content/presetMelodies.ts
```

See `../docs/CONTENT_HANDOFF.md` before adding content.

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `1-7` | Play C/D/E/F/G/A/B |
| `R` | Record sample |
| `G` | Generate melody |
