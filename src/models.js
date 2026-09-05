import * as THREE from 'https://unpkg.com/three@0.156.0/build/three.module.js';

// Detailed 3D pistol models
export function createClassicPistolModel() {
  const group = new THREE.Group();
  
  // Slide (top of gun)
  const slide = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.08, 0.08),
    new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.8,
      roughness: 0.2,
    })
  );
  slide.position.set(0, 0.02, 0);
  group.add(slide);

  // Barrel
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.25, 16),
    new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.9,
      roughness: 0.1,
    })
  );
  barrel.rotation.z = Math.PI / 2;
  barrel.position.set(0.15, 0.05, 0);
  group.add(barrel);

  // Frame (grip part)
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.12, 0.065),
    new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      metalness: 0.6,
      roughness: 0.3,
    })
  );
  frame.position.set(0, -0.02, 0);
  group.add(frame);

  // Grip panels
  const gripLeft = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.1, 0.015),
    new THREE.MeshStandardMaterial({ color: 0x8b4513 })
  );
  gripLeft.position.set(0, -0.02, 0.045);
  group.add(gripLeft);

  const gripRight = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.1, 0.015),
    new THREE.MeshStandardMaterial({ color: 0x8b4513 })
  );
  gripRight.position.set(0, -0.02, -0.045);
  group.add(gripRight);

  // Trigger guard
  const triggerGuard = new THREE.Mesh(
    new THREE.TorusGeometry(0.025, 0.008, 8, 16, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a })
  );
  triggerGuard.rotation.z = Math.PI / 2;
  triggerGuard.position.set(-0.05, -0.01, 0);
  group.add(triggerGuard);

  // Hammer
  const hammer = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.04, 0.025),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
  );
  hammer.position.set(-0.06, 0.06, 0);
  group.add(hammer);

  // Sights
  const sightRear = new THREE.Mesh(
    new THREE.BoxGeometry(0.015, 0.06, 0.01),
    new THREE.MeshStandardMaterial({ color: 0x0a0a0a })
  );
  sightRear.position.set(-0.15, 0.08, 0);
  group.add(sightRear);

  const sightFront = new THREE.Mesh(
    new THREE.BoxGeometry(0.015, 0.08, 0.01),
    new THREE.MeshStandardMaterial({ color: 0x0a0a0a })
  );
  sightFront.position.set(0.15, 0.08, 0);
  group.add(sightFront);

  group.position.set(0.35, -0.15, -0.5);
  group.scale.set(1.2, 1.2, 1.2);
  return group;
}

export function createShortyModel() {
  const group = new THREE.Group();
  
  // Receiver (main body - wider for shotgun)
  const receiver = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.1, 0.1),
    new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      metalness: 0.7,
      roughness: 0.3,
    })
  );
  receiver.position.set(0, 0, 0);
  group.add(receiver);

  // Twin barrels
  const barrelLeft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, 0.2, 16),
    new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.9,
      roughness: 0.05,
    })
  );
  barrelLeft.rotation.z = Math.PI / 2;
  barrelLeft.position.set(0.12, 0.04, 0.04);
  group.add(barrelLeft);

  const barrelRight = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, 0.2, 16),
    new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.9,
      roughness: 0.05,
    })
  );
  barrelRight.rotation.z = Math.PI / 2;
  barrelRight.position.set(0.12, 0.04, -0.04);
  group.add(barrelRight);

  // Stock/grip
  const stock = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.14, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x6b4423 })
  );
  stock.position.set(-0.12, -0.02, 0);
  group.add(stock);

  // Trigger guard
  const triggerGuard = new THREE.Mesh(
    new THREE.TorusGeometry(0.035, 0.012, 8, 16, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a })
  );
  triggerGuard.rotation.z = Math.PI / 2;
  triggerGuard.position.set(-0.05, -0.01, 0);
  group.add(triggerGuard);

  group.position.set(0.4, -0.12, -0.45);
  group.scale.set(1.1, 1.1, 1.1);
  return group;
}

export function createGhostModel() {
  const group = new THREE.Group();
  
  // Slide with serrations
  const slide = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.075, 0.075),
    new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.85,
      roughness: 0.15,
    })
  );
  slide.position.set(0, 0.02, 0);
  group.add(slide);

  // Suppressor (silencer) - the key feature
  const suppressor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.05, 0.18, 16),
    new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.7,
      roughness: 0.3,
    })
  );
  suppressor.rotation.z = Math.PI / 2;
  suppressor.position.set(0.18, 0.05, 0);
  group.add(suppressor);

  // Barrel under slide
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.22, 16),
    new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      metalness: 0.9,
      roughness: 0.1,
    })
  );
  barrel.rotation.z = Math.PI / 2;
  barrel.position.set(0.12, -0.01, 0);
  group.add(barrel);

  // Frame
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.11, 0.06),
    new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      metalness: 0.6,
      roughness: 0.4,
    })
  );
  frame.position.set(0, -0.02, 0);
  group.add(frame);

  // Grip
  const grip = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.11, 0.03),
    new THREE.MeshStandardMaterial({ color: 0x5a4a3a })
  );
  grip.position.set(0, -0.02, 0.047);
  group.add(grip);

  group.position.set(0.32, -0.14, -0.48);
  group.scale.set(1.15, 1.15, 1.15);
  return group;
}

