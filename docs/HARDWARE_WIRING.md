# Hardware Wiring

## Required MVP Hardware

| Item | Quantity | Purpose |
|---|---:|---|
| DFRobot ESP32-S3-DevKitC-1, DFR0895 | 1 | Reads buttons, controls LED ring, USB serial bridge |
| Gravity digital big button, yellow, DFR0029-Y | 7 | Do / Re / Mi / Fa / Sol / La / Si |
| Gravity digital big button, red, DFR0029-R | 1 | Record |
| Gravity digital big button, green, DFR0029-G | 1 | Generate |
| WS2812-16 RGB LED Ring, DFR0888-16 | 1 | Note and rhythm feedback |
| Medium breadboard, FIT0096 | 1 | Prototype wiring |
| Breadboard jumper wires, FIT0121 | 1 batch | Signal and power wiring |
| Type-C & Micro USB cable, FIT0668 | 1 | Power and serial |

## Pin Map

DFRobot Gravity digital big buttons are 3-wire modules. Wire every button with `VCC -> 3V3`, `GND -> GND`, and `SIG -> the GPIO below`.

The module outputs `HIGH` when pressed, so the firmware uses normal `INPUT` and high-level trigger logic.

| Function | GPIO |
|---|---:|
| Note C / Do | GPIO4 |
| Note D / Re | GPIO5 |
| Note E / Mi | GPIO6 |
| Note F / Fa | GPIO7 |
| Note G / Sol | GPIO8 |
| Note A / La | GPIO9 |
| Note B / Si | GPIO10 |
| Record | GPIO12 |
| Generate | GPIO13 |
| WS2812B DIN | GPIO11 |

## LED Ring

| LED Ring Pin | ESP32-S3 |
|---|---|
| 5V | 5V / VBUS |
| GND | GND |
| DIN | GPIO11 |

Keep brightness low in firmware (`32` by default). If the LED ring flickers, reduce brightness first.

## Build Notes

- Use USB power for the first demo.
- Do not add battery charging until the MVP flow is stable.
- If using a 24-pixel ring instead of 16 pixels, update `NUM_LEDS` in firmware and keep brightness low.
- The detailed purchase list is in `DFRobot 完整采购清单.md`.
