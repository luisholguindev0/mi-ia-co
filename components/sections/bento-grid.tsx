"use client";

import { useState, useRef, useMemo, memo } from "react";
import { motion } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Float } from "@react-three/drei";
import * as THREE from "three";
import {
    Zap, Globe, Cpu, Shield, Activity,
    Search, BarChart3, Workflow, CreditCard,
    ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Visual Components ---

const AtomVisual = memo(() => (
    <div className="relative w-full h-full flex items-center justify-center">
        <svg viewBox="-50 -50 100 100" className="w-full h-full opacity-80" style={{ filter: "drop-shadow(0 0 5px rgba(97,218,251,0.5))" }}>
            <circle cx="0" cy="0" r="4" fill="#61dafb"><animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" /></circle>
            <g fill="none" stroke="#61dafb" strokeWidth="0.5" strokeOpacity="0.4">
                <ellipse rx="20" ry="6" transform="rotate(0)" />
                <ellipse rx="20" ry="6" transform="rotate(60)" />
                <ellipse rx="20" ry="6" transform="rotate(120)" />
            </g>
            <circle r="1.5" fill="#fff"><animateMotion dur="3s" repeatCount="indefinite"><mpath href="#p1" /></animateMotion></circle>
            <path id="p1" d="M -20 0 A 20 6 0 1 1 20 0 A 20 6 0 1 1 -20 0" fill="none" />
        </svg>
    </div>
));
AtomVisual.displayName = "AtomVisual";

const NeuralVisual = memo(() => {
    // Architecture: Input (4), Hidden (6), Hidden (6), Output (2)
    const { nodes, connections } = useMemo(() => {
        const layers = [4, 6, 6, 2];
        const xGap = 50;
        const yGap = 20;
        const offset = { x: 30, y: 30 };

        const nodesList = layers.flatMap((count, layerIdx) =>
            Array.from({ length: count }).map((_, nodeIdx) => {
                const height = count * yGap;
                const yOffset = (140 - height) / 2; // Center vertically in 140px viewbox
                return {
                    id: `l${layerIdx}-n${nodeIdx}`,
                    layer: layerIdx,
                    x: offset.x + layerIdx * xGap,
                    y: yOffset + nodeIdx * yGap + 10,
                    color: layerIdx === 0 ? "#60a5fa" : // Blue input
                        layerIdx === layers.length - 1 ? "#4ade80" : // Green output
                            "#a5b4fc" // Indigo hidden
                };
            })
        );

        const connectionsList: { start: { id: string; x: number; y: number; layer: number }; end: { id: string; x: number; y: number; layer: number }; id: string }[] = [];
        nodesList.forEach(node => {
            if (node.layer < layers.length - 1) {
                const nextLayerNodes = nodesList.filter(n => n.layer === node.layer + 1);
                nextLayerNodes.forEach(target => {
                    connectionsList.push({
                        start: node,
                        end: target,
                        id: `${node.id}-${target.id}`
                    });
                });
            }
        });

        return { nodes: nodesList, connections: connectionsList };
    }, []);

    return (
        <div className="w-full h-full flex items-center justify-center opacity-80">
            <svg viewBox="0 0 220 140" className="w-full h-full">
                {/* Connections */}
                <g strokeOpacity="0.2" strokeWidth="0.5">
                    {connections.map((conn) => (
                        <line
                            key={conn.id}
                            x1={conn.start.x} y1={conn.start.y}
                            x2={conn.end.x} y2={conn.end.y}
                            stroke="#818cf8"
                        />
                    ))}
                </g>

                {/* Animated Signals - Randomly firing */}
                {connections.map((conn, i) => (
                    // Only animate a subset to avoid chaos
                    i % 3 === 0 && (
                        <circle key={`sig-${i}`} r="1.5" fill={conn.start.layer === 0 ? "#60a5fa" : "#fff"}>
                            <animateMotion
                                dur={`${1 + (i % 5) * 0.2}s`} // Deterministic duration based on index
                                repeatCount="indefinite"
                                begin={`${(i % 3)}s`} // Deterministic delay
                                path={`M${conn.start.x},${conn.start.y} L${conn.end.x},${conn.end.y}`}
                                calcMode="linear"
                            />
                            <animate
                                attributeName="opacity"
                                values="0;1;0"
                                dur={`${1 + (i % 5) * 0.2}s`}
                                repeatCount="indefinite"
                                begin={`${(i % 3)}s`}
                            />
                        </circle>
                    )
                ))}

                {/* Nodes */}
                {nodes.map((node) => (
                    <motion.circle
                        key={node.id}
                        cx={node.x}
                        cy={node.y}
                        r={node.layer === 0 || node.layer === 3 ? 3.5 : 2.5}
                        fill={node.layer === 0 ? "none" : node.color}
                        stroke={node.color}
                        strokeWidth={node.layer === 0 ? 1.5 : 0}
                        initial={{ scale: 0.8, opacity: 0.5 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                            repeat: Infinity,
                            repeatType: "reverse",
                            duration: 1.5,
                            delay: node.layer * 0.2 // Wave effect across layers
                        }}
                    />
                ))}
            </svg>
        </div>
    );
});
NeuralVisual.displayName = "NeuralVisual";

// --- 3D Globe Components ---

function GlobePoints(props: Record<string, unknown>) {
    const ref = useRef<THREE.Points>(null);

    // Generate random points on a sphere
    const [sphere] = useState(() => {
        const count = 800;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const phi = Math.acos(-1 + (2 * i) / count);
            const theta = Math.sqrt(count * Math.PI) * phi;

            const r = 1.6;

            positions[i * 3] = r * Math.cos(theta) * Math.sin(phi);
            positions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
            positions[i * 3 + 2] = r * Math.cos(phi);

            // Green variations for "matrix" look or blue/cyan for "earth"
            colors[i * 3] = 0.1;
            colors[i * 3 + 1] = 0.5 + Math.random() * 0.5; // Green-ish
            colors[i * 3 + 2] = 0.5 + Math.random() * 0.5; // Blue-ish
        }
        return { positions, colors };
    });

    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.rotation.y += delta * 0.1;
        }
    });

    return (
        <group rotation={[0, 0, Math.PI / 6]}>
            <Points ref={ref} stride={3} positions={sphere.positions} colors={sphere.colors} {...props}>
                <PointMaterial
                    transparent
                    color="#fff"
                    size={0.04}
                    sizeAttenuation={true}
                    depthWrite={false}
                    vertexColors
                />
            </Points>
        </group>
    );
}

