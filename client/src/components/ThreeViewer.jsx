import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeViewer({ imageUrl }) {
  const mountRef = useRef(null);
  const sceneRef = useRef();
  const rendererRef = useRef();
  const cameraRef = useRef();

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 2.5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    const setSize = () => {
      const width = mount.clientWidth || 480;
      const height = mount.clientHeight || 480;
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio || 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    setSize();
    mount.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 1, 2);
    scene.add(light);

    // Simple plane representing user image as texture
    const geometry = new THREE.PlaneGeometry(1.6, 2.0);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    const animate = () => {
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    window.addEventListener("resize", setSize);

    return () => {
      window.removeEventListener("resize", setSize);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    if (!imageUrl || !rendererRef.current) return;
    const loader = new THREE.TextureLoader();
    loader.load(
      imageUrl,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        const plane = sceneRef.current.children.find((c) => c.isMesh);
        if (plane) {
          plane.material.map = texture;
          plane.material.needsUpdate = true;
        }
      },
      undefined,
      () => {
        // ignore errors for now
      }
    );
  }, [imageUrl]);

  return (
    <div className="viewer-shell">
      <p className="small">3D Preview (beta)</p>
      <div className="viewer-mount" ref={mountRef} />
    </div>
  );
}
