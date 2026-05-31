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
5. Use **Key Root** to compare which root fits the sample best.
6. Use on-screen keys or keyboard `1-7` to play notes.
7. Use **Generate Melody** to test a short generated melody.

Recommended order:

| Sound | Use |
|---|---|
| `圆号鱼双采样` | First choice for current main demo; only keeps `发音2` and `发音5低音` |
| `圆号鱼发音2` | Clean single-syllable comparison sample |
| `圆号鱼发音5低音` | Low single-syllable comparison sample |
| `里拉鳐` | Sharp and distinctive comparison |
| `猴麦仔` | Comparison only; long source file |
| `炫光迪迪` | Comparison only; long and loud source file |

Recommended preset melodies:

| Melody | Use |
|---|---|
| `场景-登陆 BGM` | Extracted 7-note demo phrase from the uploaded login scene BGM |
| `彼得大道 BGM` | Extracted 7-note demo phrase from the uploaded Peter Avenue BGM |

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
