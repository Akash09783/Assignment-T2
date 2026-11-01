'use client';

import React, { useState } from 'react';
import {
  Play,
  Square,
  Pause,
  RotateCcw,
  FastForward,
  FolderOpen,
  Save,
  Share2,
  Download,
  Plus,
  Box,
  Layout,
  Code,
  Layers,
  Sparkles,
  Zap,
  Check,
  ChevronDown
} from 'lucide-react';

interface TopNavbarProps {
  projectName: string;
  onChangeProjectName: (name: string) => void;
  activeTab: 'design' | '3d' | 'code' | 'bom';
  onChangeTab: (tab: 'design' | '3d' | 'code' | 'bom') => void;
  simulationRunning: boolean;
  simulationPaused: boolean;
  simulationTime: number;
  simulationSpeed: number;
  onStartSimulation: () => void;
  onPauseSimulation: () => void;
  onStopSimulation: () => void;
  onResetSimulation: () => void;
  onChangeSpeed: (spd: number) => void;
  activeWireColor: string;
  onChangeWireColor: (color: string) => void;
  onOpenComponentLibrary: () => void;
  onOpenProjectsModal: () => void;
  onOpenBOMModal: () => void;
  onSaveProject: () => void;
  onExportJSON: () => void;
  onShareProject: () => void;
  isSaving?: boolean;
}

const WIRE_COLORS = [
  { name: 'Red (+VCC)', hex: '#ef4444' },
  { name: 'Black (GND)', hex: '#1e293b' },
  { name: 'Blue (SDA/Signal)', hex: '#3b82f6' },
  { name: 'Purple (SCL)', hex: '#a855f7' },
  { name: 'Green (Output)', hex: '#10b981' },
  { name: 'Yellow (Data)', hex: '#eab308' },
  { name: 'Orange (PWM)', hex: '#f97316' },
  { name: 'White', hex: '#f8fafc' }
];

