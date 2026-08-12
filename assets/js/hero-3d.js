/**
 * 3D animated hero background using Three.js
 * - Floating wireframe geometric shapes (icosahedron, torus knot, octahedron)
 * - Particle starfield with connecting lines
 * - Mouse-driven parallax camera movement
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const canvas = document.getElementById('hero-3d');

if (canvas && window.WebGLRenderingContext) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    60,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    1000
  );
  camera.position.z = 32;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const brandColor = 0x149ddd;
  const accentColor = 0x2eafec;

  // ---- Particle field ----
  const PARTICLE_COUNT = 140;
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const spread = { x: 60, y: 34, z: 30 };

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * spread.x;
    positions[i * 3 + 1] = (Math.random() - 0.5) * spread.y;
    positions[i * 3 + 2] = (Math.random() - 0.5) * spread.z;
  }

  const particlesGeometry = new THREE.BufferGeometry();
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const particlesMaterial = new THREE.PointsMaterial({
    color: accentColor,
    size: 0.35,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
  });

  const particles = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particles);

  // ---- Connecting lines between nearby particles ----
  const linePositions = [];
  const maxDist = 7;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    for (let j = i + 1; j < PARTICLE_COUNT; j++) {
      const dx = positions[i * 3] - positions[j * 3];
      const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
      const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < maxDist) {
        linePositions.push(
          positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
          positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]
        );
      }
    }
  }
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));
  const lineMaterial = new THREE.LineBasicMaterial({ color: brandColor, transparent: true, opacity: 0.12 });
  const lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
  scene.add(lineMesh);

  // ---- Floating wireframe shapes ----
  const shapes = [];
  const geometries = [
    new THREE.IcosahedronGeometry(4.2, 0),
    new THREE.TorusKnotGeometry(2.6, 0.7, 100, 16),
    new THREE.OctahedronGeometry(3.2, 0),
    new THREE.IcosahedronGeometry(2.2, 1),
  ];

  geometries.forEach((geo, idx) => {
    const mat = new THREE.MeshBasicMaterial({
      color: idx % 2 === 0 ? brandColor : accentColor,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      (idx - geometries.length / 2) * 12 + (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 12,
      (Math.random() - 0.5) * 14 - 6
    );
    mesh.userData.rotSpeed = {
      x: (Math.random() - 0.5) * 0.006,
      y: (Math.random() - 0.5) * 0.008,
    };
    mesh.userData.floatOffset = Math.random() * Math.PI * 2;
    scene.add(mesh);
    shapes.push(mesh);
  });

  // ---- Mouse parallax ----
  const mouse = { x: 0, y: 0 };
  const targetCamera = { x: 0, y: 0 };

  window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  });

  function resize() {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    shapes.forEach((mesh) => {
      mesh.rotation.x += mesh.userData.rotSpeed.x;
      mesh.rotation.y += mesh.userData.rotSpeed.y;
      mesh.position.y += Math.sin(t * 0.5 + mesh.userData.floatOffset) * 0.01;
    });

    particles.rotation.y = t * 0.02;
    lineMesh.rotation.y = t * 0.02;

    targetCamera.x += (mouse.x * 3 - targetCamera.x) * 0.03;
    targetCamera.y += (-mouse.y * 2 - targetCamera.y) * 0.03;
    camera.position.x = targetCamera.x;
    camera.position.y = targetCamera.y;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  animate();
}
