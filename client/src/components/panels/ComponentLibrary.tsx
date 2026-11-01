'use client';

import React, { useState } from 'react';
import { ComponentCategory } from '../../types/circuit';
import { COMPONENT_REGISTRY } from '../../lib/componentRegistry';
import {
  Cpu,
  Activity,
  Tv,
  Zap,
  ToggleLeft,
  Gauge,
  BatteryCharging,
  Search,
  Plus
} from 'lucide-react';

interface ComponentLibraryProps {
  onAddComponent: (type: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_TABS: Array<{ id: ComponentCategory | 'all'; label: string; icon: any }> = [
  { id: 'all', label: 'All', icon: Search },
  { id: 'microcontrollers', label: 'MCUs', icon: Cpu },
  { id: 'sensors', label: 'Sensors', icon: Activity },
  { id: 'displays', label: 'Displays', icon: Tv },
  { id: 'passives', label: 'Passives', icon: Zap },
  { id: 'switches', label: 'Switches', icon: ToggleLeft },
  { id: 'actuators', label: 'Motors', icon: Gauge },
  { id: 'power', label: 'Power', icon: BatteryCharging }
];

export const ComponentLibrary: React.FC<ComponentLibraryProps> = ({
  onAddComponent,
  isOpen,
  onClose
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ComponentCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const allComponents = Object.values(COMPONENT_REGISTRY);

  const filtered = allComponents.filter((comp) => {
    const matchesCategory = selectedCategory === 'all' || comp.category === selectedCategory;
    const matchesSearch =
      comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      {/* Mobile backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 sm:hidden"
        onClick={onClose}
      />

      <div className="fixed inset-x-2 bottom-2 z-40 sm:absolute sm:top-14 sm:left-4 sm:inset-x-auto sm:bottom-auto w-auto sm:w-80 max-h-[80vh] sm:max-h-[82vh] bg-slate-900/98 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center gap-2 text-cyan-400">
            <Zap className="w-4 h-4" /> Component Palette
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded-md hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-2 border-b border-slate-800">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search sensors, MCUs, LEDs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 text-xs text-white pl-8 pr-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-1 p-2 overflow-x-auto border-b border-slate-800 scrollbar-none touch-pan-x">
          {CATEGORY_TABS.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-md whitespace-nowrap transition active:scale-95 ${
                  selectedCategory === cat.id
                    ? 'bg-cyan-500 text-white font-medium shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-3 h-3" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Components Grid */}
        <div className="p-3 overflow-y-auto space-y-2 flex-1 max-h-[500px]">
          {filtered.map((comp) => (
            <div
              key={comp.type}
              onClick={() => {
                onAddComponent(comp.type);
                // On mobile, auto close on add
                if (window.innerWidth < 640) {
                  onClose();
                }
              }}
              className="group p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-cyan-500/50 cursor-pointer transition flex items-start justify-between gap-2 active:scale-[0.98]"
            >
              <div>
                <div className="text-xs font-semibold text-white group-hover:text-cyan-300 transition">
                  {comp.name}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                  {comp.description}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 uppercase font-mono">
                  {comp.pins.length} Pins • {comp.category}
                </div>
              </div>

              <button
                title="Add to canvas"
                className="mt-1 p-1.5 bg-cyan-500/10 text-cyan-400 rounded-md group-hover:bg-cyan-500 group-hover:text-white transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="p-6 text-center text-xs text-slate-500">
              No electronic components found matching &ldquo;{searchQuery}&rdquo;.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

