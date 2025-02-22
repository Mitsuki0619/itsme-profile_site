"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";

export function Particles({ count = 200 }) {
  const meshRef = useRef();
  const { viewport } = useThree();
  const timeRef = useRef(0);

  const createParticle = () => {
    const phi = Math.random() * Math.PI * 2;
    const theta = Math.random() * Math.PI;
    const radius = Math.random() * 2;
    const speed = Math.random() * 0.08;

    const x = radius * Math.sin(theta) * Math.cos(phi);
    const y = radius * Math.sin(theta) * Math.sin(phi);
    const z = radius * Math.cos(theta);

    const maxLife = Math.random() * 20 + 5;
    const isLarge = Math.random() < 0.1;

    return {
      position: new THREE.Vector3(x, y, z),
      velocity: new THREE.Vector3(x, y, z).normalize().multiplyScalar(speed),
      scale: isLarge
        ? Math.random() * 0.15 + 0.05
        : Math.random() * 0.05 + 0.02,
      life: maxLife,
      maxLife: maxLife,
      color: new THREE.Color(
        0.6 + Math.random() * 0.4,
        0.8 + Math.random() * 0.2,
        1
      ),
      isLarge,
    };
  };

  const particlesData = useMemo(() => {
    return Array(count)
      .fill(0)
      .map(() => createParticle());
  }, [count, createParticle]); // Added createParticle to dependencies

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorArray = useMemo(() => new Float32Array(count * 3), [count]);

  useEffect(() => {
    timeRef.current = 0;
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    timeRef.current += delta;
    const maxDistance = Math.max(viewport.width, viewport.height) * 6;

    particlesData.forEach((particle, i) => {
      const adjustedVelocity = particle.velocity.clone();
      particle.position.add(adjustedVelocity);

      particle.life -= delta;

      if (particle.life <= 0 || particle.position.length() > maxDistance) {
        const newParticle = createParticle();
        Object.assign(particle, newParticle);
      }

      const scale =
        particle.scale * (0.3 + 1 * (particle.life / particle.maxLife));
      dummy.position.copy(particle.position);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);

      particle.color.toArray(colorArray, i * 3);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.geometry.setAttribute(
      "color",
      new THREE.InstancedBufferAttribute(colorArray, 3)
    );
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial
        color="#a0f0ff"
        vertexColors
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
}
