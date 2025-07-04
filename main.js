// Load Three.js library
import * as THREE from 'three';

// Get HTML elements
const canvas = document.getElementById('canvas');
const controlsDiv = document.getElementById('controls');
const tooltip = document.getElementById('tooltip');

// Create a 3D scene
const scene = new THREE.Scene();
scene.background = new THREE.Color('#1a1a2e'); // Dark background

// Create a camera to view the scene
const camera = new THREE.PerspectiveCamera(
  75, 
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 60; // Move camera back

// Create renderer to show the scene
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);

// Add light to the scene
const pointLight = new THREE.PointLight(0xffffff, 2, 500);
pointLight.position.set(0, 0, 0); // Light at center (Sun)
scene.add(pointLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.2); // Soft light
scene.add(ambientLight);

// Create the Sun
const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xfdb813 }); // Yellow Sun
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Create background stars
function createStars(count = 500) {
  const geometry = new THREE.BufferGeometry();
  const positions = [];

  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * 300;
    const y = (Math.random() - 0.5) * 300;
    const z = (Math.random() - 0.5) * 300;
    positions.push(x, y, z);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
  const stars = new THREE.Points(geometry, material);
  scene.add(stars);
}
createStars(); // Add stars

// Info for each planet: [size, distance from sun, color]
const planetsData = [
  [1, 8, 0xd4af37],   // Mercury
  [1.2, 12, 0xeedc82], // Venus
  [1.3, 16, 0x1e90ff], // Earth
  [1.1, 20, 0xff6347], // Mars
  [2.5, 28, 0xffa500], // Jupiter
  [2.0, 36, 0xf5deb3], // Saturn
  [1.8, 42, 0x00ffff], // Uranus
  [1.7, 48, 0x4169e1], // Neptune
];

const planetNames = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];
const planets = [];

// Create planets and orbits
for (let i = 0; i < planetsData.length; i++) {
  const [size, distance, color] = planetsData[i];

  // Create planet sphere
  const geometry = new THREE.SphereGeometry(size, 32, 32);
  const material = new THREE.MeshBasicMaterial({ color });
  const planet = new THREE.Mesh(geometry, material);
  planet.position.x = distance;

  // Orbit object to move the planet
  const orbit = new THREE.Object3D();
  orbit.add(planet);
  scene.add(orbit);

  // Show orbit ring
  const ringGeometry = new THREE.RingGeometry(distance - 0.1, distance + 0.1, 64);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.3,
  });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.rotation.x = Math.PI / 2;
  scene.add(ring);

  // Set default speed
  const speed = 0.01 * (1 / (i + 1)) + 0.002;

  // Save planet data
  planets.push({ mesh: planet, orbit, speed });

  // Create slider to control speed
  const control = document.createElement('div');
  control.innerHTML = `
    <label>
      ${planetNames[i]}:
      <input type="range" min="0" max="0.05" step="0.001" value="${speed}" data-index="${i}" />
      <span id="speed-val-${i}">${speed.toFixed(3)}</span>
    </label>
  `;
  controlsDiv.appendChild(control);

  // Update speed when slider changes
  const slider = control.querySelector('input');
  slider.addEventListener('input', (e) => {
    const index = parseInt(e.target.dataset.index);
    const newSpeed = parseFloat(e.target.value);
    planets[index].speed = newSpeed;
    document.getElementById(`speed-val-${index}`).textContent = newSpeed.toFixed(3);
  });
}

// Pause/resume button
let isPaused = false;
document.getElementById('toggleBtn').addEventListener('click', () => {
  isPaused = !isPaused;
  document.getElementById('toggleBtn').textContent = isPaused ? 'Resume' : 'Pause';
});

// Dark/light theme toggle
let isDark = true;
document.getElementById('themeToggle').addEventListener('click', () => {
  isDark = !isDark;
  scene.background = new THREE.Color(isDark ? '#1a1a2e' : '#f0f0f0');
  document.body.style.backgroundColor = isDark ? '#000' : '#fff';
});

// Show planet name on hover
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('mousemove', (e) => {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planets.map(p => p.mesh));

  if (intersects.length > 0) {
    const index = planets.findIndex(p => p.mesh === intersects[0].object);
    tooltip.textContent = planetNames[index];
    tooltip.style.left = `${e.clientX + 10}px`;
    tooltip.style.top = `${e.clientY + 10}px`;
    tooltip.style.display = 'block';
  } else {
    tooltip.style.display = 'none';
  }
});

// Zoom camera when a planet is clicked
window.addEventListener('click', () => {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planets.map(p => p.mesh));

  if (intersects.length > 0) {
    const pos = intersects[0].object.position;
    camera.position.set(pos.x, pos.y + 5, pos.z + 15);
    camera.lookAt(pos);
  }
});

// Animate the scene
function animate() {
  requestAnimationFrame(animate);

  if (!isPaused) {
    // Move planets in orbit and rotate them
    planets.forEach((planet) => {
      planet.orbit.rotation.y += planet.speed;  // Orbit around sun
      planet.mesh.rotation.y += 0.01;           // Spin in place
    });
  }

  // Show the scene
  renderer.render(scene, camera);
}

animate(); // Start animation
