import * as THREE from 'https://unpkg.com/three@0.156.0/build/three.module.js';
import { WeaponInstance } from './weapons.js';

export class Bot {
  constructor(position, team = 'terrorists', name = 'Bot', obstacles = []) {
    this.position = position;
    this.team = team;
    this.name = name;
    this.hp = 100;
    this.maxHP = 100;
    this.armor = 0;
    this.isDead = false;
    this.respawnTimer = 0;
    this.respawnTime = 5.0;
    this.initialPosition = position.clone();
    this.slot = 1;
    this.weapons = { 1: new WeaponInstance(1), 2: new WeaponInstance(2), 3: new WeaponInstance(3) };
    this.money = 800;
    this.obstacles = obstacles;
    this.collisionRadius = 0.3;

    // Random movement
    this.waypoints = [];
    this.currentWaypoint = 0;
    this.moveSpeed = 2.5;
    this.direction = new THREE.Vector3();
    this.randomTarget = this._generateRandomTarget();
    this.targetChangeTimer = 0;
    this.targetChangeInterval = 3.0; // Change target every 3 seconds

    // Create detailed person model
    this.body = this._createDetailedModel(position, team);
    this.body.position.copy(position);
    this.body.userData.isBot = true;
    this.body.userData.bot = this;
  }

