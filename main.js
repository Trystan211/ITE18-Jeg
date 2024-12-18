import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/jsm/loaders/GLTFLoader.js';

// Scene Setup ni bb
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffc8a3);
scene.fog = new THREE.Fog(0xd56b4f, 10, 50);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(20, 10, 30);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// OrbitControls ni diri bb
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;

// Pagsetup nis floor bb
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(60, 60),
  new THREE.MeshStandardMaterial({ color: 0x8b3e3e })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Lights ni bb, naay ambient og directional
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

const sunlight = new THREE.DirectionalLight(0xffd4a6, 0.6);
sunlight.position.set(10, 20, -5);
scene.add(sunlight);

// Restricted Area ni para dili magpatakag spawn ang mga tae na black sa tunga sa shrine(Shrine Center)
let restrictedArea = {
  x: 0,
  z: 0,
  radius: 15
};

// Checker ni if naay position outside sa restricted area
function isOutsideRestrictedArea(x, z) {
  const dx = x - restrictedArea.x;
  const dz = z - restrictedArea.z;
  return Math.sqrt(dx * dx + dz * dz) >= restrictedArea.radius;
}

// Maka kuha kag random position gawas sa restricted area kung naay maka sulod na tae na black
function getRandomPositionOutsideRestrictedArea() {
  let x, z;
  do {
    x = Math.random() * 50 - 25;
    z = Math.random() * 50 - 25;
  } while (!isOutsideRestrictedArea(x, z));
  return { x, z };
}

// I import nato ang tae na shrine model
const loader = new GLTFLoader();
loader.load(
  'https://trystan211.github.io/test_joshua/fox_stone_statue_handpainted_kitsune.glb',
  (gltf) => {
    const shrine = gltf.scene;

    shrine.position.set(restrictedArea.x, -0.5, restrictedArea.z);
    shrine.scale.set(310, 310, 310); // dako ni kay gamayay siya na shit
    scene.add(shrine);

    // Calculate ang bounding box niya og i update ang restricted radius
    const boundingBox = new THREE.Box3().setFromObject(shrine);
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    restrictedArea.radius = Math.max(size.x, size.z) / 2 + 1;
    console.log(`Restricted area radius updated: ${restrictedArea.radius}`);
  },
  undefined,
  (error) => console.error('Error loading shrine model:', error)
);

// Trees og Mushrooms
const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x5b341c });
const leafMaterial = new THREE.MeshStandardMaterial({ color: 0xd35f45 });
const mushroomMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });

const trees = [];

for (let i = 0; i < 20; i++) {
  const position = getRandomPositionOutsideRestrictedArea();

  // Create a group para sa whole tree
  const treeGroup = new THREE.Group();

  // Tree trunk ni bai
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 8),
    trunkMaterial
  );
  trunk.position.set(0, 4, 0);
  treeGroup.add(trunk);

  // Tree leaves or foliage ni bai
  for (let j = 0; j < 4; j++) {
    const foliage = new THREE.Mesh(
      new THREE.ConeGeometry(5 - j * 1.5, 4),
      leafMaterial
    );
    foliage.position.set(0, 8 + j * 2.5, 0);
    treeGroup.add(foliage);
  }

  // Position sa whole tree group, iset nato kay mabuang siyag di
  treeGroup.position.set(position.x, 0, position.z);

  // i Add ang tree group sa scene og i store for interaction bai
  scene.add(treeGroup);
  trees.push(treeGroup);
}

// I import na nato ang fox models bai
loader.load(
  'https://trystan211.github.io/test_joshua/low_poly_fox.glb',
  (gltf) => {
    for (let i = 0; i < 5; i++) {
      const position = getRandomPositionOutsideRestrictedArea();
      const rotationY = Math.random() * Math.PI * 2;

      const fox = gltf.scene.clone();
      fox.position.set(position.x, 1, position.z);
      fox.rotation.y = rotationY;
      fox.scale.set(1, 1, 1);
      scene.add(fox);
    }
  },
  undefined,
  (error) => console.error('Error loading fox model:', error)
);

// Rocks ni bai nga nahimong white bushes HAHAHAHAH
const rockMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.9,
  metalness: 0.1
});

for (let i = 0; i < 15; i++) {
  const position = getRandomPositionOutsideRestrictedArea();

  const rock = new THREE.Mesh(
    new THREE.IcosahedronGeometry(Math.random() * 2 + 1, 1),
    rockMaterial
  );
  rock.position.set(position.x, 0.5, position.z);
  scene.add(rock);
}

// Red leaf particles ni bai
const particleCount = 1000;
const particlesGeometry = new THREE.BufferGeometry();
const positions = [];
const velocities = [];

for (let i = 0; i < particleCount; i++) {
  positions.push(
    Math.random() * 100 - 50, // X
    Math.random() * 50 + 10,  // Y
    Math.random() * 100 - 50 // Z
  );
  velocities.push(0, Math.random() * -0.1, 0); // Falling effect ni siya bai
}

particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
particlesGeometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));

const particlesMaterial = new THREE.PointsMaterial({
  color: 0xb94e48,
  size: 0.5,
  transparent: true,
  opacity: 0.8
});

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

// Raycaster para sa tree interaction ni bb
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(trees, true); // Gamit tag `true` para sa recursive checking
  if (intersects.length > 0) {
    const treeGroup = intersects[0].object.parent;

    // Change size og color para sa tanan parts sa tree, actually bug ni diri pero feature na
    treeGroup.scale.multiplyScalar(1.2);
    treeGroup.children.forEach((child) => {
      if (child.material) {
        child.material.color.set(0x4b2a17); // Darker color ra
      }
    });

    // Revert changes after 2 seconds ni bai
    setTimeout(() => {
      treeGroup.scale.multiplyScalar(1 / 1.2);
      treeGroup.children.forEach((child) => {
        if (child.material) {
          child.material.color.set(
            child.geometry.type === 'ConeGeometry' ? 0xd35f45 : 0x5b341c // Reset sa original color
          );
        }
      });
    }, 2000); // 2 seconds pasabot ani bai
  }
});

// I loop ang animation
const clock = new THREE.Clock();

const animate = () => {
  // Update sa particles
  const positions = particlesGeometry.attributes.position.array;
  const velocities = particlesGeometry.attributes.velocity.array;

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3 + 1] += velocities[i * 3 + 1]; // Y position falls ni
    if (positions[i * 3 + 1] < 0) {
      positions[i * 3 + 1] = Math.random() * 50 + 10; // Reset particle sa top para looping ba naunsa
    }
  }

  particlesGeometry.attributes.position.needsUpdate = true;

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};

animate();

// Mao ni mag handle sa Window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});