// Gobble Dash world: the turkey, the farmer, the obstacles, the pickups and
// the rules that decide caught or escaped. Pure simulation — no drawing here,
// no sound here — so the screenshots can drive it with an autopilot.
import {
  COMBO_MAX,
  COMBO_WINDOW,
  CORN_POINTS,
  COYOTE_TIME,
  ESCAPE_DISTANCE,
  FARMER_CATCH_GAP,
  FARMER_MAX_GAP,
  FARMER_RECOVER_PER_SECOND,
  FARMER_START_GAP,
  FEATHER_POINTS,
  GRAVITY,
  GROUND_Y,
  HIDE_GAP_BONUS,
  HIT_GAP_COST,
  JUMP_BUFFER,
  JUMP_CUT,
  JUMP_VELOCITY,
  MAX_SPEED,
  MUD_GAP_DRAIN,
  PIXELS_PER_METER,
  PLAYER_H,
  PLAYER_SLIDE_H,
  PLAYER_W,
  PLAYER_X,
  SPEED_PER_METER,
  STAGES,
  START_LIVES,
  START_SPEED,
} from './config.js';

export const EVENT_PICKUP = 1;
export const EVENT_HIT = 2;
export const EVENT_OVER = 4;
export const EVENT_STAGE = 8;
export const EVENT_HIDE = 16;
export const EVENT_KNIFE = 32;
export const EVENT_FEATHER = 64;

export const KIND_FENCE = 'fence';
export const KIND_BALE = 'bale';
export const KIND_PUMPKIN = 'pumpkin';
export const KIND_PIN = 'pin';
export const KIND_OVEN = 'oven';
export const KIND_KNIFE = 'knife';
export const KIND_MUD = 'mud';
export const KIND_HAYSTACK = 'haystack';

// What each obstacle needs: its box, whether it hurts, and whether it is
// jumped over, slid under, or a place to hide.
const OBSTACLES = {
  fence: { w: 26, h: 64, hurts: true, pass: 'jump' },
  bale: { w: 66, h: 80, hurts: true, pass: 'jump' },
  pumpkin: { w: 56, h: 44, hurts: true, pass: 'jump' },
  pin: { w: 74, h: 30, hurts: true, pass: 'jump' },
  oven: { w: 112, h: 122, hurts: true, pass: 'jump' },
  knife: { w: 58, h: 26, hurts: true, pass: 'slide' },
  mud: { w: 160, h: 14, hurts: false, pass: 'run' },
  haystack: { w: 116, h: 92, hurts: false, pass: 'hide' },
};

// Which obstacles each stage throws at the turkey, with weights.
const STAGE_TABLES = [
  ['fence', 'fence', 'bale', 'pumpkin', 'mud', 'haystack'],
  ['fence', 'bale', 'pumpkin', 'mud', 'haystack', 'fence', 'bale'],
  ['oven', 'pin', 'knife', 'oven', 'fence', 'knife', 'mud', 'pin'],
];