  _createDetailedModel(position, team) {
    const group = new THREE.Group();
    const color = team === 'terrorists' ? 0xff4444 : 0x4444ff;
    const lightColor = team === 'terrorists' ? 0xff8888 : 0x8888ff;
    
    // Head
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xff9966, metalness: 0, roughness: 0.8 })
    );
    head.position.y = 1.5;
    group.add(head);
    
    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x000000 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.08, 1.65, 0.2);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.08, 1.65, 0.2);
    group.add(leftEye);
    group.add(rightEye);
    
    // Torso (chest + abdomen)
    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.6, 0.25),
      new THREE.MeshStandardMaterial({ color: color, metalness: 0.1, roughness: 0.7 })
    );
    torso.position.y = 0.9;
    group.add(torso);
    
    // Left Arm
    const leftArm = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.12, 0.7, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xff9966, metalness: 0, roughness: 0.8 })
    );
    leftArm.position.set(-0.3, 0.9, 0);
    leftArm.rotation.z = Math.PI * 0.3;
    group.add(leftArm);
    
    // Right Arm
    const rightArm = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.12, 0.7, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xff9966, metalness: 0, roughness: 0.8 })
    );
    rightArm.position.set(0.3, 0.9, 0);
    rightArm.rotation.z = -Math.PI * 0.3;
    group.add(rightArm);
    
    // Left Leg
    const leftLeg = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.13, 0.8, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.2, roughness: 0.6 })
    );
    leftLeg.position.set(-0.15, 0.4, 0);
    group.add(leftLeg);
    
    // Right Leg
    const rightLeg = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.13, 0.8, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.2, roughness: 0.6 })
    );
    rightLeg.position.set(0.15, 0.4, 0);
    group.add(rightLeg);
    
    // Helmet / Hat
    const helmet = new THREE.Mesh(
      new THREE.ConeGeometry(0.28, 0.25, 16),
      new THREE.MeshStandardMaterial({ color: lightColor, metalness: 0.6, roughness: 0.4 })
    );
    helmet.position.y = 1.7;
    group.add(helmet);
    
    // Name tag
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = team === 'terrorists' ? '#ff4444' : '#4444ff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(name.slice(0, 8), 128, 40);
    const texture = new THREE.CanvasTexture(canvas);

    const nameTagGeo = new THREE.PlaneGeometry(2, 0.5);
    const nameTagMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    this.nameTag = new THREE.Mesh(nameTagGeo, nameTagMat);
    this.nameTag.position.y = 2.0;
    group.add(this.nameTag);
    
    // Health bar background
    const healthBarBg = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 0.1),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    healthBarBg.position.y = 2.2;
    healthBarBg.position.z = 0.01;
    group.add(healthBarBg);
    
    // Health bar fill
    const healthBarFill = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 0.1),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    healthBarFill.position.y = 2.2;
    healthBarFill.position.z = 0.02;
    healthBarFill.scale.x = 1; // Will be updated based on health
    group.add(healthBarFill);
    this.healthBarFill = healthBarFill;
    
    return group;
  }

  setWaypoints(points) {
    this.waypoints = points;
    this.currentWaypoint = 0;
  }

  _generateRandomTarget() {
    // Generate a random target within stage bounds (-80 to 80 on X and Z axis)
    const stageMin = -80;
    const stageMax = 80;
    const x = Math.random() * (stageMax - stageMin) + stageMin;
    const z = Math.random() * (stageMax - stageMin) + stageMin;
    return new THREE.Vector3(x, 0, z);
  }

  _checkCollision(position) {
    // Check if position would collide with any obstacle
    for (let i = 0; i < this.obstacles.length; i++) {
      const obstacle = this.obstacles[i];
      const obsBox = new THREE.Box3().setFromObject(obstacle);
      
      // Create a box around the bot position
      const botBox = new THREE.Box3();
      botBox.setFromCenterAndSize(
        position,
        new THREE.Vector3(this.collisionRadius * 2, 1.8, this.collisionRadius * 2)
      );
      
      // Check for intersection
      if (botBox.intersectsBox(obsBox)) {
        return true; // Collision detected
      }
    }
    return false; // No collision
  }

  _isWithinStageBounds(position) {
    // Keep bots within stage bounds (-80 to 80)
    const stageMin = -80;
    const stageMax = 80;
    return position.x > stageMin && position.x < stageMax && position.z > stageMin && position.z < stageMax;
  }

  setWaypoints(points) {

  canSeePlayer(playerPos) {
    // Check distance (vision range)
    const distanceToPlayer = playerPos.distanceTo(this.body.position);
    const visionRange = 30; // Can see within 30 units
    if (distanceToPlayer > visionRange) return false;
    
    // Check if player is roughly in front (simple FOV check)
    const dirToPlayer = playerPos.clone().sub(this.body.position).normalize();
    const botForward = new THREE.Vector3(0, 0, -1); // Default forward direction
    const dotProduct = dirToPlayer.dot(botForward);
    
    // Can see if within ~120 degree FOV
    if (dotProduct < -0.3) return false;
    
    return true;
  }
  
  fireAtPlayer(playerPos, player, now) {
    // Fire cooldown (fire every 0.5 seconds)
    const weapon = this.weapons[this.slot];
    if (!weapon.canFire(now)) return;
    
    // Calculate direction to player
    const dirToPlayer = playerPos.clone().sub(this.body.position).normalize();
    
    // Raycast to check line of sight
    const raycaster = new THREE.Raycaster(this.body.position, dirToPlayer);
    
    // Create a simple hit box for player at camera position
    const playerRadius = 0.4;
    const distToPlayer = playerPos.distanceTo(this.body.position);
    const sphere = new THREE.Sphere(playerPos, playerRadius);
    
    if (raycaster.ray.distanceToPoint(playerPos) < playerRadius && distToPlayer < 50) {
      // Hit the player with 50% damage
      weapon.fire(now);
      const baseDamage = weapon.weaponDef.damage.body;
      const actualDamage = baseDamage * 0.5; // 50% damage
      
      player.takeDamage(actualDamage);
      console.log(`Bot ${this.name} shot player for ${actualDamage.toFixed(1)} damage!`);
    }
  }
  
  takeDamage(amount) {
    if (this.isDead) return;
    
    // Apply armor reduction (simplified)
    const actualDamage = amount * (1 - this.armor / 100);
    this.hp -= actualDamage;
    
    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
      this.body.traverse(child => {
        if (child.material) {
          child.material.emissive.setHex(0xff0000);
        }
      });
      console.log(`Bot ${this.name} died!`);
    }
    
    // Update health bar
    this.updateHealthBar();
    
    return actualDamage;
  }
  
  updateHealthBar() {
    if (this.healthBarFill) {
      const healthRatio = Math.max(0, this.hp / this.maxHP);
      this.healthBarFill.scale.x = healthRatio;
      this.healthBarFill.material.color.setHex(healthRatio > 0.5 ? 0x00ff00 : healthRatio > 0.25 ? 0xffff00 : 0xff0000);
    }
  }

  update(dt, player) {
    // Handle respawning
    if (this.isDead) {
      this.respawnTimer += dt;
      if (this.respawnTimer >= this.respawnTime) {
        // Respawn
        this.isDead = false;
        this.respawnTimer = 0;
        this.hp = 100;
        this.armor = 0;
        this.body.position.copy(this.initialPosition);
        this.randomTarget = this._generateRandomTarget();
        this.targetChangeTimer = 0;
        this.updateHealthBar();
        this.body.traverse(child => {
          if (child.material && child.material.emissive) {
            child.material.emissive.setHex(0x000000);
          }
        });
        console.log(`Bot ${this.name} respawned!`);
      }
      return;
    }

    // Check if player is visible and shoot
    if (player && !player.isDead && this.canSeePlayer(player.camera.position)) {
      this.fireAtPlayer(player.camera.position, player, performance.now());
    }

    // Random movement with target changing
    this.targetChangeTimer += dt;
    if (this.targetChangeTimer >= this.targetChangeInterval) {
      this.targetChangeTimer = 0;
      this.randomTarget = this._generateRandomTarget();
    }

    // Move toward random target with collision and boundary checking
    const dirToTarget = this.randomTarget.clone().sub(this.body.position);
    const distToTarget = dirToTarget.length();

    if (distToTarget > 0.5) {
      const direction = dirToTarget.normalize();
      const newPosition = this.body.position.clone().addScaledVector(direction, this.moveSpeed * dt);

      // Check boundaries and collisions before moving
      if (this._isWithinStageBounds(newPosition) && !this._checkCollision(newPosition)) {
        this.body.position.copy(newPosition);
      } else {
        // If hit boundary or wall, generate new target immediately
        this.randomTarget = this._generateRandomTarget();
        this.targetChangeTimer = 0;
      }
    } else {
      // Reached target, generate new one
      this.randomTarget = this._generateRandomTarget();
      this.targetChangeTimer = 0;
    }
  }

  getModel() {
    return this.body;
  }
}