function GlobeConnections() {
    const ref = useRef<THREE.Group>(null);
    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.rotation.y += delta * 0.1; // Sync rotation roughly
        }
    });

    return (
        <group ref={ref} rotation={[0, 0, Math.PI / 6]}>
            {/* Abstract rings to simulate data paths around the globe */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[1.7, 1.71, 64]} />
                <meshBasicMaterial color="#4ade80" transparent opacity={0.15} side={THREE.DoubleSide} />
            </mesh>
            <mesh rotation={[0.5, 0.5, 0]}>
                <ringGeometry args={[1.8, 1.81, 64]} />
                <meshBasicMaterial color="#60a5fa" transparent opacity={0.1} side={THREE.DoubleSide} />
            </mesh>
        </group>
    )
}

// PERFORMANCE OPTIMIZATION: 
// Virtual Viewport Strategy. We render the globe at a fixed high-resolution size
// and simpler scale it with CSS transform. This prevents the heavy WebGL Context
// from ever resizing/recalculating (0 cost on resize), while still giving the 
// visual "pop" of sync resize.
const GlobalEdgeVisual = memo(({ isHovered }: { isHovered?: boolean }) => (
    <div className="w-full h-full pointer-events-none flex items-center justify-center overflow-hidden">
        <motion.div
            className="w-[600px] h-[500px] flex-shrink-0"
            animate={{ scale: isHovered ? 1 : 0.6 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        >
            <Canvas
                camera={{ position: [0, 0, 5], fov: 45 }}
                gl={{ alpha: true, antialias: true }}
                dpr={1}
                // CRITICAL: Disable auto-resize to lock buffer size
                resize={{ scroll: false, offsetSize: true }}
            >
                <ambientLight intensity={0.5} />
                <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.2}>
                    <GlobePoints />
                    <GlobeConnections />
                </Float>
            </Canvas>
        </motion.div>
    </div>
));
GlobalEdgeVisual.displayName = "GlobalEdgeVisual";

const ShieldVisual = memo(() => (
    <div className="relative w-full h-full flex items-center justify-center">
        <Shield className="w-16 h-16 text-blue-500/20" strokeWidth={1} />
        <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
                animate={{ height: ["0%", "100%", "0%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="w-16 bg-gradient-to-b from-transparent via-blue-400/10 to-transparent absolute"
            />
        </div>
    </div>
));
ShieldVisual.displayName = "ShieldVisual";

const AnalyticsVisual = memo(() => (
    <div className="w-full h-full flex items-end justify-between p-4 gap-1 opacity-60">
        {[40, 70, 50, 90, 60, 80].map((h, i) => (
            <motion.div
                key={i}
                className="w-full bg-orange-500/20 rounded-t"
                animate={{ height: [`${h}%`, `${h - 20}%`, `${h}%`] }}
                transition={{ duration: 2 + i * 0.2, repeat: Infinity }}
            />
        ))}
    </div>
));
AnalyticsVisual.displayName = "AnalyticsVisual";

const SeoVisual = memo(() => (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
        {/* Animated Search Bar */}
        <div className="w-full max-w-[80%] h-10 border border-cyan-500/30 rounded-full flex items-center px-4 gap-3 bg-black/40 backdrop-blur-sm mb-4 relative overflow-hidden">
            <Search className="w-4 h-4 text-cyan-400" />
            <motion.div
                className="h-4 bg-cyan-400/20 rounded-sm"
                animate={{ width: ["0%", "60%", "60%", "0%"] }}
                transition={{ duration: 4, repeat: Infinity, times: [0, 0.3, 0.8, 1] }}
            />
            <motion.div
                className="absolute right-3 w-1.5 h-4 bg-cyan-400"
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
            />
        </div>

        {/* Animated Results */}
        <div className="w-full max-w-[80%] space-y-2">
            {[1, 2, 3].map((i) => (
                <motion.div
                    key={i}
                    className="flex flex-col gap-1.5"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: [0, 1, 1, 0], x: [-10, 0, 0, 10] }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        delay: 1.2 + (i * 0.2),
                        times: [0, 0.1, 0.8, 1]
                    }}
                >
                    <div className="h-2 w-1/3 bg-cyan-400/40 rounded-sm" />
                    <div className="h-1.5 w-full bg-cyan-400/10 rounded-sm" />
                </motion.div>
            ))}
        </div>
    </div>
));
SeoVisual.displayName = "SeoVisual";

const WorkflowVisual = memo(() => (
    <div className="w-full h-full flex items-center justify-center opacity-80">
        <svg viewBox="0 0 200 120" className="w-full h-full">
            <defs>
                <marker id="wf-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill="#ec4899" fillOpacity="0.5" />
                </marker>
            </defs>

            {/* Paths */}
            <path d="M30 60 H 70" stroke="#ec4899" strokeWidth="1" strokeOpacity="0.3" markerEnd="url(#wf-arrow)" />
            <path d="M90 60 C 90 60, 110 60, 105 40" stroke="#ec4899" strokeWidth="1" strokeOpacity="0.3" fill="none" />
            <path d="M90 60 C 90 60, 110 60, 105 80" stroke="#ec4899" strokeWidth="1" strokeOpacity="0.3" fill="none" />
            <path d="M125 40 H 150" stroke="#ec4899" strokeWidth="1" strokeOpacity="0.3" markerEnd="url(#wf-arrow)" />
            <path d="M125 80 H 150" stroke="#ec4899" strokeWidth="1" strokeOpacity="0.3" markerEnd="url(#wf-arrow)" />

            {/* Floating Packets */}
            <circle r="2" fill="#fff">
                <animateMotion dur="2s" repeatCount="indefinite" path="M30 60 H 70" />
            </circle>
            <circle r="2" fill="#fff">
                <animateMotion dur="2s" begin="0.5s" repeatCount="indefinite" path="M125 40 H 160" />
            </circle>
            <circle r="2" fill="#fff">
                <animateMotion dur="2s" begin="0.7s" repeatCount="indefinite" path="M125 80 H 160" />
            </circle>

            {/* Nodes */}
            <g transform="translate(20, 50)">
                <rect width="20" height="20" rx="4" fill="#ec4899" fillOpacity="0.1" stroke="#ec4899" strokeWidth="1" />
                <path d="M5 10 L10 15 L15 5" fill="none" stroke="#ec4899" strokeWidth="1.5" transform="scale(0.8) translate(2,2)" />
            </g>

            <g transform="translate(70, 50)">
                <rect width="20" height="20" rx="10" fill="#ec4899" fillOpacity="0.1" stroke="#ec4899" strokeWidth="1" />
                <path d="M10 5 V 15 M 5 10 H 15" stroke="#ec4899" strokeWidth="1.5" />
            </g>

            <g transform="translate(105, 30)">
                <rect width="20" height="20" rx="4" fill="#ec4899" fillOpacity="0.1" stroke="#ec4899" strokeWidth="1" />
            </g>

            <g transform="translate(105, 70)">
                <rect width="20" height="20" rx="4" fill="#ec4899" fillOpacity="0.1" stroke="#ec4899" strokeWidth="1" />
            </g>

        </svg>
    </div>
));
WorkflowVisual.displayName = "WorkflowVisual";

const PaymentsVisual = memo(() => (
    <div className="w-full h-full flex items-center justify-center perspective-[1000px]">
        {/* Floating Card */}
        <motion.div
            className="w-32 h-20 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-600/20 border border-white/10 backdrop-blur-md relative overflow-hidden shadow-2xl flex flex-col justify-between p-3"
            animate={{
                rotateY: [0, 10, 0, -10, 0],
                rotateX: [0, 5, 0, 5, 0],
                y: [0, -5, 0]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
            {/* Shimmer Effect */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                animate={{ x: ["-150%", "150%"] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 1 }}
            />

            <div className="w-8 h-5 bg-yellow-500/20 rounded flex items-center justify-center border border-yellow-500/30">
                <div className="w-4 h-3 border-2 border-yellow-500/50 rounded-sm" />
            </div>
            <div className="space-y-1">
                <div className="h-1.5 w-3/4 bg-white/20 rounded-full" />
                <div className="h-1.5 w-1/2 bg-white/20 rounded-full" />
            </div>
        </motion.div>

        {/* Background Particles Flowing In */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {[...Array(6)].map((_, i) => (
                <circle key={i} r="1.5" fill="#a855f7">
                    <animateMotion
                        dur={`${2 + i * 0.5}s`}
                        repeatCount="indefinite"
                        path={`M ${i % 2 === 0 ? '0' : '100%'} ${100 - (i * 10)} Q 50 50 50 50`}
                    />
                    <animate attributeName="opacity" values="0;1;0" dur={`${2 + i * 0.5}s`} repeatCount="indefinite" />
                </circle>
            ))}
        </svg>
    </div>
));
PaymentsVisual.displayName = "PaymentsVisual";

// --- Data ---
const bentoItems = [
    {
        id: 0,
        title: "Núcleo Next.js",
        desc: "Architecture vanguardista con Server Actions y React Server Components.",
        icon: Zap,
        color: "text-blue-400",
        bg: "bg-blue-500/5",
        visual: AtomVisual
    },
    {
        id: 1,
        title: "Inteligencia Neural",
        desc: "Orquestación multi-modelo con Llama 3, GPT-4o y Claude 3.5.",
        icon: Cpu,
        color: "text-indigo-400",
        bg: "bg-indigo-500/5",
        visual: NeuralVisual
    },
    {
        id: 2,
        title: "Red Global Edge",
        desc: "Despliegue distribuido en 35 regiones para latencia cero.",
        icon: Globe,
        color: "text-green-400",
        bg: "bg-green-500/5",
        visual: GlobalEdgeVisual
    },
    {
        id: 3,
        title: "Ciberseguridad",
        desc: "Encriptación militar y detección de amenazas en tiempo real.",
        icon: Shield,
        color: "text-emerald-400",
        bg: "bg-emerald-500/5",
        visual: ShieldVisual
    },
    {
        id: 4,
        title: "SLA 99.99%",
        desc: "Infraestructura redundante garantizada por contrato.",
        icon: Activity,
        color: "text-orange-400",
        bg: "bg-orange-500/5",
        visual: AnalyticsVisual
    },
    {
        id: 5,
        title: "Dominio SEO",
        desc: "Optimización técnica y semántica para rankings superiores.",
        icon: Search,
        color: "text-cyan-400",
        bg: "bg-cyan-500/5",
        visual: SeoVisual
    },
    {
        id: 6,
        title: "Data Predictiva",
        desc: "Dashboards en tiempo real con insights accionables.",
        icon: BarChart3,
        color: "text-yellow-400",
        bg: "bg-yellow-500/5",
        visual: AnalyticsVisual // Reused style but different
    },
    {
        id: 7,
        title: "Workflows",
        desc: "Automatización de procesos complejos end-to-end.",
        icon: Workflow,
        color: "text-pink-400",
        bg: "bg-pink-500/5",
        visual: WorkflowVisual
    },
    {
        id: 8,
        title: "Pagos Globales",
        desc: "Integración nativa de Stripe y Crypto payments.",
        icon: CreditCard,
        color: "text-purple-400",
        bg: "bg-purple-500/5",
        visual: PaymentsVisual
    }
];

export function BentoGrid() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    // Initial Grid State Logic
    const getRowCol = (index: number) => {
        return { row: Math.floor(index / 3), col: index % 3 };
    };

    const hoveredPos = hoveredIndex !== null ? getRowCol(hoveredIndex) : null;

    const getTrackSize = (activeIdx: number | undefined, currentIdx: number) => {
        if (activeIdx === undefined) return "1fr";
        return activeIdx === currentIdx ? "2fr" : "1fr";
    };

    const gridCols = hoveredPos
        ? `${getTrackSize(hoveredPos.col, 0)} ${getTrackSize(hoveredPos.col, 1)} ${getTrackSize(hoveredPos.col, 2)}`
        : "1fr 1fr 1fr";

    const gridRows = hoveredPos
        ? `${getTrackSize(hoveredPos.row, 0)} ${getTrackSize(hoveredPos.row, 1)} ${getTrackSize(hoveredPos.row, 2)}`
        : "1fr 1fr 1fr";

    return (
        <section ref={containerRef} className="relative pt-12 pb-24 px-4 md:px-8 max-w-7xl mx-auto min-h-screen flex flex-col justify-center">

            <div className="mb-20 text-center relative z-10 max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="inline-block py-1 px-3 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-md mb-6"
                    >
                        <span className="text-blue-400 text-xs font-bold tracking-[0.2em] uppercase">
                            Infraestructura Integral
                        </span>
                    </motion.div>

                    <h2 className="text-4xl md:text-7xl font-bold tracking-tighter mb-6 relative">
                        <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/50">
                            ECOSISTEMA DE
                        </span>
                        <br className="md:hidden" />
                        <span className="relative inline-block ml-0 md:ml-4">
                            <span className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 blur-2xl opacity-20 animate-pulse" />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-white to-purple-300 bg-[length:200%_auto] animate-shine">
                                ALTO RENDIMIENTO
                            </span>
                        </span>
                    </h2>

                    <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto font-light leading-relaxed">
                        Arquitectura digital diseñada para la <span className="text-blue-400 font-medium">escalabilidad masiva</span>, integrando inteligencia artificial, seguridad de grado militar y optimización semántica avanzada.
                    </p>
                </motion.div>

                {/* Decorative background glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[200px] bg-blue-500/10 blur-[120px] -z-10 rounded-full pointer-events-none" />
            </div>

            {/* Desktop Grid - "Abstract Accordion" Environment */}
            <div
                className="hidden md:grid gap-4 w-full h-[800px] transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] will-change-[grid-template-columns,grid-template-rows]"
                style={{
                    gridTemplateColumns: gridCols,
                    gridTemplateRows: gridRows
                }}
            >
                {bentoItems.map((item, index) => {
                    const isHovered = hoveredIndex === index;
                    const VisualComponent = item.visual;

                    return (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.4, delay: index * 0.05 }}
                            className={cn(
                                "bento-item relative overflow-hidden rounded-2xl group cursor-pointer border border-white/5 bg-black/40 backdrop-blur-md transition-all duration-500",
                                item.bg,
                                isHovered ? "z-10 shadow-2xl shadow-blue-900/10 ring-1 ring-white/20" : "grayscale-[0.5] hover:grayscale-0"
                            )}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            onClick={() => setHoveredIndex(index === hoveredIndex ? null : index)}
                        >
                            {/* Background Visual Layer */}
                            <div className={cn(
                                "absolute inset-0 transition-opacity duration-500",
                                isHovered ? "opacity-80" : "opacity-40"
                            )}>
                                {/* Pass prop for visuals that need to react to hover (Optimization) */}
                                <VisualComponent isHovered={isHovered} />
                            </div>

                            {/* Content Layer */}
                            <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
                                <div className="flex justify-between items-start">
                                    <div className={cn(
                                        "p-2 rounded-lg bg-white/5 backdrop-blur-sm transition-colors duration-300",
                                        isHovered ? "bg-white/10" : ""
                                    )}>
                                        <item.icon className={cn("w-6 h-6", item.color)} />
                                    </div>
                                    <ArrowUpRight className={cn(
                                        "w-5 h-5 text-white/20 transition-all duration-300",
                                        isHovered ? "opacity-100 translate-x-1 -translate-y-1" : "opacity-0"
                                    )} />
                                </div>

                                <div>
                                    <h3 className={cn(
                                        "font-bold text-white transition-all duration-300",
                                        isHovered ? "text-2xl mb-2" : "text-lg md:text-xl"
                                    )}>
                                        {item.title}
                                    </h3>

                                    {/* Description with "Accordion" reveal effect */}
                                    <div className={cn(
                                        "overflow-hidden transition-all duration-500 ease-out",
                                        isHovered ? "max-h-24 opacity-100" : "max-h-0 opacity-0 md:max-h-0"
                                    )}>
                                        <p className="text-sm text-white/60 leading-relaxed font-light">
                                            {item.desc}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Mobile View - Stacked list with expand functionality */}
            <div className="md:hidden flex flex-col gap-4">
                {bentoItems.map((item, index) => {
                    const isExpanded = hoveredIndex === index;
                    const VisualComponent = item.visual;

                    return (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className={cn(
                                "bento-item border border-white/10 rounded-xl bg-white/5 p-6 active:scale-[0.98] transition-all",
                                isExpanded ? "border-blue-500/30 bg-blue-900/10" : ""
                            )}
                            onClick={() => setHoveredIndex(isExpanded ? null : index)}
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <item.icon className={cn("w-6 h-6", item.color)} />
                                <h3 className="font-bold text-white text-lg">{item.title}</h3>
                            </div>
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    className="text-sm text-white/60"
                                >
                                    {item.desc}
                                    <div className="mt-4 h-32 w-full rounded bg-black/20 overflow-hidden relative">
                                        <VisualComponent isHovered={isExpanded} />
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

        </section>
    );
}
