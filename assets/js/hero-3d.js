/**
 * Full-page animated 3D background (Three.js)
 * - Floating wireframe geometry (icosahedron, torus knot, octahedron, dodecahedron)
 * - Particle starfield with proximity-based connecting lines
 * - Mouse parallax + slow scroll-driven camera drift
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const canvas = document.getElementById('bg-3d');

if (canvas && window.WebGLRenderingContext) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 34;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const cyan = 0x6ee7ff;
  const violet = 0xa78bfa;

  // ---- Particle field ----
  const PARTICLE_COUNT = 180;
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const spread = { x: 70, y: 46, z: 36 };

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * spread.x;
    positions[i * 3 + 1] = (Math.random() - 0.5) * spread.y;
    positions[i * 3 + 2] = (Math.random() - 0.5) * spread.z;
  }

  const particlesGeometry = new THREE.BufferGeometry();
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particlesMaterial = new THREE.PointsMaterial({
    color: cyan,
    size: 0.32,
    transparent: true,
    opacity: 0.75,
    sizeAttenuation: true,
  });
  const particles = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particles);

  // ---- Connecting lines between nearby particles ----
  const linePositions = [];
  const maxDist = 7.5;
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
  const lineMaterial = new THREE.LineBasicMaterial({ color: violet, transparent: true, opacity: 0.1 });
  const lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
  scene.add(lineMesh);

  // ---- Floating wireframe shapes ----
  const shapes = [];
  const geometries = [
    new THREE.IcosahedronGeometry(4.6, 0),
    new THREE.TorusKnotGeometry(2.8, 0.75, 100, 16),
    new THREE.OctahedronGeometry(3.4, 0),
    new THREE.DodecahedronGeometry(3, 0),
    new THREE.IcosahedronGeometry(2.2, 1),
  ];

  geometries.forEach((geo, idx) => {
    const mat = new THREE.MeshBasicMaterial({
      color: idx % 2 === 0 ? cyan : violet,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    const mesh = new THREE.Mesh(geo, mat);
    const angle = (idx / geometries.length) * Math.PI * 2;
    mesh.position.set(
      Math.cos(angle) * 22 + (Math.random() - 0.5) * 8,
      Math.sin(angle) * 14 + (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 18 - 8
    );
    mesh.userData.rotSpeed = {
      x: (Math.random() - 0.5) * 0.005,
      y: (Math.random() - 0.5) * 0.007,
    };
    mesh.userData.floatOffset = Math.random() * Math.PI * 2;
    mesh.userData.baseY = mesh.position.y;
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

  // ---- Scroll-driven drift ----
  let scrollFactor = 0;
  window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    scrollFactor = max > 0 ? window.scrollY / max : 0;
  }, { passive: true });

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    shapes.forEach((mesh) => {
      mesh.rotation.x += mesh.userData.rotSpeed.x;
      mesh.rotation.y += mesh.userData.rotSpeed.y;
      mesh.position.y = mesh.userData.baseY + Math.sin(t * 0.4 + mesh.userData.floatOffset) * 1.2;
    });

    particles.rotation.y = t * 0.015;
    lineMesh.rotation.y = t * 0.015;

    targetCamera.x += (mouse.x * 3.5 - targetCamera.x) * 0.03;
    targetCamera.y += (-mouse.y * 2.4 - targetCamera.y - scrollFactor * 8) * 0.03;
    camera.position.x = targetCamera.x;
    camera.position.y = targetCamera.y;
    camera.rotation.z = scrollFactor * 0.05;
    camera.lookAt(0, -scrollFactor * 4, 0);

    renderer.render(scene, camera);
  }

  animate();
}
