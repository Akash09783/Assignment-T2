'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { PlacedComponent, ProjectData } from '../types/circuit';
import { DEFAULT_TEMPLATES } from '../lib/defaultTemplates';
import { DEFAULT_WIRE_COLOR } from '../constants/wireColors';

import { useCircuitProject } from '../hooks/useCircuitProject';
import { useSimulation } from '../hooks/useSimulation';
import { useProjectsApi } from '../hooks/useProjectsApi';

import { TopNavbar } from '../components/ui/TopNavbar';
import { CircuitCanvas2D } from '../components/2d/CircuitCanvas2D';
import { CircuitCanvas3D } from '../components/3d/CircuitCanvas3D';
import { CodeEditor } from '../components/editor/CodeEditor';
import { ComponentLibrary } from '../components/panels/ComponentLibrary';
import { PropertyInspector } from '../components/panels/PropertyInspector';
import { SerialMonitor } from '../components/panels/SerialMonitor';
import { ProjectsModal } from '../components/panels/ProjectsModal';
import { BOMModal } from '../components/panels/BOMModal';

import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function CircuitSimulatorPage() {
  // 1. View Navigation & Tool States
  const [activeTab, setActiveTab] = useState<'design' | '3d' | 'code' | 'bom'>('design');
  const [activeWireColor, setActiveWireColor] = useState<string>(DEFAULT_WIRE_COLOR);

  // Panel toggles
  const [isComponentLibraryOpen, setIsComponentLibraryOpen] = useState<boolean>(false);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState<boolean>(false);
  const [isBOMModalOpen, setIsBOMModalOpen] = useState<boolean>(false);
  const [isSerialMonitorOpen, setIsSerialMonitorOpen] = useState<boolean>(false);

  // Responsive default: Open Serial Monitor on desktop screens only
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setIsSerialMonitorOpen(true);
    }
  }, []);

  // 2. Circuit Project Hook (Components, Wires, Firmware, Placement)
  const {
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
  } = useCircuitProject(DEFAULT_TEMPLATES[0]);

  // 3. Simulation Engine Hook (Clock, Netlist Solver, Firmware Runner, Audio)
  const handleUpdateComponentsState = useCallback((updated: PlacedComponent[]) => {
    setComponents(updated);
  }, [setComponents]);

  const {
    isRunning: simulationRunning,
    isPaused: simulationPaused,
    timeSeconds: simulationTime,
    speed: simulationSpeed,
    setSpeed: setSimulationSpeed,
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
  } = useSimulation({
    components,
    wires,
    code,
    onUpdateComponentsState: handleUpdateComponentsState
  });

  // 4. Persistence & API Hook (MongoDB REST API & Storage)
  const {
    savedProjects,
    isSaving,
    toastMessage,
    saveCurrentProject,
    forkExisting,
    deleteExisting,
    exportProjectJson,
    shareProject
  } = useProjectsApi();

  // Selected component resolution
  const selectedComponent = components.find(c => c.id === selectedComponentId) || null;

  // Handlers bridging hooks
  const handleProjectLoad = (loaded: ProjectData) => {
    stopSimulation();
    loadProject(loaded);
  };

  const handleCreateNew = () => {
    stopSimulation();
    createNewProject();
  };

  const handleSave = async () => {
    const saved = await saveCurrentProject(project, components, wires, code);
    if (saved) {
      setProject(saved);
    }
  };

  const handleFork = async (id: string) => {
    const cloned = await forkExisting(id);
    if (cloned) {
      handleProjectLoad(cloned);
    }
  };

  const handleTabChange = (tab: 'design' | '3d' | 'code' | 'bom') => {
    if (tab === 'bom') {
      setIsBOMModalOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full min-h-[100dvh] overflow-hidden bg-slate-950 font-sans select-none">
      {/* Top Cirkit-style Navbar */}
      <TopNavbar
        projectName={project.name}
        onChangeProjectName={(name) => setProject(p => ({ ...p, name }))}
        activeTab={activeTab}
        onChangeTab={handleTabChange}
        simulationRunning={simulationRunning}
        simulationPaused={simulationPaused}
        simulationTime={simulationTime}
        simulationSpeed={simulationSpeed}
        onStartSimulation={startSimulation}
        onPauseSimulation={pauseSimulation}
        onStopSimulation={stopSimulation}
        onResetSimulation={resetSimulation}
        onChangeSpeed={setSimulationSpeed}
        activeWireColor={activeWireColor}
        onChangeWireColor={setActiveWireColor}
        onOpenComponentLibrary={() => setIsComponentLibraryOpen(!isComponentLibraryOpen)}
        onOpenProjectsModal={() => setIsProjectsModalOpen(true)}
        onOpenBOMModal={() => setIsBOMModalOpen(true)}
        onSaveProject={handleSave}
        onExportJSON={() => exportProjectJson(project, components, wires, code)}
        onShareProject={() => shareProject(project)}
        isSaving={isSaving}
      />

      {/* Floating Status Notification Toast */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 bg-emerald-600/95 text-white text-xs px-4 py-2 rounded-lg shadow-2xl flex items-center gap-2 animate-bounce max-w-[90vw] text-center">
          <CheckCircle className="w-4 h-4 text-emerald-200 flex-shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* Circuit Diagnostics Alert Banner */}
      {circuitErrors.length > 0 && (
        <div className="bg-rose-600/95 text-white text-xs px-3 sm:px-4 py-1.5 flex items-center justify-between z-30 font-medium flex-shrink-0">
          <div className="flex items-center gap-2 truncate pr-2">
            <AlertTriangle className="w-4 h-4 text-rose-200 flex-shrink-0" />
            <span className="truncate">{circuitErrors[0]}</span>
          </div>
          <button
            className="text-[10px] text-rose-200 underline cursor-pointer flex-shrink-0"
            onClick={() => setCircuitErrors([])}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Viewport Workspace */}
      <main className="flex-1 relative overflow-hidden flex">
        {/* VIEW 1: 2D Schematic & Breadboard Canvas */}
        {activeTab === 'design' && (
          <CircuitCanvas2D
            components={components}
            wires={wires}
            selectedComponentId={selectedComponentId}
            selectedWireId={selectedWireId}
            activeWireColor={activeWireColor}
            onSelectComponent={setSelectedComponentId}
            onSelectWire={setSelectedWireId}
            onUpdateComponentPosition={updateComponentPosition}
            onRotateComponent={rotateComponent}
            onDeleteComponent={deleteComponent}
            onDeleteWire={deleteWire}
            onConnectPins={(from, to) => connectPins(from, to, activeWireColor)}
            onTogglePushbutton={togglePushbutton}
            oledLines={oledLines}
            simulationRunning={simulationRunning}
          />
        )}

        {/* VIEW 2: 3D Realistic Circuit Studio (Three.js WebGL) */}
        {activeTab === '3d' && (
          <CircuitCanvas3D
            components={components}
            wires={wires}
            selectedComponentId={selectedComponentId}
            onSelectComponent={setSelectedComponentId}
            onConnectPin={(from, to) => connectPins(from, to, activeWireColor)}
            onTogglePushbutton={togglePushbutton}
            oledLines={oledLines}
            simulationRunning={simulationRunning}
          />
        )}

        {/* VIEW 3: Embedded Firmware Code Editor */}
        {activeTab === 'code' && (
          <CodeEditor
            code={code}
            onChangeCode={setCode}
            onRunSimulation={() => {
              setActiveTab('design');
              startSimulation();
            }}
            onResetCode={() => setCode(DEFAULT_TEMPLATES[0].code)}
          />
        )}

        {/* Drawer: Component Palette Library */}
        <ComponentLibrary
          isOpen={isComponentLibraryOpen}
          onClose={() => setIsComponentLibraryOpen(false)}
          onAddComponent={addComponent}
        />

        {/* Inspector: Component Properties Panel */}
        <PropertyInspector
          component={selectedComponent}
          onUpdateProperties={updateComponentProperties}
          onRotateComponent={rotateComponent}
          onDeleteComponent={deleteComponent}
          onClose={() => setSelectedComponentId(null)}
        />
      </main>

      {/* Bottom Collapsible Serial Monitor Dock */}
      <SerialMonitor
        logs={serialLogs}
        onClearLogs={clearLogs}
        onSendCommand={sendCommand}
        isOpen={isSerialMonitorOpen}
        onToggle={() => setIsSerialMonitorOpen(!isSerialMonitorOpen)}
      />

      {/* Modal: Projects Manager */}
      <ProjectsModal
        isOpen={isProjectsModalOpen}
        onClose={() => setIsProjectsModalOpen(false)}
        projects={savedProjects}
        templates={DEFAULT_TEMPLATES}
        onLoadProject={handleProjectLoad}
        onCreateNew={handleCreateNew}
        onForkProject={handleFork}
        onDeleteProject={deleteExisting}
        onImportJson={handleProjectLoad}
        currentProjectId={project._id || project.id}
      />

      {/* Modal: Bill of Materials (BOM) */}
      <BOMModal
        isOpen={isBOMModalOpen}
        onClose={() => setIsBOMModalOpen(false)}
        components={components}
        wires={wires}
        projectName={project.name}
      />
    </div>
  );
}
