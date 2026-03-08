import * as THREE from 'https://unpkg.com/three@0.156.0/build/three.module.js';

export const WEAPONS = {
  1: {
    name: 'Classic',
    cost: 0,
    damage: { head: 75, body: 30, leg: 20 },
    ammoPerMag: 10,
    maxAmmo: 30,
    fireRate: 0.1, // seconds
    accuracy: 0.95,
    recoil: 0.02,
    model: createClassicModel,
  },
  2: {
    name: 'Shorty',
    cost: 300,
    damage: { head: 85, body: 40, leg: 25 },
    ammoPerMag: 8,
    maxAmmo: 24,
    fireRate: 0.15,
    accuracy: 0.85,
    recoil: 0.05,
    model: createShortyModel,
  },
  3: {
    name: 'Knife',
    cost: 0,
    damage: { head: 50, body: 35, leg: 25 },
    ammoPerMag: -1, // melee, unlimited
    maxAmmo: -1,
    fireRate: 0.5,
    accuracy: 1.0,
    recoil: 0.0,
    model: createKnifeModel,
  },
  4: {
    name: 'Bomb',
    cost: 0,
    damage: { head: 0, body: 0, leg: 0 }, // utility, no damage
    ammoPerMag: -1,
    maxAmmo: -1,
    fireRate: 1.0,
    accuracy: 1.0,
    recoil: 0.0,
    model: createBombModel,
  },
};

function createClassicModel() {
  const group = new THREE.Group();
  
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x333333 })
  );
  barrel.position.set(0.1, 0, -0.2);
  barrel.rotation.z = Math.PI / 2;
  group.add(barrel);
  
  const grip = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.12, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
  );
  grip.position.set(0.05, -0.05, -0.05);
  group.add(grip);
  
  const slide = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.06, 0.25),
    new THREE.MeshStandardMaterial({ color: 0x666666 })
  );
  slide.position.set(0, 0, -0.1);
  group.add(slide);
  
  group.position.set(0.3, -0.15, -0.5);
  group.scale.set(0.8, 0.8, 0.8);
  
  return group;
}

function createShortyModel() {
  const group = new THREE.Group();
  
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 0.15),
    new THREE.MeshStandardMaterial({ color: 0x333333 })
  );
  barrel.position.set(0.1, 0, -0.1);
  barrel.rotation.z = Math.PI / 2;
  group.add(barrel);
  
  const stock = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.08, 0.15),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
  );
  stock.position.set(0, -0.04, 0.04);
  group.add(stock);
  
  group.position.set(0.35, -0.12, -0.45);
  group.scale.set(0.9, 0.9, 0.9);
  
  return group;
}

function createKnifeModel() {
  const group = new THREE.Group();
  
  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.15, 0.02),
    new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.8, roughness: 0.2 })
  );
  blade.position.set(0, 0.08, 0);
  group.add(blade);
  
  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.08, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x8b4513 })
  );
  handle.position.set(0, -0.02, 0);
  group.add(handle);
  
  group.position.set(0.25, -0.1, -0.3);
  group.scale.set(1, 1, 1);
  
  return group;
}

function createBombModel() {
  const group = new THREE.Group();
  
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.2, 0.12),
    new THREE.MeshStandardMaterial({ color: 0xff0000 })
  );
  group.add(body);
  
  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.05, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x00ff00 })
  );
  screen.position.set(0, 0.05, 0.07);
  group.add(screen);
  
  group.position.set(0.4, -0.1, -0.5);
  group.scale.set(0.7, 0.7, 0.7);
  
  return group;
}

export class WeaponInstance {
  constructor(slot) {
    this.slot = slot;
    this.weaponDef = WEAPONS[slot];
    this.ammoLoaded = this.weaponDef.ammoPerMag;
    this.ammoReserve = Math.max(0, this.weaponDef.maxAmmo - this.weaponDef.ammoPerMag);
    this.lastFireTime = 0;
    this.model = null;
    this.createModel();
  }

  createModel() {
    this.model = this.weaponDef.model();
  }

  canFire(now) {
    return now - this.lastFireTime >= this.weaponDef.fireRate;
  }

  fire(now) {
    if (!this.canFire(now)) return false;
    if (this.weaponDef.ammoPerMag === -1 || this.ammoLoaded > 0) {
      if (this.weaponDef.ammoPerMag !== -1) this.ammoLoaded--;
      this.lastFireTime = now;
      return true;
    }
    return false;
  }

  reload(now) {
    if (this.weaponDef.ammoPerMag === -1) return; // melee/bomb, can't reload
    const needed = this.weaponDef.ammoPerMag - this.ammoLoaded;
    const available = Math.min(needed, this.ammoReserve);
    this.ammoLoaded += available;
    this.ammoReserve -= available;
  }

  getAmmoDisplay() {
    if (this.weaponDef.ammoPerMag === -1) return '∞';
    return `${this.ammoLoaded}/${this.ammoReserve}`;
  }
}
