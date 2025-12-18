"use client";

import { Canvas, useFrame, useThree, extend } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useMousePosition } from "@/hooks/use-mouse-position";
import { shaderMaterial } from "@react-three/drei";

// Optimzed Shader Material
// Moves all math from CPU to GPU (Vertex Shader)
const FluidGridMaterial = shaderMaterial(
    {
        uTime: 0,
        uMouse: new THREE.Vector2(0, 0),
        uColor: new THREE.Color("#00f3ff"),
    },
    // Vertex Shader
    `
    uniform float uTime;
    uniform vec2 uMouse;
    varying float vDistance;

    void main() {
        vec3 pos = position;
        
        // Grid Wave Logic (GLSL)
        float d = distance(pos.xy, uMouse);
        
        // Base Wave
        float z = sin(pos.x * 0.1 + uTime) * cos(pos.y * 0.1 + uTime) * 2.0;

        // Mouse Ripple
        // If distance is less than threshold, push up
        if (d < 40.0) {
            z += (40.0 - d) * 2.0;
        }

        pos.z = z;
        vDistance = z;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        // Size attenuation
        gl_PointSize = 4.0 * (50.0 / -mvPosition.z);
    }
    `,
    // Fragment Shader
    `
    uniform vec3 uColor;
    varying float vDistance;

    void main() {
        // Circular particle shape
        float r = distance(gl_PointCoord, vec2(0.5));
        if (r > 0.5) discard;

        // Dynamic opacity based on height (Z)
        float opacity = 0.3 + (vDistance * 0.1);
        
        gl_FragColor = vec4(uColor, opacity);
    }
    `
);

extend({ FluidGridMaterial });



function GridMesh() {
    const materialRef = useRef<THREE.ShaderMaterial & { uTime: number; uMouse: THREE.Vector2 }>(null);
    const mouse = useMousePosition();
    const { viewport } = useThree();

    // Static Geometry (Created Once)
    const count = 100; // Grid density
    const sep = 3;    // Separation

    const particles = useMemo(() => {
        const positions = new Float32Array(count * count * 3);
        for (let i = 0; i < count; i++) {
            for (let j = 0; j < count; j++) {
                const x = (i - count / 2) * sep;
                const y = (j - count / 2) * sep;
                const z = 0;
                const index = (i * count + j) * 3;
                positions[index] = x;
                positions[index + 1] = y;
                positions[index + 2] = z;
            }
        }
        return positions;
    }, []);

    useFrame((state) => {
        if (!materialRef.current) return;

        // Update Uniforms (Cheap)
        materialRef.current.uTime = state.clock.getElapsedTime();

        // Approximate mouse world mapping
        // We match the previous logic: mouseX * (viewport.width / 2)
        const mouseX = (mouse.x / window.innerWidth) * 2 - 1;
        const mouseY = -(mouse.y / window.innerHeight) * 2 + 1;
        const vecX = mouseX * (viewport.width / 2);
        const vecY = mouseY * (viewport.height / 2);

        // The original code used a scaling factor of 30 for the mouse vector distance check?
        // Let's pass the raw world coordinates and handle '30' scaling in shader or here.
        // Original: dx = x - vecX * 30
        // So shader expects mouse to be scaled by 30 relative to grid units?
        // Actually, looking at previous code: x and y are grid coords (sep=3, count=100 -> range -150 to 150)
        // previous logic: dx = x - vecX * 30. 
        // If viewport.width is e.g. 50 (camera z=50), vecX is small. 
        // Let's pass the pre-scaled vector to match the original behavior perfectly.

        materialRef.current.uMouse = new THREE.Vector2(vecX * 30, vecY * 30);
    });

    return (
        <points rotation={[-Math.PI / 4, 0, 0]}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[particles, 3]}
                />
            </bufferGeometry>
            {/* @ts-expect-error custom element */}
            <fluidGridMaterial ref={materialRef} />
        </points>
    );
}

export function FluidBackground() {
    return (
        <div className="absolute inset-0 -z-10 h-full w-full bg-[#030014]">
            <Canvas
                camera={{ position: [0, 0, 50], fov: 75 }}
                dpr={1} // Performance Optimization: Lock DPI
                resize={{ debounce: 0 }} // Sync resize if needed
                gl={{ antialias: false }} // Dissable MSAA for performance
            >
                <fog attach="fog" args={["#030014", 20, 100]} />
                <ambientLight intensity={0.5} />
                <GridMesh />
            </Canvas>
        </div>
    );
}
