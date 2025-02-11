"use client";

import { useEffect, useRef } from "react";
import { Canvas, extend, useThree, useFrame } from "@react-three/fiber";
import {
  Text3D,
  Environment,
  OrbitControls,
  Effects,
  Center,
} from "@react-three/drei";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import gsap from "gsap";
import { Lines } from "./Lines.jsx";
import { Particles } from "./Particles.jsx";
import * as THREE from "three";

extend({ UnrealBloomPass });

function Background() {
  const shaderRef = useRef();

  useFrame(({ clock }) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.time.value = clock.elapsedTime;
    }
  });

  return (
    <mesh>
      <sphereGeometry args={[50, 64, 64]} />
      <shaderMaterial
        ref={shaderRef}
        side={THREE.BackSide}
        uniforms={{
          time: { value: 0 },
        }}
        vertexShader={`
          varying vec3 vWorldPosition;
          
          void main() {
            vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec3 vWorldPosition;
          uniform float time;
          
          // Simplex 3D Noise 
          // by Ian McEwan, Ashima Arts
          vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
          vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
          
          float snoise(vec3 v){ 
            const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
            const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
            
            // First corner
            vec3 i  = floor(v + dot(v, C.yyy) );
            vec3 x0 =   v - i + dot(i, C.xxx) ;
            
            // Other corners
            vec3 g = step(x0.yzx, x0.xyz);
            vec3 l = 1.0 - g;
            vec3 i1 = min( g.xyz, l.zxy );
            vec3 i2 = max( g.xyz, l.zxy );
            
            vec3 x1 = x0 - i1 + 1.0 * C.xxx;
            vec3 x2 = x0 - i2 + 2.0 * C.xxx;
            vec3 x3 = x0 - 1. + 3.0 * C.xxx;
            
            // Permutations
            i = mod(i, 289.0 ); 
            vec4 p = permute( permute( permute( 
                     i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                   + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
                   + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
                   
            // Gradients
            float n_ = 1.0/7.0; // N=7
            vec3  ns = n_ * D.wyz - D.xzx;
            
            vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)
            
            vec4 x_ = floor(j * ns.z);
            vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)
            
            vec4 x = x_ *ns.x + ns.yyyy;
            vec4 y = y_ *ns.x + ns.yyyy;
            vec4 h = 1.0 - abs(x) - abs(y);
            
            vec4 b0 = vec4( x.xy, y.xy );
            vec4 b1 = vec4( x.zw, y.zw );
            
            vec4 s0 = floor(b0)*2.0 + 1.0;
            vec4 s1 = floor(b1)*2.0 + 1.0;
            vec4 sh = -step(h, vec4(0.0));
            
            vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
            vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
            
            vec3 p0 = vec3(a0.xy,h.x);
            vec3 p1 = vec3(a0.zw,h.y);
            vec3 p2 = vec3(a1.xy,h.z);
            vec3 p3 = vec3(a1.zw,h.w);
            
            // Normalise gradients
            vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
            p0 *= norm.x;
            p1 *= norm.y;
            p2 *= norm.z;
            p3 *= norm.w;
            
            // Mix final noise value
            vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
            m = m * m;
            return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                          dot(p2,x2), dot(p3,x3) ) );
          }
          
          void main() {
            vec3 viewDirection = normalize(vWorldPosition);
            
            // Darker blue base color
            vec3 color = vec3(0.005, 0.01, 0.04);
            
            // Add moving nebula with more blue tint, reduced intensity and scale
            float nebula1 = snoise(viewDirection * 1.5 + time * 0.03);
            float nebula2 = snoise(viewDirection * 2.0 - time * 0.05);
            float combinedNebula = (nebula1 + nebula2) * 0.5;
            color += vec3(0.01, 0.02, 0.05) * combinedNebula * 0.2;
            
            // Add subtle color variations
            float colorVar = snoise(viewDirection * 3.0 + time * 0.02);
            color += vec3(0.002, 0.005, 0.015) * colorVar * 0.15;
            
            // Add some brighter areas with low contrast
            float brightness = max(0.0, snoise(viewDirection * 1.0 + time * 0.01));
            color += vec3(0.005, 0.01, 0.02) * brightness * brightness * 0.15;
            
            gl_FragColor = vec4(color, 1.0);
          }
        `}
      />
    </mesh>
  );
}

function Bloom() {
  const { size, scene, camera } = useThree();
  const bloomPass = useRef();

  useEffect(() => {
    bloomPass.current.strength = 2.0;
    bloomPass.current.radius = 0.8;
    bloomPass.current.threshold = 0.1;
  }, []);

  return (
    <Effects disableGamma>
      <unrealBloomPass ref={bloomPass} attachArray="passes" />
    </Effects>
  );
}

function AnimatedText() {
  const textRef = useRef();

  useFrame(({ clock }) => {
    if (textRef.current) {
      textRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.5) * 0.1;
      // Add pulsating effect
      const pulsate = Math.sin(clock.elapsedTime * 2) * 0.5 + 0.5;
      textRef.current.material.emissiveIntensity = 0.5 + pulsate * 0.5;
    }
  });

  return (
    <Center>
      <Text3D
        ref={textRef}
        font="/fonts/inter_bold.json"
        size={1}
        height={0.3}
        bevelEnabled
        bevelThickness={0.01}
        bevelSize={0.01}
        bevelOffset={0}
        bevelSegments={5}
      >
        Hello, World!
        <meshStandardMaterial
          color="#fff"
          emissive="#a0f0ff"
          emissiveIntensity={0.5}
          metalness={0.2}
          roughness={0.3}
          toneMapped={false}
        />
      </Text3D>
    </Center>
  );
}

export default function AnimatedMV() {
  const containerRef = useRef();

  useEffect(() => {
    if (!containerRef.current) return;

    gsap.to(containerRef.current, {
      backgroundColor: "#000000",
      duration: 1,
      ease: "power2.inOut",
    });
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100vh", backgroundColor: "black" }}
    >
      <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
        <Background />
        <OrbitControls enableZoom={false} enablePan={true} />
        <Environment preset="night" />
        <AnimatedText />
        <Lines count={40} />
        <Particles count={400} />
        <Bloom />
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1.0} />
        <spotLight
          position={[-5, 5, 0]}
          angle={0.5}
          penumbra={0.5}
          intensity={1.0}
          castShadow
        />
      </Canvas>
    </div>
  );
}
