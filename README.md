# Circuit3D: Interactive 3D Electronic Circuit Designer & Simulator

> A browser-based 3D & 2D electronic circuit design and simulation platform powered by **Next.js**, **Three.js / WebGL**, **Node.js + Express**, and **MongoDB**. Create IoT and microcontroller projects (ESP32, Arduino Uno), wire components interactively, edit C++ firmware, and simulate electrical behaviors in real time.

---

## 🌟 Key Highlights & Feature Matrix

| Feature | 3D Studio (Three.js) | 2D Schematic Canvas |
| :--- | :--- | :--- |
| **Microcontrollers** | Procedural ESP32 DevKit V1 & Arduino Uno with gold headers | Full pinout with GPIO, ADC, PWM & I2C indicators |
| **Interactive Wiring** | 3D Bezier curve jumper wires with physical droop & ferrules | Orthogonal & curved wires with pin snapping & color picker |
| **Displays** | Dynamic CanvasTexture OLED updating live frames in WebGL | Pixel-accurate monochrome SSD1306 128x64 display |
| **Actuators & LEDs** | 5mm LEDs with real-time PointLights & rotating SG90 servo | Emissive glow halos, servo angle indicator, buzzer waves |
| **Sensors** | DHT22 slotted grill, 10k potentiometer with rotating knurled knob | Real-time temperature & humidity sliders, angle dials |
| **Interactive Controls**| Click tactile pushbuttons in 3D, drag camera OrbitControls | Drag & drop, 90° rotation, multi-selection, delete |

---

## 🏗️ Architecture Overview

```
                          ┌────────────────────────────────────────────────────────┐
                          │               Circuit3D Next.js Client                 │
                          │   (React 18 + Tailwind CSS + Lucide + Web Audio API)    │
                          └──────────────────────────┬─────────────────────────────┘
                                                     │
                         ┌───────────────────────────┴───────────────────────────┐
                         │                                                       │
                         ▼                                                       ▼
        ┌─────────────────────────────────┐                     ┌─────────────────────────────────┐
        │       3D Realistic Studio       │                     │       2D Schematic Canvas       │
        │  Three.js WebGL / OrbitControls │                     │  Interactive SVG / Breadboard   │
        │  Procedural 3D Meshes & Lights  │                     │  Pin Snapping & Wire Routing    │
        └────────────────┬────────────────┘                     └────────────────┬────────────────┘
                         │                                                       │
                         └───────────────────────────┬───────────────────────────┘
                                                     │
                                                     ▼
                          ┌────────────────────────────────────────────────────────┐
                          │               Modular Simulation Engine                │
                          │   • Electrical Netlist & Graph Continuity Solver       │
                          │   • Ohm's Law & LED Series Current Limiting Check      │
                          │   • ESP32 / Arduino C++ Cooperative Execution Engine   │
                          │   • Virtual SSD1306 Framebuffer & I2C Emulation        │
                          │   • Web Audio API Synthesizer (Piezo Buzzer)          │
                          └──────────────────────────┬─────────────────────────────┘
                                                     │
                                                     ▼
                          ┌────────────────────────────────────────────────────────┐
                          │          Node.js + Express REST API (Port 5000)        │
                          │   • Full Project CRUD (`/api/projects`)               │
                          │   • Template Library (`/api/templates`)               │
                          │   • Duplicate / Fork (`/api/projects/fork/:id`)       │
                          └──────────────────────────┬─────────────────────────────┘
                                                     │
                                                     ▼
                          ┌────────────────────────────────────────────────────────┐
                          │               Dual Persistence Engine                  │
                          │   • MongoDB with Mongoose (when connected)             │
                          │   • Resilient File Store Fallback (zero downtime)      │
                          └────────────────────────────────────────────────────────┘
```

---

## 🎯 Primary Showcase: ESP32 Smart Home Monitoring System

The application comes pre-loaded with the **ESP32 Smart Home Environmental Monitor** project:

### 1. Hardware Circuit Setup
- **ESP32 DevKit V1 (30 pins)**: Main IoT processing unit.
- **DHT22 (AM2302) Sensor**:
  - `Pin 1 (VCC)` $\rightarrow$ `ESP32 3V3`
  - `Pin 2 (DATA)` $\rightarrow$ `ESP32 GPIO 13`
  - `Pin 4 (GND)` $\rightarrow$ `ESP32 GND`
- **0.96" SSD1306 I2C OLED Display**:
  - `VDD` $\rightarrow$ `ESP32 3V3`
  - `GND` $\rightarrow$ `ESP32 GND`
  - `SCK (SCL)` $\rightarrow$ `ESP32 GPIO 22 (SCL)`
  - `SDA` $\rightarrow$ `ESP32 GPIO 21 (SDA)`
- **Alert Indicator Circuit**:
  - `ESP32 GPIO 4` $\rightarrow$ `220Ω Resistor Pin 1`
  - `220Ω Resistor Pin 2` $\rightarrow$ `Red 5mm LED Anode (+)`
  - `LED Cathode (-)` $\rightarrow$ `ESP32 GND`
- **Manual Alert Pushbutton**:
  - `Button Pin 1a` $\rightarrow$ `ESP32 GPIO 14 (INPUT_PULLUP)`
  - `Button Pin 2a` $\rightarrow$ `ESP32 GND`
- **Breadboard**: Solderless half-size breadboard routing power and interconnects.

