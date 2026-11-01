'use client';

import React from 'react';
import { PlacedComponent, Wire } from '../../types/circuit';
import { COMPONENT_REGISTRY } from '../../lib/componentRegistry';
import { Download, Layers, CheckCircle } from 'lucide-react';

interface BOMModalProps {
  isOpen: boolean;
  onClose: () => void;
  components: PlacedComponent[];
  wires: Wire[];
  projectName: string;
}

export const BOMModal: React.FC<BOMModalProps> = ({
  isOpen,
  onClose,
  components,
  wires,
  projectName
}) => {
  if (!isOpen) return null;

  // Aggregate components by type and properties
  const bomMap: Record<string, { name: string; type: string; count: number; details: string; category: string }> = {};

  components.forEach((c) => {
    const meta = COMPONENT_REGISTRY[c.type];
    const key = `${c.type}_${c.properties?.resistance || c.properties?.color || ''}`;
    let details = '';

    if (c.type === 'resistor') {
      details = `${c.properties?.resistance || 220} Ω (1/4W 5%)`;
    } else if (c.type === 'led') {
      details = `5mm Diffused (${c.properties?.color || 'Red'})`;
    } else if (c.type === 'esp32') {
      details = 'DevKit V1 (30-pin, 240MHz, 4MB Flash)';
    } else if (c.type === 'dht22') {
      details = 'AM2302 Digital Temperature & Humidity';
    } else if (c.type === 'oled-ssd1306') {
      details = '0.96" I2C Monochrome 128x64 OLED (0x3C)';
    } else if (c.type === 'breadboard-half') {
      details = '400 Tie-Point Solderless Breadboard';
    } else if (c.type === 'pushbutton') {
      details = '6x6mm Momentary Tactile Switch';
    } else if (c.type === 'servo-sg90') {
      details = '9g Micro RC Positional Servo (0-180°)';
    } else if (c.type === 'potentiometer') {
      details = '10kΩ Rotary Potentiometer';
    } else {
      details = meta?.description || '';
    }

    if (!bomMap[key]) {
      bomMap[key] = {
        name: meta?.name || c.name,
        type: c.type,
        count: 0,
        details,
        category: meta?.category || 'General'
      };
    }
    bomMap[key].count += 1;
  });

  const bomItems = Object.values(bomMap);

  const handleExportCSV = () => {
    let csv = 'Item,Component Name,Category,Quantity,Specification\n';
    bomItems.forEach((item, index) => {
      csv += `${index + 1},"${item.name}","${item.category}",${item.count},"${item.details}"\n`;
    });
    csv += `${bomItems.length + 1},"Jumper Connecting Wires","Wiring",${wires.length},"Flexible Male-to-Male jumper leads"\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName.toLowerCase().replace(/\s+/g, '_')}_BOM.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[80vh] overflow-hidden text-slate-100">
        <div className="p-3 sm:p-4 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Layers className="w-5 h-5 text-cyan-400 flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-white truncate">Bill of Materials (BOM)</h3>
              <p className="text-[11px] text-slate-400 truncate">{projectName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Export </span>CSV
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-sm px-2.5 py-1 rounded hover:bg-slate-800"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-4 overflow-y-auto flex-1">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[460px] text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-[11px] font-semibold">
                  <th className="pb-2 w-12">Qty</th>
                  <th className="pb-2">Part Name</th>
                  <th className="pb-2">Category</th>
                  <th className="pb-2">Specifications</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                {bomItems.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-800/40">
                    <td className="py-2.5 font-bold text-cyan-400">{item.count}x</td>
                    <td className="py-2.5 font-sans font-medium text-white">{item.name}</td>
                    <td className="py-2.5 text-slate-400 text-[10px] uppercase">{item.category}</td>
                    <td className="py-2.5 text-slate-300 font-sans">{item.details}</td>
                  </tr>
                ))}
                <tr className="hover:bg-slate-800/40 font-mono">
                  <td className="py-2.5 font-bold text-cyan-400">{wires.length}x</td>
                  <td className="py-2.5 font-sans font-medium text-white">Jumper Connecting Wires</td>
                  <td className="py-2.5 text-slate-400 text-[10px] uppercase">Wiring</td>
                  <td className="py-2.5 text-slate-300 font-sans">Multi-color point-to-point interconnects</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

