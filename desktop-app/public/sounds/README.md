# Sound Library Drop Zone

Put team-owned or authorized audio files here.

## Preferred Format

- `.wav`
- 44.1kHz or 48kHz
- mono preferred, stereo accepted
- 16-bit or 24-bit PCM
- 0.3s-1.2s ideal, 3s maximum

Browser-supported `.mp3`, `.webm`, and `.ogg` files also work, but `.wav` is easiest to inspect and debug.

## Naming

Use lowercase kebab-case:

```text
cat-meow-c4.wav
water-sprite-c4.wav
tiny-bell-c4.wav
```

The suffix should describe the note of the source file when known. If unknown, use `c4` and set `baseNote: 'C'`.

## Registration

After adding a file, register it in:

```text
desktop-app/src/content/soundLibrary.ts
```

Example:

```ts
{
  id: 'cat-meow',
  name: 'Cat Meow',
  description: 'Short meow recorded by the team.',
  file: '/sounds/cat-meow-c4.wav',
  baseNote: 'C',
  trimStartMs: 20,
  trimEndMs: 780,
  gain: 0.85,
  enabled: true,
  credit: 'Team recording',
  tags: ['animal', 'bright']
}
```

Do not add official game audio or ripped assets unless the team has explicit permission.

