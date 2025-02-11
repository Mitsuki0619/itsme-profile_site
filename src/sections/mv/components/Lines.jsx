"use client"

import { useRef, useMemo, useCallback } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"


export function Lines({ count = 80 }) {
  const meshRef = useRef()
  const { viewport } = useThree()

  const createNewLine = useCallback(
    () => {
    const phi = Math.random() * Math.PI * 2
    const theta = Math.random() * Math.PI
    const length = Math.random() * 15 + 20
    const speed = Math.random() * 10 + 5
    const maxLife = Math.random() * 5 + 5

    const direction = new THREE.Vector3(
      Math.sin(theta) * Math.cos(phi),
      Math.sin(theta) * Math.sin(phi),
      Math.cos(theta),
    ).normalize()

    return {
      position: new THREE.Vector3(0, 0, 0),
      direction: direction,
      length: length,
      speed: speed,
      life: maxLife,
      maxLife: maxLife,
      color: new THREE.Color(0.5 + Math.random() * 0.5, 0.7 + Math.random() * 0.3, 1),
    }
  },
    [],
  )

  const linesData = useMemo(() => {
    return Array(count)
      .fill(0)
      .map(() => createNewLine())
  }, [count, createNewLine])

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const colorArray = useMemo(() => new Float32Array(count * 3), [count])

  useFrame((state, delta) => {
    if (!meshRef.current) return

    const maxDistance = Math.max(viewport.width, viewport.height) * 2

    linesData.forEach((line, i) => {
      const movement = line.direction.clone().multiplyScalar(line.speed * delta)
      line.position.add(movement)

      line.life -= delta

      if (line.life <= 0 || line.position.length() > maxDistance) {
        const newLine = createNewLine()
        Object.assign(line, newLine)
      }

      const currentLength = line.position.length()
      const scale = 0.05 * (0.3 + 0.3 * (line.life / line.maxLife))
      dummy.position.copy(line.position.clone().multiplyScalar(0.5))
      dummy.scale.set(scale, currentLength / 2, scale)
      dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), line.direction)
      dummy.updateMatrix()

      meshRef.current.setMatrixAt(i, dummy.matrix)

      line.color.toArray(colorArray, i * 3)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
    meshRef.current.geometry.setAttribute("color", new THREE.InstancedBufferAttribute(colorArray, 3))
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <cylinderGeometry args={[1, 1, 1, 8]} />
      <meshBasicMaterial color="#a0f0ff" vertexColors transparent opacity={0.5} blending={THREE.AdditiveBlending} />
    </instancedMesh>
  )
}

