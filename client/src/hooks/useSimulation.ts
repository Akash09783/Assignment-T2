'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { PlacedComponent, Wire } from '../types/circuit';
import { solveCircuit } from '../lib/circuitSolver';
import { MCUEmulator, MCULogEntry } from '../lib/mcuEmulator';
import { audioManager } from '../lib/audioManager';

interface UseSimulationProps {
  components: PlacedComponent[];
  wires: Wire[];
  code: string;
  onUpdateComponentsState: (updated: PlacedComponent[]) => void;
}

export function useSimulation({
  components,
  wires,
  code,
  onUpdateComponentsState
}: UseSimulationProps) {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [timeSeconds, setTimeSeconds] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(1.0);
  const [serialLogs, setSerialLogs] = useState<MCULogEntry[]>([]);
  const [oledLines, setOledLines] = useState<string[]>([
    'ESP32 SMART NODE',
    'Temp: 24.5 C',
    'Humidity: 60 %',
    'STATUS: SAFE OK'
  ]);
  const [circuitErrors, setCircuitErrors] = useState<string[]>([]);

  const mcuRef = useRef<MCUEmulator | null>(null);

  // Initialize or re-target MCU emulator
  useEffect(() => {
    const mcuComp = components.find(c => c.type === 'esp32' || c.type === 'arduino-uno');
    const mcuType = mcuComp?.type === 'arduino-uno' ? 'arduino-uno' : 'esp32';
    const mcu = new MCUEmulator(mcuComp?.id || 'esp32-1', mcuType);

    mcu.setLogCallback((entry) => {
      setSerialLogs(prev => [...prev.slice(-300), entry]);
    });

    mcuRef.current = mcu;
  }, [components]);

  // Main simulation tick loop
  useEffect(() => {
    if (!isRunning || isPaused) return;

    const intervalMs = Math.round(100 / speed);

    const timer = setInterval(() => {
      setTimeSeconds(t => Math.round((t + 0.1) * 10) / 10);

      if (!mcuRef.current) return;

      // 1. Execute MCU cycle
      mcuRef.current.executeCycle(components, wires, code);
      const gpioOutputs = mcuRef.current.getGPIOStates();
      const updatedOled = mcuRef.current.getOLEDDisplayLines();
      const servoDeg = mcuRef.current.getServoAngle();

      setOledLines(updatedOled);

      // 2. Solve electrical net continuity
      const analysis = solveCircuit(components, wires, gpioOutputs);
      setCircuitErrors(analysis.errors);

      // 3. Update component states
      const updated = components.map(comp => {
        const compState = analysis.componentStates[comp.id] || {};
        const updatedProps = { ...comp.properties };

        if (comp.type === 'servo-sg90') {
          updatedProps.angle = servoDeg;
        }

        if (comp.type === 'piezo-buzzer') {
          audioManager.setBuzzer(Boolean(compState.active));
        }

        return {
          ...comp,
          state: compState,
          properties: updatedProps
        };
      });

      onUpdateComponentsState(updated);
    }, intervalMs);

    return () => {
      clearInterval(timer);
      audioManager.setBuzzer(false);
    };
  }, [isRunning, isPaused, speed, components, wires, code, onUpdateComponentsState]);

  const startSimulation = useCallback(() => {
    if (!isRunning) {
      mcuRef.current?.reset();
      setSerialLogs([]);
      mcuRef.current?.logSerial('--- Starting Simulation Runtime ---', 'info');
    }
    setIsRunning(true);
    setIsPaused(false);
    audioManager.playClick();
  }, [isRunning]);

  const pauseSimulation = useCallback(() => {
    setIsPaused(true);
    audioManager.setBuzzer(false);
  }, []);

  const stopSimulation = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    audioManager.setBuzzer(false);
    mcuRef.current?.logSerial('--- Simulation Stopped ---', 'info');

    // Reset components to idle
    const idle = components.map(c => ({
      ...c,
      state: { powered: false, active: false, currentMa: 0, voltage: 0 }
    }));
    onUpdateComponentsState(idle);
  }, [components, onUpdateComponentsState]);

  const resetSimulation = useCallback(() => {
    stopSimulation();
    setTimeSeconds(0);
    setSerialLogs([]);
    setCircuitErrors([]);
    mcuRef.current?.reset();
  }, [stopSimulation]);

  const sendCommand = useCallback((cmd: string) => {
    mcuRef.current?.logSerial(`> ${cmd}`, 'serial');
  }, []);

  const clearLogs = useCallback(() => {
    setSerialLogs([]);
  }, []);

  return {
    isRunning,
    isPaused,
    timeSeconds,
    speed,
    setSpeed,
    serialLogs,
    oledLines,
    circuitErrors,
    setCircuitErrors,
    startSimulation,
    pauseSimulation,
    stopSimulation,
    resetSimulation,
    sendCommand,
    clearLogs
  };
}
