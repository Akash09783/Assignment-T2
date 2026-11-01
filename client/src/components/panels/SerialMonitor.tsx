'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Trash2, Send, ChevronDown, ChevronUp, Clock, ArrowDown } from 'lucide-react';
import { MCULogEntry } from '../../lib/mcuEmulator';

interface SerialMonitorProps {
  logs: MCULogEntry[];
  onClearLogs: () => void;
  onSendCommand?: (cmd: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const SerialMonitor: React.FC<SerialMonitorProps> = ({
  logs,
  onClearLogs,
  onSendCommand,
  isOpen,
  onToggle
}) => {
  const [baudRate, setBaudRate] = useState<number>(115200);
  const [inputCmd, setInputCmd] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [showTimestamps, setShowTimestamps] = useState<boolean>(true);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && isOpen) {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCmd.trim()) return;
    if (onSendCommand) {
      onSendCommand(inputCmd);
    }
    setInputCmd('');
  };

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const mill = ms % 1000;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${mill.toString().padStart(3, '0')}`;
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-30 transition-all duration-300 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 shadow-2xl flex flex-col ${
        isOpen ? 'h-56' : 'h-9'
      }`}
    >
      {/* Top Header Bar */}
      <div className="h-9 px-4 flex items-center justify-between bg-slate-900/90 border-b border-slate-800/80 text-xs text-slate-300 select-none">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onToggle}>
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold text-slate-200">Serial Monitor</span>
          <span className="bg-slate-800 text-[10px] px-1.5 py-0.5 rounded text-slate-400 font-mono">
            {logs.length}
          </span>
          {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" /> : <ChevronUp className="w-3.5 h-3.5 text-slate-400 ml-1" />}
        </div>

        {isOpen && (
          <div className="flex items-center gap-3">
            {/* Baud rate */}
            <select
              value={baudRate}
              onChange={(e) => setBaudRate(parseInt(e.target.value))}
              className="bg-slate-800 text-slate-300 border border-slate-700 rounded px-2 py-0.5 text-[11px] focus:outline-none"
            >
              <option value={9600}>9600 baud</option>
              <option value={19200}>19200 baud</option>
              <option value={57600}>57600 baud</option>
              <option value={115200}>115200 baud</option>
            </select>

            {/* Auto-scroll toggle */}
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded transition ${
                autoScroll ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
              }`}
              title="Toggle Auto-Scroll"
            >
              <ArrowDown className="w-3 h-3" /> Auto-Scroll
            </button>

            {/* Timestamps toggle */}
            <button
              onClick={() => setShowTimestamps(!showTimestamps)}
              className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded transition ${
                showTimestamps ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
              }`}
              title="Toggle Timestamps"
            >
              <Clock className="w-3 h-3" /> Timestamps
            </button>

            {/* Clear button */}
            <button
              onClick={onClearLogs}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded hover:bg-slate-800 transition"
              title="Clear Terminal"
            >
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          </div>
        )}
      </div>

      {/* Terminal Output */}
      {isOpen && (
        <div className="flex-1 flex flex-col overflow-hidden bg-black/60 font-mono text-xs">
          <div className="flex-1 p-3 overflow-y-auto space-y-1 select-text">
            {logs.length === 0 ? (
              <div className="text-slate-600 italic text-[11px] pt-2">
                Serial port open at {baudRate} baud. Ready to stream data from MCU. Start simulation to inspect output.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="leading-relaxed flex items-start gap-2">
                  {showTimestamps && (
                    <span className="text-slate-500 text-[10px] select-none whitespace-nowrap">
                      [{formatTime(log.timestamp)}]
                    </span>
                  )}
                  <span
                    className={
                      log.level === 'warn'
                        ? 'text-amber-400'
                        : log.level === 'error'
                        ? 'text-rose-400 font-bold'
                        : log.level === 'info'
                        ? 'text-cyan-400'
                        : 'text-emerald-300'
                    }
                  >
                    {log.message}
                  </span>
                </div>
              ))
            )}
            <div ref={terminalEndRef} />
          </div>

          {/* Input Sender Bar */}
          <form onSubmit={handleSend} className="h-8 px-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
            <span className="text-slate-500 text-xs">&gt;</span>
            <input
              type="text"
              placeholder="Send message to MCU Serial..."
              value={inputCmd}
              onChange={(e) => setInputCmd(e.target.value)}
              className="flex-1 bg-transparent text-xs text-white focus:outline-none placeholder-slate-600 font-mono"
            />
            <button
              type="submit"
              className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white px-2.5 py-0.5 rounded flex items-center gap-1 transition"
            >
              <Send className="w-3 h-3" /> Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

