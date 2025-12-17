"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import { GlassCard } from "@/components/ui/glass-card";

function GlowingGlobe() {
    const meshRef = useRef<THREE.Mesh>(null);

    // Create particles for the globe surface
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < 2000; i++) {
            const phi = Math.acos(-1 + (2 * i) / 2000);
            const theta = Math.sqrt(2000 * Math.PI) * phi;
            const x = 2 * Math.cos(theta) * Math.sin(phi);
            const y = 2 * Math.sin(theta) * Math.sin(phi);
            const z = 2 * Math.cos(phi);
            temp.push(x, y, z);
        }
        return new Float32Array(temp);
    }, []);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.002;
            meshRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.2) * 0.1;
        }
    });

    return (
        <group>
            {/* Core Sphere */}
            <mesh ref={meshRef}>
                <sphereGeometry args={[2, 64, 64]} />
                <meshBasicMaterial color="#000000" transparent opacity={0.8} />
                <points>
                    <bufferGeometry>
                        <bufferAttribute
                            attach="attributes-position"
                            count={particles.length / 3}
                            array={particles}
                            args={[particles, 3]}
                        />
                    </bufferGeometry>
                    <pointsMaterial size={0.02} color="#4ade80" transparent opacity={0.6} />
                </points>
            </mesh>

            {/* Atmosphere Glow */}
            <mesh scale={[2.2, 2.2, 2.2]}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshBasicMaterial color="#4ade80" transparent opacity={0.05} side={THREE.BackSide} />
            </mesh>
        </group>
    );
}

function ConnectionLines() {
    // Connecting Barranquilla (approx coords mapped to sphere) to world cities
    return (
        <group rotation={[0.5, 2, 0]}>
            <line>
                <bufferGeometry>
                    <float32BufferAttribute attach="attributes-position" args={[new Float32Array([0, 2, 0, 1.5, 1.5, 0.5]), 3]} />
                </bufferGeometry>
                <lineBasicMaterial color="#3b82f6" transparent opacity={0.5} />
            </line>
            <line>
                <bufferGeometry>
                    <float32BufferAttribute attach="attributes-position" args={[new Float32Array([0, 2, 0, -1, 1.5, 1]), 3]} />
                </bufferGeometry>
                <lineBasicMaterial color="#3b82f6" transparent opacity={0.5} />
            </line>
        </group>
    )
}

export function GlobalReach() {
    return (
        <section className="relative h-[80vh] w-full overflow-hidden bg-black">
            <div className="absolute inset-0 z-0">
                <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
                    <ambientLight intensity={0.5} />
                    <GlowingGlobe />
                    <ConnectionLines />
                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                    <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
                </Canvas>
            </div>

            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-center space-y-4">
                    <GlassCard className="inline-block px-6 py-2">
                        <span className="text-xs font-mono text-green-400 tracking-widest uppercase animate-pulse">
                            ● Red Activa
                        </span>
                    </GlassCard>
                    <h2 className="text-4xl md:text-7xl font-bold text-white tracking-tighter mix-blend-difference">
                        DESDE BARRANQUILLA.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
                            DESPLEGANDO GLOBALMENTE.
                        </span>
                    </h2>
                </div>
            </div>

            {/* Data Points */}
            <div className="absolute bottom-12 left-12 hidden md:block">
                <div className="text-xs font-mono text-white/40 space-y-1">
                    <p>MAPA DE LATENCIA:</p>
                    <p className="text-green-400">BOGOTÁ: 12ms</p>
                    <p className="text-blue-400">MIAMI: 45ms</p>
                    <p className="text-purple-400">NYC: 82ms</p>
                </div>
            </div>
        </section>
    );
}
