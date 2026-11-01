'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlacedComponent, Wire, ProjectData } from '../types/circuit';
import { COMPONENT_REGISTRY } from '../lib/componentRegistry';
import { solveCircuit } from '../lib/circuitSolver';
import { MCUEmulator, MCULogEntry } from '../lib/mcuEmulator';
import { audioManager } from '../lib/audioManager';
import {
  fetchProjects,
  fetchProjectById,
  saveProject,
  deleteProject,
  forkProject
} from '../lib/api';

import { TopNavbar } from '../components/ui/TopNavbar';
import { CircuitCanvas2D } from '../components/2d/CircuitCanvas2D';
import { CircuitCanvas3D } from '../components/3d/CircuitCanvas3D';
import { CodeEditor } from '../components/editor/CodeEditor';
import { ComponentLibrary } from '../components/panels/ComponentLibrary';
import { PropertyInspector } from '../components/panels/PropertyInspector';
import { SerialMonitor } from '../components/panels/SerialMonitor';
import { ProjectsModal } from '../components/panels/ProjectsModal';
import { BOMModal } from '../components/panels/BOMModal';

import { DEFAULT_TEMPLATES } from '../lib/defaultTemplates';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function CircuitSimulatorPage() {
  // Primary Project State
  const [currentProject, setCurrentProject] = useState<ProjectData>(DEFAULT_TEMPLATES[0]);
  const [components, setComponents] = useState<PlacedComponent[]>(DEFAULT_TEMPLATES[0].components);
  const [wires, setWires] = useState<Wire[]>(DEFAULT_TEMPLATES[0].wires);
  const [code, setCode] = useState<string>(DEFAULT_TEMPLATES[0].code);

  // View Navigation
  const [activeTab, setActiveTab] = useState<'design' | '3d' | 'code' | 'bom'>('design');

  // Selections & Active Tools
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);
  const [activeWireColor, setActiveWireColor] = useState<string>('#3b82f6');

  // Modals & Panels
  const [isComponentLibraryOpen, setIsComponentLibraryOpen] = useState<boolean>(false);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState<boolean>(false);
  const [isBOMModalOpen, setIsBOMModalOpen] = useState<boolean>(false);
  const [isSerialMonitorOpen, setIsSerialMonitorOpen] = useState<boolean>(true);

  // Projects list
  const [savedProjects, setSavedProjects] = useState<ProjectData[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);

  // Simulation State
  const [simulationRunning, setSimulationRunning] = useState<boolean>(false);
  const [simulationPaused, setSimulationPaused] = useState<boolean>(false);
  const [simulationTime, setSimulationTime] = useState<number>(0);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1.0);
  const [serialLogs, setSerialLogs] = useState<MCULogEntry[]>([]);
  const [oledLines, setOledLines] = useState<string[]>([
    'ESP32 SMART NODE',
    'Temp: 24.5 C',
    'Humidity: 60 %',
    'STATUS: SAFE OK'
  ]);
  const [circuitErrors, setCircuitErrors] = useState<string[]>([]);

  // MCU Emulator instance
  const mcuRef = useRef<MCUEmulator | null>(null);

  // Initialize MCU
  useEffect(() => {
    const mcuComp = components.find(c => c.type === 'esp32' || c.type === 'arduino-uno');
    const mcuType = (mcuComp?.type === 'arduino-uno' ? 'arduino-uno' : 'esp32');
    const mcu = new MCUEmulator(mcuComp?.id || 'esp32-1', mcuType);

    mcu.setLogCallback((entry) => {
      setSerialLogs(prev => [...prev.slice(-300), entry]);
    });

    mcuRef.current = mcu;
  }, [components]);

  // Load saved projects list from API
  const refreshProjectsList = useCallback(async () => {
    const list = await fetchProjects();
    setSavedProjects(list);
  }, []);

  useEffect(() => {
    refreshProjectsList();
  }, [refreshProjectsList]);

  // Simulation Execution Loop
  useEffect(() => {
    if (!simulationRunning || simulationPaused) return;

    const intervalMs = Math.round(100 / simulationSpeed);

    const timer = setInterval(() => {
      setSimulationTime(t => Math.round((t + 0.1) * 10) / 10);

      if (!mcuRef.current) return;

      // 1. Run MCU firmware cycle
      mcuRef.current.executeCycle(components, wires, code);
      const gpioOutputs = mcuRef.current.getGPIOStates();
      const updatedOled = mcuRef.current.getOLEDDisplayLines();
      const servoDeg = mcuRef.current.getServoAngle();

      setOledLines(updatedOled);

      // 2. Solve Electrical Circuit continuity & states
      const analysis = solveCircuit(components, wires, gpioOutputs);
      setCircuitErrors(analysis.errors);

      // 3. Update component states in React state
      setComponents(prevComponents =>
        prevComponents.map(comp => {
          const compState = analysis.componentStates[comp.id] || {};
          let updatedProps = { ...comp.properties };

          // Update servo angle property if driven by MCU
          if (comp.type === 'servo-sg90') {
            updatedProps.angle = servoDeg;
          }

          // Buzzer sound trigger
          if (comp.type === 'piezo-buzzer') {
            audioManager.setBuzzer(Boolean(compState.active));
          }

          return {
            ...comp,
            state: compState,
            properties: updatedProps
          };
        })
      );
    }, intervalMs);

    return () => {
      clearInterval(timer);
      audioManager.setBuzzer(false);
    };
  }, [simulationRunning, simulationPaused, simulationSpeed, components, wires, code]);

  // Simulation Controls
  const handleStartSimulation = () => {
    if (!simulationRunning) {
      mcuRef.current?.reset();
      setSerialLogs([]);
      mcuRef.current?.logSerial('--- Starting Simulation Runtime ---', 'info');
    }
    setSimulationRunning(true);
    setSimulationPaused(false);
    audioManager.playClick();
  };

  const handlePauseSimulation = () => {
    setSimulationPaused(true);
    audioManager.setBuzzer(false);
  };

  const handleStopSimulation = () => {
    setSimulationRunning(false);
    setSimulationPaused(false);
    audioManager.setBuzzer(false);
    mcuRef.current?.logSerial('--- Simulation Stopped ---', 'info');

    // Reset components active state
    setComponents(prev =>
      prev.map(c => ({
        ...c,
        state: { powered: false, active: false, currentMa: 0, voltage: 0 }
      }))
    );
  };

  const handleResetSimulation = () => {
    handleStopSimulation();
    setSimulationTime(0);
    setSerialLogs([]);
    setCircuitErrors([]);
    mcuRef.current?.reset();
  };

  // Component Manipulation Handlers
  const handleAddComponent = (type: string) => {
    const meta = COMPONENT_REGISTRY[type];
    if (!meta) return;

    const newId = `${type}-${Date.now().toString(36).substr(2, 5)}`;
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
    setIsComponentLibraryOpen(false);
    audioManager.playClick();
  };

  const handleUpdateComponentPosition = (id: string, x: number, y: number) => {
    setComponents(prev =>
      prev.map(c => (c.id === id ? { ...c, x, y } : c))
    );
  };

  const handleRotateComponent = (id: string) => {
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
  };

  const handleDeleteComponent = (id: string) => {
    setComponents(prev => prev.filter(c => c.id !== id));
    // Also remove wires connected to this component
    setWires(prev => prev.filter(w => w.from.componentId !== id && w.to.componentId !== id));
    if (selectedComponentId === id) setSelectedComponentId(null);
    audioManager.playClick();
  };

  const handleUpdateProperties = (id: string, newProps: Record<string, any>) => {
    setComponents(prev =>
      prev.map(c => (c.id === id ? { ...c, properties: newProps } : c))
    );
  };

  const handleTogglePushbutton = (compId: string, pressed: boolean) => {
    setComponents(prev =>
      prev.map(c => {
        if (c.id === compId) {
          return {
            ...c,
            properties: { ...c.properties, pressed }
          };
        }
        return c;
      })
    );
    audioManager.playClick();
  };

  // Wire Manipulation Handlers
  const handleConnectPins = (
    from: { componentId: string; pin: string },
    to: { componentId: string; pin: string }
  ) => {
    // Check if wire already exists
    const exists = wires.some(
      w =>
        (w.from.componentId === from.componentId && w.from.pin === from.pin && w.to.componentId === to.componentId && w.to.pin === to.pin) ||
        (w.from.componentId === to.componentId && w.from.pin === to.pin && w.to.componentId === from.componentId && w.to.pin === from.pin)
    );
    if (exists) return;

    const newWire: Wire = {
      id: `w-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      from,
      to,
      color: activeWireColor
    };

    setWires(prev => [...prev, newWire]);
    audioManager.playClick();
  };

  const handleDeleteWire = (id: string) => {
    setWires(prev => prev.filter(w => w.id !== id));
    if (selectedWireId === id) setSelectedWireId(null);
    audioManager.playClick();
  };

  // Project Management Handlers
  const handleLoadProject = (proj: ProjectData) => {
    handleStopSimulation();
    setCurrentProject(proj);
    setComponents(proj.components || []);
    setWires(proj.wires || []);
    setCode(proj.code || '');
    setSelectedComponentId(null);
    setSelectedWireId(null);
    setSimulationTime(0);
    setSerialLogs([]);
    audioManager.playClick();
  };

  const handleCreateNewProject = () => {
    handleStopSimulation();
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
    handleLoadProject(blank);
  };

  const handleSaveProject = async () => {
    setIsSaving(true);
    const updatedProj: ProjectData = {
      ...currentProject,
      components,
      wires,
      code,
      updatedAt: new Date().toISOString()
    };

    try {
      const saved = await saveProject(updatedProj);
      setCurrentProject(saved);
      await refreshProjectsList();
      setSaveBanner('Project saved successfully to MongoDB storage!');
      setTimeout(() => setSaveBanner(null), 3000);
    } catch (err) {
      setSaveBanner('Saved to local storage cache.');
      setTimeout(() => setSaveBanner(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleForkProject = async (id: string) => {
    const cloned = await forkProject(id);
    if (cloned) {
      await refreshProjectsList();
      handleLoadProject(cloned);
    }
  };

  const handleDeleteProject = async (id: string) => {
    await deleteProject(id);
    await refreshProjectsList();
  };

  const handleExportJSON = () => {
    const projectData = {
      ...currentProject,
      components,
      wires,
      code
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentProject.name.toLowerCase().replace(/\s+/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleShareProject = () => {
    if (typeof window !== 'undefined') {
      const shareUrl = window.location.origin + '?project=' + (currentProject._id || currentProject.id || '');
      navigator.clipboard.writeText(shareUrl);
      setSaveBanner('Shareable Project link copied to clipboard!');
      setTimeout(() => setSaveBanner(null), 3000);
    }
  };

  // Get selected component object
  const selectedComponent = components.find(c => c.id === selectedComponentId) || null;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* Top Cirkit-style Navbar */}
      <TopNavbar
        projectName={currentProject.name}
        onChangeProjectName={(name) => setCurrentProject(p => ({ ...p, name }))}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        simulationRunning={simulationRunning}
        simulationPaused={simulationPaused}
        simulationTime={simulationTime}
        simulationSpeed={simulationSpeed}
        onStartSimulation={handleStartSimulation}
        onPauseSimulation={handlePauseSimulation}
        onStopSimulation={handleStopSimulation}
        onResetSimulation={handleResetSimulation}
        onChangeSpeed={setSimulationSpeed}
        activeWireColor={activeWireColor}
        onChangeWireColor={setActiveWireColor}
        onOpenComponentLibrary={() => setIsComponentLibraryOpen(!isComponentLibraryOpen)}
        onOpenProjectsModal={() => setIsProjectsModalOpen(true)}
        onOpenBOMModal={() => setIsBOMModalOpen(true)}
        onSaveProject={handleSaveProject}
        onExportJSON={handleExportJSON}
        onShareProject={handleShareProject}
        isSaving={isSaving}
      />

      {/* Save / Share Toast Banner */}
      {saveBanner && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-50 bg-emerald-600/95 text-white text-xs px-4 py-2 rounded-lg shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-200" />
          <span>{saveBanner}</span>
        </div>
      )}

      {/* Critical Circuit Warnings / Errors Alert Bar */}
      {circuitErrors.length > 0 && (
        <div className="bg-rose-600/90 text-white text-xs px-4 py-1.5 flex items-center justify-between z-30 font-medium">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-200" />
            <span>{circuitErrors[0]}</span>
          </div>
          <span className="text-[10px] text-rose-200 underline cursor-pointer" onClick={() => setCircuitErrors([])}>
            Dismiss
          </span>
        </div>
      )}

      {/* Main Viewport Area */}
      <main className="flex-1 relative overflow-hidden flex">
        {/* TAB 1: 2D Schematic & Breadboard Canvas */}
        {activeTab === 'design' && (
          <CircuitCanvas2D
            components={components}
            wires={wires}
            selectedComponentId={selectedComponentId}
            selectedWireId={selectedWireId}
            activeWireColor={activeWireColor}
            onSelectComponent={setSelectedComponentId}
            onSelectWire={setSelectedWireId}
            onUpdateComponentPosition={handleUpdateComponentPosition}
            onRotateComponent={handleRotateComponent}
            onDeleteComponent={handleDeleteComponent}
            onDeleteWire={handleDeleteWire}
            onConnectPins={handleConnectPins}
            onTogglePushbutton={handleTogglePushbutton}
            oledLines={oledLines}
            simulationRunning={simulationRunning}
          />
        )}

        {/* TAB 2: 3D Realistic Circuit Studio */}
        {activeTab === '3d' && (
          <CircuitCanvas3D
            components={components}
            wires={wires}
            selectedComponentId={selectedComponentId}
            onSelectComponent={setSelectedComponentId}
            onConnectPin={(from, to) => handleConnectPins(from, to)}
            onTogglePushbutton={handleTogglePushbutton}
            oledLines={oledLines}
            simulationRunning={simulationRunning}
          />
        )}

        {/* TAB 3: Embedded Firmware Code Editor */}
        {activeTab === 'code' && (
          <CodeEditor
            code={code}
            onChangeCode={setCode}
            onRunSimulation={() => {
              setActiveTab('design');
              handleStartSimulation();
            }}
            onResetCode={() => setCode(DEFAULT_TEMPLATES[0].code)}
          />
        )}

        {/* Component Palette Library Drawer */}
        <ComponentLibrary
          isOpen={isComponentLibraryOpen}
          onClose={() => setIsComponentLibraryOpen(false)}
          onAddComponent={handleAddComponent}
        />

        {/* Component Property Inspector Panel */}
        <PropertyInspector
          component={selectedComponent}
          onUpdateProperties={handleUpdateProperties}
          onRotateComponent={handleRotateComponent}
          onDeleteComponent={handleDeleteComponent}
          onClose={() => setSelectedComponentId(null)}
        />
      </main>

      {/* Bottom Collapsible Serial Monitor Dock */}
      <SerialMonitor
        logs={serialLogs}
        onClearLogs={() => setSerialLogs([])}
        onSendCommand={(cmd) => {
          mcuRef.current?.logSerial(`> ${cmd}`, 'serial');
        }}
        isOpen={isSerialMonitorOpen}
        onToggle={() => setIsSerialMonitorOpen(!isSerialMonitorOpen)}
      />

      {/* Projects Manager Modal */}
      <ProjectsModal
        isOpen={isProjectsModalOpen}
        onClose={() => setIsProjectsModalOpen(false)}
        projects={savedProjects}
        templates={DEFAULT_TEMPLATES}
        onLoadProject={handleLoadProject}
        onCreateNew={handleCreateNewProject}
        onForkProject={handleForkProject}
        onDeleteProject={handleDeleteProject}
        onImportJson={handleLoadProject}
        currentProjectId={currentProject._id || currentProject.id}
      />

      {/* Bill of Materials (BOM) Modal */}
      <BOMModal
        isOpen={isBOMModalOpen}
        onClose={() => setIsBOMModalOpen(false)}
        components={components}
        wires={wires}
        projectName={currentProject.name}
      />
    </div>
  );
}
