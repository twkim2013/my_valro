import * as THREE from 'https://unpkg.com/three@0.156.0/build/three.module.js';
import Player from './player.js';
import { EnemyManager } from './enemy.js';

const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x7fbfff);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0,1.6,5);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// simple environment
const light = new THREE.DirectionalLight(0xffffff, 1.0);
light.position.set(5,10,7);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040, 0.8));

const groundGeo = new THREE.PlaneGeometry(200,200);
const groundMat = new THREE.MeshStandardMaterial({color:0x6b6b6b});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI/2;
scene.add(ground);

// obstacles
for(let i=0;i<6;i++){
  const b = new THREE.Mesh(new THREE.BoxGeometry(1,2,1), new THREE.MeshStandardMaterial({color:0x333333}));
  b.position.set((i-3)*2,1, -5 - (i%2)*3);
  scene.add(b);
}

const player = new Player(camera, renderer.domElement, scene);

// Enemy management
const enemyManager = new EnemyManager(scene);
player.enemyManager = enemyManager;

// Spawn dummy enemies for testing
enemyManager.spawn(new THREE.Vector3(0, 0, -5), 'terrorists');
enemyManager.spawn(new THREE.Vector3(3, 0, -8), 'counter-terrorists');
enemyManager.spawn(new THREE.Vector3(-3, 0, -6), 'terrorists');

// start button / pointer lock handling
document.getElementById('startBtn').addEventListener('click', ()=>{
  renderer.domElement.requestPointerLock();
  document.getElementById('blocker').style.display = 'none';
  document.getElementById('crosshair').style.display = 'block';
});

document.addEventListener('pointerlockchange', ()=>{
  if(document.pointerLockElement === renderer.domElement){
    document.getElementById('crosshair').style.display = 'block';
  } else {
    document.getElementById('crosshair').style.display = 'none';
  }
});

// UI updates
function updateUI(){
  document.getElementById('hp').textContent = player.hp;
  document.getElementById('armorVal').textContent = player.armor;
  document.getElementById('moneyVal').textContent = Math.floor(player.money);
  const names = {1:'Classic',2:'Shorty',3:'Knife',4:'Bomb'};
  document.getElementById('weaponName').textContent = names[player.slot]||'Unknown';
  document.getElementById('weaponSlot').textContent = player.slot;
  document.getElementById('buyTime').textContent = Math.ceil(player.buyTime);
  const w = player.weapons[player.slot];
  document.getElementById('ammo').textContent = w.getAmmoDisplay();
  document.getElementById('kills').textContent = player.kills;
  document.getElementById('damage').textContent = player.damageDealt.toFixed(0);
}

let last = performance.now();
function animate(now){
  const dt = Math.min(0.1, (now - last)/1000);
  last = now;
  player.update(dt);
  enemyManager.update(dt);
  updateUI();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

window.addEventListener('resize', ()=>{
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// simple instructions in console
console.log('Prototype running. WASD to move, Shift to sprint, Ctrl to crouch, 1-4 to switch slots, B to open market.');