export class BotManager {
  constructor(scene, obstacles = []) {
    this.scene = scene;
    this.bots = [];
    this.player = null;
    this.obstacles = obstacles;
    this.terroristSpawns = [
      new THREE.Vector3(-10, 0, 0),
      new THREE.Vector3(-8, 0, -2),
      new THREE.Vector3(-6, 0, 0),
      new THREE.Vector3(-10, 0, 2),
      new THREE.Vector3(-8, 0, 2),
    ];
    this.ctSpawns = [
      new THREE.Vector3(10, 0, 0),
      new THREE.Vector3(8, 0, -2),
      new THREE.Vector3(6, 0, 0),
      new THREE.Vector3(10, 0, 2),
      new THREE.Vector3(8, 0, 2),
    ];
  }

  spawnTeam(team = 'terrorists', count = 4) {
    const spawns = team === 'terrorists' ? this.terroristSpawns : this.ctSpawns;
    const baseWaypoints = team === 'terrorists'
      ? [new THREE.Vector3(5, 0, -10), new THREE.Vector3(8, 0, -8), new THREE.Vector3(-8, 0, -8)]
      : [new THREE.Vector3(-6, 0, -8), new THREE.Vector3(0, 0, -8), new THREE.Vector3(8, 0, -8)];

    for (let i = 0; i < Math.min(count, spawns.length); i++) {
      const bot = new Bot(spawns[i], team, `${team === 'terrorists' ? 'T' : 'CT'}${i + 1}`, this.obstacles);
      bot.setWaypoints(baseWaypoints);
      this.scene.add(bot.getModel());
      this.bots.push(bot);
    }
  }

  update(dt, player) {
    this.bots.forEach(bot => bot.update(dt, player));
  }

  getAliveBotsCount(team) {
    return this.bots.filter(b => !b.isDead && b.team === team).length;
  }

  setPlayer(player) {
    this.player = player;
    this.bots.forEach(bot => bot.player = player);
  }
}
