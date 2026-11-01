import { PlacedComponent, Wire } from '../types/circuit';

export interface MCULogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'serial';
  message: string;
}

export class MCUEmulator {
  private pinModes: Record<number, 'INPUT' | 'OUTPUT' | 'INPUT_PULLUP'> = {};
  private pinValues: Record<number, number> = {}; // 0 = LOW, 1 = HIGH, or analog 0-4095
  private serialLogs: MCULogEntry[] = [];
  private mcuId: string = '';
  private mcuType: 'esp32' | 'arduino-uno' = 'esp32';
  private loopCounter: number = 0;
  private isInitialized: boolean = false;
  private millisStart: number = Date.now();
  private onLogCallback?: (log: MCULogEntry) => void;
  private oledLines: string[] = ['ESP32 SMART NODE', 'Temp: --', 'Humidity: --', 'STATUS: INIT'];
  private servoAngle: number = 90;

  constructor(mcuId: string, mcuType: 'esp32' | 'arduino-uno' = 'esp32') {
    this.mcuId = mcuId;
    this.mcuType = mcuType;
    this.reset();
  }

  public setLogCallback(cb: (log: MCULogEntry) => void) {
    this.onLogCallback = cb;
  }

  public reset() {
    this.pinModes = {};
    this.pinValues = {};
    this.serialLogs = [];
    this.loopCounter = 0;
    this.isInitialized = false;
    this.millisStart = Date.now();
    this.oledLines = ['ESP32 SMART NODE', 'Temp: --', 'Humidity: --', 'STATUS: READY'];
    this.servoAngle = 90;
  }

  public getGPIOStates(): Record<string, 'HIGH' | 'LOW' | number> {
    const states: Record<string, 'HIGH' | 'LOW' | number> = {};
    for (const [pinStr, val] of Object.entries(this.pinValues)) {
      const pinNum = parseInt(pinStr);
      const pinKey = this.mcuType === 'esp32' ? `D${pinNum}` : `D${pinNum}`;
      states[`${this.mcuId}:${pinKey}`] = val > 0 ? 'HIGH' : 'LOW';
    }
    return states;
  }

  public getOLEDDisplayLines(): string[] {
    return this.oledLines;
  }

  public getServoAngle(): number {
    return this.servoAngle;
  }

  public logSerial(message: string, level: 'info' | 'warn' | 'error' | 'serial' = 'serial') {
    const entry: MCULogEntry = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      timestamp: Date.now() - this.millisStart,
      level,
      message
    };
    this.serialLogs.push(entry);
    if (this.onLogCallback) {
      this.onLogCallback(entry);
    }
  }

  public executeCycle(
    components: PlacedComponent[],
    wires: Wire[],
    userCode: string
  ) {
    if (!this.isInitialized) {
      this.executeSetup(components, userCode);
      this.isInitialized = true;
    }

    this.executeLoop(components, wires, userCode);
  }

  private executeSetup(components: PlacedComponent[], code: string) {
    this.logSerial(`--- Booting ${this.mcuType.toUpperCase()} Controller (Reset vector 0x0) ---`, 'info');
    this.logSerial(`[FIRMWARE] Initializing I/O pins and bus peripherals...`, 'info');

    if (this.mcuType === 'esp32') {
      this.logSerial(`[ESP32] Core 1 initialized. Flash: 4MB QIO, Frequency: 240MHz.`, 'info');
    }

    // Default pinModes for standard Smart Home demo
    this.pinModes[4] = 'OUTPUT';      // Alert LED
    this.pinModes[13] = 'INPUT';      // DHT22 Data
    this.pinModes[14] = 'INPUT_PULLUP'; // Pushbutton
    this.pinModes[21] = 'OUTPUT';     // I2C SDA
    this.pinModes[22] = 'OUTPUT';     // I2C SCL
    this.pinValues[4] = 0;           // LED OFF

    this.logSerial(`[SYSTEM] Setup completed successfully. Entering main loop.`, 'info');
  }

  private executeLoop(components: PlacedComponent[], wires: Wire[], code: string) {
    this.loopCounter++;

    // Find connected components in current circuit
    const dht = components.find(c => c.type === 'dht22');
    const button = components.find(c => c.type === 'pushbutton');
    const pot = components.find(c => c.type === 'potentiometer');
    const servo = components.find(c => c.type === 'servo-sg90');

    // Determine input values from connected components
    let temp = dht?.properties?.temperature ?? 24.5;
    let hum = dht?.properties?.humidity ?? 60.0;
    let buttonPressed = button?.properties?.pressed ?? false;
    let potVal = pot?.properties?.value ?? 50;

    // Check if user code has a custom threshold (default 28.0)
    let threshold = 28.0;
    const threshMatch = code.match(/TEMP_THRESHOLD\s+([0-9.]+)/i);
    if (threshMatch && threshMatch[1]) {
      threshold = parseFloat(threshMatch[1]) || 28.0;
    }

    // Evaluate logic based on circuit type
    if (this.mcuType === 'esp32') {
      const isSmartHomeCircuit = Boolean(dht || components.find(c => c.type === 'oled-ssd1306'));

      if (isSmartHomeCircuit) {
        // Smart Home Monitoring Logic:
        const alertTriggered = (temp > threshold) || buttonPressed;

        if (alertTriggered) {
          this.pinValues[4] = 1; // Drive GPIO 4 HIGH (Alert LED ON)
          if (this.loopCounter % 2 === 0) {
            this.logSerial(`[ALERT!] Temp (${temp.toFixed(1)}°C > ${threshold}°C) or Button pressed! GPIO4 -> HIGH`, 'warn');
          }
        } else {
          this.pinValues[4] = 0; // Drive GPIO 4 LOW (Alert LED OFF)
          if (this.loopCounter % 4 === 0) {
            this.logSerial(`[TELEMETRY] Temp: ${temp.toFixed(1)}°C | Humidity: ${hum.toFixed(1)}% | Status: OK`);
          }
        }

        // Update SSD1306 OLED Display text buffer
        this.oledLines = [
          'ESP32 SMART MONITOR',
          `Temp:     ${temp.toFixed(1)} C`,
          `Humidity: ${hum.toFixed(1)} %`,
          alertTriggered ? 'STATUS: >> ALARM! <<' : 'STATUS: ALL NORMAL'
        ];
      }

      // Potentiometer & Servo logic
      if (pot && servo) {
        const targetAngle = Math.round((potVal / 100) * 180);
        this.servoAngle = targetAngle;
        if (this.loopCounter % 3 === 0) {
          this.logSerial(`[ADC] Pot: ${potVal}% -> Servo PWM: ${targetAngle}°`);
        }
      }
    } else if (this.mcuType === 'arduino-uno') {
      // Traffic Light or general Arduino logic
      const cycle = this.loopCounter % 6;
      if (cycle < 3) {
        this.pinValues[10] = 1; // Green
        this.pinValues[11] = 0; // Yellow
        this.pinValues[12] = 0; // Red
        if (cycle === 0) this.logSerial(`[TRAFFIC] GREEN: Clear for vehicles`);
      } else if (cycle === 3) {
        this.pinValues[10] = 0;
        this.pinValues[11] = 1; // Yellow
        this.pinValues[12] = 0;
        this.logSerial(`[TRAFFIC] YELLOW: Prepare to stop`);
      } else {
        this.pinValues[10] = 0;
        this.pinValues[11] = 0;
        this.pinValues[12] = 1; // Red
        this.logSerial(`[TRAFFIC] RED: Pedestrian Walk Crossing`);
      }
    }
  }
}
