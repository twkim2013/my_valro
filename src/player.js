import * as THREE from 'https://unpkg.com/three@0.156.0/build/three.module.js';

export default class Player {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    
    // Character stats
    this.maxHP = 1500;
    this.hp = 1500;
    this.isDead = false;
    this.respawnTimer = 0;
    this.respawnTime = 10;

    // Create player character mesh
    this.body = new THREE.Group();
    
    // Main body
    const bodyGeo = new THREE.CapsuleGeometry(0.3, 1.2, 8, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4488ff });
    this.mesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.body.add(this.mesh);

    // Head
    const headGeo = new THREE.SphereGeometry(0.25, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xddaa88 });
    this.head = new THREE.Mesh(headGeo, headMat);
    this.head.position.y = 0.85;
    this.body.add(this.head);

    this.body.position.set(0, 1, 8);
    this.scene.add(this.body);

    // Third-person camera
    this.cameraDistance = 5;
    this.cameraHeight = 1.5;
    this.yaw = 0;
    this.pitch = 0.3;

    // Movement
    this.move = { forward: false, back: false, left: false, right: false };
    this.movementSpeed = 8;
    this.lastMoveDir = new THREE.Vector3();

    // Combat
    this.lastAttackTime = 0;
    this.attackCooldown = 1.0; // 1 attack per second

    // Skill 1 - Airborne + damage
    this.skill1Cooldown = 0;
    this.skill1MaxCooldown = 6;

    // Skill 2 - Next attack boosted
    this.skill2Cooldown = 0;
    this.skill2MaxCooldown = 4;
    this.skill2NextAttackBoosted = false;

    // Skill 3 - Damage boost for 5 seconds
    this.skill3Cooldown = 0;
    this.skill3MaxCooldown = 10;
    this.skill3Active = false;
    this.skill3Duration = 0;
    this.skill3DurationMax = 5;

    this.dummy = null;
    this.enabled = false;

    this._bindKeys();
  }


  _bindKeys() {
    window.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'KeyW': this.move.forward = true; break;
        case 'KeyS': this.move.back = true; break;
        case 'KeyA': this.move.left = true; break;
        case 'KeyD': this.move.right = true; break;
        case 'KeyQ': if (!this.isDead) this._useSkill1(); break;
        case 'KeyE': if (!this.isDead) this._useSkill2(); break;
        case 'KeyR': if (!this.isDead) this._useSkill3(); break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW': this.move.forward = false; break;
        case 'KeyS': this.move.back = false; break;
        case 'KeyA': this.move.left = false; break;
        case 'KeyD': this.move.right = false; break;
      }
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0 && !this.isDead) { // Left click
        this._normalAttack();
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.enabled) return;
      this.yaw -= e.movementX * 0.003;
      this.pitch += e.movementY * 0.003;
      this.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.pitch));
    });
  }

  setCameraLocked(locked) {
    this.enabled = locked;
  }

  setDummy(dummy) {
    this.dummy = dummy;
  }

  _normalAttack() {
    const now = performance.now() / 1000;
    if (now - this.lastAttackTime < this.attackCooldown) return;

    this.lastAttackTime = now;
    let damage = 50;

    // Apply skill 3 damage boost if active
    if (this.skill3Active) {
      damage = 100;
    }

    // Apply skill 2 boost if queued
    if (this.skill2NextAttackBoosted) {
      damage += 75;
      this.skill2NextAttackBoosted = false;
      // Push dummy back
      if (this.dummy && !this.dummy.isDead) {
        const dir = new THREE.Vector3().subVectors(this.dummy.body.position, this.body.position).normalize();
        this.dummy.body.position.addScaledVector(dir, 2);
      }
    }

    if (this.dummy && !this.dummy.isDead) {
      const dist = this.body.position.distanceTo(this.dummy.body.position);
      if (dist < 3) {
        this.dummy.takeDamage(damage);
      }
    }
  }

  _useSkill1() {
    if (this.skill1Cooldown > 0) return;
    this.skill1Cooldown = this.skill1MaxCooldown;

    // Airborne enemies around character and damage
    if (this.dummy && !this.dummy.isDead) {
      const dist = this.body.position.distanceTo(this.dummy.body.position);
      if (dist < 8) {
        this.dummy.takeDamage(100);
        this.dummy.stun(0.5);
      }
    }
  }

  _useSkill2() {
    if (this.skill2Cooldown > 0) return;
    this.skill2Cooldown = this.skill2MaxCooldown;
    this.skill2NextAttackBoosted = true;
  }

  _useSkill3() {
    if (this.skill3Cooldown > 0) return;
    this.skill3Cooldown = this.skill3MaxCooldown;
    this.skill3Active = true;
    this.skill3Duration = this.skill3DurationMax;
  }

  takeDamage(amount) {
    if (this.isDead) return;
    this.hp -= amount;
    if (this.hp < 0) this.hp = 0;

    if (this.hp <= 0) {
      this.isDead = true;
      this.respawnTimer = 0;
    }
  }

  respawn() {
    this.isDead = false;
    this.hp = this.maxHP;
    this.body.position.set(0, 1, 8);
    this.skill1Cooldown = 0;
    this.skill2Cooldown = 0;
    this.skill3Cooldown = 0;
    this.skill3Active = false;
    this.skill2NextAttackBoosted = false;
  }

  update(dt) {
    // Update skill cooldowns
    if (this.skill1Cooldown > 0) this.skill1Cooldown -= dt;
    if (this.skill2Cooldown > 0) this.skill2Cooldown -= dt;
    if (this.skill3Cooldown > 0) this.skill3Cooldown -= dt;

    // Update skill 3 duration
    if (this.skill3Active) {
      this.skill3Duration -= dt;
      if (this.skill3Duration <= 0) {
        this.skill3Active = false;
      }
    }

    // Handle respawning
    if (this.isDead) {
      this.respawnTimer += dt;
      if (this.respawnTimer >= this.respawnTime) {
        this.respawn();
      }
      return;
    }

    // Movement
    let moveDir = new THREE.Vector3();
    if (this.move.forward) moveDir.z -= 1;
    if (this.move.back) moveDir.z += 1;
    if (this.move.left) moveDir.x -= 1;
    if (this.move.right) moveDir.x += 1;

    if (moveDir.length() > 0) {
      // Rotate movement based on camera yaw
      const cameraYaw = this.yaw;
      const cos = Math.cos(cameraYaw);
      const sin = Math.sin(cameraYaw);

      const rotated = new THREE.Vector3(
        moveDir.x * cos - moveDir.z * sin,
        0,
        moveDir.x * sin + moveDir.z * cos
      );

      rotated.normalize();
      this.body.position.addScaledVector(rotated, this.movementSpeed * dt);
      // Rotate character to face movement direction
      this.body.rotation.y = Math.atan2(rotated.x, -rotated.z);
      this.lastMoveDir.copy(rotated);
    }

    // Update camera to orbit around character
    const camDistance = this.cameraDistance;
    const camHeight = this.cameraHeight;
    this.camera.position.x = this.body.position.x - Math.sin(this.yaw) * camDistance * Math.cos(this.pitch);
    this.camera.position.y = this.body.position.y + camHeight + Math.sin(this.pitch) * camDistance;
    this.camera.position.z = this.body.position.z - Math.cos(this.yaw) * camDistance * Math.cos(this.pitch);
    this.camera.lookAt(this.body.position.x, this.body.position.y + 0.5, this.body.position.z);
  }
}

