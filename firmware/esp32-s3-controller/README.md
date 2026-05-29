# ESP32-S3 Controller Firmware

This firmware is the MVP hardware bridge:

- Reads 7 note buttons plus record and generate.
- Sends ASCII events to the desktop app over USB serial.
- Receives LED commands from the desktop app.
- Drives a WS2812B LED ring with FastLED.

## Build

Install PlatformIO, then run:

```bash
cd firmware/esp32-s3-controller
pio run
pio run --target upload
pio device monitor -b 115200
```

If you use Arduino IDE instead, copy `src/main.cpp` into an Arduino sketch and install the FastLED library.

## Wiring

See `../../docs/HARDWARE_WIRING.md`.

