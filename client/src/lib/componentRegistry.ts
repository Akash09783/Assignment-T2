import { ComponentMetadata } from '../types/circuit';

export const COMPONENT_REGISTRY: Record<string, ComponentMetadata> = {
  'esp32': {
    type: 'esp32',
    name: 'ESP32 DevKit V1',
    category: 'microcontrollers',
    description: '30-pin dual-core Wi-Fi & Bluetooth microcontroller with 3.3V logic and hardware I2C/SPI/PWM.',
    width: 140,
    height: 220,
    size3D: [2.8, 0.4, 5.0],
    pins: [
      // Left side pins (top to bottom)
      { id: '3V3', name: '3V3', type: 'power', x: 10, y: 30, pos3D: [-1.3, 0.2, -2.1], voltage: 3.3 },
      { id: 'EN', name: 'EN', type: 'digital', x: 10, y: 44, pos3D: [-1.3, 0.2, -1.8] },
      { id: 'VP', name: 'VP (D36)', type: 'analog', x: 10, y: 58, pos3D: [-1.3, 0.2, -1.5] },
      { id: 'VN', name: 'VN (D39)', type: 'analog', x: 10, y: 72, pos3D: [-1.3, 0.2, -1.2] },
      { id: 'D34', name: 'D34', type: 'analog', x: 10, y: 86, pos3D: [-1.3, 0.2, -0.9] },
      { id: 'D35', name: 'D35', type: 'analog', x: 10, y: 100, pos3D: [-1.3, 0.2, -0.6] },
      { id: 'D32', name: 'D32', type: 'digital', x: 10, y: 114, pos3D: [-1.3, 0.2, -0.3] },
      { id: 'D33', name: 'D33', type: 'digital', x: 10, y: 128, pos3D: [-1.3, 0.2, 0.0] },
      { id: 'D25', name: 'D25', type: 'digital', x: 10, y: 142, pos3D: [-1.3, 0.2, 0.3] },
      { id: 'D26', name: 'D26', type: 'digital', x: 10, y: 156, pos3D: [-1.3, 0.2, 0.6] },
      { id: 'D27', name: 'D27', type: 'digital', x: 10, y: 170, pos3D: [-1.3, 0.2, 0.9] },
      { id: 'D14', name: 'D14', type: 'digital', x: 10, y: 184, pos3D: [-1.3, 0.2, 1.2] },
      { id: 'D12', name: 'D12', type: 'digital', x: 10, y: 198, pos3D: [-1.3, 0.2, 1.5] },
      { id: 'D13', name: 'D13', type: 'digital', x: 10, y: 212, pos3D: [-1.3, 0.2, 1.8] },
      { id: 'GND_1', name: 'GND', type: 'ground', x: 10, y: 226, pos3D: [-1.3, 0.2, 2.1], voltage: 0 },

      // Right side pins (top to bottom)
      { id: 'VIN', name: 'VIN (5V)', type: 'power', x: 130, y: 30, pos3D: [1.3, 0.2, -2.1], voltage: 5.0 },
      { id: 'GND_2', name: 'GND', type: 'ground', x: 130, y: 44, pos3D: [1.3, 0.2, -1.8], voltage: 0 },
      { id: 'D15', name: 'D15', type: 'digital', x: 130, y: 58, pos3D: [1.3, 0.2, -1.5] },
      { id: 'D2', name: 'D2 (LED)', type: 'digital', x: 130, y: 72, pos3D: [1.3, 0.2, -1.2] },
      { id: 'D4', name: 'D4', type: 'digital', x: 130, y: 86, pos3D: [1.3, 0.2, -0.9] },
      { id: 'RX2', name: 'RX2 (D16)', type: 'digital', x: 130, y: 100, pos3D: [1.3, 0.2, -0.6] },
      { id: 'TX2', name: 'TX2 (D17)', type: 'digital', x: 130, y: 114, pos3D: [1.3, 0.2, -0.3] },
      { id: 'D5', name: 'D5', type: 'digital', x: 130, y: 128, pos3D: [1.3, 0.2, 0.0] },
      { id: 'D18', name: 'D18 (SCK)', type: 'digital', x: 130, y: 142, pos3D: [1.3, 0.2, 0.3] },
      { id: 'D19', name: 'D19 (MISO)', type: 'digital', x: 130, y: 156, pos3D: [1.3, 0.2, 0.6] },
      { id: 'D21', name: 'D21 (SDA)', type: 'i2c', x: 130, y: 170, pos3D: [1.3, 0.2, 0.9] },
      { id: 'RX0', name: 'RX0', type: 'digital', x: 130, y: 184, pos3D: [1.3, 0.2, 1.2] },
      { id: 'TX0', name: 'TX0', type: 'digital', x: 130, y: 198, pos3D: [1.3, 0.2, 1.5] },
      { id: 'D22', name: 'D22 (SCL)', type: 'i2c', x: 130, y: 212, pos3D: [1.3, 0.2, 1.8] },
      { id: 'D23', name: 'D23 (MOSI)', type: 'digital', x: 130, y: 226, pos3D: [1.3, 0.2, 2.1] }
    ],
    defaultProperties: {
      label: 'ESP32 DevKit V1',
      frequency: '240MHz',
      ram: '520KB'
    },
    specs: {
      Architecture: 'Xtensa Dual-Core 32-bit LX6',
      'Operating Voltage': '3.3V',
      'Input Voltage': '5V via USB or VIN',
      'Digital I/O': '25 Pins',
      'Analog ADC': '12-bit (up to 18 channels)'
    }
  },

  'arduino-uno': {
    type: 'arduino-uno',
    name: 'Arduino Uno R3',
    category: 'microcontrollers',
    description: 'ATmega328P based microcontroller board with 14 digital I/O pins and 6 analog inputs.',
    width: 160,
    height: 220,
    size3D: [3.5, 0.5, 4.8],
    pins: [
      { id: '5V', name: '5V', type: 'power', x: 20, y: 60, pos3D: [-1.5, 0.2, -1.2], voltage: 5.0 },
      { id: '3V3', name: '3.3V', type: 'power', x: 20, y: 80, pos3D: [-1.5, 0.2, -0.8], voltage: 3.3 },
      { id: 'GND_1', name: 'GND', type: 'ground', x: 20, y: 100, pos3D: [-1.5, 0.2, -0.4], voltage: 0 },
      { id: 'GND_2', name: 'GND', type: 'ground', x: 20, y: 120, pos3D: [-1.5, 0.2, 0.0], voltage: 0 },
      { id: 'VIN', name: 'VIN', type: 'power', x: 20, y: 140, pos3D: [-1.5, 0.2, 0.4] },
      { id: 'A0', name: 'A0', type: 'analog', x: 20, y: 165, pos3D: [-1.5, 0.2, 0.9] },
      { id: 'A1', name: 'A1', type: 'analog', x: 20, y: 180, pos3D: [-1.5, 0.2, 1.2] },
      { id: 'A2', name: 'A2', type: 'analog', x: 20, y: 195, pos3D: [-1.5, 0.2, 1.5] },
      { id: 'A3', name: 'A3', type: 'analog', x: 20, y: 210, pos3D: [-1.5, 0.2, 1.8] },
      { id: 'A4', name: 'A4 (SDA)', type: 'i2c', x: 20, y: 225, pos3D: [-1.5, 0.2, 2.1] },
      { id: 'A5', name: 'A5 (SCL)', type: 'i2c', x: 20, y: 240, pos3D: [-1.5, 0.2, 2.4] },

      { id: 'D0', name: 'D0 (RX)', type: 'digital', x: 140, y: 60, pos3D: [1.5, 0.2, -1.2] },
      { id: 'D1', name: 'D1 (TX)', type: 'digital', x: 140, y: 75, pos3D: [1.5, 0.2, -0.9] },
      { id: 'D2', name: 'D2', type: 'digital', x: 140, y: 90, pos3D: [1.5, 0.2, -0.6] },
      { id: 'D3', name: 'D3 (PWM)', type: 'pwm', x: 140, y: 105, pos3D: [1.5, 0.2, -0.3] },
      { id: 'D4', name: 'D4', type: 'digital', x: 140, y: 120, pos3D: [1.5, 0.2, 0.0] },
      { id: 'D5', name: 'D5 (PWM)', type: 'pwm', x: 140, y: 135, pos3D: [1.5, 0.2, 0.3] },
      { id: 'D6', name: 'D6 (PWM)', type: 'pwm', x: 140, y: 150, pos3D: [1.5, 0.2, 0.6] },
      { id: 'D7', name: 'D7', type: 'digital', x: 140, y: 165, pos3D: [1.5, 0.2, 0.9] },
      { id: 'D8', name: 'D8', type: 'digital', x: 140, y: 180, pos3D: [1.5, 0.2, 1.2] },
      { id: 'D9', name: 'D9 (PWM)', type: 'pwm', x: 140, y: 195, pos3D: [1.5, 0.2, 1.5] },
      { id: 'D10', name: 'D10 (PWM)', type: 'pwm', x: 140, y: 210, pos3D: [1.5, 0.2, 1.8] },
      { id: 'D11', name: 'D11 (PWM)', type: 'pwm', x: 140, y: 225, pos3D: [1.5, 0.2, 2.1] },
      { id: 'D12', name: 'D12', type: 'digital', x: 140, y: 240, pos3D: [1.5, 0.2, 2.4] },
      { id: 'D13', name: 'D13 (LED)', type: 'digital', x: 140, y: 255, pos3D: [1.5, 0.2, 2.7] }
    ],
    defaultProperties: {
      label: 'Arduino Uno R3',
      clock: '16MHz'
    }
  },

  'breadboard-half': {
    type: 'breadboard-half',
    name: 'Half-Size Breadboard',
    category: 'power',
    description: '400 tie-point solderless breadboard with dual power rails and 30 terminal rows.',
    width: 240,
    height: 180,
    size3D: [6.5, 0.3, 4.5],
    pins: [
      { id: 'pwr_pos_top', name: '+ Rail Top', type: 'power', x: 30, y: 15, pos3D: [-2.5, 0.15, -1.8], voltage: 5.0 },
      { id: 'pwr_neg_top', name: '- Rail Top', type: 'ground', x: 30, y: 30, pos3D: [-2.5, 0.15, -1.5], voltage: 0 },
      { id: 'row_1a', name: 'Pin Row 1A', type: 'passive', x: 30, y: 55, pos3D: [-2.5, 0.15, -1.0] },
      { id: 'row_1e', name: 'Pin Row 1E', type: 'passive', x: 30, y: 85, pos3D: [-2.5, 0.15, -0.4] },
      { id: 'row_1f', name: 'Pin Row 1F', type: 'passive', x: 30, y: 105, pos3D: [-2.5, 0.15, 0.4] },
      { id: 'row_1j', name: 'Pin Row 1J', type: 'passive', x: 30, y: 135, pos3D: [-2.5, 0.15, 1.0] },
      { id: 'pwr_pos_bot', name: '+ Rail Bot', type: 'power', x: 30, y: 155, pos3D: [-2.5, 0.15, 1.5], voltage: 5.0 },
      { id: 'pwr_neg_bot', name: '- Rail Bot', type: 'ground', x: 30, y: 170, pos3D: [-2.5, 0.15, 1.8], voltage: 0 }
    ],
    defaultProperties: {
      tiePoints: 400
    }
  },

  'dht22': {
    type: 'dht22',
    name: 'DHT22 Temp & Humidity Sensor',
    category: 'sensors',
    description: 'High-accuracy digital sensor measuring temperature (-40 to 80°C) and relative humidity (0 to 100%).',
    width: 90,
    height: 120,
    size3D: [1.6, 1.2, 2.0],
    pins: [
      { id: 'VCC', name: '1: VCC (3.3V-5V)', type: 'power', x: 20, y: 110, pos3D: [-0.6, -0.6, 0.9], voltage: 3.3 },
      { id: 'SDA', name: '2: DATA', type: 'digital', x: 40, y: 110, pos3D: [-0.2, -0.6, 0.9] },
      { id: 'NC', name: '3: NC (Not Connected)', type: 'passive', x: 60, y: 110, pos3D: [0.2, -0.6, 0.9] },
      { id: 'GND', name: '4: GND', type: 'ground', x: 80, y: 110, pos3D: [0.6, -0.6, 0.9], voltage: 0 }
    ],
    defaultProperties: {
      label: 'DHT22 Sensor',
      temperature: 24.5,
      humidity: 60.0
    },
    specs: {
      'Temp Range': '-40 to 80 °C (±0.5°C)',
      'Humidity Range': '0 to 100% RH (±2%)',
      'Sampling Period': '2 seconds',
      Protocol: 'Single-bus proprietary 1-wire'
    }
  },

  'oled-ssd1306': {
    type: 'oled-ssd1306',
    name: '0.96" SSD1306 OLED Display (I2C)',
    category: 'displays',
    description: '128x64 pixel monochrome graphical OLED display communicating via I2C interface (address 0x3C).',
    width: 120,
    height: 110,
    size3D: [2.8, 0.4, 2.8],
    pins: [
      { id: 'GND', name: 'GND', type: 'ground', x: 30, y: 15, pos3D: [-0.9, 0.2, -1.2], voltage: 0 },
      { id: 'VDD', name: 'VDD (3.3V/5V)', type: 'power', x: 50, y: 15, pos3D: [-0.3, 0.2, -1.2], voltage: 3.3 },
      { id: 'SCK', name: 'SCK (SCL)', type: 'i2c', x: 70, y: 15, pos3D: [0.3, 0.2, -1.2] },
      { id: 'SDA', name: 'SDA', type: 'i2c', x: 90, y: 15, pos3D: [0.9, 0.2, -1.2] }
    ],
    defaultProperties: {
      label: 'SSD1306 OLED',
      address: '0x3C',
      width: 128,
      height: 64,
      lines: ['ESP32 SMART NODE', 'Temp: 24.5 C', 'Humidity: 60 %', 'STATUS: SAFE OK']
    },
    specs: {
      Resolution: '128 x 64 pixels',
      Technology: 'Self-emitting OLED (no backlight)',
      Interface: 'I2C (Address 0x3C)',
      Supply: '3.3V - 5V'
    }
  },

  'lcd-16x2': {
    type: 'lcd-16x2',
    name: '16x2 LCD Display (I2C)',
    category: 'displays',
    description: '16 characters by 2 lines alphanumeric LCD module with PCF8574 I2C backpack.',
    width: 170,
    height: 90,
    size3D: [4.2, 0.6, 2.0],
    pins: [
      { id: 'GND', name: 'GND', type: 'ground', x: 20, y: 20, pos3D: [-1.8, 0.2, -0.8], voltage: 0 },
      { id: 'VCC', name: 'VCC (5V)', type: 'power', x: 20, y: 35, pos3D: [-1.8, 0.2, -0.4], voltage: 5.0 },
      { id: 'SDA', name: 'SDA', type: 'i2c', x: 20, y: 50, pos3D: [-1.8, 0.2, 0.0] },
      { id: 'SCL', name: 'SCL', type: 'i2c', x: 20, y: 65, pos3D: [-1.8, 0.2, 0.4] }
    ],
    defaultProperties: {
      label: '16x2 LCD',
      line1: 'ESP32 Weather Stn',
      line2: 'T: 24.5C H: 60%'
    }
  },

  'led': {
    type: 'led',
    name: 'LED (5mm)',
    category: 'displays',
    description: '5mm diffused through-hole light emitting diode with anode (+) and cathode (-).',
    width: 60,
    height: 80,
    size3D: [0.8, 1.4, 0.8],
    pins: [
      { id: 'anode', name: 'Anode (+ Long)', type: 'passive', x: 20, y: 70, pos3D: [-0.2, -0.6, 0] },
      { id: 'cathode', name: 'Cathode (- Short)', type: 'passive', x: 40, y: 70, pos3D: [0.2, -0.6, 0] }
    ],
    defaultProperties: {
      label: '5mm LED',
      color: 'red',
      forwardVoltage: 2.0, // V
      maxCurrent: 25 // mA
    },
    specs: {
      'Forward Voltage': 'Red: 1.8-2.2V, Green/Blue: 3.0-3.2V',
      'Max Continuous Current': '20-25 mA',
      'Limiting Resistor': 'Required (e.g. 220Ω - 330Ω)'
    }
  },

  'resistor': {
    type: 'resistor',
    name: 'Resistor (Axial)',
    category: 'passives',
    description: 'Through-hole metal film resistor with configurable resistance value and accurate 4-band color codes.',
    width: 80,
    height: 40,
    size3D: [1.8, 0.4, 0.4],
    pins: [
      { id: '1', name: 'Pin 1', type: 'passive', x: 10, y: 20, pos3D: [-0.9, 0, 0] },
      { id: '2', name: 'Pin 2', type: 'passive', x: 70, y: 20, pos3D: [0.9, 0, 0] }
    ],
    defaultProperties: {
      label: '220 Ω Resistor',
      resistance: 220,
      tolerance: 5 // %
    },
    specs: {
      Power: '0.25 W (1/4 Watt)',
      Tolerance: '±5% (Gold band)'
    }
  },

  'pushbutton': {
    type: 'pushbutton',
    name: 'Tactile Pushbutton',
    category: 'switches',
    description: '6x6mm momentary normally-open tactile pushbutton switch with 4 corner pins.',
    width: 60,
    height: 60,
    size3D: [1.0, 0.8, 1.0],
    pins: [
      { id: '1a', name: 'Pin 1A', type: 'passive', x: 10, y: 15, pos3D: [-0.4, -0.3, -0.4] },
      { id: '1b', name: 'Pin 1B', type: 'passive', x: 50, y: 15, pos3D: [0.4, -0.3, -0.4] },
      { id: '2a', name: 'Pin 2A', type: 'passive', x: 10, y: 45, pos3D: [-0.4, -0.3, 0.4] },
      { id: '2b', name: 'Pin 2B', type: 'passive', x: 50, y: 45, pos3D: [0.4, -0.3, 0.4] }
    ],
    defaultProperties: {
      label: 'Push Button',
      pressed: false
    }
  },

  'potentiometer': {
    type: 'potentiometer',
    name: 'Potentiometer (10k)',
    category: 'sensors',
    description: 'Rotary potentiometer providing variable analog voltage divider output (0 - 100%).',
    width: 70,
    height: 80,
    size3D: [1.2, 1.4, 1.2],
    pins: [
      { id: 'VCC', name: '1: VCC', type: 'power', x: 15, y: 70, pos3D: [-0.4, -0.5, 0.3] },
      { id: 'SIG', name: '2: SIG (Output)', type: 'analog', x: 35, y: 70, pos3D: [0, -0.5, 0.3] },
      { id: 'GND', name: '3: GND', type: 'ground', x: 55, y: 70, pos3D: [0.4, -0.5, 0.3] }
    ],
    defaultProperties: {
      label: '10k Potentiometer',
      value: 50, // 0 - 100%
      resistance: 10000
    }
  },

  'servo-sg90': {
    type: 'servo-sg90',
    name: 'SG90 Micro Servo',
    category: 'actuators',
    description: '9g micro RC servo motor with 0 to 180 degree positional rotation control via PWM.',
    width: 90,
    height: 90,
    size3D: [1.8, 1.5, 1.4],
    pins: [
      { id: 'GND', name: 'Brown: GND', type: 'ground', x: 20, y: 80, pos3D: [-0.6, -0.5, 0.5] },
      { id: 'VCC', name: 'Red: VCC (5V)', type: 'power', x: 45, y: 80, pos3D: [0, -0.5, 0.5] },
      { id: 'PWM', name: 'Orange: PWM', type: 'pwm', x: 70, y: 80, pos3D: [0.6, -0.5, 0.5] }
    ],
    defaultProperties: {
      label: 'SG90 Servo',
      angle: 90 // 0 to 180 deg
    },
    specs: {
      'Operating Speed': '0.12s / 60 degrees (4.8V)',
      'Stall Torque': '1.8 kg-cm',
      'Operating Voltage': '4.8V - 6.0V'
    }
  },

  'piezo-buzzer': {
    type: 'piezo-buzzer',
    name: 'Piezo Buzzer',
    category: 'actuators',
    description: 'Active/Passive acoustic transducer generating audible sound tones (simulated via Web Audio API).',
    width: 70,
    height: 70,
    size3D: [1.4, 0.8, 1.4],
    pins: [
      { id: 'POS', name: '+ Positive', type: 'passive', x: 25, y: 60, pos3D: [-0.3, -0.4, 0] },
      { id: 'NEG', name: '- Negative (GND)', type: 'ground', x: 45, y: 60, pos3D: [0.3, -0.4, 0] }
    ],
    defaultProperties: {
      label: 'Piezo Buzzer',
      frequency: 2400,
      active: false
    }
  },

  'sensor-ultrasonic': {
    type: 'sensor-ultrasonic',
    name: 'HC-SR04 Ultrasonic Sensor',
    category: 'sensors',
    description: 'Ultrasonic distance measuring sensor (2cm to 400cm) with transmitter and receiver transducers.',
    width: 110,
    height: 70,
    size3D: [2.5, 1.2, 1.2],
    pins: [
      { id: 'VCC', name: 'VCC (5V)', type: 'power', x: 25, y: 60, pos3D: [-0.6, -0.5, 0] },
      { id: 'TRIG', name: 'TRIG', type: 'digital', x: 45, y: 60, pos3D: [-0.2, -0.5, 0] },
      { id: 'ECHO', name: 'ECHO', type: 'digital', x: 65, y: 60, pos3D: [0.2, -0.5, 0] },
      { id: 'GND', name: 'GND', type: 'ground', x: 85, y: 60, pos3D: [0.6, -0.5, 0] }
    ],
    defaultProperties: {
      label: 'HC-SR04 Ultrasonic',
      distanceCm: 50
    }
  }
};

// Helper: Calculate 4-band resistor color codes from resistance in Ohms
export function getResistorColorBands(ohms: number): [string, string, string, string] {
  const COLOR_MAP: Record<number, string> = {
    0: '#000000', // Black
    1: '#8b4513', // Brown
    2: '#ef4444', // Red
    3: '#f97316', // Orange
    4: '#eab308', // Yellow
    5: '#22c55e', // Green
    6: '#3b82f6', // Blue
    7: '#a855f7', // Violet
    8: '#6b7280', // Grey
    9: '#ffffff'  // White
  };

  const str = Math.round(ohms).toString();
  const digit1 = parseInt(str[0]) || 0;
  const digit2 = parseInt(str[1]) || 0;
  const multiplier = Math.max(0, str.length - 2);

  const band1 = COLOR_MAP[digit1] || '#8b4513';
  const band2 = COLOR_MAP[digit2] || '#000000';
  const band3 = COLOR_MAP[multiplier] || '#8b4513';
  const band4 = '#d4af37'; // Gold (5% tolerance)

  return [band1, band2, band3, band4];
}
