import * as THREE from 'https://unpkg.com/three@0.156.0/build/three.module.js';

export class Dummy {
  constructor(scene, position = new THREE.Vector3(0, 1, 3)) {
    this.scene = scene;
    this.maxHP = 500;
    this.hp = 500;
    this.isDead = false;
    this.stunned = false;
    this.stunTimer = 0;

    // Create dummy mesh
    this.body = new THREE.Group();

    // Main body
    const bodyGeo = new THREE.CapsuleGeometry(0.25, 1.0, 8, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff6b6b });
    this.mesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.body.add(this.mesh);

    // Head
    const headGeo = new THREE.SphereGeometry(0.2, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffaa88 });
    this.head = new THREE.Mesh(headGeo, headMat);
    this.head.position.y = 0.7;
    this.body.add(this.head);

    // Health bar background
    const healthBarBgGeo = new THREE.PlaneGeometry(1, 0.1);
    const healthBarBgMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
    this.healthBarBg = new THREE.Mesh(healthBarBgGeo, healthBarBgMat);
    this.healthBarBg.position.y = 1.3;
    this.healthBarBg.position.z = 0.1;
    this.body.add(this.healthBarBg);

    // Health bar
    const healthBarGeo = new THREE.PlaneGeometry(1, 0.1);
    const healthBarMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    this.healthBar = new THREE.Mesh(healthBarGeo, healthBarMat);
    this.healthBar.position.y = 1.3;
    this.healthBar.position.z = 0.11;
    this.body.add(this.healthBar);

    this.body.position.copy(position);
    this.initialPosition = position.clone();
    this.scene.add(this.body);

    this.player = null;
  }

  setPlayer(player) {
    this.player = player;
  }

  takeDamage(amount) {
    if (this.isDead) return;

    this.hp -= amount;
    if (this.hp < 0) this.hp = 0;

    // Flash the dummy
    this.mesh.material.emissive.setHex(0xff0000);
    setTimeout(() => {
      this.mesh.material.emissive.setHex(0x000000);
    }, 100);

    // Update health bar
    const healthPercent = Math.max(0, this.hp / this.maxHP);
    this.healthBar.scale.x = healthPercent;
    this.healthBar.position.x = (1 - healthPercent) * -0.5;

    if (this.hp <= 0) {
      this.isDead = true;
      this.mesh.material.color.setHex(0x666666);
      this.head.material.color.setHex(0x888888);
    }
  }

  stun(duration) {
    this.stunned = true;
    this.stunTimer = duration;
    this.mesh.material.emissive.setHex(0xffff00);
  }

  respawn() {
    this.isDead = false;
    this.hp = this.maxHP;
    this.stunned = false;
    this.stunTimer = 0;
    this.mesh.material.color.setHex(0xff6b6b);
    this.mesh.material.emissive.setHex(0x000000);
    this.head.material.color.setHex(0xffaa88);
    this.body.position.copy(this.initialPosition);

    // Reset health bar
    this.healthBar.scale.x = 1;
    this.healthBar.position.x = 0;
  }

  update(dt) {
    if (this.stunned) {
      this.stunTimer -= dt;
      if (this.stunTimer <= 0) {
        this.stunned = false;
        this.mesh.material.emissive.setHex(0x000000);
      }
    }

    // Simple AI: move towards player if not dead
    if (!this.isDead && this.player && !this.stunned) {
      const direction = new THREE.Vector3().subVectors(this.player.body.position, this.body.position);
      const distance = direction.length();

      if (distance > 1.5) {
        direction.normalize();
        this.body.position.addScaledVector(direction, 3 * dt);
        this.body.rotation.y = Math.atan2(direction.x, direction.z);
      }
    }
  }
}

