'use client';

import React, { useState } from 'react';
import { ProjectData } from '../../types/circuit';
import {
  FolderOpen,
  Plus,
  Trash2,
  Copy,
  Download,
  Upload,
  Cpu,
  Sparkles,
  ExternalLink,
  Calendar,
  Layers
} from 'lucide-react';

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProjectData[];
  templates: ProjectData[];
  onLoadProject: (project: ProjectData) => void;
  onCreateNew: () => void;
  onForkProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onImportJson: (project: ProjectData) => void;
  currentProjectId?: string;
}

export const ProjectsModal: React.FC<ProjectsModalProps> = ({
  isOpen,
  onClose,
  projects,
  templates,
  onLoadProject,
  onCreateNew,
  onForkProject,
  onDeleteProject,
  onImportJson,
  currentProjectId
}) => {
  const [activeTab, setActiveTab] = useState<'templates' | 'saved'>('templates');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.components && Array.isArray(json.components)) {
          onImportJson(json);
          onClose();
        } else {
          alert('Invalid circuit project JSON file format.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 select-none">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="p-3 sm:p-4 bg-slate-800/80 border-b border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FolderOpen className="w-5 h-5 text-cyan-400 flex-shrink-0" />
              <div>
                <h2 className="text-sm font-bold text-white">Circuit Project Manager</h2>
                <p className="text-[11px] text-slate-400">Open starter templates or manage saved projects</p>
              </div>
            </div>
            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="sm:hidden text-slate-400 hover:text-white text-sm px-2.5 py-1 rounded hover:bg-slate-800"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Import JSON button */}
            <label className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer transition border border-slate-700 active:scale-95">
              <Upload className="w-3.5 h-3.5 text-cyan-400" /> Import JSON
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>

            {/* New Project button */}
            <button
              onClick={() => {
                onCreateNew();
                onClose();
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-cyan-900/40 transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" /> New Circuit
            </button>

            {/* Desktop close button */}
            <button
              onClick={onClose}
              className="hidden sm:inline-flex text-slate-400 hover:text-white text-sm px-2.5 py-1 rounded hover:bg-slate-800"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Headers */}
        <div className="flex border-b border-slate-800 px-3 sm:px-4 pt-2 bg-slate-900/60 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3 sm:px-4 py-2 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'templates'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Verified Demonstration Projects</span>
            <span className="sm:hidden">Templates</span>
            <span>({templates.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`px-3 sm:px-4 py-2 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'saved'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">My Saved Projects</span>
            <span className="sm:hidden">Saved</span>
            <span>({projects.length})</span>
          </button>
        </div>

        {/* Tab Content List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {activeTab === 'templates' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {templates.map((tmpl) => (
                <div
                  key={tmpl.id || tmpl._id}
                  className="p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/50 transition flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono uppercase bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800/50">
                        {tmpl.category || 'ESP32 IoT'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {tmpl.components?.length || 0} parts • {tmpl.wires?.length || 0} wires
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-white group-hover:text-cyan-300 transition">
                      {tmpl.name}
                    </h4>

                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-3">
                      {tmpl.description}
                    </p>

                    {tmpl.tags && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {tmpl.tags.map((t) => (
                          <span key={t} className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between">
                    <button
                      onClick={() => {
                        onLoadProject(tmpl);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg text-xs transition flex items-center gap-1.5 shadow"
                    >
                      <Cpu className="w-3.5 h-3.5" /> Open Project
                    </button>

                    <button
                      onClick={() => {
                        onForkProject(tmpl.id || tmpl._id || '');
                        onClose();
                      }}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-700 transition"
                      title="Clone as New Project"
                    >
                      <Copy className="w-3 h-3" /> Duplicate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="space-y-2">
              {projects.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No saved projects yet. Click &ldquo;New Circuit&rdquo; or save your current design!
                </div>
              ) : (
                projects.map((proj) => (
                  <div
                    key={proj._id || proj.id}
                    className="p-3 sm:p-3.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 transition"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-white flex items-center gap-2 truncate">
                        <span className="truncate">{proj.name}</span>
                        {(proj._id === currentProjectId || proj.id === currentProjectId) && (
                          <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.2 rounded flex-shrink-0">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                        {proj.description || 'Circuit schematic and firmware project'}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 flex flex-wrap items-center gap-2 sm:gap-3">
                        <span>{proj.components?.length || 0} Parts</span>
                        <span>{proj.wires?.length || 0} Wires</span>
                        {proj.updatedAt && (
                          <span>Modified: {new Date(proj.updatedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
                      <button
                        onClick={() => {
                          onLoadProject(proj);
                          onClose();
                        }}
                        className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition active:scale-95"
                      >
                        Load
                      </button>

                      <button
                        onClick={() => onForkProject(proj._id || proj.id || '')}
                        className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition"
                        title="Fork / Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDeleteProject(proj._id || proj.id || '')}
                        className="p-1.5 text-rose-400 hover:text-rose-300 rounded hover:bg-rose-950/50 transition"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

