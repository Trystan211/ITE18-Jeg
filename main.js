import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/jsm/loaders/GLTFLoader.js';

// Scene Setup for Snowy Winter Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue
scene.fog = new THREE.Fog(0x87ceeb, 10, 100);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(20, 10, 30);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// OrbitControls for user interaction
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;

// Snowy ground setup
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshStandardMaterial({ color: 0xffffff }) // Snow white ground
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Ambient and directional lighting for the scene
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const sunlight = new THREE.DirectionalLight(0xfff8e1, 0.7);
sunlight.position.set(30, 50, -10);
scene.add(sunlight);

// Restricted area for a central snowman feature
let restrictedArea = {
  x: 0,
  z: 0,
  radius: 10
};

// Function to check if a position is outside the restricted area
function isOutsideRestrictedArea(x, z) {
  const dx = x - restrictedArea.x;
  const dz = z - restrictedArea.z;
  return Math.sqrt(dx * dx + dz * dz) >= restrictedArea.radius;
}

// Function to get a random position outside the restricted area
function getRandomPositionOutsideRestrictedArea() {
  let x, z;
  do {
    x = Math.random() * 80 - 40;
    z = Math.random() * 80 - 40;
  } while (!isOutsideRestrictedArea(x, z));
  return { x, z };
}

// Load a snowman model at the center
const loader = new GLTFLoader();
loader.load(
  'https://trystan211.github.io/ITE18-Jeg/snowman_monster.glb',
  (gltf) => {
    const snowman = gltf.scene;
    snowman.position.set(restrictedArea.x, 0, restrictedArea.z);
    snowman.scale.set(5, 5, 5);
    scene.add(snowman);

    // Update restricted area radius based on the snowman's size
    const boundingBox = new THREE.Box3().setFromObject(snowman);
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    restrictedArea.radius = Math.max(size.x, size.z) / 2 + 2;
    console.log(`Restricted area radius updated: ${restrictedArea.radius}`);
  },
  undefined,
  (error) => console.error('Error loading snowman model:', error)
);

// Trees setup for the snowy scene
const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });
const snowMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });

const trees = [];

for (let i = 0; i < 30; i++) {
  const position = getRandomPositionOutsideRestrictedArea();

  // Create a tree group
  const treeGroup = new THREE.Group();

  // Tree trunk
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 5),
    trunkMaterial
  );
  trunk.position.set(0, 2.5, 0);
  treeGroup.add(trunk);

  // Tree leaves
  for (let j = 0; j < 3; j++) {
    const foliage = new THREE.Mesh(
      new THREE.ConeGeometry(3 - j, 4),
      leafMaterial
    );
    foliage.position.set(0, 5 + j * 2, 0);
    treeGroup.add(foliage);
  }

  // Snow on tree
  const snow = new THREE.Mesh(
    new THREE.ConeGeometry(2.5, 1, 8),
    snowMaterial
  );
  snow.position.set(0, 9, 0);
  treeGroup.add(snow);

  // Position the tree group
  treeGroup.position.set(position.x, 0, position.z);

  // Add tree group to the scene and store it
  scene.add(treeGroup);
  trees.push(treeGroup);
}

// Falling snow particles
const particleCount = 2000;
const particlesGeometry = new THREE.BufferGeometry();
const positions = [];
const velocities = [];

for (let i = 0; i < particleCount; i++) {
  positions.push(
    Math.random() * 100 - 50, // X
    Math.random() * 50 + 10,  // Y
    Math.random() * 100 - 50 // Z
  );
  velocities.push(0, Math.random() * -0.2, 0); // Falling effect
}

particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
particlesGeometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));

const particlesMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.5,
  transparent: true,
  opacity: 0.8
});

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

// Raycaster for tree interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(trees, true);
  if (intersects.length > 0) {
    const treeGroup = intersects[0].object.parent;

    // Change color to white (snow effect)
    treeGroup.children.forEach((child) => {
      if (child.material) {
        child.material.color.set(0xffffff);
      }
    });

    // Revert color after 2 seconds
    setTimeout(() => {
      treeGroup.children.forEach((child) => {
        if (child.material) {
          child.material.color.set(
            child.geometry.type === 'ConeGeometry' ? 0x228b22 : 0x8b5a2b
          );
        }
      });
    }, 2000);
  }
});

// Animation loop
const clock = new THREE.Clock();

const animate = () => {
  // Update snow particles
  const positions = particlesGeometry.attributes.position.array;
  const velocities = particlesGeometry.attributes.velocity.array;

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3 + 1] += velocities[i * 3 + 1];
    if (positions[i * 3 + 1] < 0) {
      positions[i * 3 + 1] = Math.random() * 50 + 10;
    }
  }

  particlesGeometry.attributes.position.needsUpdate = true;

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};

animate();

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
