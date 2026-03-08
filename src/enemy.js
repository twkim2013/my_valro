import * as THREE from 'https://unpkg.com/three@0.156.0/build/three.module.js';

export class Enemy {
  constructor(position, team = 'terrorists') {
    this.team = team; // 'terrorists' or 'counter-terrorists'
    this.hp = 100;
    this.maxHP = 100;
    this.armor = 0;
    this.isDead = false;
    this.lastHitTime = 0;
    this.hitFlashDuration = 0.1;
    this.hitFlashing = false;

    // Create body mesh
    this.body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.4, 1.6, 8, 16),
      new THREE.MeshStandardMaterial({
        color: team === 'terrorists' ? 0xff4444 : 0x4444ff,
        emissive: 0x000000,
      })
    );
    this.body.position.copy(position);
    this.body.userData.isEnemy = true;
    this.body.userData.enemy = this;

    // Create hitbox components
    this.head = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 16, 16),
      new THREE.MeshStandardMaterial({ color: team === 'terrorists' ? 0xcc3333 : 0x3333cc })
    );
    this.head.position.y = 0.8;
    this.body.add(this.head);
    this.head.userData.hitType = 'head';
    this.head.userData.multiplier = 2.0;

    // Body hitbox (already body mesh, but store multiplier)
    this.body.userData.hitType = 'body';
    this.body.userData.multiplier = 1.0;

    // Legs hitbox
    this.legs = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.6, 0.35),
      new THREE.MeshStandardMaterial({ color: team === 'terrorists' ? 0x991111 : 0x111199 })
    );
    this.legs.position.y = -0.5;
    this.body.add(this.legs);
    this.legs.userData.hitType = 'legs';
    this.legs.userData.multiplier = 0.75;

    // Health bar
    this.healthBarGroup = new THREE.Group();
    this.healthBarGroup.position.y = 1.2;
    this.body.add(this.healthBarGroup);

    const bgBar = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 0.1),
      new THREE.MeshBasicMaterial({ color: 0x222222 })
    );
    bgBar.position.z = 0.01;
    this.healthBarGroup.add(bgBar);

    this.healthBar = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 0.1),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    this.healthBar.position.z = 0.02;
    this.healthBarGroup.add(this.healthBar);
  }

  takeDamage(amount, hitType = 'body') {
    if (this.isDead) return 0;

    const multiplier = hitType === 'head' ? 2.0 : hitType === 'legs' ? 0.75 : 1.0;
    let finalDamage = amount * multiplier;

    // Armor reduction (simple model)
    if (this.armor > 0) {
      const armorAbsorb = Math.min(finalDamage * 0.5, this.armor);
      finalDamage -= armorAbsorb;
      this.armor -= armorAbsorb;
    }

    this.hp = Math.max(0, this.hp - finalDamage);
    this.hitFlashing = true;
    this.lastHitTime = performance.now();

    if (this.hp <= 0) {
      this.die();
      return finalDamage;
    }

    return finalDamage;
  }

  die() {
    this.isDead = true;
    this.body.material.emissive.setHex(0xff0000);
    setTimeout(() => {
      if (this.body.parent) this.body.parent.remove(this.body);
    }, 500);
  }

  update(dt) {
    // Update health bar width
    const healthPercent = this.hp / this.maxHP;
    this.healthBar.scale.x = healthPercent;
    this.healthBar.position.x = (healthPercent - 1) * 0.4; // center it

    // Hit flash effect
    if (this.hitFlashing) {
      const elapsed = (performance.now() - this.lastHitTime) / 1000;
      if (elapsed < this.hitFlashDuration) {
        const t = elapsed / this.hitFlashDuration;
        const flashColor = new THREE.Color(0xffff00).lerp(
          new THREE.Color(this.team === 'terrorists' ? 0xff4444 : 0x4444ff),
          t
        );
        if (this.body.material) this.body.material.color.copy(flashColor);
      } else {
        this.hitFlashing = false;
        this.body.material.color.setHex(this.team === 'terrorists' ? 0xff4444 : 0x4444ff);
      }
    }
  }

  getModel() {
    return this.body;
  }
}

export class EnemyManager {
  constructor(scene) {
    this.scene = scene;
    this.enemies = [];
  }

  spawn(position, team = 'terrorists') {
    const enemy = new Enemy(position, team);
    this.scene.add(enemy.getModel());
    this.enemies.push(enemy);
    return enemy;
  }

  raycastHit(raycaster) {
    const hitMeshes = this.enemies
      .filter(e => !e.isDead)
      .map(e => [e.head, e.body, e.legs])
      .flat();

    const intersects = raycaster.intersectObjects(hitMeshes);
    if (intersects.length > 0) {
      const hit = intersects[0];
      const enemy = hit.object.userData.enemy || hit.object.parent.userData.enemy;
      const hitType = hit.object.userData.hitType || 'body';
      return { enemy, hitType, distance: hit.distance };
    }
    return null;
  }

  update(dt) {
    this.enemies.forEach(e => e.update(dt));
    // Remove dead enemies from list
    this.enemies = this.enemies.filter(e => !e.isDead);
  }

  getAliveCount() {
    return this.enemies.filter(e => !e.isDead).length;
  }
}
