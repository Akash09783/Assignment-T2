import { PlacedComponent, Wire } from '../types/circuit';
import { COMPONENT_REGISTRY } from './componentRegistry';

export interface SolvedPinState {
  voltage: number;
  netId: string;
  isGnd: boolean;
  isVcc: boolean;
  vccVoltage: number;
}

export interface CircuitAnalysisResult {
  nets: Array<{ id: string; pins: Array<{ componentId: string; pin: string }> }>;
  pinStates: Record<string, SolvedPinState>; // key: "componentId:pin"
  componentStates: Record<string, {
    powered: boolean;
    active: boolean;
    currentMa: number;
    voltage: number;
    burnedOut?: boolean;
    error?: string;
  }>;
  shortCircuit: boolean;
  warnings: string[];
  errors: string[];
}

export function solveCircuit(
  components: PlacedComponent[],
  wires: Wire[],
  gpioOutputs: Record<string, 'HIGH' | 'LOW' | number> // e.g. "esp32-1:D4" -> 'HIGH'
): CircuitAnalysisResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Build Adjacency Graph of Pins
  const pinKey = (cId: string, pId: string) => `${cId}:${pId}`;
  const adj: Record<string, Set<string>> = {};

  const addEdge = (p1: string, p2: string) => {
    if (!adj[p1]) adj[p1] = new Set();
    if (!adj[p2]) adj[p2] = new Set();
    adj[p1].add(p2);
    adj[p2].add(p1);
  };

  // 1. Direct wires
  for (const wire of wires) {
    if (!wire.from || !wire.to) continue;
    const k1 = pinKey(wire.from.componentId, wire.from.pin);
    const k2 = pinKey(wire.to.componentId, wire.to.pin);
    addEdge(k1, k2);
  }

  // 2. Internal connections: Closed pushbuttons connect pin 1a <-> 2a, 1b <-> 2b
  for (const comp of components) {
    if (comp.type === 'pushbutton' && comp.properties.pressed) {
      addEdge(pinKey(comp.id, '1a'), pinKey(comp.id, '2a'));
      addEdge(pinKey(comp.id, '1b'), pinKey(comp.id, '2b'));
      addEdge(pinKey(comp.id, '1a'), pinKey(comp.id, '1b'));
      addEdge(pinKey(comp.id, '2a'), pinKey(comp.id, '2b'));
    }
  }

  // 3. Find Connected Components (Nets) using BFS/DFS
  const visited = new Set<string>();
  const nets: Array<{ id: string; pins: Array<{ componentId: string; pin: string }> }> = [];

  const allPinKeys = Object.keys(adj);
  let netCounter = 0;

  for (const pKey of allPinKeys) {
    if (!visited.has(pKey)) {
      netCounter++;
      const netId = `NET_${netCounter}`;
      const group: Array<{ componentId: string; pin: string }> = [];
      const queue = [pKey];
      visited.add(pKey);

      while (queue.length > 0) {
        const curr = queue.shift()!;
        const [cId, pId] = curr.split(':');
        group.push({ componentId: cId, pin: pId });

        for (const neighbor of adj[curr] || []) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        }
      }

      nets.push({ id: netId, pins: group });
    }
  }

  // Map each pin to its Net
  const pinToNet: Record<string, string> = {};
  for (const net of nets) {
    for (const p of net.pins) {
      pinToNet[pinKey(p.componentId, p.pin)] = net.id;
    }
  }

  // 4. Identify Net Electrical Characteristics (VCC sources, GND, GPIO states)
  const netVoltages: Record<string, { voltage: number; isGnd: boolean; isVcc: boolean }> = {};
  let shortCircuit = false;

  for (const net of nets) {
    let hasGnd = false;
    let maxVcc = 0;
    let hasVcc = false;

    for (const p of net.pins) {
      const comp = components.find(c => c.id === p.componentId);
      if (!comp) continue;

      // Microcontroller power outputs
      if (comp.type === 'esp32') {
        if (p.pin.startsWith('GND')) hasGnd = true;
        if (p.pin === '3V3') { hasVcc = true; maxVcc = Math.max(maxVcc, 3.3); }
        if (p.pin === 'VIN') { hasVcc = true; maxVcc = Math.max(maxVcc, 5.0); }

        // GPIO Pin Outputs
        const gpioVal = gpioOutputs[`${comp.id}:${p.pin}`];
        if (gpioVal === 'HIGH' || gpioVal === 1) {
          hasVcc = true;
          maxVcc = Math.max(maxVcc, 3.3);
        } else if (gpioVal === 'LOW' || gpioVal === 0) {
          hasGnd = true;
        }
      } else if (comp.type === 'arduino-uno') {
        if (p.pin.startsWith('GND')) hasGnd = true;
        if (p.pin === '5V') { hasVcc = true; maxVcc = Math.max(maxVcc, 5.0); }
        if (p.pin === '3V3') { hasVcc = true; maxVcc = Math.max(maxVcc, 3.3); }

        const gpioVal = gpioOutputs[`${comp.id}:${p.pin}`];
        if (gpioVal === 'HIGH' || gpioVal === 1) {
          hasVcc = true;
          maxVcc = Math.max(maxVcc, 5.0);
        } else if (gpioVal === 'LOW' || gpioVal === 0) {
          hasGnd = true;
        }
      } else if (comp.type === 'breadboard-half') {
        if (p.pin.includes('neg')) hasGnd = true;
        if (p.pin.includes('pos')) { hasVcc = true; maxVcc = Math.max(maxVcc, 5.0); }
      }
    }

    if (hasGnd && hasVcc && maxVcc > 0) {
      shortCircuit = true;
      errors.push(`CRITICAL: Short Circuit detected on ${net.id}! Power rail directly shorted to Ground.`);
    }

    const netV = hasGnd ? 0 : (hasVcc ? maxVcc : 0);
    netVoltages[net.id] = { voltage: netV, isGnd: hasGnd, isVcc: hasVcc };
  }

  // 5. Build Pin States lookup
  const pinStates: Record<string, SolvedPinState> = {};
  for (const net of nets) {
    const nInfo = netVoltages[net.id] || { voltage: 0, isGnd: false, isVcc: false };
    for (const p of net.pins) {
      pinStates[pinKey(p.componentId, p.pin)] = {
        voltage: nInfo.voltage,
        netId: net.id,
        isGnd: nInfo.isGnd,
        isVcc: nInfo.isVcc,
        vccVoltage: nInfo.voltage
      };
    }
  }

  // 6. Evaluate Component Statuses (Sensors, Displays, LEDs, Buzzers, Servos)
  const componentStates: CircuitAnalysisResult['componentStates'] = {};

  for (const comp of components) {
    const meta = COMPONENT_REGISTRY[comp.type];
    let powered = false;
    let active = false;
    let currentMa = 0;
    let voltage = 0;
    let burnedOut = false;
    let error: string | undefined;

    if (comp.type === 'esp32' || comp.type === 'arduino-uno') {
      // Microcontrollers are assumed powered during simulation via simulated USB connection
      powered = true;
      active = true;
      voltage = comp.type === 'esp32' ? 3.3 : 5.0;
    } else if (comp.type === 'dht22') {
      const vccPin = pinStates[pinKey(comp.id, 'VCC')];
      const gndPin = pinStates[pinKey(comp.id, 'GND')];
      if (vccPin && gndPin && vccPin.isVcc && gndPin.isGnd) {
        powered = true;
        active = true;
        voltage = vccPin.voltage;
      } else {
        warnings.push(`${comp.name || 'DHT22'}: VCC/GND not properly wired.`);
      }
    } else if (comp.type === 'oled-ssd1306') {
      const vddPin = pinStates[pinKey(comp.id, 'VDD')];
      const gndPin = pinStates[pinKey(comp.id, 'GND')];
      const sdaPin = pinStates[pinKey(comp.id, 'SDA')];
      const sckPin = pinStates[pinKey(comp.id, 'SCK')];

      if (vddPin && gndPin && vddPin.isVcc && gndPin.isGnd) {
        powered = true;
        voltage = vddPin.voltage;
        if (sdaPin && sckPin) {
          active = true;
        } else {
          warnings.push(`${comp.name || 'OLED'}: I2C SDA/SCK lines not fully connected.`);
        }
      }
    } else if (comp.type === 'lcd-16x2') {
      const vccPin = pinStates[pinKey(comp.id, 'VCC')];
      const gndPin = pinStates[pinKey(comp.id, 'GND')];
      if (vccPin && gndPin && vccPin.isVcc && gndPin.isGnd) {
        powered = true;
        active = true;
        voltage = vccPin.voltage;
      }
    } else if (comp.type === 'led') {
      // Analyze LED circuit: Anode -> Cathode
      const anodeNetId = pinToNet[pinKey(comp.id, 'anode')];
      const cathodeNetId = pinToNet[pinKey(comp.id, 'cathode')];

      if (anodeNetId && cathodeNetId) {
        const anodeNet = netVoltages[anodeNetId];
        const cathodeNet = netVoltages[cathodeNetId];

        if (anodeNet && cathodeNet && anodeNet.voltage > cathodeNet.voltage) {
          powered = true;
          const vDrop = anodeNet.voltage - cathodeNet.voltage;
          voltage = vDrop;

          // Check if there is a series resistor in the same net or loop
          // Trace connected components on anodeNet or cathodeNet
          let totalSeriesResistance = 0;
          for (const c of components) {
            if (c.type === 'resistor') {
              const r1Net = pinToNet[pinKey(c.id, '1')];
              const r2Net = pinToNet[pinKey(c.id, '2')];
              if (r1Net === anodeNetId || r2Net === anodeNetId || r1Net === cathodeNetId || r2Net === cathodeNetId) {
                totalSeriesResistance += (c.properties.resistance || 220);
              }
            }
          }

          const vf = comp.properties.forwardVoltage || 2.0;

          if (totalSeriesResistance > 0) {
            // Safe current limiting: I = (V_in - V_f) / R
            currentMa = Math.max(0, ((vDrop - vf) / totalSeriesResistance) * 1000);
            if (currentMa > 1.0) {
              active = true;
            }
          } else {
            // Warning: No resistor connected!
            if (vDrop >= 3.0) {
              burnedOut = true;
              active = false;
              error = 'LED Burnout: Exceeded max forward voltage without current-limiting resistor!';
              errors.push(`LED Burnout on ${comp.name || 'LED'}: Connected to ${vDrop.toFixed(1)}V with 0Ω resistance.`);
            } else if (vDrop > 1.8) {
              active = true;
              currentMa = 35; // Danger zone
              warnings.push(`${comp.name || 'LED'}: High current. Add a 220Ω resistor.`);
            }
          }
        }
      }
    } else if (comp.type === 'piezo-buzzer') {
      const posPin = pinStates[pinKey(comp.id, 'POS')];
      const negPin = pinStates[pinKey(comp.id, 'NEG')];
      if (posPin && negPin && posPin.voltage > negPin.voltage) {
        powered = true;
        active = true;
        voltage = posPin.voltage - negPin.voltage;
      }
    } else if (comp.type === 'servo-sg90') {
      const vccPin = pinStates[pinKey(comp.id, 'VCC')];
      const gndPin = pinStates[pinKey(comp.id, 'GND')];
      if (vccPin && gndPin && vccPin.isVcc && gndPin.isGnd) {
        powered = true;
        active = true;
      }
    } else if (comp.type === 'potentiometer') {
      const vccPin = pinStates[pinKey(comp.id, 'VCC')];
      const gndPin = pinStates[pinKey(comp.id, 'GND')];
      if (vccPin && gndPin && vccPin.isVcc && gndPin.isGnd) {
        powered = true;
        active = true;
      }
    }

    componentStates[comp.id] = {
      powered,
      active,
      currentMa: Math.round(currentMa * 10) / 10,
      voltage: Math.round(voltage * 100) / 100,
      burnedOut,
      error
    };
  }

  return {
    nets,
    pinStates,
    componentStates,
    shortCircuit,
    warnings,
    errors
  };
}

