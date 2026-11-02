'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export function HeroScene() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return
    const mount = mountRef.current

    // ── Renderer ──────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    // ── Scene / Camera ────────────────────────────────────────
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 1000)
    camera.position.set(0, 0, 5)

    // ── Lighting ──────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)
    const pointLight1 = new THREE.PointLight(0xffffff, 1.5, 20)
    pointLight1.position.set(3, 3, 3)
    scene.add(pointLight1)
    const pointLight2 = new THREE.PointLight(0xaaaaaa, 1, 20)
    pointLight2.position.set(-3, -2, 2)
    scene.add(pointLight2)

    // ── Central rotating icosahedron (wireframe) ──────────────
    const icoGeo = new THREE.IcosahedronGeometry(1.4, 1)
    const icoMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.2,
    })
    const ico = new THREE.Mesh(icoGeo, icoMat)
    scene.add(ico)

    // Inner solid icosahedron (glowing core)
    const innerGeo = new THREE.IcosahedronGeometry(0.8, 0)
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.08,
      roughness: 0.1,
      metalness: 0.9,
    })
    const inner = new THREE.Mesh(innerGeo, innerMat)
    scene.add(inner)

    // ── Orbiting torus ring ───────────────────────────────────
    const torusGeo = new THREE.TorusGeometry(2.2, 0.012, 8, 100)
    const torusMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.25,
    })
    const torus = new THREE.Mesh(torusGeo, torusMat)
    torus.rotation.x = Math.PI / 3
    scene.add(torus)

    const torus2 = new THREE.Mesh(
      new THREE.TorusGeometry(2.6, 0.008, 8, 100),
      new THREE.MeshStandardMaterial({ color: 0xcccccc, transparent: true, opacity: 0.15 })
    )
    torus2.rotation.x = -Math.PI / 4
    torus2.rotation.z = Math.PI / 6
    scene.add(torus2)

    // ── Floating particle cloud ───────────────────────────────
    const particleCount = 300
    const particlePositions = new Float32Array(particleCount * 3)
    const particleColors = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 2.5 + Math.random() * 2.5

      particlePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      particlePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      particlePositions[i * 3 + 2] = r * Math.cos(phi)

      // White to light gray
      const brightness = 0.6 + Math.random() * 0.4
      particleColors[i * 3] = brightness
      particleColors[i * 3 + 1] = brightness
      particleColors[i * 3 + 2] = brightness
    }

    const particleGeo = new THREE.BufferGeometry()
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3))
    const particleMat = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    })
    const particles = new THREE.Points(particleGeo, particleMat)
    scene.add(particles)

    // ── Mouse parallax ────────────────────────────────────────
    let mouseX = 0
    let mouseY = 0
    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2
      mouseY = -(e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMouseMove)

    // ── Resize ────────────────────────────────────────────────
    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', onResize)

    // ── Animation loop ────────────────────────────────────────
    let animId = 0
    const clock = new THREE.Clock()

    const animate = () => {
      animId = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()

      ico.rotation.x = t * 0.18
      ico.rotation.y = t * 0.24
      inner.rotation.x = -t * 0.15
      inner.rotation.y = t * 0.30

      torus.rotation.z = t * 0.12
      torus2.rotation.y = t * 0.10
      torus2.rotation.z = -t * 0.08

      particles.rotation.y = t * 0.04
      particles.rotation.x = t * 0.02

      // Smooth mouse parallax
      camera.position.x += (mouseX * 0.8 - camera.position.x) * 0.05
      camera.position.y += (mouseY * 0.8 - camera.position.y) * 0.05
      camera.lookAt(scene.position)

      // Pulse inner core
      const scale = 1 + Math.sin(t * 2) * 0.08
      inner.scale.setScalar(scale)

      renderer.render(scene, camera)
    }

    animate()

    // ── Cleanup ───────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
          obj.geometry.dispose()
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose())
          else obj.material.dispose()
        }
      })
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full"
      style={{ background: 'transparent' }}
    />
  )
}
