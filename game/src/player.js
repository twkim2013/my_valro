import * as THREE from 'https://unpkg.com/three@0.156.0/build/three.module.js';

export default class Player {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.hp = 1500;
        this.maxHp = 1500;
        this.isDead = false;
        this.respawnTimer = 0;
        this.respawnTime = 10.0;

        // Movement
        this.position = new THREE.Vector3(0, 0, 5);
        this.moveSpeed = 5.0;
        this.move = { forward: false, back: false, left: false, right: false };

        // Combat
        this.lastAttackTime = 0;
        this.attackCooldown = 1.0; // 1 attack per second
        this.normalDamage = 50;
        this.skillCooldowns = { 1: 0, 2: 0, 3: 0 };
        this.skillCooldownTimes = { 1: 6.0, 2: 4.0, 3: 10.0 };
        this.powerUpActive = false;
        this.powerUpDamage = 75;
        this.rageActive = false;
        this.rageDamage = 100;
        this.rageTimer = 0;
        this.rageDuration = 5.0;
        this.skillQueued = null; // Track which skill is queued for mouse click
        this.enemy = null; // Reference to enemy for targeting

        // Hit effect properties
        this.hitEffectActive = false;
        this.hitEffectTimer = 0;
        this.hitEffectDuration = 0.2;
        this.originalColor = new THREE.Color(0x0000ff);
        this.hitColor = new THREE.Color(0xffffff);
        this.originalScale = new THREE.Vector3(1, 1, 1);
        this.hitScale = new THREE.Vector3(1.2, 0.8, 1.2);

        // Character model (simple capsule)
        this.createModel();

        // Input handling
        this.setupInput();

        // HP Bar
        this.createHpBar();
        this.updateHpBar();

