import * as THREE from 'https://unpkg.com/three@0.156.0/build/three.module.js';
import Player from './player.js';
import { Dummy } from './dummy.js';

const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 3, 8);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1.0);
light.position.set(10, 15, 10);
light.castShadow = true;
light.shadow.mapSize.width = 2048;
light.shadow.mapSize.height = 2048;
scene.add(light);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));

// Ground
const groundGeo = new THREE.PlaneGeometry(100, 100);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x66bb6a });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Create player
const player = new Player(scene, camera);

// Create dummy
const dummy = new Dummy(scene, new THREE.Vector3(0, 1, 3));
player.setDummy(dummy);
dummy.setPlayer(player);

// Pointer lock
document.getElementById('startBtn').addEventListener('click', () => {
  renderer.domElement.requestPointerLock();
  document.getElementById('blocker').style.display = 'none';
});

document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement === renderer.domElement) {
    player.setCameraLocked(true);
  } else {
    player.setCameraLocked(false);
    document.getElementById('blocker').style.display = 'flex';
  }
});

// Update UI
function updateUI() {
  const hpPercent = Math.max(0, player.hp / player.maxHP);
  document.getElementById('hp-fill').style.width = (hpPercent * 100) + '%';
  document.getElementById('hp-text').textContent = Math.ceil(player.hp) + ' / ' + player.maxHP;

  // Skill cooldowns
  const skill1Cd = Math.max(0, player.skill1Cooldown);
  const skill2Cd = Math.max(0, player.skill2Cooldown);
  const skill3Cd = Math.max(0, player.skill3Cooldown);

  document.getElementById('skill1-cd').textContent = skill1Cd.toFixed(1) + 's';
  document.getElementById('skill2-cd').textContent = skill2Cd.toFixed(1) + 's';
  document.getElementById('skill3-cd').textContent = skill3Cd.toFixed(1) + 's';

  // Skill box colors
  const skillBoxes = document.querySelectorAll('.skill-box');
  skillBoxes[0].className = 'skill-box ' + (skill1Cd > 0 ? 'cooldown' : 'ready');
  skillBoxes[1].className = 'skill-box ' + (skill2Cd > 0 ? 'cooldown' : 'ready');
  skillBoxes[2].className = 'skill-box ' + (skill3Cd > 0 ? 'cooldown' : 'ready');

  // Attack indicator
  const now = performance.now() / 1000;
  const attackReady = (now - player.lastAttackTime) >= player.attackCooldown;
  document.getElementById('attack-ready').textContent = attackReady ? '✓' : '✗';
  document.getElementById('attack-ready').style.color = attackReady ? '#0f0' : '#f00';

  // Death UI
  if (player.isDead) {
    document.getElementById('deathUI').style.display = 'block';
    const respawnIn = Math.ceil(player.respawnTime - player.respawnTimer);
    document.getElementById('respawn-time').textContent = Math.max(0, respawnIn);
  } else {
    document.getElementById('deathUI').style.display = 'none';
  }
}

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Game loop
let lastTime = performance.now();
function animate() {
  requestAnimationFrame(animate);

  const now = performance.now();
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  player.update(dt);
  dummy.update(dt);

  updateUI();

  renderer.render(scene, camera);
}

animate();
