'use client';

import { useState, useCallback } from 'react';
import { PlacedComponent, Wire, ProjectData, ComponentProperties } from '../types/circuit';
import { COMPONENT_REGISTRY } from '../lib/componentRegistry';
import { DEFAULT_TEMPLATES } from '../lib/defaultTemplates';
import { audioManager } from '../lib/audioManager';

export function useCircuitProject(initialProject: ProjectData = DEFAULT_TEMPLATES[0]) {
  const [project, setProject] = useState<ProjectData>(initialProject);
  const [components, setComponents] = useState<PlacedComponent[]>(initialProject.components || []);
  const [wires, setWires] = useState<Wire[]>(initialProject.wires || []);
  const [code, setCode] = useState<string>(initialProject.code || '');

  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);

  const addComponent = useCallback((type: string) => {
    const meta = COMPONENT_REGISTRY[type];
    if (!meta) return;

    const newId = `${type}-${Date.now().toString(36).substring(2, 6)}`;
    const newComp: PlacedComponent = {
      id: newId,
      type,
      name: meta.name,
      x: 350 + Math.floor(Math.random() * 80),
      y: 180 + Math.floor(Math.random() * 80),
      rotation: 0,
      properties: { ...meta.defaultProperties }
    };

    setComponents(prev => [...prev, newComp]);
    setSelectedComponentId(newId);
    audioManager.playClick();
  }, []);

  const updateComponentPosition = useCallback((id: string, x: number, y: number) => {
    setComponents(prev =>
      prev.map(c => (c.id === id ? { ...c, x, y } : c))
    );
  }, []);

  const rotateComponent = useCallback((id: string) => {
    setComponents(prev =>
      prev.map(c => {
        if (c.id === id) {
          const nextRot = (c.rotation + 90) % 360;
          return { ...c, rotation: nextRot };
        }
        return c;
      })
    );
    audioManager.playClick();
  }, []);

  const deleteComponent = useCallback((id: string) => {
    setComponents(prev => prev.filter(c => c.id !== id));
    setWires(prev => prev.filter(w => w.from.componentId !== id && w.to.componentId !== id));
    setSelectedComponentId(prev => (prev === id ? null : prev));
    audioManager.playClick();
  }, []);

  const updateComponentProperties = useCallback((id: string, newProps: ComponentProperties) => {
    setComponents(prev =>
      prev.map(c => (c.id === id ? { ...c, properties: newProps } : c))
    );
  }, []);

  const togglePushbutton = useCallback((id: string, pressed: boolean) => {
    setComponents(prev =>
      prev.map(c => (c.id === id ? { ...c, properties: { ...c.properties, pressed } } : c))
    );
    audioManager.playClick();
  }, []);

  const connectPins = useCallback((
    from: { componentId: string; pin: string },
    to: { componentId: string; pin: string },
    color: string
  ) => {
    const exists = wires.some(
      w =>
        (w.from.componentId === from.componentId && w.from.pin === from.pin && w.to.componentId === to.componentId && w.to.pin === to.pin) ||
        (w.from.componentId === to.componentId && w.from.pin === to.pin && w.to.componentId === from.componentId && w.to.pin === from.pin)
    );
    if (exists) return;

    const newWire: Wire = {
      id: `w-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      from,
      to,
      color
    };

    setWires(prev => [...prev, newWire]);
    audioManager.playClick();
  }, [wires]);

  const deleteWire = useCallback((id: string) => {
    setWires(prev => prev.filter(w => w.id !== id));
    setSelectedWireId(prev => (prev === id ? null : prev));
    audioManager.playClick();
  }, []);

  const loadProject = useCallback((proj: ProjectData) => {
    setProject(proj);
    setComponents(proj.components || []);
    setWires(proj.wires || []);
    setCode(proj.code || '');
    setSelectedComponentId(null);
    setSelectedWireId(null);
    audioManager.playClick();
  }, []);

  const createNewProject = useCallback(() => {
    const blank: ProjectData = {
      name: 'New Circuit Project',
      description: 'Custom ESP32 / Arduino circuit design',
      category: 'General',
      components: [
        {
          id: 'esp32-1',
          type: 'esp32',
          name: 'ESP32 DevKit V1',
          x: 200,
          y: 200,
          rotation: 0,
          properties: { label: 'ESP32 DevKit V1' }
        },
        {
          id: 'bb-1',
          type: 'breadboard-half',
          name: 'Half Breadboard',
          x: 480,
          y: 220,
          rotation: 0,
          properties: { rows: 30 }
        }
      ],
      wires: [],
      code: `// New Sketch\nvoid setup() {\n  Serial.begin(115200);\n  Serial.println("System Ready");\n}\n\nvoid loop() {\n  delay(1000);\n}`
    };
    loadProject(blank);
  }, [loadProject]);

  return {
    project,
    setProject,
    components,
    setComponents,
    wires,
    code,
    setCode,
    selectedComponentId,
    selectedWireId,
    setSelectedComponentId,
    setSelectedWireId,
    addComponent,
    updateComponentPosition,
    rotateComponent,
    deleteComponent,
    updateComponentProperties,
    togglePushbutton,
    connectPins,
    deleteWire,
    loadProject,
    createNewProject
  };
}
