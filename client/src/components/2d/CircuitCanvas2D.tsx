'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PlacedComponent, Wire, PinDefinition } from '../../types/circuit';
import { COMPONENT_REGISTRY, getResistorColorBands } from '../../lib/componentRegistry';
import { RotateCw, Trash2, ZoomIn, ZoomOut, Maximize2, AlertCircle } from 'lucide-react';

interface CircuitCanvas2DProps {
  components: PlacedComponent[];
  wires: Wire[];
  selectedComponentId: string | null;
  selectedWireId: string | null;
  activeWireColor: string;
  onSelectComponent: (id: string | null) => void;
  onSelectWire: (id: string | null) => void;
  onUpdateComponentPosition: (id: string, x: number, y: number) => void;
  onRotateComponent: (id: string) => void;
  onDeleteComponent: (id: string) => void;
  onDeleteWire: (id: string) => void;
  onConnectPins: (from: { componentId: string; pin: string }, to: { componentId: string; pin: string }) => void;
  onTogglePushbutton?: (componentId: string, pressed: boolean) => void;
  oledLines?: string[];
  simulationRunning?: boolean;
}

export const CircuitCanvas2D: React.FC<CircuitCanvas2DProps> = ({
  components,
  wires,
  selectedComponentId,
  selectedWireId,
  activeWireColor,
  onSelectComponent,
  onSelectWire,
  onUpdateComponentPosition,
  onRotateComponent,
  onDeleteComponent,
  onDeleteWire,
  onConnectPins,
  onTogglePushbutton,
  oledLines = ['ESP32 SMART NODE', 'Temp: 24.5 C', 'Humidity: 60 %', 'STATUS: OK'],
  simulationRunning = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan & Zoom
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 40, y: 30 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Dragging components
  const [draggingCompId, setDraggingCompId] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Interactive Wiring
  const [wireDraftStart, setWireDraftStart] = useState<{ componentId: string; pin: string; x: number; y: number } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Pin Tooltip
  const [hoveredPinInfo, setHoveredPinInfo] = useState<{
    compName: string;
    pinName: string;
    pinType: string;
    voltage?: number;
    screenX: number;
    screenY: number;
  } | null>(null);

  // Calculate absolute coordinates of any pin in canvas space
  const getPinCanvasPos = useCallback((componentId: string, pinId: string): { x: number; y: number } | null => {
    const comp = components.find(c => c.id === componentId);
    if (!comp) return null;
    const meta = COMPONENT_REGISTRY[comp.type];
    if (!meta) return null;
    const pin = meta.pins.find(p => p.id === pinId);
    if (!pin) return null;

    // Apply component rotation (0, 90, 180, 270)
    const cx = meta.width / 2;
    const cy = meta.height / 2;
    const px = pin.x - cx;
    const py = pin.y - cy;
    const rad = (comp.rotation * Math.PI) / 180;

    const rotatedX = px * Math.cos(rad) - py * Math.sin(rad) + cx;
    const rotatedY = px * Math.sin(rad) + py * Math.cos(rad) + cy;

    return {
      x: comp.x + rotatedX,
      y: comp.y + rotatedY
    };
  }, [components]);

  // Mouse Handlers for Pan & Canvas Drag
  const handleMouseDown = (e: React.MouseEvent) => {
    // Left click on background or Middle click -> Pan
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg' || e.button === 1) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      onSelectComponent(null);
      onSelectWire(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const canvasMouseX = (e.clientX - rect.left - pan.x) / zoom;
    const canvasMouseY = (e.clientY - rect.top - pan.y) / zoom;

    setMousePos({ x: canvasMouseX, y: canvasMouseY });

    if (isPanning) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
      });
    } else if (draggingCompId) {
      // Snap to 10px grid
      const rawX = canvasMouseX - dragOffsetRef.current.x;
      const rawY = canvasMouseY - dragOffsetRef.current.y;
      const snappedX = Math.round(rawX / 10) * 10;
      const snappedY = Math.round(rawY / 10) * 10;

      onUpdateComponentPosition(draggingCompId, snappedX, snappedY);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingCompId(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom(z => Math.max(0.4, Math.min(2.5, z * zoomFactor)));
  };

  // Component Drag Start
  const handleComponentDragStart = (e: React.MouseEvent, comp: PlacedComponent) => {
    e.stopPropagation();
    onSelectComponent(comp.id);
    onSelectWire(null);

    const rect = containerRef.current!.getBoundingClientRect();
    const canvasMouseX = (e.clientX - rect.left - pan.x) / zoom;
    const canvasMouseY = (e.clientY - rect.top - pan.y) / zoom;

    dragOffsetRef.current = {
      x: canvasMouseX - comp.x,
      y: canvasMouseY - comp.y
    };
    setDraggingCompId(comp.id);
  };

  // Pin Click for Wiring
  const handlePinClick = (e: React.MouseEvent, compId: string, pinId: string) => {
    e.stopPropagation();
    const pinPos = getPinCanvasPos(compId, pinId);
    if (!pinPos) return;

    if (!wireDraftStart) {
      // Start wire
      setWireDraftStart({
        componentId: compId,
        pin: pinId,
        x: pinPos.x,
        y: pinPos.y
      });
    } else {
      // Finish wire if different pin
      if (wireDraftStart.componentId !== compId || wireDraftStart.pin !== pinId) {
        onConnectPins(
          { componentId: wireDraftStart.componentId, pin: wireDraftStart.pin },
          { componentId: compId, pin: pinId }
        );
      }
      setWireDraftStart(null);
    }
  };

  // Pin Hover
  const handlePinMouseEnter = (e: React.MouseEvent, comp: PlacedComponent, pin: PinDefinition) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    setHoveredPinInfo({
      compName: comp.name || comp.type,
      pinName: `${pin.name} (${pin.id})`,
      pinType: pin.type.toUpperCase(),
      voltage: pin.voltage,
      screenX: e.clientX - rect.left,
      screenY: e.clientY - rect.top
    });
  };

  const handlePinMouseLeave = () => {
    setHoveredPinInfo(null);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className="relative w-full h-full overflow-hidden select-none bg-[#0a0f1d] cursor-crosshair"
    >
      {/* SVG Canvas Root with Pan & Zoom Transform */}
      <svg
        className="w-full h-full pointer-events-auto"
        style={{
          transformOrigin: '0 0'
        }}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Subtle Workspace Grid */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="1.0" fill="#1e293b" />
            </pattern>
          </defs>
          <rect x="-2000" y="-2000" width="8000" height="8000" fill="url(#grid)" />

          {/* -------------------------------------------------------- */}
          {/* Render Placed Components                                 */}
          {/* -------------------------------------------------------- */}
          {components.map((comp) => {
            const meta = COMPONENT_REGISTRY[comp.type] || {
              width: 100,
              height: 100,
              pins: [],
              name: comp.name
            };
            const isSelected = comp.id === selectedComponentId;
            const isLit = Boolean(comp.state?.active);
            const isBurned = Boolean(comp.state?.burnedOut);

            return (
              <g
                key={comp.id}
                transform={`translate(${comp.x}, ${comp.y}) rotate(${comp.rotation}, ${meta.width / 2}, ${meta.height / 2})`}
                onMouseDown={(e) => handleComponentDragStart(e, comp)}
                className="cursor-move"
              >
                {/* Selection border halo */}
                {isSelected && (
                  <rect
                    x="-6"
                    y="-6"
                    width={meta.width + 12}
                    height={meta.height + 12}
                    rx="8"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    className="animate-pulse"
                  />
                )}

                {/* 1. ESP32 DevKit V1 Rendering */}
                {comp.type === 'esp32' && (
                  <g>
                    {/* PCB Body */}
                    <rect x="0" y="0" width="140" height="240" rx="8" fill="#111827" stroke="#374151" strokeWidth="2" />
                    
                    {/* ESP32 WROOM-32 Shield */}
                    <rect x="25" y="40" width="90" height="85" rx="4" fill="#334155" stroke="#64748b" strokeWidth="1" />
                    <text x="70" y="70" fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      ESP-WROOM-32
                    </text>
                    <text x="70" y="85" fill="#64748b" fontSize="8" textAnchor="middle" fontFamily="sans-serif">
                      Wi-Fi & BLE MCU
                    </text>

                    {/* Micro-USB Port */}
                    <rect x="48" y="2" width="44" height="24" rx="2" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
                    
                    {/* Onboard Status LEDs */}
                    <circle cx="36" cy="140" r="3" fill="#ef4444" /> {/* PWR LED */}
                    <circle cx="36" cy="155" r="3" fill={isLit ? '#3b82f6' : '#1e3a5f'} /> {/* GPIO 2 LED */}

                    {/* Label */}
                    <text x="70" y="225" fill="#cbd5e1" fontSize="11" fontWeight="bold" textAnchor="middle">
                      {comp.name || 'ESP32 DevKit'}
                    </text>
                  </g>
                )}

                {/* 2. Arduino Uno R3 Rendering */}
                {comp.type === 'arduino-uno' && (
                  <g>
                    <rect x="0" y="0" width="160" height="240" rx="8" fill="#0284c7" stroke="#0369a1" strokeWidth="2" />
                    <rect x="15" y="10" width="40" height="40" rx="3" fill="#94a3b8" />
                    <rect x="105" y="10" width="40" height="30" rx="3" fill="#1e293b" />
                    <text x="80" y="130" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">
                      Arduino UNO
                    </text>
                  </g>
                )}

                {/* 3. Half Breadboard Rendering */}
                {comp.type === 'breadboard-half' && (
                  <g>
                    <rect x="0" y="0" width="240" height="180" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
                    {/* Power Rails (+ / -) */}
                    <line x1="20" y1="18" x2="220" y2="18" stroke="#ef4444" strokeWidth="2" />
                    <line x1="20" y1="32" x2="220" y2="32" stroke="#3b82f6" strokeWidth="2" />
                    <line x1="20" y1="150" x2="220" y2="150" stroke="#ef4444" strokeWidth="2" />
                    <line x1="20" y1="164" x2="220" y2="164" stroke="#3b82f6" strokeWidth="2" />

                    {/* Center Trough */}
                    <rect x="15" y="92" width="210" height="8" fill="#e2e8f0" />
                    
                    <text x="120" y="100" fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="middle">
                      400-POINT BREADBOARD
                    </text>
                  </g>
                )}

                {/* 4. DHT22 Temperature & Humidity Sensor Rendering */}
                {comp.type === 'dht22' && (
                  <g>
                    <rect x="0" y="0" width="90" height="110" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
                    {/* Grill slits */}
                    {[20, 35, 50, 65, 80].map((slitY) => (
                      <rect key={slitY} x="15" y={slitY} width="60" height="5" rx="2" fill="#94a3b8" />
                    ))}
                    <text x="45" y="15" fill="#334155" fontSize="9" fontWeight="bold" textAnchor="middle">
                      DHT22
                    </text>
                    <text x="45" y="102" fill="#0284c7" fontSize="8" fontWeight="bold" textAnchor="middle">
                      {comp.properties?.temperature?.toFixed(1) || '24.5'}°C | {comp.properties?.humidity?.toFixed(0) || '60'}%
                    </text>
                  </g>
                )}

                {/* 5. SSD1306 0.96" OLED Display Rendering */}
                {comp.type === 'oled-ssd1306' && (
                  <g>
                    {/* Blue Breakout PCB */}
                    <rect x="0" y="0" width="130" height="115" rx="6" fill="#1e3a8a" stroke="#2563eb" strokeWidth="1.5" />
                    
                    {/* Dark Glass OLED Panel */}
                    <rect x="8" y="28" width="114" height="78" rx="2" fill="#030712" stroke="#00f0ff" strokeWidth="1" />

                    {/* Live Rendered Monospace Display Text */}
                    <text x="14" y="44" fill="#00f0ff" fontSize="8" fontWeight="bold" fontFamily="monospace">
                      {oledLines[0] || 'ESP32 MONITOR'}
                    </text>
                    <line x1="14" y1="48" x2="116" y2="48" stroke="#00f0ff" strokeWidth="0.5" />
                    <text x="14" y="60" fill="#ffffff" fontSize="8" fontFamily="monospace">
                      {oledLines[1] || 'Temp: 24.5 C'}
                    </text>
                    <text x="14" y="74" fill="#ffffff" fontSize="8" fontFamily="monospace">
                      {oledLines[2] || 'Humidity: 60 %'}
                    </text>
                    <text
                      x="14"
                      y="92"
                      fill={oledLines[3]?.includes('ALARM') ? '#ef4444' : '#22c55e'}
                      fontSize="8"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {oledLines[3] || 'STATUS: ALL OK'}
                    </text>
                  </g>
                )}

                {/* 6. 5mm LED Rendering */}
                {comp.type === 'led' && (
                  <g>
                    {/* Glowing outer halo when illuminated */}
                    {isLit && !isBurned && (
                      <circle
                        cx="30"
                        cy="35"
                        r="30"
                        fill={comp.properties?.color || '#ef4444'}
                        opacity="0.35"
                        className="animate-pulse"
                      />
                    )}
                    <circle
                      cx="30"
                      cy="35"
                      r="18"
                      fill={
                        isBurned
                          ? '#27272a'
                          : isLit
                          ? comp.properties?.color || '#ef4444'
                          : '#7f1d1d'
                      }
                      stroke={isBurned ? '#ef4444' : '#f87171'}
                      strokeWidth="2"
                    />
                    {/* Anode / Cathode leads */}
                    <line x1="20" y1="52" x2="20" y2="70" stroke="#94a3b8" strokeWidth="2.5" />
                    <line x1="40" y1="52" x2="40" y2="70" stroke="#94a3b8" strokeWidth="2.5" />
                    <text x="30" y="78" fill="#cbd5e1" fontSize="9" fontWeight="bold" textAnchor="middle">
                      {isBurned ? 'BLOWN!' : isLit ? 'ON' : 'OFF'}
                    </text>
                  </g>
                )}

                {/* 7. Resistor Rendering */}
                {comp.type === 'resistor' && (
                  <g>
                    {/* Lead wires */}
                    <line x1="10" y1="20" x2="24" y2="20" stroke="#94a3b8" strokeWidth="2.5" />
                    <line x1="56" y1="20" x2="70" y2="20" stroke="#94a3b8" strokeWidth="2.5" />
                    {/* Beige Ceramic Body */}
                    <rect x="24" y="10" width="32" height="20" rx="5" fill="#f5deb3" stroke="#d2b48c" strokeWidth="1.5" />
                    {/* Color Bands */}
                    {(() => {
                      const [b1, b2, b3, b4] = getResistorColorBands(comp.properties?.resistance || 220);
                      return (
                        <g>
                          <rect x="28" y="10" width="3" height="20" fill={b1} />
                          <rect x="34" y="10" width="3" height="20" fill={b2} />
                          <rect x="40" y="10" width="3" height="20" fill={b3} />
                          <rect x="48" y="10" width="3" height="20" fill={b4} />
                        </g>
                      );
                    })()}
                    <text x="40" y="38" fill="#cbd5e1" fontSize="9" textAnchor="middle">
                      {comp.properties?.resistance || 220}Ω
                    </text>
                  </g>
                )}

                {/* 8. Tactile Pushbutton Rendering */}
                {comp.type === 'pushbutton' && (
                  <g
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onTogglePushbutton) {
                        onTogglePushbutton(comp.id, !comp.properties?.pressed);
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <rect x="0" y="0" width="60" height="60" rx="6" fill="#18181b" stroke="#3f3f46" strokeWidth="2" />
                    <circle
                      cx="30"
                      cy="30"
                      r={comp.properties?.pressed ? 14 : 16}
                      fill={comp.properties?.pressed ? '#22c55e' : '#ef4444'}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    <text x="30" y="33" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
                      {comp.properties?.pressed ? 'HELD' : 'PUSH'}
                    </text>
                  </g>
                )}

                {/* 9. Potentiometer Rendering */}
                {comp.type === 'potentiometer' && (
                  <g>
                    <rect x="0" y="0" width="70" height="70" rx="4" fill="#0284c7" stroke="#0369a1" strokeWidth="2" />
                    <circle cx="35" cy="35" r="22" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
                    <circle cx="35" cy="35" r="6" fill="#0f172a" />
                    <text x="35" y="64" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                      {comp.properties?.value ?? 50}%
                    </text>
                  </g>
                )}

                {/* 10. SG90 Micro Servo Rendering */}
                {comp.type === 'servo-sg90' && (
                  <g>
                    <rect x="0" y="0" width="80" height="80" rx="6" fill="#0284c7" stroke="#0369a1" strokeWidth="2" />
                    <circle cx="40" cy="40" r="14" fill="#f8fafc" stroke="#64748b" strokeWidth="2" />
                    <line
                      x1="40"
                      y1="40"
                      x2={40 + 26 * Math.cos(((comp.properties?.angle ?? 90) * Math.PI) / 180)}
                      y2={40 + 26 * Math.sin(((comp.properties?.angle ?? 90) * Math.PI) / 180)}
                      stroke="#ffffff"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    <text x="40" y="74" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                      {comp.properties?.angle ?? 90}°
                    </text>
                  </g>
                )}

                {/* 11. Piezo Buzzer Rendering */}
                {comp.type === 'piezo-buzzer' && (
                  <g>
                    <circle cx="35" cy="35" r="30" fill="#18181b" stroke="#3f3f46" strokeWidth="2" />
                    <circle cx="35" cy="35" r="6" fill="#000000" />
                    {isLit && (
                      <circle cx="35" cy="35" r="34" fill="none" stroke="#eab308" strokeWidth="2" className="animate-ping" />
                    )}
                    <text x="35" y="58" fill="#eab308" fontSize="8" fontWeight="bold" textAnchor="middle">
                      BUZZER
                    </text>
                  </g>
                )}

                {/* ---------------------------------------------------- */}
                {/* Component Pins (Clickable Snapping Circles)          */}
                {/* ---------------------------------------------------- */}
                {meta.pins?.map((pin) => {
                  const isPinStart = wireDraftStart?.componentId === comp.id && wireDraftStart?.pin === pin.id;

                  return (
                    <g
                      key={pin.id}
                      onClick={(e) => handlePinClick(e, comp.id, pin.id)}
                      onMouseEnter={(e) => handlePinMouseEnter(e, comp, pin)}
                      onMouseLeave={handlePinMouseLeave}
                      className="cursor-pointer group"
                    >
                      {/* Interactive hit area */}
                      <circle cx={pin.x} cy={pin.y} r="10" fill="transparent" />

                      {/* Visible Pin Dot */}
                      <circle
                        cx={pin.x}
                        cy={pin.y}
                        r="4"
                        fill={isPinStart ? '#ef4444' : pin.type === 'power' ? '#ef4444' : pin.type === 'ground' ? '#18181b' : '#38bdf8'}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        className="transition-transform group-hover:scale-150"
                      />

                      {/* Tiny Pin Label */}
                      <text
                        x={pin.x}
                        y={pin.y - 7}
                        fill="#94a3b8"
                        fontSize="7"
                        textAnchor="middle"
                        className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity font-mono"
                      >
                        {pin.id}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* -------------------------------------------------------- */}
          {/* Render Completed Wires (Curved Orthogonal Bezier Lines)  */}
          {/* -------------------------------------------------------- */}
          {wires.map((wire) => {
            const p1 = getPinCanvasPos(wire.from.componentId, wire.from.pin);
            const p2 = getPinCanvasPos(wire.to.componentId, wire.to.pin);
            if (!p1 || !p2) return null;

            const isSelected = wire.id === selectedWireId;

            // Orthogonal / S-curve routing
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Control points for organic curved wire
            const cp1x = p1.x + dx * 0.2;
            const cp1y = p1.y + Math.max(30, dist * 0.2);
            const cp2x = p2.x - dx * 0.2;
            const cp2y = p2.y + Math.max(30, dist * 0.2);

            const pathD = `M ${p1.x} ${p1.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;

            return (
              <g
                key={wire.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectWire(wire.id);
                  onSelectComponent(null);
                }}
                className="cursor-pointer group"
              >
                {/* Thick invisible click area */}
                <path d={pathD} fill="none" stroke="transparent" strokeWidth="14" />

                {/* Highlight glow if selected */}
                {isSelected && (
                  <path d={pathD} fill="none" stroke="#ffffff" strokeWidth="7" opacity="0.6" />
                )}

                {/* Main Colored Jumper Wire */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={wire.color || '#3b82f6'}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  className="transition group-hover:brightness-125"
                />

                {/* Pin terminal ends */}
                <circle cx={p1.x} cy={p1.y} r="3" fill="#cbd5e1" />
                <circle cx={p2.x} cy={p2.y} r="3" fill="#cbd5e1" />
              </g>
            );
          })}

          {/* -------------------------------------------------------- */}
          {/* Active Rubberband Wire being drawn                       */}
          {/* -------------------------------------------------------- */}
          {wireDraftStart && (
            <line
              x1={wireDraftStart.x}
              y1={wireDraftStart.y}
              x2={mousePos.x}
              y2={mousePos.y}
              stroke={activeWireColor}
              strokeWidth="3"
              strokeDasharray="6 4"
              strokeLinecap="round"
              className="animate-pulse"
            />
          )}
        </g>
      </svg>

      {/* Floating 2D Controls (Zoom, Pan, Rotate, Delete) */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow-xl">
        <button
          onClick={() => setZoom(z => Math.min(2.5, z * 1.15))}
          title="Zoom In"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom(z => Math.max(0.4, z * 0.85))}
          title="Zoom Out"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setZoom(1.0); setPan({ x: 40, y: 30 }); }}
          title="Reset View"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-slate-700 mx-1" />

        {/* Selected Component Operations */}
        {selectedComponentId && (
          <>
            <button
              onClick={() => onRotateComponent(selectedComponentId)}
              title="Rotate 90°"
              className="flex items-center gap-1 px-2 py-1 text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded hover:bg-cyan-500/30 transition"
            >
              <RotateCw className="w-3.5 h-3.5" /> Rotate
            </button>
            <button
              onClick={() => onDeleteComponent(selectedComponentId)}
              title="Delete Component"
              className="flex items-center gap-1 px-2 py-1 text-xs bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded hover:bg-rose-500/30 transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </>
        )}

        {/* Selected Wire Operations */}
        {selectedWireId && (
          <button
            onClick={() => onDeleteWire(selectedWireId)}
            title="Delete Wire"
            className="flex items-center gap-1 px-2 py-1 text-xs bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded hover:bg-rose-500/30 transition"
          >
            <Trash2 className="w-3.5 h-3.5" /> Remove Wire
          </button>
        )}
      </div>

      {/* Wiring In-Progress Banner */}
      {wireDraftStart && (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-cyan-950/90 border border-cyan-500/50 text-cyan-200 px-3.5 py-1.5 rounded-lg shadow-xl text-xs animate-pulse">
          <span>Routing Wire from <strong>{wireDraftStart.pin}</strong> — Click target pin to complete.</span>
          <button
            onClick={() => setWireDraftStart(null)}
            className="ml-2 text-cyan-400 hover:text-white underline"
          >
            Esc
          </button>
        </div>
      )}

      {/* Pin Hover Tooltip Popover */}
      {hoveredPinInfo && (
        <div
          className="absolute z-20 pointer-events-none bg-slate-900/95 border border-slate-700 text-white px-2.5 py-1.5 rounded shadow-2xl text-[11px] transform -translate-x-1/2 -translate-y-full mb-2"
          style={{
            left: hoveredPinInfo.screenX,
            top: hoveredPinInfo.screenY - 8
          }}
        >
          <div className="font-bold text-cyan-300">{hoveredPinInfo.pinName}</div>
          <div className="text-slate-400 text-[10px]">{hoveredPinInfo.compName} • {hoveredPinInfo.pinType}</div>
          {hoveredPinInfo.voltage !== undefined && (
            <div className="text-emerald-400 font-mono text-[10px]">Nominal: {hoveredPinInfo.voltage}V</div>
          )}
        </div>
      )}
    </div>
  );
};
