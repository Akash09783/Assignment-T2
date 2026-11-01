'use client';

import React from 'react';
import { PlacedComponent } from '../../types/circuit';
import { COMPONENT_REGISTRY, getResistorColorBands } from '../../lib/componentRegistry';
import {
  Sliders,
  Trash2,
  RotateCw,
  Sparkles,
  Thermometer,
  Droplets,
  Activity,
  AlertTriangle,
  Info
} from 'lucide-react';

interface PropertyInspectorProps {
  component: PlacedComponent | null;
  onUpdateProperties: (id: string, newProps: Record<string, any>) => void;
  onRotateComponent: (id: string) => void;
  onDeleteComponent: (id: string) => void;
  onClose: () => void;
}

export const PropertyInspector: React.FC<PropertyInspectorProps> = ({
  component,
  onUpdateProperties,
  onRotateComponent,
  onDeleteComponent,
  onClose
}) => {
  if (!component) return null;

  const meta = COMPONENT_REGISTRY[component.type];
  const props = component.properties || {};

  const handlePropChange = (key: string, value: any) => {
    onUpdateProperties(component.id, {
      ...props,
      [key]: value
    });
  };

  return (
    <div className="absolute top-14 right-4 z-20 w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[82vh]">
      {/* Header matching Cirkit Designer style */}
      <div className="p-3.5 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h3 className="font-semibold text-xs tracking-wide text-white uppercase">
            Component Properties
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded hover:bg-slate-700"
        >
          ✕
        </button>
      </div>

      <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
        {/* Component Label */}
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Component Label / Name
          </label>
          <input
            type="text"
            value={props.label || component.name}
            onChange={(e) => handlePropChange('label', e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-medium focus:outline-none focus:border-cyan-500 text-xs"
          />
          <div className="text-[10px] text-slate-500 mt-1">
            {meta?.name || component.type} • ID: <span className="font-mono">{component.id}</span>
          </div>
        </div>

        {/* Live Simulation Status Banner */}
        {component.state && (
          <div className={`p-2.5 rounded-lg border text-[11px] ${
            component.state.burnedOut
              ? 'bg-rose-950/50 border-rose-600/50 text-rose-300'
              : component.state.active
              ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-800/60 border-slate-700 text-slate-400'
          }`}>
            <div className="font-semibold flex items-center gap-1.5">
              {component.state.burnedOut ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Overcurrent Burnout!
                </>
              ) : component.state.active ? (
                <>
                  <Activity className="w-3.5 h-3.5 text-emerald-400" /> Active / Energized
                </>
              ) : (
                <>
                  <Info className="w-3.5 h-3.5 text-slate-400" /> Standby / Idle
                </>
              )}
            </div>
            {component.state.voltage !== undefined && (
              <div className="mt-1 font-mono text-[10px]">
                Potential: {component.state.voltage}V | Current: {component.state.currentMa || 0} mA
              </div>
            )}
            {component.state.error && (
              <div className="mt-1 text-rose-400 font-semibold">{component.state.error}</div>
            )}
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* Dynamic Controls per Component Type                        */}
        {/* ----------------------------------------------------------- */}

        {/* 1. DHT22 Temperature & Humidity Controls */}
        {component.type === 'dht22' && (
          <div className="space-y-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <div className="font-semibold text-cyan-400 flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5" /> Sensor Simulation Controls
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>Temperature</span>
                <span className="font-mono font-bold text-amber-400">
                  {(props.temperature ?? 24.5).toFixed(1)} °C
                </span>
              </div>
              <input
                type="range"
                min="-20"
                max="60"
                step="0.5"
                value={props.temperature ?? 24.5}
                onChange={(e) => handlePropChange('temperature', parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="text-[10px] text-slate-500 flex justify-between">
                <span>-20°C</span>
                <span className="text-rose-400 font-semibold">Threshold: 28°C</span>
                <span>60°C</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>Relative Humidity</span>
                <span className="font-mono font-bold text-cyan-400">
                  {(props.humidity ?? 60).toFixed(0)} %
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={props.humidity ?? 60}
                onChange={(e) => handlePropChange('humidity', parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* 2. Tactile Pushbutton Interaction */}
        {component.type === 'pushbutton' && (
          <div className="space-y-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <div className="font-semibold text-slate-300">Pushbutton Trigger</div>
            <button
              onClick={() => handlePropChange('pressed', !props.pressed)}
              className={`w-full py-2 rounded-lg font-bold text-xs transition shadow-lg ${
                props.pressed
                  ? 'bg-emerald-600 text-white shadow-emerald-900/50'
                  : 'bg-rose-600 text-white hover:bg-rose-500 shadow-rose-900/50'
              }`}
            >
              {props.pressed ? 'Button Active (Closed)' : 'Click to Press Button'}
            </button>
            <div className="text-[10px] text-slate-400 text-center">
              State: {props.pressed ? 'Connecting Pin 1 to Pin 2 (LOW to GPIO)' : 'Open Circuit (Pull-up HIGH)'}
            </div>
          </div>
        )}

        {/* 3. Resistor Configuration & Color Code */}
        {component.type === 'resistor' && (
          <div className="space-y-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <label className="block text-[11px] font-medium text-slate-300">
              Resistance (Ohms Ω)
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[220, 330, 470, 1000, 4700, 10000].map((rVal) => (
                <button
                  key={rVal}
                  onClick={() => handlePropChange('resistance', rVal)}
                  className={`py-1 rounded text-xs font-mono transition ${
                    (props.resistance || 220) === rVal
                      ? 'bg-cyan-500 text-white font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {rVal >= 1000 ? `${rVal / 1000}kΩ` : `${rVal}Ω`}
                </button>
              ))}
            </div>

            <input
              type="number"
              min="1"
              max="1000000"
              value={props.resistance || 220}
              onChange={(e) => handlePropChange('resistance', parseInt(e.target.value) || 220)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs"
            />

            {/* Color Band Visualizer */}
            <div>
              <div className="text-[10px] text-slate-400 mb-1">4-Band Color Code:</div>
              <div className="flex gap-1 h-5 rounded overflow-hidden border border-slate-700">
                {getResistorColorBands(props.resistance || 220).map((bColor, idx) => (
                  <div key={idx} className="flex-1" style={{ backgroundColor: bColor }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. LED Color Selector */}
        {component.type === 'led' && (
          <div className="space-y-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <label className="block text-[11px] font-medium text-slate-300">
              LED Color
            </label>
            <div className="flex gap-2">
              {[
                { name: 'red', hex: '#ef4444' },
                { name: 'green', hex: '#22c55e' },
                { name: 'blue', hex: '#3b82f6' },
                { name: 'yellow', hex: '#eab308' },
                { name: 'amber', hex: '#f97316' }
              ].map((c) => (
                <button
                  key={c.name}
                  onClick={() => handlePropChange('color', c.name)}
                  className={`w-7 h-7 rounded-full border-2 transition ${
                    (props.color || 'red') === c.name ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>
        )}

        {/* 5. Potentiometer Value */}
        {component.type === 'potentiometer' && (
          <div className="space-y-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <div className="flex justify-between text-slate-300">
              <span>Wiper Position</span>
              <span className="font-mono font-bold text-cyan-400">{props.value ?? 50}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={props.value ?? 50}
              onChange={(e) => handlePropChange('value', parseInt(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>
        )}

        {/* 6. SG90 Servo Manual Angle Slider */}
        {component.type === 'servo-sg90' && (
          <div className="space-y-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <div className="flex justify-between text-slate-300">
              <span>Servo Angle</span>
              <span className="font-mono font-bold text-amber-400">{props.angle ?? 90}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="180"
              value={props.angle ?? 90}
              onChange={(e) => handlePropChange('angle', parseInt(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>
        )}

        {/* Pinout Details */}
        <div>
          <h4 className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider mb-2">
            Pinout Details ({meta?.pins?.length || 0} Pins)
          </h4>
          <div className="max-h-36 overflow-y-auto space-y-1 bg-slate-800/40 p-2 rounded-lg border border-slate-800 font-mono text-[10px]">
            {meta?.pins?.map((pin) => (
              <div key={pin.id} className="flex justify-between text-slate-300 border-b border-slate-800/60 pb-1">
                <span className="font-bold text-cyan-400">{pin.name}</span>
                <span className="text-slate-500 uppercase">{pin.type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="pt-2 border-t border-slate-800 flex gap-2">
          <button
            onClick={() => onRotateComponent(component.id)}
            className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center justify-center gap-1.5 transition"
          >
            <RotateCw className="w-3.5 h-3.5" /> Rotate 90°
          </button>
          <button
            onClick={() => onDeleteComponent(component.id)}
            className="flex-1 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg flex items-center justify-center gap-1.5 transition border border-rose-500/20"
          >
            <Trash2 className="w-3.5 h-3.5" /> Remove
          </button>
        </div>
      </div>
    </div>
  );
};

