import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function ThreeViewer({ imageUrl }) {
  const mountRef = useRef(null);
  const sceneRef = useRef();
  const rendererRef = useRef();
  const cameraRef = useRef();
  const meshRef = useRef();
  const controlsRef = useRef({ isDragging: false, startX: 0, startY: 0, targetRotX: 0, targetRotY: 0 });
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a2238);
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
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

    // Lighting
    const keyLight = new THREE.DirectionalLight(0xffffff, 1);
    keyLight.position.set(2, 2, 2);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0x80a0ff, 0.4);
    fillLight.position.set(-2, 0, 1);
    scene.add(fillLight);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    // Plane for image
    const geometry = new THREE.PlaneGeometry(1.6, 2.0);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.order = "YXZ";
    scene.add(mesh);
    meshRef.current = mesh;

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    // Mouse controls
    const onMouseDown = (e) => {
      controlsRef.current.isDragging = true;
      controlsRef.current.startX = e.clientX;
      controlsRef.current.startY = e.clientY;
    };
    const onMouseMove = (e) => {
      if (!controlsRef.current.isDragging) return;
      const deltaX = e.clientX - controlsRef.current.startX;
      const deltaY = e.clientY - controlsRef.current.startY;
      controlsRef.current.targetRotY += deltaX * 0.01;
      controlsRef.current.targetRotX -= deltaY * 0.01;
      controlsRef.current.targetRotX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, controlsRef.current.targetRotX));
    };
    const onMouseUp = () => {
      controlsRef.current.isDragging = false;
    };
    renderer.domElement.addEventListener("mousedown", onMouseDown);
    renderer.domElement.addEventListener("mousemove", onMouseMove);
    renderer.domElement.addEventListener("mouseup", onMouseUp);
    renderer.domElement.addEventListener("mouseleave", onMouseUp);

    // Animation loop
    const animate = () => {
      if (mesh) {
        mesh.rotation.x += (controlsRef.current.targetRotX - mesh.rotation.x) * 0.1;
        mesh.rotation.y += (controlsRef.current.targetRotY - mesh.rotation.y) * 0.1;
      }
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    window.addEventListener("resize", setSize);

    return () => {
      window.removeEventListener("resize", setSize);
      renderer.domElement.removeEventListener("mousedown", onMouseDown);
      renderer.domElement.removeEventListener("mousemove", onMouseMove);
      renderer.domElement.removeEventListener("mouseup", onMouseUp);
      renderer.domElement.removeEventListener("mouseleave", onMouseUp);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    if (!imageUrl || !rendererRef.current) return;
    setLoading(true);
    setLoadError("");
    const loader = new THREE.TextureLoader();
    loader.load(
      imageUrl,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        if (meshRef.current) {
          meshRef.current.material.map = texture;
          meshRef.current.material.needsUpdate = true;
        }
        setLoading(false);
      },
      undefined,
      (err) => {
        console.error("Texture load error:", err);
        setLoading(false);
        setLoadError("Image failed to load. Check CORS or try a different URL.");
      }
    );
  }, [imageUrl]);

  return (
    <div className="viewer-shell">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p className="small">3D Try-On Preview {loading ? "(loading...)" : ""}</p>
        <p className="small muted" style={{ margin: 0, fontSize: "0.8rem" }}>Drag to rotate</p>
      </div>
      <div className="viewer-mount" ref={mountRef} />
      {loadError && <p style={{ color: "#fca5a5", fontSize: "0.85rem", marginTop: "8px" }}>⚠️ {loadError}</p>}
    </div>
  );
}
