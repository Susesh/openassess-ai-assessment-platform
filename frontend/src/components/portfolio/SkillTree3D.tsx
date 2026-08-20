"use client";

import { useRef, useEffect } from "react";
import * as THREE from "three";

interface SkillTree3DProps {
  skills: Array<{ name: string; level: number }>;
}

export function SkillTree3D({ skills }: SkillTree3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || skills.length === 0) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(300, 300);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    // Create skill tree structure
    const group = new THREE.Group();
    
    // Central node (root)
    const rootGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const rootMaterial = new THREE.MeshPhongMaterial({
      color: 0x2B2E33,
      emissive: 0x2B2E33,
      emissiveIntensity: 0.3,
      shininess: 150,
    });
    const root = new THREE.Mesh(rootGeometry, rootMaterial);
    group.add(root);

    // Branch out to skill nodes
    const branchCount = Math.min(skills.length, 6);
    const radius = 2;
    
    skills.slice(0, 6).forEach((skill, index) => {
      const angle = (index / branchCount) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * 0.5;
      const z = Math.sin(angle) * radius * 0.5;

      // Create branch line
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(x, y, z),
      ]);
      const lineMaterial = new THREE.LineBasicMaterial({ 
        color: skill.level >= 80 ? 0x2B2E33 : 0x7B7F85,
        linewidth: 2 
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      group.add(line);

      // Create skill node
      const nodeGeometry = new THREE.SphereGeometry(0.3 + (skill.level / 100) * 0.2, 32, 32);
      const nodeMaterial = new THREE.MeshPhongMaterial({
        color: skill.level >= 80 ? 0x2B2E33 : skill.level >= 60 ? 0x06b6d4 : 0xf59e0b,
        emissive: skill.level >= 80 ? 0x2B2E33 : skill.level >= 60 ? 0x06b6d4 : 0xf59e0b,
        emissiveIntensity: 0.2,
        shininess: 100,
      });
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
      node.position.set(x, y, z);
      group.add(node);
    });

    scene.add(group);

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

      group.rotation.x += (targetRotationX - group.rotation.x) * 0.05;
      group.rotation.y += (targetRotationY - group.rotation.y) * 0.05;

      // Slow auto-rotation
      group.rotation.y += 0.002;

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
  }, [skills]);

  return (
    <div 
      ref={containerRef} 
      className="w-[300px] h-[300px] mx-auto cursor-pointer"
      style={{ perspective: "1000px" }}
    />
  );
}
