# VoxSprite Desktop App

Browser-based performance console for VoxSprite, a voice-sampling instrument with ESP32 controls and reactive LEDs.

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
| `圆号鱼` | First choice for current main demo |
| `里拉鳐` | Sharp and distinctive comparison |
| `猴麦仔` | Short dry sample, useful for rhythm tests |
| `炫光迪迪` | Louder long-source comparison |
| `小夜` | Softer lyrical comparison timbre |
| `恶魔叮` | Bright attack-heavy comparison timbre |
| `蹦床松鼠` | Bouncy short-note comparison timbre |

Recommended preset melodies:

| Melody | Use |
|---|---|
| `人鱼湾 正谱` | Main lyrical demo; plays with `人鱼湾伴奏.wav` as a quiet backing pad |
| `彼得大道 Vocal` | Bright rhythmic demo phrase |
| `蜜雪冰城` | Fast familiar melody stress test |
| `找朋友` | Simple children's-song style test |

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