export const TopNavbar: React.FC<TopNavbarProps> = ({
  projectName,
  onChangeProjectName,
  activeTab,
  onChangeTab,
  simulationRunning,
  simulationPaused,
  simulationTime,
  simulationSpeed,
  onStartSimulation,
  onPauseSimulation,
  onStopSimulation,
  onResetSimulation,
  onChangeSpeed,
  activeWireColor,
  onChangeWireColor,
  onOpenComponentLibrary,
  onOpenProjectsModal,
  onOpenBOMModal,
  onSaveProject,
  onExportJSON,
  onShareProject,
  isSaving = false
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(projectName);
  const [showWireColorMenu, setShowWireColorMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (titleInput.trim()) {
      onChangeProjectName(titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  const formatSimTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec * 1000) % 1000);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between select-none text-slate-100 z-40 relative shadow-md">
      {/* Left: Brand + Project Title + Navigation Tabs */}
      <div className="flex items-center gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-2 pr-2 border-r border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-900/40">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-white hidden sm:inline">
            Circuit<span className="text-cyan-400">3D</span>
          </span>
        </div>

        {/* Project Title (Editable on Click) */}
        <div className="flex items-center">
          {isEditingTitle ? (
            <form onSubmit={handleTitleSubmit}>
              <input
                type="text"
                value={titleInput}
                autoFocus
                onBlur={handleTitleSubmit}
                onChange={(e) => setTitleInput(e.target.value)}
                className="bg-slate-800 border border-cyan-500 rounded px-2 py-0.5 text-xs text-white font-semibold focus:outline-none"
              />
            </form>
          ) : (
            <div
              onClick={() => {
                setTitleInput(projectName);
                setIsEditingTitle(true);
              }}
              title="Click to rename project"
              className="text-xs font-semibold text-slate-200 hover:text-white px-2 py-1 rounded hover:bg-slate-800/80 cursor-pointer transition max-w-[200px] truncate"
            >
              {projectName}
            </div>
          )}
        </div>

        {/* Navigation Tabs (Design | 3D Studio | Code | BOM) */}
        <nav className="flex items-center bg-slate-950/70 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onChangeTab('design')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition ${
              activeTab === 'design'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Layout className="w-3.5 h-3.5" /> 2D Canvas
          </button>

          <button
            onClick={() => onChangeTab('3d')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition ${
              activeTab === '3d'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Box className="w-3.5 h-3.5" /> 3D Studio
          </button>

          <button
            onClick={() => onChangeTab('code')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition ${
              activeTab === 'code'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Code className="w-3.5 h-3.5" /> Firmware Code
          </button>

          <button
            onClick={onOpenBOMModal}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <Layers className="w-3.5 h-3.5" /> BOM
          </button>
        </nav>
      </div>

      {/* Center: Interactive Simulation Control Center */}
      <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1 rounded-xl border border-slate-800 shadow-inner">
        {/* Simulation Timer */}
        <div className="font-mono text-xs font-bold text-cyan-400 px-2 min-w-[75px] text-center">
          {formatSimTime(simulationTime)}
        </div>

        {/* Start / Pause Button */}
        {!simulationRunning || simulationPaused ? (
          <button
            onClick={onStartSimulation}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-900/40 transition"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {simulationPaused ? 'Resume' : 'Start Simulation'}
          </button>
        ) : (
          <button
            onClick={onPauseSimulation}
            className="flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shadow transition"
          >
            <Pause className="w-3.5 h-3.5 fill-current" /> Pause
          </button>
        )}

        {/* Stop Button */}
        {simulationRunning && (
          <button
            onClick={onStopSimulation}
            className="p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition"
            title="Stop Simulation"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>
        )}

        {/* Reset Simulation Button */}
        <button
          onClick={onResetSimulation}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          title="Reset Simulation Clock & Components"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Simulation Speed Multiplier */}
        <select
          value={simulationSpeed}
          onChange={(e) => onChangeSpeed(parseFloat(e.target.value))}
          className="bg-slate-800 text-[11px] text-slate-300 border border-slate-700 rounded px-1.5 py-0.5 focus:outline-none"
        >
          <option value={0.5}>0.5x</option>
          <option value={1.0}>1.0x</option>
          <option value={2.0}>2.0x</option>
        </select>
      </div>

      {/* Right: Tools & Actions (Add Part, Wire Color, Projects, Save, Export, Share) */}
      <div className="flex items-center gap-2">
        {/* Add Component Button */}
        <button
          onClick={onOpenComponentLibrary}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-600/30 rounded-lg text-xs font-semibold transition"
        >
          <Plus className="w-3.5 h-3.5" /> Add Part
        </button>

        {/* Wire Color Selector Popover */}
        <div className="relative">
          <button
            onClick={() => setShowWireColorMenu(!showWireColorMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs transition"
            title="Select Jumper Wire Color"
          >
            <div
              className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm"
              style={{ backgroundColor: activeWireColor }}
            />
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showWireColorMenu && (
            <div className="absolute right-0 mt-2 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 space-y-1">
              <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                Wire Color
              </div>
              {WIRE_COLORS.map((w) => (
                <button
                  key={w.hex}
                  onClick={() => {
                    onChangeWireColor(w.hex);
                    setShowWireColorMenu(false);
                  }}
                  className="w-full flex items-center justify-between px-2 py-1 rounded text-xs hover:bg-slate-800 text-slate-200 transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: w.hex }} />
                    <span className="text-[11px]">{w.name}</span>
                  </div>
                  {activeWireColor === w.hex && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Projects Library Button */}
        <button
          onClick={onOpenProjectsModal}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs transition border border-slate-700"
          title="Open Project Manager"
        >
          <FolderOpen className="w-3.5 h-3.5 text-cyan-400" /> Projects
        </button>

        {/* Save Button */}
        <button
          onClick={onSaveProject}
          disabled={isSaving}
          className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow transition"
        >
          <Save className="w-3.5 h-3.5" /> {isSaving ? 'Saving...' : 'Save'}
        </button>

        {/* Export Button */}
        <button
          onClick={onExportJSON}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition border border-slate-700"
          title="Export Project File (.json)"
        >
          <Download className="w-3.5 h-3.5" />
        </button>

        {/* Share Button */}
        <button
          onClick={onShareProject}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition border border-slate-700"
          title="Share Project URL"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};

