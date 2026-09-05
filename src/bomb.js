import * as THREE from 'https://unpkg.com/three@0.156.0/build/three.module.js';

export class BombSite {
  constructor(name, position, size = 3) {
    this.name = name;
    this.position = position;
    this.size = size;
    
    // Visual zone
    this.zone = new THREE.Mesh(
      new THREE.BoxGeometry(size, 0.1, size),
      new THREE.MeshStandardMaterial({
        color: name === 'A' ? 0xff0000 : 0xffff00,
        transparent: true,
        opacity: 0.3,
        emissive: name === 'A' ? 0xff0000 : 0xffff00,
      })
    );
    this.zone.position.copy(position);
    this.zone.position.y = 0.05;
    this.zone.userData.isBombSite = true;
    this.zone.userData.siteName = name;
  }

  isWithinZone(position, radius = 1.0) {
    return this.position.distanceTo(position) <= (this.size / 2 + radius);
  }

  getModel() {
    return this.zone;
  }
}

export class Bomb {
  constructor() {
    this.carrier = null;
    this.isPlanted = false;
    this.plantedAt = null;
    this.plantedSite = null;
    this.model = this._createModel();
    this.position = new THREE.Vector3();
  }

  _createModel() {
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
    
    return group;
  }

  pickup(carrier) {
    this.carrier = carrier;
    this.isPlanted = false;
  }

  drop(position) {
    this.carrier = null;
    this.position.copy(position);
  }

  plant(siteName, position) {
    this.isPlanted = true;
    this.plantedAt = performance.now();
    this.plantedSite = siteName;
    this.position.copy(position);
    this.carrier = null;
  }

  isExploded(bombTimer = 40) {
    if (!this.isPlanted) return false;
    const elapsed = (performance.now() - this.plantedAt) / 1000;
    return elapsed >= bombTimer;
  }

  getTimeRemaining(bombTimer = 40) {
    if (!this.isPlanted) return bombTimer;
    const elapsed = (performance.now() - this.plantedAt) / 1000;
    return Math.max(0, bombTimer - elapsed);
  }

  getModel() {
    return this.model;
  }
}

export class BombManager {
  constructor(scene) {
    this.scene = scene;
    this.bomb = new Bomb();
    this.sites = {
      A: new BombSite('A', new THREE.Vector3(-8, 0, -8)),
      B: new BombSite('B', new THREE.Vector3(8, 0, -10)),
    };
    
    // Add site zones to scene
    Object.values(this.sites).forEach(site => this.scene.add(site.getModel()));

    this.plantingPlayer = null;
    this.plantingProgress = 0;
    this.plantTimeNeeded = 4.0;

    this.defusingPlayer = null;
    this.defusingProgress = 0;
    this.defuseTimeNeeded = 7.0;

    this.bombTimer = 40; // seconds
    this.plantedTime = null;
  }

  canPlant(player, sites) {
    if (!player.hasBomb || this.bomb.isPlanted) return null;
    
    for (let siteName of ['A', 'B']) {
      const site = this.sites[siteName];
      if (site.isWithinZone(player.camera.position)) return siteName;
    }
    return null;
  }

  startPlant(player, siteName) {
    if (this.plantingPlayer) return false;
    this.plantingPlayer = player;
    this.plantingProgress = 0;
  }

  updatePlant(dt) {
    if (!this.plantingPlayer) return;
    
    const siteName = this.canPlant(this.plantingPlayer, this.sites);
    if (!siteName) {
      // Interrupted
      this.plantingPlayer = null;
      this.plantingProgress = 0;
      return;
    }

    this.plantingProgress += dt;
    if (this.plantingProgress >= this.plantTimeNeeded) {
      // Plant successful
      this.bomb.plant(siteName, this.sites[siteName].position);
      this.plantedTime = performance.now();
      this.plantingPlayer.hasBomb = false;
      this.plantingPlayer = null;
      this.plantingProgress = 0;
      console.log(`Bomb planted at site ${siteName}!`);
    }
  }

  startDefuse(player) {
    if (this.defusingPlayer || !this.bomb.isPlanted) return false;
    this.defusingPlayer = player;
    this.defusingProgress = 0;
  }

  updateDefuse(dt) {
    if (!this.defusingPlayer || !this.bomb.isPlanted) return;
    
    const site = this.sites[this.bomb.plantedSite];
    if (!site.isWithinZone(this.defusingPlayer.camera.position)) {
      // Interrupted
      this.defusingPlayer = null;
      this.defusingProgress = 0;
      return;
    }

    this.defusingProgress += dt;
    if (this.defusingProgress >= this.defuseTimeNeeded) {
      // Defuse successful
      this.bomb.isPlanted = false;
      this.defusingPlayer = null;
      this.defusingProgress = 0;
      console.log('Bomb defused!');
    }
  }

  update(dt) {
    this.updatePlant(dt);
    this.updateDefuse(dt);
    
    // Update bomb position
    if (this.bomb.carrier) {
      this.bomb.position.copy(this.bomb.carrier.camera.position);
      this.bomb.position.add(new THREE.Vector3(0.3, -0.2, -0.5).applyQuaternion(this.bomb.carrier.camera.quaternion));
    }
  }

  checkExplosion(player, enemies, bots) {
    if (!this.bomb.isPlanted) return false;
    
    if (this.bomb.isExploded(this.bombTimer)) {
      console.log('BOMB EXPLODED! Terrorists win!');
      
      // Kill player if on CT side
      if (player && player.team !== 'terrorists') {
        player.hp = 0;
        player.isDead = true;
      }
      
      // Kill all alive CTs
      if (enemies) {
        enemies.forEach(e => {
          if (!e.isDead && e.team === 'counter-terrorists') {
            e.takeDamage(999);
          }
        });
      }
      
      // Kill all alive CT bots
      if (bots) {
        bots.bots.forEach(bot => {
          if (!bot.isDead && bot.team === 'counter-terrorists') {
            bot.hp = 0;
            bot.isDead = true;
          }
        });
      }
      
      return true;
    }
    return false;
  }

  getPlantProgress() {
    return this.plantingPlayer ? this.plantingProgress / this.plantTimeNeeded : 0;
  }

  getDefuseProgress() {
    return this.defusingPlayer ? this.defusingProgress / this.defuseTimeNeeded : 0;
  }
}
