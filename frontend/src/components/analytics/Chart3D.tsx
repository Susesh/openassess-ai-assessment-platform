"use client";

import { useRef, useEffect } from "react";
import * as THREE from "three";

interface Chart3DProps {
  data: Array<{ label: string; value: number }>;
  type?: "bar" | "sphere";
}

export function Chart3D({ data, type = "bar" }: Chart3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(300, 300);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(-5, -5, 5);
    scene.add(pointLight);

    // Create 3D visualization based on type
    if (type === "bar") {
      const barWidth = 0.8;
      const barSpacing = 1.2;
      const maxValue = Math.max(...data.map(d => d.value));
      
      data.forEach((item, index) => {
        const height = (item.value / maxValue) * 3;
        const geometry = new THREE.BoxGeometry(barWidth, height, barWidth);
        const material = new THREE.MeshPhongMaterial({
          color: new THREE.Color(item.value >= 70 ? 0x2B2E33 : 0x7B7F85),
          transparent: true,
          opacity: 0.9,
          shininess: 100,
        });
        const bar = new THREE.Mesh(geometry, material);
        
        const xPos = (index - data.length / 2) * barSpacing;
        bar.position.set(xPos, height / 2 - 1.5, 0);
        scene.add(bar);
      });
    } else if (type === "sphere") {
      const sphereRadius = 0.4;
      const spacing = 1.2;
      
      data.forEach((item, index) => {
        const geometry = new THREE.SphereGeometry(sphereRadius, 32, 32);
        const material = new THREE.MeshPhongMaterial({
          color: new THREE.Color(item.value >= 70 ? 0x2B2E33 : 0x7B7F85),
          emissive: new THREE.Color(item.value >= 70 ? 0x2B2E33 : 0x7B7F85),
          emissiveIntensity: 0.2,
          transparent: true,
          opacity: 0.9,
        });
        const sphere = new THREE.Mesh(geometry, material);
        
        const xPos = (index - data.length / 2) * spacing;
        const yPos = Math.sin(index * 0.5) * 0.5;
        sphere.position.set(xPos, yPos, 0);
        scene.add(sphere);
      });
    }

    camera.position.z = 6;
    camera.position.y = 1;
    camera.lookAt(0, 0, 0);

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

      scene.rotation.x += (targetRotationX - scene.rotation.x) * 0.05;
      scene.rotation.y += (targetRotationY - scene.rotation.y) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      containerRef.current?.removeEventListener('mousemove', handleMouseMove);
      containerRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
      scene.clear();
    };
  }, [data, type]);

  return (
    <div 
      ref={containerRef} 
      className="w-[300px] h-[300px] mx-auto cursor-pointer"
      style={{ perspective: "1000px" }}
    />
  );
}
