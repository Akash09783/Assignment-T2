// Enterprise-grade TypeScript definitions for Circuit3D Simulator

export type ComponentCategory =
  | 'microcontrollers'
  | 'sensors'
  | 'displays'
  | 'passives'
  | 'switches'
  | 'actuators'
  | 'power';

export type PinType =
  | 'power'
  | 'ground'
  | 'digital'
  | 'analog'
  | 'i2c'
  | 'pwm'
  | 'passive';

export interface PinDefinition {
  id: string;
  name: string;
  type: PinType;
  x: number; // Relative X coordinate in 2D (px)
  y: number; // Relative Y coordinate in 2D (px)
  pos3D: [number, number, number]; // Relative [x, y, z] in 3D units
  description?: string;
  voltage?: number;
}

export interface ComponentProperties {
  label?: string;
  resistance?: number;
  tolerance?: number;
  color?: string;
  forwardVoltage?: number;
  maxCurrent?: number;
  temperature?: number;
  humidity?: number;
  distanceCm?: number;
  value?: number;
  angle?: number;
  frequency?: number | string;
  ram?: string;
  clock?: string;
  pressed?: boolean;
  active?: boolean;
  rows?: number;
  tiePoints?: number;
  address?: string;
  width?: number;
  height?: number;
  lines?: string[];
  [key: string]: string | number | boolean | string[] | undefined;
}

export interface ComponentState {
  powered?: boolean;
  active?: boolean;
  voltage?: number;
  currentMa?: number;
  burnedOut?: boolean;
  error?: string;
  value?: number | string | boolean;
  [key: string]: string | number | boolean | undefined;
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
  defaultProperties: ComponentProperties;
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
  properties: ComponentProperties;
  state?: ComponentState;
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
  speed: number;
  gpioStates: Record<string, 'HIGH' | 'LOW' | number>;
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

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  storage?: string;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
}
