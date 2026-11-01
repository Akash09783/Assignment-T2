export interface WireColorOption {
  name: string;
  hex: string;
  purpose: string;
}

export const WIRE_COLORS: WireColorOption[] = [
  { name: 'Red', hex: '#ef4444', purpose: 'Power (+VCC / 3.3V / 5V)' },
  { name: 'Black', hex: '#1e293b', purpose: 'Ground (GND / 0V)' },
  { name: 'Blue', hex: '#3b82f6', purpose: 'I2C SDA / Analog Signal' },
  { name: 'Purple', hex: '#a855f7', purpose: 'I2C SCL Clock' },
  { name: 'Green', hex: '#10b981', purpose: 'Digital Output / Control' },
  { name: 'Yellow', hex: '#eab308', purpose: '1-Wire / Sensor Data' },
  { name: 'Orange', hex: '#f97316', purpose: 'PWM / Servo Signal' },
  { name: 'White', hex: '#f8fafc', purpose: 'Interconnect / Neutral' }
];

export const DEFAULT_WIRE_COLOR = '#3b82f6';
