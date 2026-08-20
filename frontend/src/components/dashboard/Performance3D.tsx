"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface Performance3DProps {
  score: number;
  streak: number;
  topicsMastered: number;
}

export default function Performance3D({ score, streak, topicsMastered }: Performance3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create 3D objects based on performance data
    const group = new THREE.Group();

    // Central sphere representing overall score
    const sphereGeometry = new THREE.SphereGeometry(1.5, 32, 32);
    const sphereMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color().setHSL(score / 100 * 0.3, 0.7, 0.5),
      shininess: 100,
      transparent: true,
      opacity: 0.8,
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    group.add(sphere);

    // Orbiting rings for streak
    const ringGeometry = new THREE.TorusGeometry(2.2, 0.1, 16, 100);
    const ringMaterial = new THREE.MeshPhongMaterial({
      color: 0xff6b6b,
      transparent: true,
      opacity: 0.6,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    // Additional rings for multi-day streaks
    if (streak > 7) {
      const ring2Geometry = new THREE.TorusGeometry(2.5, 0.08, 16, 100);
      const ring2Material = new THREE.MeshPhongMaterial({
        color: 0xffa500,
        transparent: true,
        opacity: 0.5,
      });
      const ring2 = new THREE.Mesh(ring2Geometry, ring2Material);
      ring2.rotation.x = Math.PI / 2;
      ring2.rotation.y = 0.3;
      group.add(ring2);
    }

    // Floating particles for topics mastered
    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = Math.min(topicsMastered * 5, 50);
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      const radius = 3 + Math.random() * 2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = radius * Math.cos(phi);
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      color: 0x4ecdc4,
      size: 0.1,
      transparent: true,
      opacity: 0.8,
    });
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    group.add(particles);

    scene.add(group);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0x4ecdc4, 0.5);
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);

    // Animation
    let frame = 0;
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      frame += 0.01;

      sphere.rotation.y += 0.005;
      sphere.rotation.x += 0.002;

      ring.rotation.z += 0.01;
      
      particles.rotation.y += 0.002;
      particles.rotation.x += 0.001;

      // Pulse effect based on score
      const pulse = 1 + Math.sin(frame * 2) * 0.05;
      sphere.scale.set(pulse, pulse, pulse);

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      sphereGeometry.dispose();
      sphereMaterial.dispose();
      ringGeometry.dispose();
      ringMaterial.dispose();
      particlesGeometry.dispose();
      particlesMaterial.dispose();
    };
  }, [score, streak, topicsMastered]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full min-h-[300px] rounded-xl overflow-hidden"
      style={{ background: 'linear-gradient(135deg, rgba(43,46,51,0.05) 0%, rgba(123,127,133,0.05) 100%)' }}
    />
  );
}