export function createWorld(random) {
  const state = freshState();

  function freshState() {
    return {
      time: 0,
      distance: 0,
      score: 0,
      combo: 0,
      comboTime: 0,
      lives: START_LIVES,
      corn: 0,
      feathers: 0,
      speed: START_SPEED,
      stageIndex: 0,
      farmerGap: FARMER_START_GAP,
      farmerMood: 'chase',
      player: {
        x: PLAYER_X,
        y: GROUND_Y - PLAYER_H,
        vy: 0,
        onGround: true,
        sliding: false,
        slideTime: 0,
        invulnTime: 0,
        runPhase: 0,
        coyoteTime: 0,
        jumpBufferTime: 0,
        hideTime: 0,
        hidden: false,
        jumps: 0,
        slides: 0,
        hides: 0,
      },
      obstacles: [],
      pickups: [],
      particles: [],
      floaters: [],
      spawnIn: 420,
      knifeThrown: false,
      dustTime: 0,
      leafTime: 0,
      over: null,
      overTime: 0,
      attract: false,
    };
  }

  function reset() {
    const fresh = freshState();
    for (const key of Object.keys(fresh)) state[key] = fresh[key];
  }

  function stageFor(distance) {
    let index = 0;
    for (let i = 0; i < STAGES.length; i += 1) {
      if (distance >= STAGES[i].from) index = i;
    }
    return index;
  }

  function addFloater(x, y, text, color) {
    state.floaters.push({ x, y, text, color, life: 1.1, maxLife: 1.1 });
  }

  function burstFeathers(x, y, count) {
    for (let i = 0; i < count; i += 1) {
      state.particles.push({
        kind: 'feather',
        x,
        y,
        vx: random.range(-160, 60),
        vy: random.range(-260, -40),
        life: random.range(0.7, 1.3),
        maxLife: 1.3,
        size: random.range(5, 10),
        color: random.pick(['#8b5a2b', '#a06a35', '#e8b06a', '#fff2cf']),
        rot: random.range(0, Math.PI * 2),
        vr: random.range(-6, 6),
      });
    }
  }

  function burstSparks(x, y, color) {
    for (let i = 0; i < 10; i += 1) {
      state.particles.push({
        kind: 'spark',
        x,
        y,
        vx: random.range(-90, 90),
        vy: random.range(-160, 20),
        life: random.range(0.3, 0.6),
        maxLife: 0.6,
        size: random.range(3, 6),
        color,
        rot: 0,
        vr: 0,
      });
    }
  }

  function spawnObstacle(kind, x) {
    const spec = OBSTACLES[kind];
    const obstacle = {
      kind,
      x,
      y: GROUND_Y - spec.h,
      w: spec.w,
      h: spec.h,
      hit: false,
      spin: 0,
    };
    if (kind === KIND_KNIFE) {
      // A knife the farmer throws from behind: it flies at head height from
      // his hands toward the turkey, so slide under it. A short wind-up
      // telegraphs the throw before it leaves his hand.
      const farmerX = PLAYER_X - state.farmerGap - 96;
      obstacle.x = farmerX + 130;
      obstacle.y = GROUND_Y - 78;
      obstacle.delay = 0.35;
      obstacle.spin = random.range(-9, 9);
    }
    state.obstacles.push(obstacle);
    return obstacle;
  }

  function spawnPickup(kind, x, y) {
    state.pickups.push({ kind, x, y, bob: random.range(0, Math.PI * 2) });
  }

  function spawnPattern() {
    const table = STAGE_TABLES[state.stageIndex];
    let kind = random.pick(table);
    const x = 1320;
    if (kind === KIND_KNIFE) {
      // The farmer only throws when the road ahead is clear: a knife plus a
      // fence at the same moment would be unfair to dodge.
      const crowded = state.obstacles.some((ob) => ob.x > 100 && ob.x < 1150);
      if (crowded) kind = KIND_FENCE;
    }
    if (kind === KIND_KNIFE) {
      spawnObstacle(KIND_KNIFE, x);
      state.knifeThrown = true;
      return state.speed * random.range(1.1, 1.4);
    }
    spawnObstacle(kind, x);
    // Corn often trails an obstacle, rewarding a clean jump over it.
    if (random.chance(0.55)) {
      const count = random.int(2, 4);
      for (let i = 0; i < count; i += 1) {
        spawnPickup('corn', x + 90 + i * 52, GROUND_Y - 150 - (i % 2) * 46);
      }
    }
    if (random.chance(0.16)) {
      spawnPickup('feather', x + random.range(160, 320), GROUND_Y - 220);
    }
    if (kind === KIND_BALE && random.chance(0.4)) {
      // A fence just behind the bale: one good jump clears both.
      spawnObstacle(KIND_FENCE, x + 200);
    }
    // The gap scales with speed, so a jump always lands before the next
    // obstacle arrives: at least one second of travel between them.
    return state.speed * random.range(1.0, 1.5);
  }

  function playerBox() {
    const player = state.player;
    const height = player.sliding ? PLAYER_SLIDE_H : PLAYER_H;
    // The box follows the turkey's real height: it rises with a jump, so a
    // well-timed jump clears a fence, and it shrinks when sliding, so a
    // slide passes under a thrown knife.
    const top = player.sliding ? GROUND_Y - PLAYER_SLIDE_H : player.y;
    return {
      x: player.x + 8,
      y: top + 4,
      w: PLAYER_W - 16,
      h: height - 4,
    };
  }

  function overlaps(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function stepPlayer(dt, control) {
    const player = state.player;
    if (control.jump) player.jumpBufferTime = JUMP_BUFFER;
    else player.jumpBufferTime = Math.max(0, player.jumpBufferTime - dt);
    if (player.onGround) player.coyoteTime = COYOTE_TIME;
    else player.coyoteTime = Math.max(0, player.coyoteTime - dt);

    if (player.jumpBufferTime > 0 && player.coyoteTime > 0 && !player.hidden) {
      player.vy = -JUMP_VELOCITY;
      player.onGround = false;
      player.coyoteTime = 0;
      player.jumpBufferTime = 0;
      player.jumps += 1;
      player.sliding = false;
    }
    if (control.jumpReleased && player.vy < 0) player.vy *= JUMP_CUT;

    player.vy += GRAVITY * dt;
    player.y += player.vy * dt;
    if (player.y >= GROUND_Y - PLAYER_H) {
      if (!player.onGround && player.vy > 300) {
        for (let i = 0; i < 4; i += 1) {
          state.particles.push({
            kind: 'dust', x: player.x + random.range(6, 50), y: GROUND_Y - 4,
            vx: random.range(-50, 30), vy: random.range(-60, -10),
            life: 0.4, maxLife: 0.4, size: random.range(4, 8),
            color: '#d8c49a', rot: 0, vr: 0,
          });
        }
      }
      player.y = GROUND_Y - PLAYER_H;
      player.vy = 0;
      player.onGround = true;
    } else {
      player.onGround = false;
    }

    player.sliding = control.slideHeld && player.onGround && !player.hidden;
    if (player.sliding) player.slides += 1;
    player.runPhase += (dt * state.speed) / 34;
    player.invulnTime = Math.max(0, player.invulnTime - dt);
    if (player.hideTime > 0) {
      player.hideTime -= dt;
      if (player.hideTime <= 0) player.hidden = false;
    }
  }

  function step(dt, control, options = {}) {
    const attract = options.attract === true;
    state.attract = attract;
    let events = 0;
    if (state.over) {
      state.overTime += dt;
      updateParticles(dt);
      updateFloaters(dt);
      return 0;
    }
    state.time += dt;

    const stageIndex = stageFor(state.distance);
    if (stageIndex !== state.stageIndex) {
      state.stageIndex = stageIndex;
      events |= EVENT_STAGE;
      addFloater(PLAYER_X + 30, GROUND_Y - 220, STAGES[stageIndex].tagline, '#fff2cf');
    }

    stepPlayer(dt, control);

    // The farmer gains on every stumble and slowly loses ground to a clean run.
    const inMud = state.obstacles.some(
      (ob) => ob.kind === KIND_MUD && overlaps(playerBox(), { x: ob.x, y: ob.y, w: ob.w, h: ob.h }),
    );
    if (inMud) state.farmerGap -= MUD_GAP_DRAIN * dt;
    else state.farmerGap = Math.min(FARMER_MAX_GAP, state.farmerGap + FARMER_RECOVER_PER_SECOND * dt);
    state.farmerMood = state.farmerGap < 55 ? 'grab' : state.farmerGap < 110 ? 'chase' : 'search';

    // Speed and score grow with distance.
    state.speed = Math.min(MAX_SPEED, START_SPEED + state.distance * SPEED_PER_METER);
    const meters = (state.speed * dt) / PIXELS_PER_METER;
    state.distance += meters;
    state.score += meters * 2;
    if (state.comboTime > 0) {
      state.comboTime -= dt;
      if (state.comboTime <= 0) state.combo = 0;
    }

    // Spawn the next obstacle when the last gap has scrolled past.
    state.spawnIn -= state.speed * dt;
    if (state.spawnIn <= 0) state.spawnIn = spawnPattern();
    if (state.knifeThrown) {
      state.knifeThrown = false;
      events |= EVENT_KNIFE;
    }

    // Move everything left; a thrown knife instead flies right, from the
    // farmer's hands toward the turkey.
    for (const obstacle of state.obstacles) {
      if (obstacle.kind === KIND_KNIFE) {
        // The wind-up holds the knife at the farmer's hand, then it flies.
        if (obstacle.delay > 0) obstacle.delay -= dt;
        else {
          obstacle.x += 240 * dt;
          obstacle.spin += dt * 10;
        }
      } else {
        obstacle.x -= state.speed * dt;
      }
      if (obstacle.kind === KIND_PIN) obstacle.spin += dt * 9;
    }
    state.obstacles = state.obstacles.filter((ob) => ob.x + ob.w > -80 && ob.x < 1420);
    for (const pickup of state.pickups) {
      pickup.x -= state.speed * dt;
      pickup.bob += dt * 5;
    }
    state.pickups = state.pickups.filter((pickup) => pickup.x > -60);

    // Running dust, drifting leaves, and sweat when the farmer is close.
    state.dustTime -= dt;
    if (state.player.onGround && !state.player.hidden && state.dustTime <= 0) {
      state.dustTime = 0.07;
      state.particles.push({
        kind: 'dust', x: state.player.x + 8, y: GROUND_Y - 4,
        vx: random.range(-70, -20), vy: random.range(-50, -8),
        life: 0.45, maxLife: 0.45, size: random.range(3, 7),
        color: '#d8c49a', rot: 0, vr: 0,
      });
    }
    state.leafTime -= dt;
    if (state.leafTime <= 0) {
      state.leafTime = random.range(0.4, 1.1);
      state.particles.push({
        kind: 'leaf', x: random.range(200, 1280), y: -12,
        vx: random.range(-40, 10), vy: random.range(40, 90),
        life: 6, maxLife: 6, size: random.range(6, 11),
        color: random.pick(['#e07a2e', '#d9a441', '#b8522e', '#c98a4b']),
        rot: random.range(0, Math.PI * 2), vr: random.range(-2, 2),
      });
    }
    if (state.farmerGap < 55 && random.chance(0.12)) {
      state.particles.push({
        kind: 'sweat', x: state.player.x + 44, y: GROUND_Y - PLAYER_H - 6,
        vx: random.range(20, 70), vy: random.range(-120, -60),
        life: 0.5, maxLife: 0.5, size: 4, color: '#bfe3ff', rot: 0, vr: 0,
      });
    }

    // Hiding: slide into a haystack and the farmer loses the trail.
    const player = state.player;
    if (player.sliding && !player.hidden) {
      const stack = state.obstacles.find(
        (ob) => ob.kind === KIND_HAYSTACK && overlaps(playerBox(), { x: ob.x + 10, y: ob.y, w: ob.w - 20, h: ob.h }),
      );
      if (stack) {
        player.hidden = true;
        player.hideTime = 1.2;
        player.hides += 1;
        player.invulnTime = Math.max(player.invulnTime, 1.4);
        state.farmerGap = Math.min(FARMER_MAX_GAP, state.farmerGap + HIDE_GAP_BONUS);
        events |= EVENT_HIDE;
        addFloater(stack.x + 40, GROUND_Y - 150, 'HIDDEN!', '#ffe9a8');
      }
    }

    // Pickups.
    const box = playerBox();
    for (const pickup of state.pickups) {
      const pickupBox = { x: pickup.x - 16, y: pickup.y - 16, w: 32, h: 32 };
      if (overlaps(box, pickupBox)) {
        pickup.taken = true;
        if (pickup.kind === 'corn') {
          state.combo = state.comboTime > 0 ? Math.min(COMBO_MAX, state.combo + 1) : 1;
          state.comboTime = COMBO_WINDOW;
          const points = CORN_POINTS * state.combo;
          state.score += points;
          state.corn += 1;
          addFloater(pickup.x, pickup.y - 24, `+${points}`, '#ffd94a');
          burstSparks(pickup.x, pickup.y, '#ffd94a');
          events |= EVENT_PICKUP;
        } else {
          state.score += FEATHER_POINTS;
          state.feathers += 1;
          addFloater(pickup.x, pickup.y - 24, `+${FEATHER_POINTS}`, '#fff2cf');
          burstSparks(pickup.x, pickup.y, '#fff2cf');
          events |= EVENT_FEATHER;
        }
      }
    }
    state.pickups = state.pickups.filter((pickup) => !pickup.taken);

    // Collisions with things that hurt.
    if (player.invulnTime <= 0 && !player.hidden && !attract) {
      for (const obstacle of state.obstacles) {
        if (obstacle.hit) continue;
        const spec = OBSTACLES[obstacle.kind];
        if (!spec.hurts) continue;
        const obstacleBox = { x: obstacle.x + 5, y: obstacle.y + 4, w: obstacle.w - 10, h: obstacle.h - 6 };
        if (overlaps(box, obstacleBox)) {
          obstacle.hit = true;
          state.lives -= 1;
          state.farmerGap -= HIT_GAP_COST;
          state.combo = 0;
          state.comboTime = 0;
          player.invulnTime = 1.6;
          burstFeathers(player.x + 30, player.y + 30, 16);
          events |= EVENT_HIT;
          if (obstacle.kind === KIND_KNIFE) obstacle.x = -9999;
          break;
        }
      }
    }

    updateParticles(dt);
    updateFloaters(dt);

    // Caught: out of lives, or the farmer closes the gap.
    if (!attract && (state.lives <= 0 || state.farmerGap <= FARMER_CATCH_GAP)) {
      state.over = 'caught';
      state.overTime = 0;
      state.farmerMood = 'grab';
      burstFeathers(player.x + 30, player.y + 30, 24);
      return events | EVENT_OVER;
    }
    // Escaped: the forest gate at the end of the kitchen.
    if (state.distance >= ESCAPE_DISTANCE) {
      state.over = 'escaped';
      state.overTime = 0;
      burstSparks(player.x + 30, player.y - 20, '#ffe9a8');
      return events | EVENT_OVER;
    }
    return events;
  }

  function updateParticles(dt) {
    for (const particle of state.particles) {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.rot += particle.vr * dt;
      if (particle.kind === 'feather' || particle.kind === 'leaf') particle.vy += 160 * dt;
      if (particle.kind === 'dust') particle.vy -= 20 * dt;
    }
    state.particles = state.particles.filter((particle) => particle.life > 0 && particle.y < 760);
  }

  function updateFloaters(dt) {
    for (const floater of state.floaters) {
      floater.life -= dt;
      floater.y -= 42 * dt;
    }
    state.floaters = state.floaters.filter((floater) => floater.life > 0);
  }

  return { state, reset, step, playerBox };
}
