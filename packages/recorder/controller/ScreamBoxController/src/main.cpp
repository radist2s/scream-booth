/**
 * @file main.cpp
 * @author Alex Batalov (radist2s@gmail.com)
 * @brief Connect first Button wire to the ground (Pin GND on the board);
 * @brief Connect second Button wire to the board Pin 9 (by default);
 * @version 0.1
 * @date 2022-01-12
 * 
 * @copyright Copyright (c) 2022
 * 
 */

#include <Arduino.h>

uint8_t BUTTON_PIN = 9;
unsigned long button_inactive_time = 0;
unsigned long button_active_time = 0;

void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
}

void loop() {
  if (digitalRead(BUTTON_PIN)) { // logic is inverted because of INPUT_PULLUP
    if (millis() - button_inactive_time > 200) {
      Serial.println("inactive");
      button_inactive_time = millis();
    }
  }
  else {
    if (millis() - button_active_time > 200) {
      Serial.println("active");
      button_active_time = millis();
    }
  }
}