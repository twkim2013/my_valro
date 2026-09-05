import * as THREE from 'https://unpkg.com/three@0.156.0/build/three.module.js';

export default class Enemy {
    constructor(scene, position) {
        this.scene = scene;
        this.position = position.clone();
        this.hp = 1500;
        this.maxHp = 1500;
        this.isDead = false;

        // AI properties
        this.moveSpeed = 3.0;
        this.targetPlayer = null;
        this.lastAttackTime = 0;
        this.attackCooldown = 1.0;
        this.normalDamage = 50;
        this.skillCooldowns = { 1: 0, 2: 0, 3: 0 };
        this.skillCooldownTimes = { 1: 6.0, 2: 4.0, 3: 10.0 };
        this.powerUpActive = false;
        this.powerUpDamage = 75;
        this.rageActive = false;
        this.rageDamage = 100;
        this.rageTimer = 0;
        this.rageDuration = 5.0;
        
        // Hit effect properties
        this.hitEffectActive = false;
        this.hitEffectTimer = 0;
        this.hitEffectDuration = 0.2;
        this.originalColor = new THREE.Color(0xff0000);
        this.hitColor = new THREE.Color(0xffffff);
        this.originalScale = new THREE.Vector3(1, 1, 1);
        this.hitScale = new THREE.Vector3(1.2, 0.8, 1.2);
        
        // AI states
        this.isFollowing = false;
        this.followStartTime = 0;
        this.closeToPlayerTime = 0;
        this.randomMoveTimer = 0;
        this.randomMoveDirection = new THREE.Vector3();
        this.randomMoveDuration = 0;

        this.createModel();
        this.createHpBar();
        this.updateHpBar();
    }

