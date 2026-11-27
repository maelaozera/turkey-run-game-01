// The screenshot scenes behind ?shot=start|play|kitchen|end. Each one plays
// the real rules forward from a fresh world for a fixed stretch, steered by
// a simple autopilot (jump the fences and the oven, slide under the knives,
// hide when the farmer closes in), so the frame is what a real run looks
// like and the same seed always gives the same frame.
import { STEP } from './config.js';
import { EVENT_OVER, KIND_HAYSTACK, KIND_KNIFE, KIND_MUD, KIND_OVEN } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 4;
const PLAY_SECONDS = 24;
const KITCHEN_DISTANCE = 860;
const END_LIMIT_SECONDS = 600;

function autopilot(state, skill) {
  const player = state.player;
  const front = player.x + 62;
  const speed = state.speed;
  let nearest = null;
  let nearestGap = Infinity;
  for (const obstacle of state.obstacles) {
    // Fully behind the turkey's tail is gone; anything else may still
    // matter — a knife comes from behind, so it must be seen early.
    if (obstacle.x + obstacle.w < player.x) continue;
    const gap = obstacle.x - front;
    if (gap < nearestGap) {
      nearestGap = gap;
      nearest = obstacle;
    }
  }
  if (!nearest) return { jump: false, slideHeld: false, jumpReleased: false };

  // A thrown knife at head height: slide under it, never jump into it.
  if (nearest.kind === KIND_KNIFE) {
    if (skill === 'good' && nearestGap < 300 && player.onGround) {
      return { jump: false, slideHeld: true, jumpReleased: false };
    }
    return { jump: false, slideHeld: false, jumpReleased: false };
  }
  // A haystack and a farmer on your tail: slide in and hide.
  if (nearest.kind === KIND_HAYSTACK && skill === 'good') {
    if (state.farmerGap < 110 && nearestGap < 160 && player.onGround) {
      return { jump: false, slideHeld: true, jumpReleased: false };
    }
    return { jump: false, slideHeld: false, jumpReleased: false };
  }
  if (nearest.kind === KIND_MUD) return { jump: false, slideHeld: false, jumpReleased: false };

  // Everything else is jumped: leave the ground just before reaching it.
  // The weak pilot jumps far too late, and never dares the oven at all.
  if (nearest.kind === KIND_OVEN && skill !== 'good') {
    return { jump: false, slideHeld: false, jumpReleased: false };
  }
  const lead = skill === 'good' ? speed * 0.30 : speed * 0.06;
  if (player.onGround && nearestGap < lead) {
    return { jump: true, slideHeld: false, jumpReleased: false };
  }
  return { jump: false, slideHeld: false, jumpReleased: false };
}

function runFor(world, seconds, skill, until) {
  const limit = Math.floor(seconds / STEP);
  for (let index = 0; index < limit; index += 1) {
    const events = world.step(STEP, autopilot(world.state, skill), { attract: false });
    if (events & EVENT_OVER) return true;
    if (until && until(world.state)) return false;
  }
  return false;
}

/**
 * Set `world` to the named scene (start, play, kitchen or end) and return the
 * screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'kitchen' && name !== 'end') {
    // Title: the turkey runs through the farmyard behind the title card.
    for (let index = 0; index < START_SECONDS / STEP; index += 1) {
      world.step(STEP, autopilot(world.state, 'good'), { attract: true });
    }
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'kitchen') {
    // Play well into the kitchen stage, then wait for an oven or a knife to
    // be on screen, so the shot shows the stage's own dangers.
    runFor(world, 400, 'good', (state) => state.distance >= KITCHEN_DISTANCE);
    const startTime = world.state.time;
    while (world.state.time - startTime < 3) {
      const onScreen = world.state.obstacles.some(
        (ob) => (ob.kind === 'oven' || ob.kind === 'knife') && ob.x > 480 && ob.x < 1150,
      );
      if (onScreen) break;
      const events = world.step(STEP, autopilot(world.state, 'good'), { attract: false });
      if (events & EVENT_OVER) break;
    }
    const over = world.state.over !== null;
    return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: Math.floor(world.state.score) };
  }
  if (name === 'end') {
    // A hurried player: short look-ahead, no sliding, no hiding — caught.
    runFor(world, END_LIMIT_SECONDS, 'weak');
    return { screen: SCREEN_OVER, best: Math.floor(world.state.score) };
  }
  runFor(world, PLAY_SECONDS, 'good');
  const over = world.state.over !== null;
  return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: Math.floor(world.state.score) };
}
