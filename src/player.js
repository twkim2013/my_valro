import * as THREE from 'https://unpkg.com/three@0.156.0/build/three.module.js';
import { WeaponInstance } from './weapons.js';

export default class Player {
  constructor(camera, domElement, scene) {
    this.camera = camera;
    this.dom = domElement;
    this.scene = scene;
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.speed = 4.0; // m/s
    this.sprintMultiplier = 1.7;
    this.crouchMultiplier = 0.5;
    this.yaw = 0;
    this.pitch = 0;
    this.enabled = false;

    this.move = { forward:false, back:false, left:false, right:false, sprint:false, crouch:false };
    this.slot = 1;
    this.weapons = { 1: new WeaponInstance(1), 2: new WeaponInstance(2), 3: new WeaponInstance(3), 4: new WeaponInstance(4) };
    this.currentWeaponModel = null;
    this.money = 800;
    this.hp = 100;
    this.armor = 0;
    this.inBuy = true;
    this.buyTime = 40;
    this.raycaster = new THREE.Raycaster();
    this.enemyManager = null;
    this.kills = 0;
    this.damageDealt = 0;

    this._initPointerLock();
    this._bindKeys();
    this._switchWeapon(1);
  }

  _initPointerLock(){
    const onClick = () => {
      if(this.dom.requestPointerLock) this.dom.requestPointerLock();
    };
    document.addEventListener('pointerlockchange', ()=>{
      this.enabled = document.pointerLockElement === this.dom;
    });
    document.addEventListener('mousemove', (e)=>{
      if(!this.enabled) return;
      const mx = e.movementX || 0;
      const my = e.movementY || 0;
      this.yaw -= mx * 0.002;
      this.pitch -= my * 0.002;
      this.pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.pitch));
      this.camera.rotation.set(this.pitch, this.yaw, 0);
    });
    // start button will call requestPointerLock
  }

  _bindKeys(){
    window.addEventListener('keydown', (e)=>{
      switch(e.code){
        case 'KeyW': this.move.forward = true; break;
        case 'KeyS': this.move.back = true; break;
        case 'KeyA': this.move.left = true; break;
        case 'KeyD': this.move.right = true; break;
        case 'ShiftLeft': this.move.sprint = true; break;
        case 'ControlLeft': this.move.crouch = true; break;
        case 'Digit1': this._switchWeapon(1); break;
        case 'Digit2': this._switchWeapon(2); break;
        case 'Digit3': this._switchWeapon(3); break;
        case 'Digit4': this._switchWeapon(4); break;
        case 'KeyB': document.getElementById('market').style.display = document.getElementById('market').style.display === 'none' ? 'block' : 'none'; break;
        case 'KeyR': this._reload(); break;
      }
    });
    window.addEventListener('keyup', (e)=>{
      switch(e.code){
        case 'KeyW': this.move.forward = false; break;
        case 'KeyS': this.move.back = false; break;
        case 'KeyA': this.move.left = false; break;
        case 'KeyD': this.move.right = false; break;
        case 'ShiftLeft': this.move.sprint = false; break;
        case 'ControlLeft': this.move.crouch = false; break;
      }
    });
    window.addEventListener('click', (e) => {
      if(this.enabled) this._fire(performance.now());
    });
  }

  _switchWeapon(num){
    this.slot = num;
    if(this.currentWeaponModel) this.camera.remove(this.currentWeaponModel);
    this.currentWeaponModel = this.weapons[num].model.clone();
    this.camera.add(this.currentWeaponModel);
  }

  _fire(now){
    const weapon = this.weapons[this.slot];
    if(weapon.fire(now)){
      const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
      this.raycaster.set(this.camera.position, direction);

      // Raycasting for hit detection
      if (this.enemyManager) {
        const hitResult = this.enemyManager.raycastHit(this.raycaster);
        if (hitResult) {
          const damage = weapon.weaponDef.damage[hitResult.hitType] || weapon.weaponDef.damage.body;
          const actualDamage = hitResult.enemy.takeDamage(damage, hitResult.hitType);
          this.damageDealt += actualDamage;
          
          console.log(`Hit ${hitResult.hitType} for ${actualDamage.toFixed(1)} damage!`);

          if (hitResult.enemy.isDead) {
            this.kills++;
            this.money += 500; // kill reward
          }
        }
      }
      
      // Muzzle flash effect
      if(this.currentWeaponModel){
        const flash = new THREE.Mesh(
          new THREE.SphereGeometry(0.15, 8, 8),
          new THREE.MeshBasicMaterial({color:0xffaa00})
        );
        flash.position.set(0.3, -0.15, -0.6).applyQuaternion(this.camera.quaternion);
        flash.position.add(this.camera.position);
        this.scene.add(flash);
        setTimeout(() => this.scene.remove(flash), 30);
      }
    }
  }

  _reload(){
    const weapon = this.weapons[this.slot];
    weapon.reload(performance.now());
  }

  update(dt){
    // update buy phase timer
    if(this.inBuy){
      this.buyTime = Math.max(0, this.buyTime - dt);
      if(this.buyTime === 0) this.inBuy = false;
    }

    // movement
    this.direction.set(0,0,0);
    if(this.move.forward) this.direction.z -= 1;
    if(this.move.back) this.direction.z += 1;
    if(this.move.left) this.direction.x -= 1;
    if(this.move.right) this.direction.x += 1;
    if(this.direction.lengthSq()>0) this.direction.normalize();

    let currentSpeed = this.speed;
    if(this.move.sprint) currentSpeed *= this.sprintMultiplier;
    if(this.move.crouch) currentSpeed *= this.crouchMultiplier;

    // apply rotation
    const forward = new THREE.Vector3(0,0,-1).applyQuaternion(this.camera.quaternion);
    const right = new THREE.Vector3(1,0,0).applyQuaternion(this.camera.quaternion);
    forward.y = 0; right.y = 0; forward.normalize(); right.normalize();
    this.velocity.set(0,0,0);
    this.velocity.addScaledVector(forward, this.direction.z * currentSpeed);
    this.velocity.addScaledVector(right, this.direction.x * currentSpeed);

    // apply to camera position
    this.camera.position.addScaledVector(this.velocity, dt);

    // simple ground clamp
    if(this.camera.position.y < 1.6) this.camera.position.y = 1.6;
  }
}
