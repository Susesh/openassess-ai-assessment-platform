"use client";

import { useRef, useEffect } from "react";
import * as THREE from "three";

interface Certificate3DProps {
  isAchievement: boolean;
  color?: string;
}

export function Certificate3D({ isAchievement, color = "#2B2E33" }: Certificate3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(250, 350);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    // Create 3D certificate (plane with texture-like appearance)
    const geometry = new THREE.PlaneGeometry(3, 4.2);
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.9,
      shininess: 100,
      side: THREE.DoubleSide,
    });
    const certificate = new THREE.Mesh(geometry, material);
    scene.add(certificate);

    // Add gold border for achievement certificates
    if (isAchievement) {
      const borderGeometry = new THREE.EdgesGeometry(geometry);
      const borderMaterial = new THREE.LineBasicMaterial({ color: 0xffd700, linewidth: 2 });
      const border = new THREE.LineSegments(borderGeometry, borderMaterial);
      certificate.add(border);

      // Add gold seal
      const sealGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 32);
      const sealMaterial = new THREE.MeshPhongMaterial({
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 0.3,
        shininess: 150,
      });
      const seal = new THREE.Mesh(sealGeometry, sealMaterial);
      seal.position.set(0, 0.5, 0.1);
      seal.rotation.x = Math.PI / 2;
      certificate.add(seal);
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

    camera.position.z = 6;

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

      certificate.rotation.x += (targetRotationX - certificate.rotation.x) * 0.05;
      certificate.rotation.y += (targetRotationY - certificate.rotation.y) * 0.05;

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
  }, [isAchievement, color]);

  return (
    <div 
      ref={containerRef} 
      className="w-[250px] h-[350px] mx-auto cursor-pointer"
      style={{ perspective: "1000px" }}
    />
  );
}
