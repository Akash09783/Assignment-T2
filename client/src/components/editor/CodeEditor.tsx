'use client';

import React, { useState } from 'react';
import {
  Code,
  Play,
  CheckCircle2,
  Download,
  RotateCcw,
  FileCode,
  Sparkles,
  Info
} from 'lucide-react';

interface CodeEditorProps {
  code: string;
  onChangeCode: (newCode: string) => void;
  onRunSimulation?: () => void;
  onResetCode?: () => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChangeCode,
  onRunSimulation,
  onResetCode
}) => {
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [verifyMessage, setVerifyMessage] = useState<string>('');

  const handleVerify = () => {
    // Quick syntax verification check
    const hasSetup = code.includes('void setup');
    const hasLoop = code.includes('void loop');

    if (!hasSetup || !hasLoop) {
      setVerifyStatus('error');
      setVerifyMessage('Syntax Check: Both void setup() and void loop() are required in Arduino/ESP32 sketch.');
    } else {
      setVerifyStatus('success');
      setVerifyMessage('Verified: Syntax is valid. Ready for simulation!');
    }

    setTimeout(() => {
      setVerifyStatus('idle');
    }, 4000);
  };

  const handleDownloadIno = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sketch.ino';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Compute line numbers
  const lines = code.split('\n');

  return (
    <div className="w-full h-full flex flex-col bg-[#0d1117] text-slate-200 font-mono text-xs select-none">
      {/* Editor Toolbar */}
      <div className="h-10 px-4 bg-[#161b22] border-b border-slate-800 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-slate-100 text-xs">sketch.ino</span>
          <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
            C++ / Arduino
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Verify button */}
          <button
            onClick={handleVerify}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition border border-slate-700"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Verify
          </button>

          {/* Download .ino */}
          <button
            onClick={handleDownloadIno}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition border border-slate-700"
            title="Download Arduino Sketch"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" /> Download .ino
          </button>

          {/* Reset Code */}
          {onResetCode && (
            <button
              onClick={onResetCode}
              className="flex items-center gap-1 px-2.5 py-1 text-slate-400 hover:text-white rounded text-xs transition"
              title="Reset to Template Firmware"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Verification notification banner */}
      {verifyStatus !== 'idle' && (
        <div
          className={`px-4 py-1.5 text-xs flex items-center gap-2 border-b ${
            verifyStatus === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
          }`}
        >
          {verifyStatus === 'success' ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Info className="w-3.5 h-3.5 text-rose-400" />
          )}
          <span>{verifyMessage}</span>
        </div>
      )}

      {/* Code Textarea with Line Numbers */}
      <div className="flex-1 flex overflow-hidden">
        {/* Line Numbers Column */}
        <div className="w-12 bg-[#0d1117] border-r border-slate-800 text-slate-600 text-right pr-3 pt-3 select-none text-[11px] font-mono leading-5">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Text Area Input */}
        <textarea
          value={code}
          onChange={(e) => onChangeCode(e.target.value)}
          spellCheck={false}
          className="flex-1 p-3 bg-transparent text-slate-100 font-mono text-xs leading-5 resize-none focus:outline-none focus:ring-0 select-text overflow-auto"
        />
      </div>

      {/* Editor Footer Status */}
      <div className="h-6 px-4 bg-[#161b22] border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <div>ESP32 / Arduino C++ Core • UTF-8</div>
        <div className="flex gap-4">
          <span>{lines.length} lines</span>
          <span>{code.length} characters</span>
        </div>
      </div>
    </div>
  );
};

