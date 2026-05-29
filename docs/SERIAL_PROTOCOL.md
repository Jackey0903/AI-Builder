# Serial Protocol

The ESP32-S3 and desktop app communicate over USB serial at `115200` baud.

All messages are ASCII lines ending with `\n`.

## ESP32-S3 -> Desktop App

```text
READY
NOTE:C
NOTE:D
NOTE:E
NOTE:F
NOTE:G
NOTE:A
NOTE:B
REC
GENERATE
PING
```

## Desktop App -> ESP32-S3

```text
LED:NOTE:C
LED:NOTE:D
LED:NOTE:E
LED:NOTE:F
LED:NOTE:G
LED:NOTE:A
LED:NOTE:B
LED:REC
LED:GENERATE
LED:PLAY
LED:RAINBOW
LED:OFF
BRIGHTNESS:32
PING
```

## Notes

- `NOTE:*` maps to both sound playback and LED note color.
- `REC` starts microphone capture in the desktop app.
- `GENERATE` builds and plays a melody from the recent motif.
- `BRIGHTNESS:*` accepts `0-255`; the MVP should stay around `24-48` for USB stability.
- Unknown commands are ignored by firmware and logged by the desktop app.

