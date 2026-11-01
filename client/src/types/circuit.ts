// Types for Circuit Designer & Simulator

export type ComponentCategory =
  | 'microcontrollers'
  | 'sensors'
  | 'displays'
  | 'passives'
  | 'switches'
  | 'actuators'
  | 'power';

export interface PinDefinition {
  id: string;
  name: string;
  type: 'power' | 'ground' | 'digital' | 'analog' | 'i2c' | 'pwm' | 'passive';
  x: number; // Relative X coordinate in 2D (px)
  y: number; // Relative Y coordinate in 2D (px)
  pos3D: [number, number, number]; // Relative [x, y, z] in 3D units
  description?: string;
  voltage?: number;
}

export interface ComponentMetadata {
  type: string;
  name: string;
  category: ComponentCategory;
  description: string;
  width: number;
  height: number;
  size3D: [number, number, number];
  pins: PinDefinition[];
  defaultProperties: Record<string, any>;
  specs?: Record<string, string>;
}

export interface PlacedComponent {
  id: string;
  type: string;
  name: string;
  x: number;
  y: number;
  z?: number;
  rotation: number; // 0, 90, 180, 270 degrees
  properties: Record<string, any>;
  state?: {
    powered?: boolean;
    active?: boolean;
    value?: any;
    error?: string;
    voltage?: number;
    currentMa?: number;
    burnedOut?: boolean;
    [key: string]: any;
  };
}

export interface WireConnection {
  componentId: string;
  pin: string;
}

export interface Wire {
  id: string;
  from: WireConnection;
  to: WireConnection;
  color: string;
  points?: Array<{ x: number; y: number }>;
}

export interface SimulationState {
  isRunning: boolean;
  isPaused: boolean;
  timeSeconds: number;
  speed: number; // 0.25, 0.5, 1.0, 2.0
  logs: Array<{
    id: string;
    timestamp: number;
    level: 'info' | 'warn' | 'error' | 'serial';
    message: string;
  }>;
  gpioStates: Record<string, 'HIGH' | 'LOW' | number>; // e.g. "esp32-1:D4" -> 'HIGH'
  errors: string[];
}

export interface ProjectData {
  _id?: string;
  id?: string;
  name: string;
  description: string;
  category?: string;
  tags?: string[];
  components: PlacedComponent[];
  wires: Wire[];
  code: string;
  thumbnail?: string;
  createdAt?: string;
  updatedAt?: string;
}

