'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Square,
  Pause,
  RotateCcw,
  FolderOpen,
  Save,
  Share2,
  Download,
  Plus,
  Box,
  Layout,
  Code,
  Layers,
  Zap,
  Check,
  ChevronDown,
  MoreHorizontal,
  X,
  Gauge,
  Palette
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const wireMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (wireMenuRef.current && !wireMenuRef.current.contains(target)) {
        setShowWireColorMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

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
    <header className="bg-slate-900 border-b border-slate-800 select-none text-slate-100 z-40 relative shadow-md flex-shrink-0">
      {/* Primary Top Bar */}
      <div className="h-14 px-2.5 sm:px-4 flex items-center justify-between gap-2">
        {/* Left: Brand + Project Title + (Desktop Navigation Tabs) */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0">
          {/* Brand Logo */}
          <div className="flex items-center gap-1.5 sm:gap-2 pr-1 sm:pr-2 border-r border-slate-800 flex-shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-900/40">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="font-extrabold text-xs sm:text-sm tracking-tight text-white hidden xs:inline">
              Circuit<span className="text-cyan-400">3D</span>
            </span>
          </div>

          {/* Project Title (Editable on Click) */}
          <div className="flex items-center min-w-0">
            {isEditingTitle ? (
              <form onSubmit={handleTitleSubmit} className="min-w-0">
                <input
                  type="text"
                  value={titleInput}
                  autoFocus
                  onBlur={handleTitleSubmit}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="bg-slate-800 border border-cyan-500 rounded px-2 py-0.5 text-xs text-white font-semibold focus:outline-none w-24 sm:w-36 md:w-44"
                />
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setTitleInput(projectName);
                  setIsEditingTitle(true);
                }}
                title="Click to rename project"
                className="text-xs font-semibold text-slate-200 hover:text-white px-1.5 py-1 rounded hover:bg-slate-800/80 cursor-pointer transition max-w-[90px] xs:max-w-[130px] sm:max-w-[160px] md:max-w-[200px] truncate text-left"
              >
                {projectName}
              </button>
            )}
          </div>

          {/* Desktop Navigation Tabs (Hidden on mobile / tablet < lg) */}
          <nav className="hidden lg:flex items-center bg-slate-950/70 p-1 rounded-xl border border-slate-800">
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

        {/* Center: Simulation Control Center */}
        <div className="flex items-center gap-1 sm:gap-2 bg-slate-950/80 px-2 sm:px-3 py-1 rounded-xl border border-slate-800 shadow-inner flex-shrink-0">
          {/* Simulation Timer */}
          <div className="font-mono text-[11px] sm:text-xs font-bold text-cyan-400 px-1 sm:px-1.5 min-w-[65px] sm:min-w-[75px] text-center">
            {formatSimTime(simulationTime)}
          </div>

          {/* Start / Pause Button */}
          {!simulationRunning || simulationPaused ? (
            <button
              onClick={onStartSimulation}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-900/40 transition active:scale-95"
              title={simulationPaused ? 'Resume Simulation' : 'Start Simulation'}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">{simulationPaused ? 'Resume' : 'Start Simulation'}</span>
            </button>
          ) : (
            <button
              onClick={onPauseSimulation}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shadow transition active:scale-95"
              title="Pause Simulation"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Pause</span>
            </button>
          )}

          {/* Stop Button */}
          {simulationRunning && (
            <button
              onClick={onStopSimulation}
              className="p-1 sm:p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition active:scale-95"
              title="Stop Simulation"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          )}

          {/* Reset Simulation Button (Desktop/Tablet) */}
          <button
            onClick={onResetSimulation}
            className="hidden sm:inline-flex p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="Reset Simulation Clock & Components"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Simulation Speed Multiplier (Desktop) */}
          <select
            value={simulationSpeed}
            onChange={(e) => onChangeSpeed(parseFloat(e.target.value))}
            className="hidden md:block bg-slate-800 text-[11px] text-slate-300 border border-slate-700 rounded px-1.5 py-0.5 focus:outline-none"
            title="Simulation Speed"
          >
            <option value={0.5}>0.5x</option>
            <option value={1.0}>1.0x</option>
            <option value={2.0}>2.0x</option>
          </select>
        </div>

        {/* Right: Tools & Actions */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Add Component Button */}
          <button
            onClick={onOpenComponentLibrary}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-600/30 rounded-lg text-xs font-semibold transition active:scale-95"
            title="Add Electronics Component"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Part</span>
          </button>

          {/* Wire Color Selector Popover (Hidden on smallest mobile, accessible via More Menu) */}
          <div className="relative hidden md:block" ref={wireMenuRef}>
            <button
              onClick={() => setShowWireColorMenu(!showWireColorMenu)}
              className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs transition"
              title="Select Jumper Wire Color"
            >
              <div
                className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm"
                style={{ backgroundColor: activeWireColor }}
              />
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showWireColorMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 space-y-1">
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
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded text-xs hover:bg-slate-800 text-slate-200 transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: w.hex }} />
                      <span className="text-[11px]">{w.name}</span>
                    </div>
                    {activeWireColor === w.hex && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Projects Library Button (Desktop) */}
          <button
            onClick={onOpenProjectsModal}
            className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs transition border border-slate-700"
            title="Open Project Manager"
          >
            <FolderOpen className="w-3.5 h-3.5 text-cyan-400" /> Projects
          </button>

          {/* Save Button */}
          <button
            onClick={onSaveProject}
            disabled={isSaving}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow transition active:scale-95"
            title="Save Project"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
          </button>

          {/* Export Button (Desktop) */}
          <button
            onClick={onExportJSON}
            className="hidden lg:inline-flex p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition border border-slate-700"
            title="Export Project File (.json)"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Share Button (Desktop) */}
          <button
            onClick={onShareProject}
            className="hidden lg:inline-flex p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition border border-slate-700"
            title="Share Project URL"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          {/* Responsive Overflow "More" Button (Mobile & Tablet) */}
          <div className="relative lg:hidden" ref={mobileMenuRef}>
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition border border-slate-700"
              title="More Actions & Settings"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {/* Mobile / Tablet Overflow Menu */}
            {showMobileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900/98 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl p-3 z-50 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Quick Actions</span>
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className="p-1 text-slate-400 hover:text-white rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Wire Color Picker Row */}
                <div>
                  <div className="text-[10px] font-bold text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <Palette className="w-3 h-3 text-cyan-400" /> Active Wire Color:
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {WIRE_COLORS.map((w) => (
                      <button
                        key={w.hex}
                        onClick={() => {
                          onChangeWireColor(w.hex);
                        }}
                        className={`flex items-center justify-center py-1.5 rounded-lg border transition ${
                          activeWireColor === w.hex ? 'border-cyan-400 bg-slate-800 ring-1 ring-cyan-400' : 'border-slate-800 bg-slate-800/60 hover:bg-slate-800'
                        }`}
                        title={w.name}
                      >
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: w.hex }} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Simulation Speed & Reset (Mobile) */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <Gauge className="w-3.5 h-3.5 text-cyan-400" /> Speed:
                  </div>
                  <div className="flex items-center gap-1">
                    {[0.5, 1.0, 2.0].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => onChangeSpeed(spd)}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${
                          simulationSpeed === spd
                            ? 'bg-cyan-600 text-white font-bold'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reset Clock button on mobile */}
                <button
                  onClick={() => {
                    onResetSimulation();
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" /> Reset Simulation Clock
                </button>

                {/* Projects Manager */}
                <button
                  onClick={() => {
                    onOpenProjectsModal();
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-cyan-400" /> Projects Manager
                </button>

                {/* Export JSON */}
                <button
                  onClick={() => {
                    onExportJSON();
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" /> Export Project (.json)
                </button>

                {/* Share Project */}
                <button
                  onClick={() => {
                    onShareProject();
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                >
                  <Share2 className="w-3.5 h-3.5 text-blue-400" /> Share Project Link
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Mobile & Tablet Navigation Tab Strip (< lg) */}
      <div className="lg:hidden px-2 pb-2 pt-1 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between gap-1 overflow-x-auto scrollbar-none">
        <button
          onClick={() => onChangeTab('design')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 text-xs font-medium rounded-lg transition whitespace-nowrap ${
            activeTab === 'design'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Layout className="w-3.5 h-3.5" />
          <span>2D Canvas</span>
        </button>

        <button
          onClick={() => onChangeTab('3d')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 text-xs font-medium rounded-lg transition whitespace-nowrap ${
            activeTab === '3d'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span>3D Studio</span>
        </button>

        <button
          onClick={() => onChangeTab('code')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 text-xs font-medium rounded-lg transition whitespace-nowrap ${
            activeTab === 'code'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>Firmware</span>
        </button>

        <button
          onClick={onOpenBOMModal}
          className="flex-1 flex items-center justify-center gap-1.5 py-1 px-2 text-xs font-medium rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition whitespace-nowrap"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>BOM</span>
        </button>
      </div>
    </header>
  );
};
