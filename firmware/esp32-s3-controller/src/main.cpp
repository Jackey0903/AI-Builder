#include <Arduino.h>
#include <FastLED.h>

constexpr uint32_t BAUD_RATE = 115200;
constexpr uint8_t LED_PIN = 11;
constexpr uint8_t NUM_LEDS = 16;
constexpr uint8_t DEFAULT_BRIGHTNESS = 32;
constexpr uint16_t DEBOUNCE_MS = 28;
constexpr bool BUTTON_PRESSED_STATE = HIGH;

CRGB leds[NUM_LEDS];

struct ButtonDef {
  uint8_t pin;
  const char* message;
  bool stableState;
  bool lastReading;
  uint32_t lastChangeMs;
};

ButtonDef buttons[] = {
  {4, "NOTE:C", LOW, LOW, 0},
  {5, "NOTE:D", LOW, LOW, 0},
  {6, "NOTE:E", LOW, LOW, 0},
  {7, "NOTE:F", LOW, LOW, 0},
  {8, "NOTE:G", LOW, LOW, 0},
  {9, "NOTE:A", LOW, LOW, 0},
  {10, "NOTE:B", LOW, LOW, 0},
  {12, "REC", LOW, LOW, 0},
  {13, "GENERATE", LOW, LOW, 0},
};

String inputLine;
uint32_t lastIdleMs = 0;
uint8_t idleHue = 0;

CRGB colorForNote(const String& note) {
  if (note == "C") return CRGB(255, 91, 77);
  if (note == "D") return CRGB(255, 176, 0);
  if (note == "E") return CRGB(242, 223, 58);
  if (note == "F") return CRGB(95, 211, 106);
  if (note == "G") return CRGB(32, 199, 199);
  if (note == "A") return CRGB(64, 140, 255);
  if (note == "B") return CRGB(173, 108, 255);
  return CRGB::White;
}

void showNote(const String& note) {
  CRGB color = colorForNote(note);
  fill_solid(leds, NUM_LEDS, CRGB::Black);
  for (uint8_t index = 0; index < NUM_LEDS; index += 2) {
    leds[index] = color;
  }
  FastLED.show();
}

void showSolid(CRGB color) {
  fill_solid(leds, NUM_LEDS, color);
  FastLED.show();
}

void showRainbow() {
  fill_rainbow(leds, NUM_LEDS, idleHue, 255 / NUM_LEDS);
  FastLED.show();
}

void showGenerate() {
  fill_solid(leds, NUM_LEDS, CRGB::Black);
  for (uint8_t index = 0; index < NUM_LEDS; index += 1) {
    leds[index] = CHSV((index * 18 + idleHue) % 255, 220, 160);
  }
  FastLED.show();
}

void handleCommand(String line) {
  line.trim();
  if (line.length() == 0) return;

  if (line.startsWith("LED:NOTE:")) {
    showNote(line.substring(9));
    return;
  }

  if (line == "LED:REC") {
    showSolid(CRGB(255, 91, 77));
    return;
  }

  if (line == "LED:GENERATE") {
    showGenerate();
    return;
  }

  if (line == "LED:PLAY") {
    showSolid(CRGB(95, 211, 106));
    return;
  }

  if (line == "LED:RAINBOW") {
    showRainbow();
    return;
  }

  if (line == "LED:OFF") {
    showSolid(CRGB::Black);
    return;
  }

  if (line.startsWith("BRIGHTNESS:")) {
    int value = line.substring(11).toInt();
    FastLED.setBrightness(constrain(value, 0, 255));
    FastLED.show();
    return;
  }

  if (line == "PING") {
    Serial.println("PONG");
  }
}

void readSerial() {
  while (Serial.available()) {
    char character = static_cast<char>(Serial.read());

    if (character == '\n') {
      handleCommand(inputLine);
      inputLine = "";
    } else if (character != '\r') {
      inputLine += character;
      if (inputLine.length() > 80) {
        inputLine = "";
      }
    }
  }
}

void scanButtons() {
  const uint32_t now = millis();

  for (ButtonDef& button : buttons) {
    bool reading = digitalRead(button.pin);

    if (reading != button.lastReading) {
      button.lastChangeMs = now;
      button.lastReading = reading;
    }

    if ((now - button.lastChangeMs) > DEBOUNCE_MS && reading != button.stableState) {
      button.stableState = reading;

      if (button.stableState == BUTTON_PRESSED_STATE) {
        Serial.println(button.message);

        String message = String(button.message);
        if (message.startsWith("NOTE:")) {
          showNote(message.substring(5));
        } else if (message == "REC") {
          showSolid(CRGB(255, 91, 77));
        } else if (message == "GENERATE") {
          showGenerate();
        }
      }
    }
  }
}

void idleAnimation() {
  const uint32_t now = millis();
  if (now - lastIdleMs < 70) return;

  lastIdleMs = now;
  idleHue += 2;
}

void setup() {
  Serial.begin(BAUD_RATE);

  for (ButtonDef& button : buttons) {
    pinMode(button.pin, INPUT);
    button.stableState = digitalRead(button.pin);
    button.lastReading = button.stableState;
  }

  FastLED.addLeds<WS2812B, LED_PIN, GRB>(leds, NUM_LEDS);
  FastLED.setBrightness(DEFAULT_BRIGHTNESS);
  showSolid(CRGB::Black);

  delay(500);
  Serial.println("READY");
}

void loop() {
  readSerial();
  scanButtons();
  idleAnimation();
}