        // Initial camera setup
        this.updateCamera();
    }

    createModel() {
        // Create player group
        this.body = new THREE.Group();
        this.scene.add(this.body);

        // Main body - capsule
        const bodyGeometry = new THREE.CapsuleGeometry(0.5, 1.5, 8, 16);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
        const mainBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.body.add(mainBody);

        // Head with face details
        const headGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });
        this.head = new THREE.Mesh(headGeometry, headMaterial);
        this.head.position.y = 1.0;
        this.body.add(this.head);

        // Eyes (simple blue spheres for player)
        const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x0066ff });
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

        // Weapon (simple staff for player)
        const staffGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8);
        const staffMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        this.staff = new THREE.Mesh(staffGeometry, staffMaterial);
        this.staff.position.set(0.8, -0.2, 0.2);
        this.staff.rotation.x = Math.PI / 6;
        this.body.add(this.staff);

        // Staff orb (glowing effect)
        const orbGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const orbMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x004444
        });
        const orb = new THREE.Mesh(orbGeometry, orbMaterial);
        orb.position.set(0.8, 0.4, 0.2);
        this.body.add(orb);

        this.body.position.copy(this.position);
    }

    setupInput() {
        document.addEventListener('keydown', (event) => {
            switch(event.code) {
                case 'KeyW': this.move.forward = true; break;
                case 'KeyA': this.move.left = true; break;
                case 'KeyS': this.move.back = true; break;
                case 'KeyD': this.move.right = true; break;
                case 'KeyQ': this.queueSkill(1); break;
                case 'KeyE': this.queueSkill(2); break;
                case 'KeyR': this.queueSkill(3); break;
            }
        });

        document.addEventListener('keyup', (event) => {
            switch(event.code) {
                case 'KeyW': this.move.forward = false; break;
                case 'KeyA': this.move.left = false; break;
                case 'KeyS': this.move.back = false; break;
                case 'KeyD': this.move.right = false; break;
            }
        });

        document.addEventListener('mousedown', (event) => {
            if (event.button === 0) { // Left mouse button
                if (this.skillQueued) {
                    this.useQueuedSkill(event, this.enemy);
                } else {
                    this.normalAttack();
                }
            }
        });
    }

    update(dt, enemy) {
        this.enemy = enemy; // Store enemy reference for targeting

        if (this.isDead) {
            this.respawnTimer -= dt;
            if (this.respawnTimer <= 0) {
                this.respawn();
            }
            return;
        }

        // Update hit effect
        if (this.hitEffectActive) {
            this.hitEffectTimer -= dt;
            if (this.hitEffectTimer <= 0) {
                // Reset to original appearance
                this.hitEffectActive = false;
                this.body.children[0].material.color.copy(this.originalColor); // Main body color
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

        // Movement
        const moveVector = new THREE.Vector3();
        if (this.move.forward) moveVector.z -= 1;
        if (this.move.back) moveVector.z += 1;
        if (this.move.left) moveVector.x -= 1;
        if (this.move.right) moveVector.x += 1;

        if (moveVector.lengthSq() > 0) {
            moveVector.normalize();
            this.position.add(moveVector.multiplyScalar(this.moveSpeed * dt));
            this.body.position.copy(this.position);
            this.updateCamera();
            this.updateHpBar();
        }
    }

    createHpBar() {
        this.hpBarContainer = document.createElement('div');
        this.hpBarContainer.className = 'hp-bar-container';
        this.hpBarContainer.innerHTML = `
            <div class="hp-bar-bg">
                <div class="hp-bar-fill" id="player-hp-fill"></div>
            </div>
        `;
        document.getElementById('hp-bars').appendChild(this.hpBarContainer);
        this.hpBarFill = this.hpBarContainer.querySelector('#player-hp-fill');
    }

    updateHpBar() {
        if (!this.hpBarContainer) return;
        
        // Convert 3D position to screen coordinates
        const screenPos = this.position.clone();
        screenPos.project(this.camera);
        
        const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight - 50; // Offset above character
        
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

    normalAttack() {
        if (this.isDead) return;

        const now = performance.now() / 1000;
        if (now - this.lastAttackTime < this.attackCooldown) return;

        this.lastAttackTime = now;

        let damage = this.normalDamage;
        let pushDistance = 0;

        if (this.powerUpActive) {
            damage += this.powerUpDamage;
            pushDistance = 2.0; // Push enemy back
            this.powerUpActive = false;
        }

        if (this.rageActive) {
            damage = this.rageDamage;
        }

        // Check if enemy is in range (simple distance check)
        if (!this.enemy) return;
        const distance = this.position.distanceTo(this.enemy.position);
        if (distance < 3.0) { // Attack range
            this.enemy.takeDamage(damage);
            this.enemy.applyHitEffect();
            if (pushDistance > 0) {
                const pushDirection = this.enemy.position.clone().sub(this.position).normalize();
                this.enemy.position.add(pushDirection.multiplyScalar(pushDistance));
                this.enemy.body.position.copy(this.enemy.position);
                this.enemy.updateHpBar();
            }
            console.log(`Normal attack: ${damage} damage`);
        }
    }

    useSkill(skillNumber) {
        if (this.isDead) return;

        if (this.skillCooldowns[skillNumber] > 0) return;

        switch(skillNumber) {
            case 1: // Air Bone - damage enemies around
                this.skill1();
                break;
            case 2: // Power Up - next attack stronger
                this.skill2();
                break;
            case 3: // Rage - increased damage for duration
                this.skill3();
                break;
        }

        this.skillCooldowns[skillNumber] = this.skillCooldownTimes[skillNumber];
    }

    queueSkill(skillNumber) {
        if (this.isDead) return;
        if (this.skillCooldowns[skillNumber] > 0) return;
        this.skillQueued = skillNumber;
        console.log(`Skill ${skillNumber} queued - click on target to use`);
    }

    useQueuedSkill(event, enemy) {
        if (!this.skillQueued || !enemy) return;

        // Create raycaster for mouse picking
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        // Convert mouse position to normalized device coordinates
        const rect = event.target.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Update raycaster with camera and mouse position
        raycaster.setFromCamera(mouse, this.camera);

        // Check if ray intersects with enemy
        const intersects = raycaster.intersectObject(enemy.body, true);
        
        if (intersects.length > 0) {
            // Hit the enemy - use the skill
            this.useSkill(this.skillQueued);
            console.log(`Skill ${this.skillQueued} used on enemy!`);
        } else {
            console.log(`Skill ${this.skillQueued} missed - click on the enemy to target`);
        }
        
        this.skillQueued = null;
    }

    skill1() {
        // Air Bone - damage enemies around (within 5 units)
        if (!this.enemy) return;
        const distance = this.position.distanceTo(this.enemy.position);
        if (distance < 5.0) {
            this.enemy.takeDamage(100);
            this.enemy.applyHitEffect();
            console.log('Skill 1: Air Bone - 100 damage');
        }
    }

    skill2() {
        // Power Up - next normal attack gets +75 damage and push
        this.powerUpActive = true;
        console.log('Skill 2: Power Up activated');
    }

    skill3() {
        // Rage - normal attack becomes 100 damage for 5 seconds
        this.rageActive = true;
        this.rageTimer = this.rageDuration;
        console.log('Skill 3: Rage activated');
    }

    takeDamage(amount) {
        if (this.isDead) return;

        this.hp -= amount;
        console.log(`Player took ${amount} damage. HP: ${this.hp}/${this.maxHp}`);
        this.updateHpBar();

        // Apply knockback effect
        if (this.enemy) {
            const knockbackDirection = this.position.clone().sub(this.enemy.position).normalize();
            const knockbackDistance = 1.0 + (amount / 50); // More damage = more knockback
            this.position.add(knockbackDirection.multiplyScalar(knockbackDistance));
            this.body.position.copy(this.position);
            this.updateCamera();
        }

        // Apply hit visual effect
        this.applyHitEffect();

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        this.isDead = true;
        this.respawnTimer = this.respawnTime;
        console.log('Player died!');
    }

    respawn() {
        this.isDead = false;
        this.hp = this.maxHp;
        this.position.set(0, 0, 5);
        this.body.position.copy(this.position);
        this.updateCamera();
        console.log('Player respawned!');
    }

    updateCamera() {
        // Third-person camera that follows the player
        const cameraOffset = new THREE.Vector3(0, 5, 10);
        this.camera.position.copy(this.position).add(cameraOffset);
        this.camera.lookAt(this.position);
    }

    applyHitEffect() {
        this.hitEffectActive = true;
        this.hitEffectTimer = this.hitEffectDuration;
        // Change color to white for flash effect (main body is first child)
        this.body.children[0].material.color.copy(this.hitColor);
        // Scale for hit reaction
        this.body.scale.copy(this.hitScale);
    }
}