    createModel() {
        // Create enemy group
        this.body = new THREE.Group();
        this.scene.add(this.body);

        // Main body - capsule
        const bodyGeometry = new THREE.CapsuleGeometry(0.5, 1.5, 8, 16);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const mainBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.body.add(mainBody);

        // Head with face details
        const headGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });
        this.head = new THREE.Mesh(headGeometry, headMaterial);
        this.head.position.y = 1.0;
        this.body.add(this.head);

        // Eyes (simple black spheres)
        const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.15, 1.1, 0.25);
        this.body.add(leftEye);
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.15, 1.1, 0.25);
        this.body.add(rightEye);

        // Arms
        const armGeometry = new THREE.CapsuleGeometry(0.15, 0.8, 6, 8);
        const armMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.7, 0.2, 0);
        leftArm.rotation.z = Math.PI / 6;
        this.body.add(leftArm);
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.7, 0.2, 0);
        rightArm.rotation.z = -Math.PI / 6;
        this.body.add(rightArm);

        // Weapon (simple sword)
        const swordGeometry = new THREE.BoxGeometry(0.1, 1.2, 0.1);
        const swordMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
        this.sword = new THREE.Mesh(swordGeometry, swordMaterial);
        this.sword.position.set(0.8, -0.3, 0.3);
        this.sword.rotation.x = Math.PI / 4;
        this.body.add(this.sword);

        // Sword handle
        const handleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8);
        const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.set(0.8, 0.1, 0.3);
        this.body.add(handle);

        this.body.position.copy(this.position);
    }

    createHpBar() {
        this.hpBarContainer = document.createElement('div');
        this.hpBarContainer.className = 'hp-bar-container';
        this.hpBarContainer.innerHTML = `
            <div class="hp-bar-bg">
                <div class="hp-bar-fill" id="enemy-hp-fill-${Date.now()}"></div>
            </div>
        `;
        document.getElementById('hp-bars').appendChild(this.hpBarContainer);
        this.hpBarFill = this.hpBarContainer.querySelector('.hp-bar-fill');
    }

    updateHpBar() {
        if (!this.hpBarContainer || !this.targetPlayer) return;
        
        // Convert 3D position to screen coordinates using player's camera
        const screenPos = this.position.clone();
        screenPos.project(this.targetPlayer.camera);
        
        const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight - 50;
        
        this.hpBarContainer.style.left = x + 'px';
        this.hpBarContainer.style.top = y + 'px';
        
        // Update HP bar width
        const hpPercent = (this.hp / this.maxHp) * 100;
        this.hpBarFill.style.width = hpPercent + '%';
        
        // Change color based on HP
        if (hpPercent > 60) {
            this.hpBarFill.style.background = '#00ff00';
        } else if (hpPercent > 30) {
            this.hpBarFill.style.background = '#ffff00';
        } else {
            this.hpBarFill.style.background = '#ff0000';
        }
    }

    setTargetPlayer(player) {
        this.targetPlayer = player;
    }

    applyHitEffect() {
        this.hitEffectActive = true;
        this.hitEffectTimer = this.hitEffectDuration;
        // Change color to white for flash effect
        this.body.material.color.copy(this.hitColor);
        // Scale for hit reaction
        this.body.scale.copy(this.hitScale);
    }

    update(dt) {
        if (this.isDead || !this.targetPlayer) return;

        // Update hit effect
        if (this.hitEffectActive) {
            this.hitEffectTimer -= dt;
            if (this.hitEffectTimer <= 0) {
                // Reset to original appearance
                this.hitEffectActive = false;
                this.body.material.color.copy(this.originalColor);
                this.body.scale.copy(this.originalScale);
            }
        }

        // Update skill cooldowns
        for (let skill in this.skillCooldowns) {
            if (this.skillCooldowns[skill] > 0) {
                this.skillCooldowns[skill] -= dt;
            }
        }

        // Update rage timer
        if (this.rageActive) {
            this.rageTimer -= dt;
            if (this.rageTimer <= 0) {
                this.rageActive = false;
            }
        }

        const distanceToPlayer = this.position.distanceTo(this.targetPlayer.position);
        const isClose = distanceToPlayer < 5.0;

        // Track how long player has been close
        if (isClose) {
            this.closeToPlayerTime += dt;
        } else {
            this.closeToPlayerTime = 0;
        }

        // AI Logic
        if (this.isFollowing) {
            // Follow player while rage is active
            if (this.rageActive) {
                const direction = this.targetPlayer.position.clone().sub(this.position).normalize();
                this.position.add(direction.multiplyScalar(this.moveSpeed * dt));
                this.body.position.copy(this.position);
            } else {
                this.isFollowing = false;
            }
        } else {
            // Random movement when not following
            this.randomMoveTimer -= dt;
            if (this.randomMoveTimer <= 0) {
                // Choose new random direction
                const angle = Math.random() * Math.PI * 2;
                this.randomMoveDirection.set(Math.cos(angle), 0, Math.sin(angle));
                this.randomMoveDuration = 1.0 + Math.random() * 2.0; // 1-3 seconds
                this.randomMoveTimer = this.randomMoveDuration;
            }

            // Move in random direction
            const newPosition = this.position.clone().add(this.randomMoveDirection.clone().multiplyScalar(this.moveSpeed * dt));
            
            // Keep within stage bounds (-20 to 20 in X and Z)
            if (newPosition.x >= -20 && newPosition.x <= 20 && newPosition.z >= -20 && newPosition.z <= 20) {
                this.position.copy(newPosition);
                this.body.position.copy(this.position);
            }

            // Normal AI behavior when close to player
            if (isClose) {
                // Use skills based on conditions
                if (this.closeToPlayerTime >= 3.0 && this.skillCooldowns[3] <= 0) {
                    // Use R skill and start following
                    this.useSkill(3);
                    this.isFollowing = true;
                    this.followStartTime = performance.now() / 1000;
                } else if (this.skillCooldowns[1] <= 0) {
                    // Use Q skill
                    this.useSkill(1);
                } else if (this.skillCooldowns[2] <= 0) {
                    // Use E skill
                    this.useSkill(2);
                } else {
                    // Normal attack
                    this.normalAttack();
                }
            }
        }

        this.updateHpBar();
    }

    normalAttack() {
        const now = performance.now() / 1000;
        if (now - this.lastAttackTime < this.attackCooldown) return;

        this.lastAttackTime = now;

        let damage = this.normalDamage;
        let pushDistance = 0;

        if (this.powerUpActive) {
            damage += this.powerUpDamage;
            pushDistance = 2.0;
            this.powerUpActive = false;
        }

        if (this.rageActive) {
            damage = this.rageDamage;
        }

        const distance = this.position.distanceTo(this.targetPlayer.position);
        if (distance < 3.0) {
            this.targetPlayer.takeDamage(damage);
            if (pushDistance > 0) {
                const pushDirection = this.targetPlayer.position.clone().sub(this.position).normalize();
                this.targetPlayer.position.add(pushDirection.multiplyScalar(pushDistance));
                this.targetPlayer.body.position.copy(this.targetPlayer.position);
                this.targetPlayer.updateCamera();
                this.targetPlayer.updateHpBar();
            }
            console.log(`Enemy normal attack: ${damage} damage`);
        }
    }

    useSkill(skillNumber) {
        if (this.skillCooldowns[skillNumber] > 0) return;

        switch(skillNumber) {
            case 1:
                this.skill1();
                break;
            case 2:
                this.skill2();
                break;
            case 3:
                this.skill3();
                break;
        }

        this.skillCooldowns[skillNumber] = this.skillCooldownTimes[skillNumber];
    }

    skill1() {
        const distance = this.position.distanceTo(this.targetPlayer.position);
        if (distance < 5.0) {
            this.targetPlayer.takeDamage(100);
            console.log('Enemy Skill 1: Air Bone - 100 damage');
        }
    }

    skill2() {
        this.powerUpActive = true;
        console.log('Enemy Skill 2: Power Up activated');
    }

    skill3() {
        this.rageActive = true;
        this.rageTimer = this.rageDuration;
        console.log('Enemy Skill 3: Rage activated');
    }

    takeDamage(amount) {
        if (this.isDead) return;

        this.hp -= amount;
        console.log(`Enemy took ${amount} damage. HP: ${this.hp}/${this.maxHp}`);
        this.updateHpBar();

        // Apply knockback effect
        if (this.targetPlayer) {
            const knockbackDirection = this.position.clone().sub(this.targetPlayer.position).normalize();
            const knockbackDistance = 1.0 + (amount / 50); // More damage = more knockback
            this.position.add(knockbackDirection.multiplyScalar(knockbackDistance));
            this.body.position.copy(this.position);
        }

        // Apply hit visual effect
        this.applyHitEffect();

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        this.isDead = true;
        this.scene.remove(this.body);
        if (this.hpBarContainer) {
            this.hpBarContainer.remove();
        }
        console.log('Enemy died!');
    }
}