export function createDesertEagleModel() {
  const group = new THREE.Group();
  
  // Large slide (Desert Eagle is a big gun)
  const slide = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.12, 0.1),
    new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.75,
      roughness: 0.25,
    })
  );
  slide.position.set(0, 0.035, 0);
  group.add(slide);

  // Barrel (thick and long)
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.3, 16),
    new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.9,
      roughness: 0.05,
    })
  );
  barrel.rotation.z = Math.PI / 2;
  barrel.position.set(0.18, 0.07, 0);
  group.add(barrel);

  // Compensator/muzzle brake (Desert Eagle trademark)
  const compensator = new THREE.Mesh(
    new THREE.CylinderGeometry(0.063, 0.06, 0.08, 16),
    new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      metalness: 0.8,
      roughness: 0.2,
    })
  );
  compensator.rotation.z = Math.PI / 2;
  compensator.position.set(0.32, 0.07, 0);
  group.add(compensator);

  // Large frame
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.15, 0.08),
    new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      metalness: 0.6,
      roughness: 0.4,
    })
  );
  frame.position.set(-0.02, -0.02, 0);
  group.add(frame);

  // Prominent grip
  const grip = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.15, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x6b4423 })
  );
  grip.position.set(-0.08, -0.01, 0.055);
  group.add(grip);

  // Trigger guard
  const triggerGuard = new THREE.Mesh(
    new THREE.TorusGeometry(0.04, 0.015, 8, 16, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a })
  );
  triggerGuard.rotation.z = Math.PI / 2;
  triggerGuard.position.set(-0.08, -0.01, 0);
  group.add(triggerGuard);

  // Rear sight
  const sightRear = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 0.1, 0.015),
    new THREE.MeshStandardMaterial({ color: 0x0a0a0a })
  );
  sightRear.position.set(-0.18, 0.1, 0);
  group.add(sightRear);

  group.position.set(0.38, -0.18, -0.52);
  group.scale.set(1.3, 1.3, 1.3);
  return group;
}

export function createSprayModel() {
  const group = new THREE.Group();
  
  // Compact slide
  const slide = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.07, 0.065),
    new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.8,
      roughness: 0.2,
    })
  );
  slide.position.set(0, 0.015, 0);
  group.add(slide);

  // Short barrel
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.032, 0.18, 16),
    new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.9,
      roughness: 0.1,
    })
  );
  barrel.rotation.z = Math.PI / 2;
  barrel.position.set(0.1, 0.04, 0);
  group.add(barrel);

  // Extended frame
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.1, 0.058),
    new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      metalness: 0.65,
      roughness: 0.35,
    })
  );
  frame.position.set(0, -0.015, 0);
  group.add(frame);

  // Long grip
  const grip = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.09, 0.03),
    new THREE.MeshStandardMaterial({ color: 0x5a5a5a })
  );
  grip.position.set(0, -0.015, 0.044);
  group.add(grip);

  group.position.set(0.33, -0.13, -0.47);
  group.scale.set(1.1, 1.1, 1.1);
  return group;
}

export function createKnifeModel() {
  const group = new THREE.Group();
  
  // Blade
  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.2, 0.015),
    new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.95,
      roughness: 0.1,
    })
  );
  blade.position.set(0, 0.1, 0);
  group.add(blade);

  // Blade shine (edge highlight)
  const bladeEdge = new THREE.Mesh(
    new THREE.BoxGeometry(0.01, 0.2, 0.002),
    new THREE.MeshStandardMaterial({
      color: 0xdddddd,
      metalness: 1.0,
      roughness: 0.05,
    })
  );
  bladeEdge.position.set(0.025, 0.1, 0.01);
  group.add(bladeEdge);

  // Handle
  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.055, 0.09, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x8b4513 })
  );
  handle.position.set(0, -0.02, 0);
  group.add(handle);

  // Guard (cross piece)
  const guard = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.015, 0.06),
    new THREE.MeshStandardMaterial({ color: 0xc0a000 })
  );
  guard.position.set(0, 0.01, 0);
  group.add(guard);

  group.position.set(0.25, -0.1, -0.35);
  group.scale.set(1, 1, 1);
  return group;
}

export function createBombModel() {
  const group = new THREE.Group();
  
  // Main red body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.25, 0.15),
    new THREE.MeshStandardMaterial({ color: 0xff3333 })
  );
  group.add(body);
  
  // Digital screen (green)
  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.08, 0.03),
    new THREE.MeshStandardMaterial({
      color: 0x00ff44,
      emissive: 0x00aa00,
    })
  );
  screen.position.set(0, 0.07, 0.08);
  group.add(screen);

  // Wires detail
  const wireLeft = new THREE.Mesh(
    new THREE.BoxGeometry(0.01, 0.08, 0.01),
    new THREE.MeshStandardMaterial({ color: 0xffff00 })
  );
  wireLeft.position.set(-0.08, -0.05, 0.08);
  group.add(wireLeft);

  const wireRight = new THREE.Mesh(
    new THREE.BoxGeometry(0.01, 0.08, 0.01),
    new THREE.MeshStandardMaterial({ color: 0xff0000 })
  );
  wireRight.position.set(0.08, -0.05, 0.08);
  group.add(wireRight);

  group.position.set(0.4, -0.1, -0.5);
  group.scale.set(0.75, 0.75, 0.75);
  return group;
}
