'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PlacedComponent, Wire, PinDefinition } from '../../types/circuit';
import { COMPONENT_REGISTRY, getResistorColorBands } from '../../lib/componentRegistry';
import {
  Camera,
  Maximize2,
  Minimize2,
  RotateCw,
  Sun,
  Grid,
  Sparkles,
  Info
} from 'lucide-react';

interface CircuitCanvas3DProps {
  components: PlacedComponent[];
  wires: Wire[];
  selectedComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  onConnectPin?: (from: { componentId: string; pin: string }, to: { componentId: string; pin: string }) => void;
  onTogglePushbutton?: (componentId: string, pressed: boolean) => void;
  oledLines?: string[];
  simulationRunning?: boolean;
}

export const CircuitCanvas3D: React.FC<CircuitCanvas3DProps> = ({
  components,
  wires,
  selectedComponentId,
  onSelectComponent,
  onConnectPin,
  onTogglePushbutton,
  oledLines = ['ESP32 SMART NODE', 'Temp: 24.5 C', 'Humidity: 60 %', 'STATUS: OK'],
  simulationRunning = false
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Dynamic references
  const componentMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const pinSpheresRef = useRef<Map<string, { mesh: THREE.Mesh; compId: string; pinId: string; worldPos: THREE.Vector3 }>>(new Map());
  const wireMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const pointLightsRef = useRef<Map<string, THREE.PointLight>>(new Map());
  const oledTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const oledCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const servoArmsRef = useRef<Map<string, THREE.Group>>(new Map());
  const buttonCapsRef = useRef<Map<string, THREE.Mesh>>(new Map());

  // Interactive wiring state
  const [wireStartPin, setWireStartPin] = useState<{ componentId: string; pin: string } | null>(null);
  const [hoveredPin, setHoveredPin] = useState<{ componentId: string; pin: string; name: string; x: number; y: number } | null>(null);
  const [viewPreset, setViewPreset] = useState<'isometric' | 'top' | 'front'>('isometric');
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Helper: map 2D layout coordinates (px) to 3D scene world coordinates (units)
  const map2DTo3D = useCallback((x: number, y: number): [number, number, number] => {
    // 100px ~= 3.0 units in 3D, centered at 400, 250
    const x3d = (x - 420) * 0.028;
    const z3d = (y - 250) * 0.028;
    return [x3d, 0, z3d];
  }, []);

  // Update dynamic OLED Canvas Texture
  const updateOledCanvas = useCallback((lines: string[]) => {
    if (!oledCanvasRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 128;
      oledCanvasRef.current = canvas;
      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      oledTextureRef.current = texture;
    }

    const canvas = oledCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dark blue OLED background
    ctx.fillStyle = '#060d1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle OLED grid / scanline effect
    ctx.fillStyle = 'rgba(0, 240, 255, 0.03)';
    for (let y = 0; y < canvas.height; y += 4) {
      ctx.fillRect(0, y, canvas.width, 2);
    }

    // Glowing border frame
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);

    // OLED Header banner
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 15px "Courier New", monospace';
    ctx.fillText(lines[0] || 'ESP32 MONITOR', 12, 22);

    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(8, 28, canvas.width - 16, 2);

    // Telemetry lines
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px "Courier New", monospace';

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i] || '';
      if (line.includes('ALARM')) {
        ctx.fillStyle = '#ff2b55';
        ctx.font = 'bold 15px "Courier New", monospace';
      } else {
        ctx.fillStyle = '#67e8f9';
        ctx.font = '14px "Courier New", monospace';
      }
      ctx.fillText(line, 12, 34 + i * 22);
    }

    if (oledTextureRef.current) {
      oledTextureRef.current.needsUpdate = true;
    }
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0b101b'); // Sleek laboratory slate
    scene.fog = new THREE.FogExp2('#0b101b', 0.015);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(13, 16, 19);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    container.replaceChildren(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Don't dip below floor
    controls.minDistance = 4;
    controls.maxDistance = 50;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight('#94a3b8', 1.0);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight('#ffffff', 2.0);
    dirLight.position.set(14, 22, 12);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 60;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    const blueRimLight = new THREE.DirectionalLight('#38bdf8', 0.8);
    blueRimLight.position.set(-14, 10, -12);
    scene.add(blueRimLight);

    // 6. Workbench Surface & Grid
    const floorGeo = new THREE.PlaneGeometry(80, 80);
    const floorMat = new THREE.MeshStandardMaterial({
      color: '#0e1626',
      roughness: 0.8,
      metalness: 0.2
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -0.02;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    const gridHelper = new THREE.GridHelper(60, 60, '#38bdf8', '#1e293b');
    gridHelper.position.y = 0.001;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.45;
    scene.add(gridHelper);

    // Initial OLED canvas texture
    updateOledCanvas(oledLines);

    // Animation loop
    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();

      // Subtle pulse animation on lit LEDs
      const elapsed = clock.getElapsedTime();
      pointLightsRef.current.forEach((light, id) => {
        const comp = components.find(c => c.id === id);
        if (comp?.state?.active) {
          light.intensity = 2.0 + Math.sin(elapsed * 10) * 0.25;
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    // Dynamic resize handler with ResizeObserver
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      cancelAnimationFrame(animationId);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update OLED texture when oledLines change
  useEffect(() => {
    updateOledCanvas(oledLines);
  }, [oledLines, updateOledCanvas]);

  // Construct or Rebuild 3D Meshes for components
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clear old component groups
    componentMeshesRef.current.forEach((group) => {
      scene.remove(group);
    });
    componentMeshesRef.current.clear();
    pinSpheresRef.current.clear();
    pointLightsRef.current.clear();
    servoArmsRef.current.clear();
    buttonCapsRef.current.clear();

    // Materials palette
    const pcbBlackMat = new THREE.MeshStandardMaterial({ color: '#12151b', roughness: 0.6, metalness: 0.1 });
    const pcbBlueMat = new THREE.MeshStandardMaterial({ color: '#0d3880', roughness: 0.5, metalness: 0.1 });
    const metalMat = new THREE.MeshStandardMaterial({ color: '#c0c0c0', roughness: 0.3, metalness: 0.9 });
    const goldMat = new THREE.MeshStandardMaterial({ color: '#d4af37', roughness: 0.2, metalness: 0.8 });
    const breadboardMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.7, metalness: 0.05 });
    const plasticBlackMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.6, metalness: 0.1 });

    components.forEach((comp) => {
      const group = new THREE.Group();
      group.name = comp.id;

      const [x3d, _, z3d] = map2DTo3D(comp.x, comp.y);
      group.position.set(x3d, 0, z3d);
      group.rotation.y = (comp.rotation * Math.PI) / 180;

      const meta = COMPONENT_REGISTRY[comp.type];

      // -------------------------------------------------------------
      // 1. ESP32 DevKit V1
      // -------------------------------------------------------------
      if (comp.type === 'esp32') {
        // PCB Board
        const boardGeo = new THREE.BoxGeometry(2.6, 0.15, 4.8);
        const boardMesh = new THREE.Mesh(boardGeo, pcbBlackMat);
        boardMesh.position.y = 0.075;
        boardMesh.castShadow = true;
        boardMesh.receiveShadow = true;
        group.add(boardMesh);

        // Metal RF Shield
        const shieldGeo = new THREE.BoxGeometry(1.6, 0.18, 1.8);
        const shieldMesh = new THREE.Mesh(shieldGeo, metalMat);
        shieldMesh.position.set(0, 0.18, -0.6);
        shieldMesh.castShadow = true;
        group.add(shieldMesh);

        // Micro-USB Jack
        const usbGeo = new THREE.BoxGeometry(0.8, 0.3, 0.9);
        const usbMesh = new THREE.Mesh(usbGeo, metalMat);
        usbMesh.position.set(0, 0.2, -2.3);
        group.add(usbMesh);

        // Header pin sockets (left and right)
        [-1.15, 1.15].forEach((xOffset) => {
          const headerGeo = new THREE.BoxGeometry(0.3, 0.4, 4.4);
          const headerMesh = new THREE.Mesh(headerGeo, plasticBlackMat);
          headerMesh.position.set(xOffset, 0.25, 0);
          group.add(headerMesh);

          for (let i = 0; i < 15; i++) {
            const pinGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.15, 8);
            const pinMesh = new THREE.Mesh(pinGeo, goldMat);
            pinMesh.position.set(xOffset, 0.5, -2.0 + i * 0.285);
            group.add(pinMesh);
          }
        });

        // Onboard LEDs (Power LED & GPIO 2 Status LED)
        const pwrLedGeo = new THREE.BoxGeometry(0.12, 0.08, 0.12);
        const pwrLedMat = new THREE.MeshBasicMaterial({ color: '#ef4444' });
        const pwrLed = new THREE.Mesh(pwrLedGeo, pwrLedMat);
        pwrLed.position.set(0.5, 0.16, -1.8);
        group.add(pwrLed);

        const d2LedGeo = new THREE.BoxGeometry(0.12, 0.08, 0.12);
        const d2LedMat = new THREE.MeshBasicMaterial({
          color: comp.state?.active ? '#3b82f6' : '#1e3a5f'
        });
        const d2Led = new THREE.Mesh(d2LedGeo, d2LedMat);
        d2Led.position.set(0.5, 0.16, -1.5);
        group.add(d2Led);
      }

      // -------------------------------------------------------------
      // 2. Arduino Uno R3
      // -------------------------------------------------------------
      else if (comp.type === 'arduino-uno') {
        const boardGeo = new THREE.BoxGeometry(3.6, 0.15, 4.8);
        const boardMesh = new THREE.Mesh(boardGeo, pcbBlueMat);
        boardMesh.position.y = 0.075;
        boardMesh.castShadow = true;
        group.add(boardMesh);

        // USB Jack & DC Barrel Jack
        const usb = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 1.0), metalMat);
        usb.position.set(-1.1, 0.35, -2.2);
        group.add(usb);

        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.0, 16), plasticBlackMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(1.1, 0.3, -2.1);
        group.add(barrel);

        // Main IC chip ATmega328P
        const chip = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 2.0), plasticBlackMat);
        chip.position.set(0.2, 0.18, 0.5);
        group.add(chip);
      }

      // -------------------------------------------------------------
      // 3. Half-size Breadboard
      // -------------------------------------------------------------
      else if (comp.type === 'breadboard-half') {
        const bbGeo = new THREE.BoxGeometry(6.4, 0.3, 4.6);
        const bbMesh = new THREE.Mesh(bbGeo, breadboardMat);
        bbMesh.position.y = 0.15;
        bbMesh.receiveShadow = true;
        bbMesh.castShadow = true;
        group.add(bbMesh);

        // Power rail colored stripes (+ Red, - Blue)
        const stripeRedGeo = new THREE.BoxGeometry(6.2, 0.02, 0.08);
        const stripeRedMat = new THREE.MeshBasicMaterial({ color: '#ef4444' });
        const redTop = new THREE.Mesh(stripeRedGeo, stripeRedMat);
        redTop.position.set(0, 0.31, -2.0);
        group.add(redTop);

        const stripeBlueGeo = new THREE.BoxGeometry(6.2, 0.02, 0.08);
        const stripeBlueMat = new THREE.MeshBasicMaterial({ color: '#3b82f6' });
        const blueTop = new THREE.Mesh(stripeBlueGeo, stripeBlueMat);
        blueTop.position.set(0, 0.31, -1.8);
        group.add(blueTop);

        const redBot = new THREE.Mesh(stripeRedGeo, stripeRedMat);
        redBot.position.set(0, 0.31, 1.8);
        group.add(redBot);

        const blueBot = new THREE.Mesh(stripeBlueGeo, stripeBlueMat);
        blueBot.position.set(0, 0.31, 2.0);
        group.add(blueBot);

        // Center trough
        const troughGeo = new THREE.BoxGeometry(6.2, 0.08, 0.2);
        const troughMesh = new THREE.Mesh(troughGeo, new THREE.MeshStandardMaterial({ color: '#cbd5e1' }));
        troughMesh.position.set(0, 0.28, 0);
        group.add(troughMesh);
      }

      // -------------------------------------------------------------
      // 4. DHT22 Temperature & Humidity Sensor
      // -------------------------------------------------------------
      else if (comp.type === 'dht22') {
        const bodyGeo = new THREE.BoxGeometry(1.6, 1.2, 1.8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.4 });
        const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        bodyMesh.position.y = 0.8;
        bodyMesh.castShadow = true;
        group.add(bodyMesh);

        // Grill slits
        for (let i = 0; i < 5; i++) {
          const slitGeo = new THREE.BoxGeometry(1.2, 0.04, 0.1);
          const slitMat = new THREE.MeshStandardMaterial({ color: '#94a3b8' });
          const slit = new THREE.Mesh(slitGeo, slitMat);
          slit.position.set(0, 0.5 + i * 0.15, 0.91);
          group.add(slit);
        }

        // 4 Pins extending down
        for (let p = 0; p < 4; p++) {
          const pinGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8);
          const pin = new THREE.Mesh(pinGeo, metalMat);
          pin.position.set(-0.45 + p * 0.3, 0.2, 0.8);
          group.add(pin);
        }
      }

      // -------------------------------------------------------------
      // 5. SSD1306 0.96" OLED Display
      // -------------------------------------------------------------
      else if (comp.type === 'oled-ssd1306') {
        // PCB base
        const pcbGeo = new THREE.BoxGeometry(2.8, 0.12, 2.8);
        const pcbMesh = new THREE.Mesh(pcbGeo, pcbBlueMat);
        pcbMesh.position.y = 0.2;
        pcbMesh.castShadow = true;
        group.add(pcbMesh);

        // Glass OLED Screen with dynamic CanvasTexture
        const screenGeo = new THREE.PlaneGeometry(2.4, 1.6);
        const screenMat = new THREE.MeshBasicMaterial({
          map: oledTextureRef.current || null,
          color: '#ffffff'
        });
        const screenMesh = new THREE.Mesh(screenGeo, screenMat);
        screenMesh.rotation.x = -Math.PI / 2;
        screenMesh.position.set(0, 0.27, 0.2);
        group.add(screenMesh);

        // 4 Header pins at top
        for (let p = 0; p < 4; p++) {
          const pinGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.3, 8);
          const pin = new THREE.Mesh(pinGeo, goldMat);
          pin.position.set(-0.6 + p * 0.4, 0.3, -1.1);
          group.add(pin);
        }
      }

      // -------------------------------------------------------------
      // 6. 5mm LED
      // -------------------------------------------------------------
      else if (comp.type === 'led') {
        const isLit = Boolean(comp.state?.active);
        const isBurned = Boolean(comp.state?.burnedOut);
        const colorName = comp.properties?.color || 'red';

        const colorHexMap: Record<string, string> = {
          red: '#ef4444',
          green: '#22c55e',
          blue: '#3b82f6',
          yellow: '#eab308',
          amber: '#f97316'
        };
        const baseColor = colorHexMap[colorName] || '#ef4444';

        // Dome geometry
        const domeGeo = new THREE.SphereGeometry(0.35, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const cylinderGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.4, 16);

        let ledMat: THREE.Material;
        if (isBurned) {
          ledMat = new THREE.MeshStandardMaterial({ color: '#27272a', roughness: 0.9, metalness: 0.1 });
        } else if (isLit) {
          ledMat = new THREE.MeshStandardMaterial({
            color: baseColor,
            emissive: baseColor,
            emissiveIntensity: 2.2,
            roughness: 0.1,
            metalness: 0.1,
            transparent: true,
            opacity: 0.95
          });
        } else {
          ledMat = new THREE.MeshStandardMaterial({
            color: baseColor,
            roughness: 0.4,
            transparent: true,
            opacity: 0.7
          });
        }

        const domeMesh = new THREE.Mesh(domeGeo, ledMat);
        domeMesh.position.y = 0.9;
        group.add(domeMesh);

        const cylMesh = new THREE.Mesh(cylinderGeo, ledMat);
        cylMesh.position.y = 0.7;
        cylMesh.castShadow = true;
        group.add(cylMesh);

        // LED Pins (Anode & Cathode)
        const anode = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.6, 8), metalMat);
        anode.position.set(-0.15, 0.3, 0);
        group.add(anode);

        const cathode = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 8), metalMat);
        cathode.position.set(0.15, 0.25, 0);
        group.add(cathode);

        // Dynamic PointLight when energized
        if (isLit && !isBurned) {
          const ptLight = new THREE.PointLight(baseColor, 2.5, 6, 1.5);
          ptLight.position.set(0, 1.1, 0);
          group.add(ptLight);
          pointLightsRef.current.set(comp.id, ptLight);
        }
      }

      // -------------------------------------------------------------
      // 7. Resistor (Axial 4-Band)
      // -------------------------------------------------------------
      else if (comp.type === 'resistor') {
        const bodyGeo = new THREE.CylinderGeometry(0.2, 0.2, 1.0, 16);
        bodyGeo.rotateZ(Math.PI / 2);
        const bodyMat = new THREE.MeshStandardMaterial({ color: '#f5deb3', roughness: 0.6 }); // Biscuit beige
        const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        bodyMesh.position.y = 0.4;
        bodyMesh.castShadow = true;
        group.add(bodyMesh);

        // 4 Color bands
        const ohms = comp.properties?.resistance || 220;
        const [b1, b2, b3, b4] = getResistorColorBands(ohms);
        const bands = [
          { color: b1, x: -0.3 },
          { color: b2, x: -0.1 },
          { color: b3, x: 0.1 },
          { color: b4, x: 0.3 }
        ];

        bands.forEach((b) => {
          const bandGeo = new THREE.CylinderGeometry(0.205, 0.205, 0.1, 16);
          bandGeo.rotateZ(Math.PI / 2);
          const bandMat = new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.3 });
          const bandMesh = new THREE.Mesh(bandGeo, bandMat);
          bandMesh.position.set(b.x, 0.4, 0);
          group.add(bandMesh);
        });

        // Leads extending from both ends
        [-0.8, 0.8].forEach((xLead) => {
          const leadGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8);
          leadGeo.rotateZ(Math.PI / 2);
          const lead = new THREE.Mesh(leadGeo, metalMat);
          lead.position.set(xLead, 0.4, 0);
          group.add(lead);
        });
      }

      // -------------------------------------------------------------
      // 8. Pushbutton (Tactile Switch)
      // -------------------------------------------------------------
      else if (comp.type === 'pushbutton') {
        const baseGeo = new THREE.BoxGeometry(0.9, 0.35, 0.9);
        const baseMesh = new THREE.Mesh(baseGeo, plasticBlackMat);
        baseMesh.position.y = 0.2;
        baseMesh.castShadow = true;
        group.add(baseMesh);

        // Depressible button cap
        const isPressed = Boolean(comp.properties?.pressed);
        const capGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.25, 16);
        const capMat = new THREE.MeshStandardMaterial({
          color: isPressed ? '#22c55e' : '#ef4444',
          roughness: 0.4
        });
        const capMesh = new THREE.Mesh(capGeo, capMat);
        capMesh.position.set(0, isPressed ? 0.36 : 0.44, 0);
        group.add(capMesh);
        buttonCapsRef.current.set(comp.id, capMesh);

        // 4 Metal leg pins
        [
          [-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]
        ].forEach(([px, pz]) => {
          const legGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 8);
          const leg = new THREE.Mesh(legGeo, metalMat);
          leg.position.set(px, 0.1, pz);
          group.add(leg);
        });
      }

      // -------------------------------------------------------------
      // 9. Potentiometer
      // -------------------------------------------------------------
      else if (comp.type === 'potentiometer') {
        const bodyGeo = new THREE.BoxGeometry(1.2, 0.8, 1.2);
        const bodyMat = new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.5 });
        const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        bodyMesh.position.y = 0.5;
        bodyMesh.castShadow = true;
        group.add(bodyMesh);

        // Rotating Shaft Knob
        const shaftGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.7, 16);
        const shaftMesh = new THREE.Mesh(shaftGeo, metalMat);
        shaftMesh.position.y = 1.0;
        const angleRatio = (comp.properties?.value || 50) / 100;
        shaftMesh.rotation.y = angleRatio * Math.PI * 1.5;
        group.add(shaftMesh);
      }

      // -------------------------------------------------------------
      // 10. SG90 Micro Servo
      // -------------------------------------------------------------
      else if (comp.type === 'servo-sg90') {
        const caseGeo = new THREE.BoxGeometry(1.4, 1.6, 2.2);
        const caseMat = new THREE.MeshStandardMaterial({
          color: '#0284c7',
          transparent: true,
          opacity: 0.85,
          roughness: 0.3
        });
        const caseMesh = new THREE.Mesh(caseGeo, caseMat);
        caseMesh.position.y = 0.85;
        caseMesh.castShadow = true;
        group.add(caseMesh);

        // Rotating Servo Horn
        const hornGroup = new THREE.Group();
        hornGroup.position.set(0, 1.7, 0.5);

        const hornGeo = new THREE.BoxGeometry(0.3, 0.1, 1.6);
        const hornMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.3 });
        const hornMesh = new THREE.Mesh(hornGeo, hornMat);
        hornMesh.castShadow = true;
        hornGroup.add(hornMesh);

        // Angle rotation from simulation or properties
        const deg = comp.properties?.angle ?? 90;
        hornGroup.rotation.y = (deg * Math.PI) / 180;
        group.add(hornGroup);
        servoArmsRef.current.set(comp.id, hornGroup);
      }

      // -------------------------------------------------------------
      // 11. Piezo Buzzer
      // -------------------------------------------------------------
      else if (comp.type === 'piezo-buzzer') {
        const cylGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.6, 24);
        const buzzerMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.6 });
        const buzzerMesh = new THREE.Mesh(cylGeo, buzzerMat);
        buzzerMesh.position.y = 0.4;
        buzzerMesh.castShadow = true;
        group.add(buzzerMesh);

        const holeGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16);
        const holeMat = new THREE.MeshBasicMaterial({ color: '#000000' });
        const hole = new THREE.Mesh(holeGeo, holeMat);
        hole.position.set(0, 0.71, 0);
        group.add(hole);
      }

      // Generic fallback for any other component
      else {
        const boxGeo = new THREE.BoxGeometry(1.6, 0.8, 1.6);
        const boxMat = new THREE.MeshStandardMaterial({ color: '#64748b' });
        const boxMesh = new THREE.Mesh(boxGeo, boxMat);
        boxMesh.position.y = 0.4;
        group.add(boxMesh);
      }

      // Selection Halo if this component is selected
      if (comp.id === selectedComponentId) {
        const haloGeo = new THREE.BoxGeometry(
          (meta?.size3D?.[0] || 2) + 0.3,
          0.05,
          (meta?.size3D?.[2] || 2) + 0.3
        );
        const haloMat = new THREE.MeshBasicMaterial({
          color: '#38bdf8',
          wireframe: true,
          transparent: true,
          opacity: 0.8
        });
        const halo = new THREE.Mesh(haloGeo, haloMat);
        halo.position.y = 0.05;
        group.add(halo);
      }

      // Add clickable Pin Spheres for 3D Pin connections
      if (meta?.pins) {
        meta.pins.forEach((pin) => {
          const pinSphereGeo = new THREE.SphereGeometry(0.09, 12, 12);
          const isStartPin = wireStartPin?.componentId === comp.id && wireStartPin?.pin === pin.id;
          const pinSphereMat = new THREE.MeshBasicMaterial({
            color: isStartPin ? '#e11d48' : '#38bdf8',
            transparent: true,
            opacity: 0.75
          });
          const pinSphere = new THREE.Mesh(pinSphereGeo, pinSphereMat);

          const px = pin.pos3D[0];
          const py = Math.max(0.2, pin.pos3D[1] + 0.5);
          const pz = pin.pos3D[2];
          pinSphere.position.set(px, py, pz);

          group.add(pinSphere);

          // Calculate world position for wiring
          const worldPos = new THREE.Vector3();
          pinSphere.getWorldPosition(worldPos);

          const pinKey = `${comp.id}:${pin.id}`;
          pinSpheresRef.current.set(pinKey, {
            mesh: pinSphere,
            compId: comp.id,
            pinId: pin.id,
            worldPos: new THREE.Vector3(x3d + px, py, z3d + pz)
          });
        });
      }

      scene.add(group);
      componentMeshesRef.current.set(comp.id, group);
    });

    // -------------------------------------------------------------
    // Build 3D Realistic Jumper Wires (Physical Bezier Curves)
    // -------------------------------------------------------------
    wireMeshesRef.current.forEach((mesh) => {
      scene.remove(mesh);
    });
    wireMeshesRef.current.clear();

    wires.forEach((wire) => {
      const fromPin = pinSpheresRef.current.get(`${wire.from.componentId}:${wire.from.pin}`);
      const toPin = pinSpheresRef.current.get(`${wire.to.componentId}:${wire.to.pin}`);

      if (!fromPin || !toPin) return;

      const pStart = fromPin.worldPos.clone();
      const pEnd = toPin.worldPos.clone();

      // Compute curved arch height based on distance
      const distance = pStart.distanceTo(pEnd);
      const archHeight = Math.min(4.5, Math.max(1.2, distance * 0.35));

      const pMid1 = new THREE.Vector3(
        pStart.x * 0.7 + pEnd.x * 0.3,
        Math.max(pStart.y, pEnd.y) + archHeight,
        pStart.z * 0.7 + pEnd.z * 0.3
      );

      const pMid2 = new THREE.Vector3(
        pStart.x * 0.3 + pEnd.x * 0.7,
        Math.max(pStart.y, pEnd.y) + archHeight * 0.9,
        pStart.z * 0.3 + pEnd.z * 0.7
      );

      const curve = new THREE.CubicBezierCurve3(pStart, pMid1, pMid2, pEnd);
      const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.05, 8, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: wire.color || '#3b82f6',
        roughness: 0.4,
        metalness: 0.1
      });
      const wireMesh = new THREE.Mesh(tubeGeo, tubeMat);
      wireMesh.castShadow = true;

      scene.add(wireMesh);
      wireMeshesRef.current.set(wire.id, wireMesh);
    });
  }, [components, wires, selectedComponentId, wireStartPin, map2DTo3D]);

  // Handle Raycasting for 3D interaction (Clicking Pushbuttons, Selecting Components, Connecting Pins)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!rendererRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = rendererRef.current.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    // 1. Check if clicked a Pin Sphere
    const pinMeshes: THREE.Mesh[] = [];
    pinSpheresRef.current.forEach((val) => pinMeshes.push(val.mesh));
    const pinIntersects = raycaster.intersectObjects(pinMeshes, true);

    if (pinIntersects.length > 0) {
      const hitMesh = pinIntersects[0].object as THREE.Mesh;
      let clickedPin: { compId: string; pinId: string } | null = null;
      const allPins = Array.from(pinSpheresRef.current.values());
      for (const val of allPins) {
        if (val.mesh === hitMesh) {
          clickedPin = { compId: val.compId, pinId: val.pinId };
          break;
        }
      }

      if (clickedPin) {
        const pinData = clickedPin;
        if (!wireStartPin) {
          setWireStartPin({ componentId: pinData.compId, pin: pinData.pinId });
        } else {
          // Connect wire between start pin and clicked pin
          if (
            onConnectPin &&
            (wireStartPin.componentId !== pinData.compId || wireStartPin.pin !== pinData.pinId)
          ) {
            onConnectPin(wireStartPin, { componentId: pinData.compId, pin: pinData.pinId });
          }
          setWireStartPin(null);
        }
        return;
      }
    }

    // 2. Check if clicked a Component
    const groups: THREE.Object3D[] = [];
    componentMeshesRef.current.forEach((group) => groups.push(group));
    const compIntersects = raycaster.intersectObjects(groups, true);

    if (compIntersects.length > 0) {
      let topGroup: THREE.Object3D | null = compIntersects[0].object;
      while (topGroup && topGroup.parent && topGroup.parent !== sceneRef.current) {
        topGroup = topGroup.parent;
      }

      if (topGroup) {
        const compId = topGroup.name;
        const comp = components.find((c) => c.id === compId);

        // If clicked a tactile pushbutton, toggle or trigger it!
        if (comp?.type === 'pushbutton' && onTogglePushbutton) {
          const currentPressed = Boolean(comp.properties?.pressed);
          onTogglePushbutton(comp.id, !currentPressed);
        }

        onSelectComponent(compId);
        return;
      }
    }

    // Clicked empty background
    onSelectComponent(null);
    setWireStartPin(null);
  };

  // Camera Presets
  const setCameraPreset = (preset: 'isometric' | 'top' | 'front') => {
    setViewPreset(preset);
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    if (preset === 'isometric') {
      camera.position.set(13, 16, 19);
      controls.target.set(0, 0, 0);
    } else if (preset === 'top') {
      camera.position.set(0, 24, 0.001);
      controls.target.set(0, 0, 0);
    } else if (preset === 'front') {
      camera.position.set(0, 10, 18);
      controls.target.set(0, 1, 0);
    }
    controls.update();
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-slate-950">
      {/* 3D WebGL Canvas Container */}
      <div
        ref={mountRef}
        onPointerDown={handlePointerDown}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Floating 3D Controls HUD */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1 sm:gap-2 bg-slate-900/90 backdrop-blur-md px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-slate-700/60 shadow-xl max-w-[calc(100vw-1.5rem)] flex-wrap">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">3D Studio</span>
        </span>

        <button
          onClick={() => setCameraPreset('isometric')}
          className={`px-2 sm:px-2.5 py-1 text-xs rounded font-medium transition active:scale-95 ${
            viewPreset === 'isometric'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <span className="hidden sm:inline">Isometric</span>
          <span className="sm:hidden">Iso</span>
        </button>

        <button
          onClick={() => setCameraPreset('top')}
          className={`px-2 sm:px-2.5 py-1 text-xs rounded font-medium transition active:scale-95 ${
            viewPreset === 'top'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <span className="hidden sm:inline">Top-Down</span>
          <span className="sm:hidden">Top</span>
        </button>

        <button
          onClick={() => setCameraPreset('front')}
          className={`px-2 sm:px-2.5 py-1 text-xs rounded font-medium transition active:scale-95 ${
            viewPreset === 'front'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <span className="hidden sm:inline">Front Angle</span>
          <span className="sm:hidden">Front</span>
        </button>
      </div>

      {/* Wire Routing Indicator Banner */}
      {wireStartPin && (
        <div className="absolute top-14 sm:top-4 right-3 left-3 sm:left-auto sm:right-4 z-10 flex items-center justify-between gap-2.5 bg-rose-950/95 border border-rose-500/60 text-rose-200 px-3.5 py-1.5 rounded-lg shadow-2xl animate-pulse text-xs">
          <div className="flex items-center gap-1.5 truncate">
            <Sparkles className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
            <span className="truncate">
              Wiring <strong>{wireStartPin.componentId}</strong> ({wireStartPin.pin}) — tap target pin
            </span>
          </div>
          <button
            onClick={() => setWireStartPin(null)}
            className="ml-2 text-rose-300 hover:text-white underline text-[11px] font-semibold flex-shrink-0"
          >
            Cancel
          </button>
        </div>
      )}

      {/* 3D Navigation Guide Pill at Bottom-Right */}
      <div className="hidden md:flex absolute bottom-4 right-4 z-10 items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-400 pointer-events-none">
        <span>Orbit: <strong>Left Drag</strong></span>
        <span>•</span>
        <span>Pan: <strong>Right Drag</strong></span>
        <span>•</span>
        <span>Zoom: <strong>Scroll</strong></span>
      </div>

      {/* Mobile touch hint pill */}
      <div className="md:hidden absolute bottom-3 right-3 z-10 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2 py-1 rounded text-[10px] text-slate-400 pointer-events-none">
        <span>1-finger orbit • 2-finger zoom</span>
      </div>
    </div>
  );
};
