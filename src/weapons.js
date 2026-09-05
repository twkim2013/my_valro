import * as THREE from 'https://unpkg.com/three@0.156.0/build/three.module.js';
import {
  createClassicPistolModel,
  createShortyModel,
  createGhostModel,
  createDesertEagleModel,
  createSprayModel,
  createKnifeModel,
  createBombModel,
} from './models.js';

export const WEAPONS = {
  1: {
    name: 'Classic',
    cost: 0,
    damage: { head: 75, body: 30, leg: 20 },
    ammoPerMag: 12,
    maxAmmo: 36,
    fireRate: 0.1,
    accuracy: 0.95,
    recoil: 0.02,
    model: createClassicPistolModel,
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
    ammoPerMag: -1,
    maxAmmo: -1,
    fireRate: 0.5,
    accuracy: 1.0,
    recoil: 0.0,
    model: createKnifeModel,
  },
  4: {
    name: 'Bomb',
    cost: 0,
    damage: { head: 0, body: 0, leg: 0 },
    ammoPerMag: -1,
    maxAmmo: -1,
    fireRate: 1.0,
    accuracy: 1.0,
    recoil: 0.0,
    model: createBombModel,
  },
  5: {
    name: 'Spray',
    cost: 400,
    damage: { head: 65, body: 28, leg: 18 },
    ammoPerMag: 15,
    maxAmmo: 60,
    fireRate: 0.05,
    accuracy: 0.75,
    recoil: 0.03,
    model: createSprayModel,
  },
  6: {
    name: 'Ghost',
    cost: 500,
    damage: { head: 70, body: 32, leg: 22 },
    ammoPerMag: 13,
    maxAmmo: 39,
    fireRate: 0.12,
    accuracy: 0.92,
    recoil: 0.018,
    model: createGhostModel,
  },
  7: {
    name: 'Desert Eagle',
    cost: 800,
    damage: { head: 95, body: 45, leg: 30 },
    ammoPerMag: 7,
    maxAmmo: 35,
    fireRate: 0.3,
    accuracy: 0.88,
    recoil: 0.08,
    model: createDesertEagleModel,
  },
};

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