### 2. Embedded C++ Firmware
```cpp
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <DHT.h>

#define DHTPIN 13
#define DHTTYPE DHT22
#define ALERT_LED_PIN 4
#define BUTTON_PIN 14
#define TEMP_THRESHOLD 28.0

DHT dht(DHTPIN, DHTTYPE);
Adafruit_SSD1306 display(128, 64, &Wire, -1);

void setup() {
  Serial.begin(115200);
  pinMode(ALERT_LED_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  dht.begin();
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
}

void loop() {
  float temp = dht.readTemperature();
  float humidity = dht.readHumidity();
  bool buttonPressed = (digitalRead(BUTTON_PIN) == LOW);

  bool alert = (temp > TEMP_THRESHOLD) || buttonPressed;

  if (alert) {
    digitalWrite(ALERT_LED_PIN, HIGH);
    Serial.println("[ALERT!] Threshold exceeded or Button Pressed!");
  } else {
    digitalWrite(ALERT_LED_PIN, LOW);
  }

  display.clearDisplay();
  display.setCursor(4, 2);
  display.println("ESP32 SMART MONITOR");
  display.setCursor(4, 18);
  display.print("Temp: "); display.print(temp, 1); display.println(" C");
  display.setCursor(4, 32);
  display.print("Humidity: "); display.print(humidity, 1); display.println(" %");
  display.setCursor(4, 48);
  display.print(alert ? "STATUS: >> ALARM! <<" : "STATUS: ALL NORMAL");
  display.display();

  delay(1000);
}
```

### 3. Interactive Simulation Behavior
1. Click **Start Simulation** on the top navigation bar.
2. The simulation clock starts running, and the MCU logs boot telemetry to the **Serial Monitor**.
3. The **SSD1306 OLED** dynamically prints telemetry readings: `Temp: 24.5 C`, `Humidity: 62 %`, `STATUS: SAFE OK`.
4. Open the **Component Properties** inspector for `DHT22` and drag the temperature slider above **28°C** (e.g. to **31.5°C**):
   - The **Alert LED** instantly illuminates with a 3D red emissive glow and point light.
   - The **SSD1306 OLED** switches its status line to `STATUS: >> ALARM! <<`.
   - The **Serial Monitor** streams real-time warnings: `[ALERT!] High Condition: Temp=31.5C, Hum=62% -> LED ACTIVATED`.
5. Click the tactile **Pushbutton** (or press it directly in the 3D scene) to trigger a manual override alert.

---

## ⚡ Additional Pre-Loaded Circuit Templates

1. **Traffic Light Controller (Arduino Uno)**:
   - Arduino Uno R3 controlling Red, Yellow, and Green LEDs with individual 220Ω current-limiting resistors.
   - Crosswalk pedestrian pushbutton interrupt to safely halt vehicle traffic.
2. **ESP32 Servo & Potentiometer Angular Positioner**:
   - Reads 10k rotary potentiometer analog ADC input (0-4095).
   - Maps voltage to positional PWM servo angles (0° to 180°), physically animating the SG90 servo arm.
   - Web Audio piezo buzzer beeps when reaching boundary limit angles (5° or 175°).

---

## ⚙️ Electrical Safety & Simulation Diagnostics

The simulation engine automatically calculates electrical continuity and flags hazards:
- **Short Circuit Detection**: Alerts the user if $V_{CC}$ (3.3V or 5V) is shorted directly to GND.
- **Overcurrent / LED Burnout Protection**: Calculates forward current $I = (V_{in} - V_f) / R$. If an LED is wired across 3.3V/5V without a series resistor, it transitions to a **Blown LED** state with warning banners.
- **Floating Pins & Broken Nets**: Warns when sensor signal lines or power pins are unconnected.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ or v20+ (Node v24 supported)
- [MongoDB](https://www.mongodb.com/) (Optional: the backend automatically uses its resilient file storage engine if local MongoDB is not running).

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd "Assignment T2"
   ```

2. **Install all dependencies**:
   ```bash
   npm run install:all
   ```

3. **Start both Backend API and Frontend Client concurrently**:
   ```bash
   npm run dev
   ```

   - Client Web Interface: [http://localhost:3000](http://localhost:3000)
   - Express REST API: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check, MongoDB connection status, and storage engine |
| `GET` | `/api/templates` | Retrieve pre-configured verified circuit projects |
| `GET` | `/api/projects` | List all saved circuit projects |
| `GET` | `/api/projects/:id` | Get details and wiring schematic for a specific project |
| `POST` | `/api/projects` | Create and save a new circuit design |
| `PUT` | `/api/projects/:id` | Update components, wires, or firmware code |
| `DELETE` | `/api/projects/:id` | Remove a project |
| `POST` | `/api/projects/fork/:id` | Clone / Duplicate an existing project |

---

## 📦 Project Deliverables Checklist

- [x] **Working ESP32 Project**: Complete design with DHT22, OLED display, alert LED, resistor, pushbutton, and breadboard.
- [x] **Interactive 3D Circuit Studio**: Three.js WebGL scene with realistic procedural components, 3D curved wires, dynamic OLED canvas texture, emissive point lights, and OrbitControls.
- [x] **Interactive 2D Schematic Editor**: Full drag-and-drop, 90° rotation, pin snapping, colored wire routing, and hover tooltips.
- [x] **Simulation Engine**: Electrical netlist solver, MCU execution loop, real-time GPIO states, and Web Audio buzzer.
- [x] **Project Management & MERN Backend**: Express API with Mongoose and resilient zero-downtime file store.
- [x] **Bill of Materials (BOM) & JSON Export**: Automated parts inventory generator with CSV download and shareable project URLs.

