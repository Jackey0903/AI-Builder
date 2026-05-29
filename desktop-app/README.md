# Desktop App

Browser-based MVP console for the AI Builder sound instrument.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:5173/` in Chrome or Edge.

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

