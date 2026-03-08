My Valro — Minimal Web Prototype

Run locally (any static server). Examples:

Using Python 3:

```bash
python -m http.server 8080
```

Using npx http-server (no install):

```bash
npx http-server -c-1 . -p 8080
```

Open http://localhost:8080 in your browser. Controls:
- Click the start button to lock the pointer.
- WASD: move, Shift: sprint, Ctrl: crouch.
- 1-4: switch weapon slot (Classic, Shorty, Knife, Bomb).
- Click (mouse): fire weapon.
- R: reload current weapon.
- B: toggle market UI.

Features:
- Three.js scene with ground, obstacles, and dynamic lighting.
- Player controller with smooth mouselook and movement.
- **Crosshair reticle**: green crosshair displayed at screen center when aiming.
- Weapon system: 4 weapon slots with unique models, ammo counts, and fire rates.
- Firing mechanism: click to fire; ammo depletes and can be restored via reload (R).
- Buy phase timer (40s) with HUD display.
- **Raycasting hit detection**: fire at enemies to register damage on head, body, or legs (each with different multipliers).
- Enemy AI: dummy enemies spawn with health bars, take damage, flash on hit, and die when HP reaches 0.
- Kill & damage tracking on HUD.
- Money rewards for kills (+500 gold per enemy eliminated).
- Muzzle flash visual feedback on fire.

Next steps: bomb plant/defuse mechanics, AI bots with pathfinding, team spawning, networking with WebSockets, PBR models.
# my_valro
my game with copilot
