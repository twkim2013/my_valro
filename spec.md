Title: My Valro — Spec

Overview
- Purpose: A lightweight 3D first-person shooter playable in a web browser (Edge/Chrome on PC).
- Core mode: Bomb Mod (5v5) with optional AI bots for single-player or fill.

Controls
- Movement: `W` / `A` / `S` / `D`.
- Sprint: `Shift` (increases movement speed while held).
- Crouch: `Ctrl` (reduces speed, lowers hitbox).
- Weapon slots: `1` = primary, `2` = secondary (pistol), `3` = knife, `4` = utility / bomb.
- Interact / Plant / Defuse: `E` (alternative to `4` for planting when holding bomb).
- Market: `B` (open while in buy time).
- Mouse: look/aim (smooth rotation), left-click = fire, right-click = aim/alternate fire.
- Misc: `Tab` = scoreboard, `Esc` = menu, `F` = use / inspect.

Authentication & Player Profile
- Login screen: nickname + password fields, `Login` and `Sign Up` buttons.
- Sign Up flow: username, password, confirm password, minimal validation.
- After login: main lobby with profile and settings accessible in the top-left corner.

Settings (Profile & Gameplay)
- Sensitivity: 0.0 — 10.0 (float slider).
- Crosshair: On/Off, size (0—10), color picker, style presets (dot/cross/circle).
- Audio: master/music/SFX volumes.
- Graphics: quality presets, shadow on/off, anti-aliasing toggle.
- Profile: display name change, avatar selection.

Matchmaking & Lobby
- Quick Play: 5v5 match (human or human+AI fill).
- Custom match: choose map, enable bots, pick teams (T / CT).
- Match start flow: team selection → buy phase (default 40s) → round start.

Art & Models
- Teams: Terrorists (red accents) and Counter-Terrorists (blue accents).
- Player models: modular (body, head, armor, weapon attachments) to allow skins.
- Weapon models: primary, secondary, melee, grenade/bomb models and animations.
- Animations: smooth transitions for walking, strafing, running, crouch, reload, swap.

Movement & Animation Rules
- Movement is smooth and frame-rate-independent.
- Animations blend: idle ↔ walk ↔ run ↔ crouch ↔ jump.
- Arms always hold the currently equipped weapon; weapon sway + bobbing when moving.

Weapons & Equipment
- Weapon categories: Primary (rifles/SMGs/shotguns), Secondary (pistols), Melee (knife), Utility (bomb, grenades), Armor/defuse kit.
- Weapon behavior: magazine size, reload time, fire modes (single/auto/burst), accuracy/spread, recoil patterns.
- Example pistols (buyable in market):
  - Classic: 0 gold (starter)
    - Ammo: 30 total (10 per magazine example); realistic reload animation.
    - Damage (example): head = 75, body = 30, leg = 20.
  - Shorty: 300 gold (short-range shotgun/pistol hybrid); crosshair becomes circular when equipped.
  - Spray: 400 gold (fast-firing pistol)
  - Ghost: 500 gold (silenced pistol)
  - Desert Eagle: 800 gold (high damage, low fire rate)
- Armor:
  - Light vest: +25 effective HP absorption — 300 gold.
  - Heavy vest: +50 effective HP absorption — 500 gold.

Economy
- Starting money: 800 gold (first round).
- Kill reward: +500 gold.
- Round win reward: base 1500 gold (scaled up for streaks: 1800, 2100 max).
- Round loss consolation: 1000 gold (increases on consecutive losses: 1400, 1800).
- Action rewards/costs: plant bomb (300 gold), defuse bomb (300 gold to buy defuse kit if present), buying weapons/armor subtracts from current money.

Core Game Flow (Bomb Mod)
- Teams: Terrorists (T) vs Counter-Terrorists (CT), 5 players per team.
- Rounds: fixed-length rounds; respawn does not occur mid-round (classic round-based play).
- Buy Phase: default 40 seconds at start of each round where players can purchase weapons/equipment. Players may rotate view and inspect their model but cannot move from spawn position (optional friendly movement can be enabled for warmup).
- Round Start: after buy time expires, round timer begins (e.g., 2:00 minutes standard). Objectives become active.

Bomb Mechanics (Finalized)
- Bomb possession: only one player on T team can carry the bomb. If carrier is killed, bomb is dropped and can be picked up by any T player.
- Planting:
  - Plant sites: pre-defined (e.g., A, B). Only within site boundaries can the bomb be planted.
  - Plant time: 4.0 seconds (interruptible by damage or movement). Progress bar shown to all nearby players.
  - Planting requires `E` while holding bomb (or `4` as shortcut).
- Bomb timer:
  - After successful plant, bomb countdown starts (e.g., 40 seconds). Audible ticking increases in frequency as time decreases.
  - Visual indicator on HUD and minimap for bomb site while active.
- Defusing:
  - Defuse time: 7.0 seconds without kit, 5.0 seconds with defuse kit.
  - Defuse requires holding `E` near the planted bomb and can be interrupted by damage.
  - If successful, CTs win the round.
- Win conditions:
  - Terrorists win if bomb explodes or all CTs are eliminated before CTs defuse.
  - Counter-Terrorists win if bomb is defused or all Ts are eliminated before a plant.
  - If time runs out (no plant), CTs win.
- Post-round: awards money, updates economy based on outcome and streaks, then return to lobby/buy phase.

Match & Round Details
- Round timer: configurable (default 120s).
- Maximum rounds per match: configurable (e.g., 30 rounds, first to 16 wins).
- Overtime: optional rules for tied matches (e.g., shorter rounds, reduced economy).

AI Bots (for single-player / fill)
- Roles: Attacker (T) / Defender (CT).
- Behavior:
  - Pathfinding: follow waypoints towards objectives, cover angles, and check common hiding spots.
  - Purchasing: simple economy-based purchases during buy phase.
  - Combat: use weapon heuristics, peek, and retreat on low HP.
  - Objectives: Ts prioritize plant when advantage; CTs prioritize retake/defuse when appropriate.
- Difficulty levels: Easy / Normal / Hard (affects aim accuracy, reaction time, decision-making).

UI / HUD
- Health, armor, current money, equipped weapon, ammo count, round timer, minimap, bomb status, kill feed.
- Buy menu: categorized list (primary, secondary, armor, utilities) with preview and price.
- Spectator: free camera and player-follow modes after death.

Sound & Feedback
- Distinct footsteps, weapon sounds, bomb beep/tick, plant/defuse audio cues.
- Hit markers and damage numbers optional for clarity.

Networking & Performance
- Designed for low-latency WebSockets or WebRTC data channel transport.
- Bandwidth: send authoritative player transforms + important events (shoot, hit, buy, plant, defuse).
- Client-side prediction and server reconciliation to mask latency.

Extensions & Nice-to-have Features
- Map rotation pool: pick 5 starter maps (CS2-inspired layout) with random rotation.
- Ranked & casual playlists, private/custom servers.
- Cosmetic progression: skins, avatars, banners.
- Replay / demo system for rounds.
- Mod support: allow community maps and rule variants.

Open Implementation Notes
- Default HP: 100; armor reduces incoming bullet damage according to armor type.
- Hitbox model: head, body, legs with multiplier damage values.
- Keep weapon stats configurable via data-driven JSON.

Next steps
- Implement prototype for core movement, shooting, and buy/round flow.
- Implement Bomb Mod server rules (plant/defuse, timers, economy) and AI
- Iterate on balance and UX based on playtests.
