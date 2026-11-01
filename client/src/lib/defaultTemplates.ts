import { ProjectData } from '../types/circuit';

export const DEFAULT_TEMPLATES: ProjectData[] = [
  {
    id: "esp32-smart-home",
    name: "ESP32 Smart Home Monitoring System",
    description: "ESP32 DevKit reading DHT22 temperature & humidity, driving SSD1306 0.96\" OLED display, with LED alert & pushbutton interrupt.",
    category: "ESP32 & IoT",
    tags: ["ESP32", "DHT22", "OLED", "LED", "Breadboard"],
    components: [
      {
        id: "esp32-1",
        type: "esp32",
        name: "ESP32 DevKit V1",
        x: 160,
        y: 200,
        rotation: 0,
        properties: {
          label: "ESP32 DevKit V1",
          voltage: "3.3V / 5V"
        }
      },
      {
        id: "breadboard-1",
        type: "breadboard-half",
        name: "Half Breadboard",
        x: 520,
        y: 260,
        rotation: 0,
        properties: {
          rows: 30
        }
      },
      {
        id: "dht22-1",
        type: "dht22",
        name: "DHT22 Sensor",
        x: 460,
        y: 80,
        rotation: 0,
        properties: {
          label: "DHT22 Temp & Hum",
          temperature: 24.5,
          humidity: 62.0
        }
      },
      {
        id: "oled-1",
        type: "oled-ssd1306",
        name: "0.96\" SSD1306 OLED (I2C)",
        x: 650,
        y: 80,
        rotation: 0,
        properties: {
          label: "SSD1306 OLED",
          address: "0x3C",
          lines: ["ESP32 SMART NODE", "Temp: 24.5 C", "Humidity: 62 %", "STATUS: SAFE OK"]
        }
      },
      {
        id: "led-1",
        type: "led",
        name: "Alert LED",
        x: 430,
        y: 430,
        rotation: 0,
        properties: {
          label: "Red Alert LED",
          color: "red",
          forwardVoltage: 2.0,
          maxCurrent: 25
        }
      },
      {
        id: "resistor-1",
        type: "resistor",
        name: "Current Limiting Resistor",
        x: 540,
        y: 430,
        rotation: 0,
        properties: {
          label: "220 Ohm",
          resistance: 220
        }
      },
      {
        id: "button-1",
        type: "pushbutton",
        name: "Alert Override Button",
        x: 660,
        y: 430,
        rotation: 0,
        properties: {
          label: "Trigger Button",
          pressed: false
        }
      }
    ],
    wires: [
      {
        id: "w-pwr-1",
        from: { componentId: "esp32-1", pin: "3V3" },
        to: { componentId: "dht22-1", pin: "VCC" },
        color: "#ef4444"
      },
      {
        id: "w-pwr-2",
        from: { componentId: "esp32-1", pin: "3V3" },
        to: { componentId: "oled-1", pin: "VDD" },
        color: "#ef4444"
      },
      {
        id: "w-gnd-1",
        from: { componentId: "esp32-1", pin: "GND_1" },
        to: { componentId: "dht22-1", pin: "GND" },
        color: "#1e293b"
      },
      {
        id: "w-gnd-2",
        from: { componentId: "esp32-1", pin: "GND_1" },
        to: { componentId: "oled-1", pin: "GND" },
        color: "#1e293b"
      },
      {
        id: "w-dht-data",
        from: { componentId: "esp32-1", pin: "D13" },
        to: { componentId: "dht22-1", pin: "SDA" },
        color: "#eab308"
      },
      {
        id: "w-oled-sda",
        from: { componentId: "esp32-1", pin: "D21" },
        to: { componentId: "oled-1", pin: "SDA" },
        color: "#3b82f6"
      },
      {
        id: "w-oled-scl",
        from: { componentId: "esp32-1", pin: "D22" },
        to: { componentId: "oled-1", pin: "SCK" },
        color: "#a855f7"
      },
      {
        id: "w-led-ctrl",
        from: { componentId: "esp32-1", pin: "D4" },
        to: { componentId: "resistor-1", pin: "1" },
        color: "#10b981"
      },
      {
        id: "w-res-led",
        from: { componentId: "resistor-1", pin: "2" },
        to: { componentId: "led-1", pin: "anode" },
        color: "#10b981"
      },
      {
        id: "w-led-gnd",
        from: { componentId: "led-1", pin: "cathode" },
        to: { componentId: "esp32-1", pin: "GND_2" },
        color: "#1e293b"
      },
      {
        id: "w-btn-1",
        from: { componentId: "esp32-1", pin: "D14" },
        to: { componentId: "button-1", pin: "1a" },
        color: "#f97316"
      },
      {
        id: "w-btn-gnd",
        from: { componentId: "button-1", pin: "2a" },
        to: { componentId: "esp32-1", pin: "GND_2" },
        color: "#1e293b"
      }
    ],
    code: `// ========================================================
// Project: ESP32 Smart Home Environmental Monitor
// Microcontroller: ESP32 DevKit V1 (30 pins)
// Peripherals: DHT22, SSD1306 OLED, Alert LED & Pushbutton
// ========================================================

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <DHT.h>

#define DHTPIN 13
#define DHTTYPE DHT22
#define ALERT_LED_PIN 4
#define BUTTON_PIN 14
#define TEMP_THRESHOLD 28.0 // High temperature threshold (Deg C)

DHT dht(DHTPIN, DHTTYPE);
Adafruit_SSD1306 display(128, 64, &Wire, -1);

int loopCounter = 0;

void setup() {
  Serial.begin(115200);
  Serial.println("================================================");
  Serial.println("  ESP32 Smart Home Environmental Monitor Boot   ");
  Serial.println("================================================");

  pinMode(ALERT_LED_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  digitalWrite(ALERT_LED_PIN, LOW);

  dht.begin();
  Serial.println("[SYSTEM] DHT22 Sensor initialized on GPIO 13.");

  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("[WARN] SSD1306 OLED allocation check (virtual 0x3C ready).");
  }

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);
  display.setCursor(10, 16);
  display.println("Smart IoT Monitor");
  display.setCursor(10, 32);
  display.println("Systems OK.");
  display.display();

  Serial.println("[SYSTEM] Ready! Starting telemetry loop...");
}

void loop() {
  loopCounter++;

  // Read environmental telemetry
  float temp = dht.readTemperature();
  float humidity = dht.readHumidity();
  bool buttonPressed = (digitalRead(BUTTON_PIN) == LOW);

  // Trigger alert if temp exceeds threshold or button pushed
  bool alertActive = (temp > TEMP_THRESHOLD) || buttonPressed;

  if (alertActive) {
    digitalWrite(ALERT_LED_PIN, HIGH);
    Serial.print("[ALERT!] High Condition Detected: Temp = ");
    Serial.print(temp, 1);
    Serial.print(" C | Hum = ");
    Serial.print(humidity, 1);
    Serial.print(" % | Manual Override = ");
    Serial.println(buttonPressed ? "YES" : "NO");
  } else {
    digitalWrite(ALERT_LED_PIN, LOW);
    Serial.print("[NORMAL] Telemetry #");
    Serial.print(loopCounter);
    Serial.print(": Temp = ");
    Serial.print(temp, 1);
    Serial.print(" C, Hum = ");
    Serial.print(humidity, 1);
    Serial.println(" %");
  }

  // Update SSD1306 128x64 OLED Display
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);

  display.setCursor(4, 2);
  display.println("ESP32 SMART MONITOR");
  display.drawLine(0, 12, 128, 12, WHITE);

  display.setCursor(4, 18);
  display.print("Temp:     ");
  display.print(temp, 1);
  display.print(" C");

  display.setCursor(4, 32);
  display.print("Humidity: ");
  display.print(humidity, 1);
  display.print(" %");

  display.setCursor(4, 48);
  if (alertActive) {
    display.print("STATUS: >> ALARM! <<");
  } else {
    display.print("STATUS: ALL NORMAL");
  }

  display.display();

  delay(1000); // 1-second sample interval
}`
  },
  {
    id: "arduino-traffic-light",
    name: "Interactive Traffic Light Controller",
    description: "Arduino Uno driving Red, Yellow, Green LEDs with a pedestrian crossing push button interrupt.",
    category: "Arduino",
    tags: ["Arduino", "LED", "Traffic", "Button"],
    components: [
      {
        id: "arduino-1",
        type: "arduino-uno",
        name: "Arduino Uno R3",
        x: 180,
        y: 200,
        rotation: 0,
        properties: { label: "Arduino Uno" }
      },
      {
        id: "led-red",
        type: "led",
        name: "Red Light",
        x: 450,
        y: 120,
        rotation: 0,
        properties: { label: "Red Stop", color: "red", forwardVoltage: 2.0 }
      },
      {
        id: "led-yellow",
        type: "led",
        name: "Yellow Light",
        x: 450,
        y: 220,
        rotation: 0,
        properties: { label: "Yellow Wait", color: "yellow", forwardVoltage: 2.1 }
      },
      {
        id: "led-green",
        type: "led",
        name: "Green Light",
        x: 450,
        y: 320,
        rotation: 0,
        properties: { label: "Green Go", color: "green", forwardVoltage: 2.2 }
      },
      {
        id: "res-red",
        type: "resistor",
        name: "Resistor Red",
        x: 550,
        y: 120,
        rotation: 0,
        properties: { label: "220 Ohm", resistance: 220 }
      },
      {
        id: "res-yellow",
        type: "resistor",
        name: "Resistor Yellow",
        x: 550,
        y: 220,
        rotation: 0,
        properties: { label: "220 Ohm", resistance: 220 }
      },
      {
        id: "res-green",
        type: "resistor",
        name: "Resistor Green",
        x: 550,
        y: 320,
        rotation: 0,
        properties: { label: "220 Ohm", resistance: 220 }
      },
      {
        id: "btn-cross",
        type: "pushbutton",
        name: "Crosswalk Button",
        x: 500,
        y: 420,
        rotation: 0,
        properties: { label: "Walk Button", pressed: false }
      }
    ],
    wires: [
      { id: "w-red", from: { componentId: "arduino-1", pin: "D12" }, to: { componentId: "res-red", pin: "1" }, color: "#ef4444" },
      { id: "w-red-led", from: { componentId: "res-red", pin: "2" }, to: { componentId: "led-red", pin: "anode" }, color: "#ef4444" },
      { id: "w-yel", from: { componentId: "arduino-1", pin: "D11" }, to: { componentId: "res-yellow", pin: "1" }, color: "#eab308" },
      { id: "w-yel-led", from: { componentId: "res-yellow", pin: "2" }, to: { componentId: "led-yellow", pin: "anode" }, color: "#eab308" },
      { id: "w-grn", from: { componentId: "arduino-1", pin: "D10" }, to: { componentId: "res-green", pin: "1" }, color: "#10b981" },
      { id: "w-grn-led", from: { componentId: "res-green", pin: "2" }, to: { componentId: "led-green", pin: "anode" }, color: "#10b981" },
      { id: "w-gnd-red", from: { componentId: "led-red", pin: "cathode" }, to: { componentId: "arduino-1", pin: "GND_1" }, color: "#1e293b" },
      { id: "w-gnd-yel", from: { componentId: "led-yellow", pin: "cathode" }, to: { componentId: "arduino-1", pin: "GND_1" }, color: "#1e293b" },
      { id: "w-gnd-grn", from: { componentId: "led-green", pin: "cathode" }, to: { componentId: "arduino-1", pin: "GND_1" }, color: "#1e293b" },
      { id: "w-btn", from: { componentId: "arduino-1", pin: "D2" }, to: { componentId: "btn-cross", pin: "1a" }, color: "#3b82f6" },
      { id: "w-btn-gnd", from: { componentId: "btn-cross", pin: "2a" }, to: { componentId: "arduino-1", pin: "GND_2" }, color: "#1e293b" }
    ],
    code: `// Traffic Light Sequence with Pedestrian Crossing Button
const int RED_LED = 12;
const int YELLOW_LED = 11;
const int GREEN_LED = 10;
const int BUTTON_PIN = 2;

void setup() {
  Serial.begin(9600);
  Serial.println("Traffic System Ready");
  pinMode(RED_LED, OUTPUT);
  pinMode(YELLOW_LED, OUTPUT);
  pinMode(GREEN_LED, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
}

void loop() {
  // Green Phase
  Serial.println("[TRAFFIC] GREEN: Traffic Flowing");
  digitalWrite(GREEN_LED, HIGH);
  digitalWrite(YELLOW_LED, LOW);
  digitalWrite(RED_LED, LOW);
  
  for(int i = 0; i < 40; i++) {
    if(digitalRead(BUTTON_PIN) == LOW) {
      Serial.println("[PEDESTRIAN] Walk button pressed! Changing signals...");
      break;
    }
    delay(100);
  }

  // Yellow Phase
  Serial.println("[TRAFFIC] YELLOW: Caution Slow Down");
  digitalWrite(GREEN_LED, LOW);
  digitalWrite(YELLOW_LED, HIGH);
  delay(1500);

  // Red Phase
  Serial.println("[TRAFFIC] RED: Stop! Pedestrians Crossing");
  digitalWrite(YELLOW_LED, LOW);
  digitalWrite(RED_LED, HIGH);
  delay(3000);
}`
  },
  {
    id: "esp32-iot-servo-pot",
    name: "ESP32 Servo & Potentiometer Controller",
    description: "ESP32 reading analog potentiometer voltage to steer SG90 Servo motor and sound a Piezo buzzer at target angles.",
    category: "ESP32 & IoT",
    tags: ["ESP32", "Servo", "Potentiometer", "Buzzer"],
    components: [
      {
        id: "esp32-1",
        type: "esp32",
        name: "ESP32 DevKit V1",
        x: 180,
        y: 200,
        rotation: 0,
        properties: { label: "ESP32 Controller" }
      },
      {
        id: "pot-1",
        type: "potentiometer",
        name: "10k Potentiometer",
        x: 480,
        y: 120,
        rotation: 0,
        properties: { label: "Angle Control", value: 50, maxVal: 100 }
      },
      {
        id: "servo-1",
        type: "servo-sg90",
        name: "SG90 Micro Servo",
        x: 520,
        y: 300,
        rotation: 0,
        properties: { label: "SG90 Servo", angle: 90 }
      },
      {
        id: "buzzer-1",
        type: "piezo-buzzer",
        name: "Piezo Buzzer",
        x: 650,
        y: 200,
        rotation: 0,
        properties: { label: "Audio Beeper", frequency: 2400 }
      }
    ],
    wires: [
      { id: "w-pot-vcc", from: { componentId: "esp32-1", pin: "3V3" }, to: { componentId: "pot-1", pin: "VCC" }, color: "#ef4444" },
      { id: "w-pot-gnd", from: { componentId: "esp32-1", pin: "GND_1" }, to: { componentId: "pot-1", pin: "GND" }, color: "#1e293b" },
      { id: "w-pot-sig", from: { componentId: "esp32-1", pin: "D34" }, to: { componentId: "pot-1", pin: "SIG" }, color: "#3b82f6" },
      { id: "w-srv-vcc", from: { componentId: "esp32-1", pin: "VIN" }, to: { componentId: "servo-1", pin: "VCC" }, color: "#ef4444" },
      { id: "w-srv-gnd", from: { componentId: "esp32-1", pin: "GND_2" }, to: { componentId: "servo-1", pin: "GND" }, color: "#1e293b" },
      { id: "w-srv-pwm", from: { componentId: "esp32-1", pin: "D18" }, to: { componentId: "servo-1", pin: "PWM" }, color: "#f97316" },
      { id: "w-bz-pos", from: { componentId: "esp32-1", pin: "D19" }, to: { componentId: "buzzer-1", pin: "POS" }, color: "#10b981" },
      { id: "w-bz-neg", from: { componentId: "esp32-1", pin: "GND_2" }, to: { componentId: "buzzer-1", pin: "NEG" }, color: "#1e293b" }
    ],
    code: `// ESP32 Servo & Potentiometer Angular Positioner
#include <ESP32Servo.h>

Servo myServo;
const int POT_PIN = 34; // ADC1 channel 6
const int SERVO_PIN = 18;
const int BUZZER_PIN = 19;

void setup() {
  Serial.begin(115200);
  Serial.println("ESP32 Servo Positioner Initialized");
  myServo.attach(SERVO_PIN);
  pinMode(BUZZER_PIN, OUTPUT);
}

void loop() {
  int potVal = analogRead(POT_PIN);
  int angle = map(potVal, 0, 4095, 0, 180);
  
  myServo.write(angle);
  
  Serial.print("Pot ADC: ");
  Serial.print(potVal);
  Serial.print(" -> Servo Angle: ");
  Serial.print(angle);
  Serial.println(" deg");

  // Beep when reaching end points
  if (angle <= 5 || angle >= 175) {
    digitalWrite(BUZZER_PIN, HIGH);
  } else {
    digitalWrite(BUZZER_PIN, LOW);
  }

  delay(100);
}`
  }
];
