// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps, and the renderer paints what is there. The game moves
// between four screens: title, play, paused and game over.
//
// ?seed=N fixes the run's pattern. ?shot=start|play|kitchen|end (with
// &seed=N) stages that scene instead of running the loop, paints it twice
// and sets window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createAudio } from './audio.js';
import { createWorld, EVENT_FEATHER, EVENT_HIT, EVENT_HIDE, EVENT_KNIFE, EVENT_OVER, EVENT_PICKUP, EVENT_STAGE } from './world.js';
import {
  ACTION_CONFIRM,
  ACTION_JUMP,
  ACTION_MUTE,
  ACTION_PAUSE,
  ACTION_RESTART,
  createInput,
} from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');

// Keep the 16:9 game frame undistorted in any desktop window: scale the
// canvas to fit and centre it, letterboxing with the page background.
function fitCanvas() {
  const scale = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
  canvas.style.width = `${Math.floor(1280 * scale)}px`;
  canvas.style.height = `${Math.floor(720 * scale)}px`;
  canvas.style.left = `${Math.floor((window.innerWidth - 1280 * scale) / 2)}px`;
  canvas.style.top = `${Math.floor((window.innerHeight - 720 * scale) / 2)}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off: the best score then lasts this visit only.
  }
}

function inside(point, rect) {
  return point && rect && point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, false, world.state.time);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let jumpHeld = false;
  let attractTime = 0;

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    audio.unlock();
    audio.startMusic();
    announce(`Playing. ${world.state.lives} lives. Run for the forest gate!`);
  }

  function endGame() {
    screen = SCREEN_OVER;
    audio.stopMusic();
    if (world.state.over === 'escaped') audio.win();
    else audio.lose();
    if (world.state.score > best) {
      best = Math.floor(world.state.score);
      saveBest(best);
    }
    announce(
      world.state.over === 'escaped'
        ? `Escaped! Score ${Math.floor(world.state.score)}. Best ${best}.`
        : `Caught! Score ${Math.floor(world.state.score)}. Best ${best}.`,
    );
  }

  function toggleMute() {
    audio.unlock();
    audio.setMuted(!audio.isMuted());
    announce(audio.isMuted() ? 'Sound off.' : 'Sound on.');
  }

  function handleClick(point) {
    if (!point) return false;
    if (inside(point, renderer.buttons.mute)) {
      toggleMute();
      return true;
    }
    if (screen === SCREEN_TITLE && inside(point, renderer.buttons.start)) {
      audio.click();
      startGame();
      return true;
    }
    if (screen === SCREEN_OVER && inside(point, renderer.buttons.restart)) {
      audio.click();
      startGame();
      return true;
    }
    if (screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
      return true;
    }
    return false;
  }

  function handleActions() {
    const actions = input.takeActions();
    const click = input.takeClick();
    if (actions & ACTION_MUTE) toggleMute();
    if (click) handleClick(click);
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) {
      // A click on a button already handled it; a key press starts the run.
      if (!click) {
        audio.click();
        startGame();
      }
    } else if (actions & ACTION_RESTART && screen !== SCREEN_TITLE) {
      audio.click();
      startGame();
    } else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      audio.stopMusic();
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      audio.startMusic();
      announce('Playing.');
    }
    if (actions & ACTION_JUMP) jumpHeld = true;
  }

  function step() {
    if (screen === SCREEN_TITLE) {
      attractTime += STEP;
      // The title turkey jumps now and then, to show it can.
      const showJump = Math.sin(attractTime * 0.45) > 0.93 && world.state.player.onGround;
      world.step(STEP, { jump: showJump, slideHeld: false, jumpReleased: false }, { attract: true });
      return;
    }
    const jump = jumpHeld;
    jumpHeld = false;
    const events = world.step(
      STEP,
      { jump, slideHeld: input.isSliding(), jumpReleased: false },
      { attract: false },
    );
    if (events & EVENT_PICKUP) audio.pickup(world.state.combo);
    if (events & EVENT_FEATHER) audio.feather();
    if (events & EVENT_HIDE) audio.hide();
    if (events & EVENT_KNIFE) audio.whoosh();
    if (events & EVENT_STAGE) audio.gobble();
    if (events & EVENT_HIT) {
      audio.hit();
      audio.yell();
      announce(
        world.state.lives === 1
          ? 'Hit! 1 life left — the farmer is close!'
          : `Hit! ${world.state.lives} lives left.`,
      );
    }
    if (events & EVENT_OVER) endGame();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best, audio.isMuted(), world.state.time);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      audio.stopMusic();
      announce('Paused.');
    }
  });

  announce('Gobble Dash. Press Space or click to start running.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
