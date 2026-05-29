# Hardware Wiring

## Required MVP Hardware

| Item | Quantity | Purpose |
|---|---:|---|
| ESP32-S3 DevKit | 1 | Reads buttons, controls LED ring, USB serial bridge |
| 12x12mm momentary buttons | 9 | 7 notes + record + generate |
| WS2812B 16-pixel LED ring | 1 | Note and rhythm feedback |
| Breadboard or perfboard | 1 | Prototype wiring |
| Jumper wires | 1 batch | Signal and power wiring |
| USB-C data cable | 1 | Power and serial |

## Pin Map

Buttons use `INPUT_PULLUP`; wire one side to the GPIO and the other side to `GND`.

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

