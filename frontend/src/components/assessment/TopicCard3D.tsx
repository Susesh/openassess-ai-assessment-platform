"use client";

import { useRef, useEffect } from "react";
import * as THREE from "three";

interface TopicCard3DProps {
  mastery?: number;
  color?: string;
}

export function TopicCard3D({ mastery = 0, color = "#2B2E33" }: TopicCard3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(200, 200);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    // Create 3D card geometry
    const geometry = new THREE.BoxGeometry(2, 2.8, 0.1);
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.9,
      shininess: 100,
    });
    const card = new THREE.Mesh(geometry, material);
    scene.add(card);

    // Add mastery indicator (sphere)
    if (mastery > 0) {
      const sphereGeometry = new THREE.SphereGeometry(0.3, 32, 32);
      const sphereMaterial = new THREE.MeshPhongMaterial({
        color: mastery >= 80 ? 0x10b981 : mastery >= 60 ? 0x06b6d4 : 0xf59e0b,
        emissive: mastery >= 80 ? 0x10b981 : mastery >= 60 ? 0x06b6d4 : 0xf59e0b,
        emissiveIntensity: 0.3,
      });
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.position.set(0.5, 0.8, 0.15);
      card.add(sphere);
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(-5, -5, 5);
    scene.add(pointLight);

    camera.position.z = 4;

    // Animation
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    containerRef.current.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      requestAnimationFrame(animate);

      targetRotationX = mouseY * 0.3;
      targetRotationY = mouseX * 0.3;

      card.rotation.x += (targetRotationX - card.rotation.x) * 0.05;
      card.rotation.y += (targetRotationY - card.rotation.y) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      containerRef.current?.removeEventListener('mousemove', handleMouseMove);
      containerRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, [mastery, color]);

  return (
    <div 
      ref={containerRef} 
      className="w-[200px] h-[200px] cursor-pointer"
      style={{ perspective: "1000px" }}
    />
  );
}
