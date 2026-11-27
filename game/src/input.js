// Keyboard and mouse input: jump, slide, confirm, pause, restart and mute.
// The game is an auto-runner, so there is no steering — only timing.
export const ACTION_JUMP = 1;
export const ACTION_CONFIRM = 2;
export const ACTION_PAUSE = 4;
export const ACTION_RESTART = 8;
export const ACTION_MUTE = 16;

export function createInput(canvas) {
  const keys = new Set();
  let queuedActions = 0;
  let pendingClick = null;
  let slideHeld = false;

  function press(action) {
    queuedActions |= action;
  }

  function onKeyDown(event) {
    if (event.repeat) {
      if (event.code === 'ArrowDown' || event.code === 'KeyS') slideHeld = true;
      return;
    }
    switch (event.code) {
      case 'Space':
      case 'ArrowUp':
      case 'KeyW':
        press(ACTION_JUMP | ACTION_CONFIRM);
        event.preventDefault();
        break;
      case 'ArrowDown':
      case 'KeyS':
        slideHeld = true;
        event.preventDefault();
        break;
      case 'Enter':
        press(ACTION_CONFIRM);
        break;
      case 'KeyP':
      case 'Escape':
        press(ACTION_PAUSE);
        break;
      case 'KeyR':
        press(ACTION_RESTART);
        break;
      case 'KeyM':
        press(ACTION_MUTE);
        break;
      default:
        break;
    }
    keys.add(event.code);
  }

  function onKeyUp(event) {
    keys.delete(event.code);
    if (event.code === 'ArrowDown' || event.code === 'KeyS') slideHeld = false;
  }

  function onPointerDown(event) {
    const rect = canvas.getBoundingClientRect();
    pendingClick = {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
    press(ACTION_JUMP | ACTION_CONFIRM);
  }

  function onBlur() {
    keys.clear();
    slideHeld = false;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('pointerdown', onPointerDown);

  return {
    // Edge-triggered actions since the last call, as a bitmask.
    takeActions() {
      const actions = queuedActions;
      queuedActions = 0;
      return actions;
    },
    // True while the slide key is held down.
    isSliding() {
      return slideHeld;
    },
    // The latest click in canvas pixels, or null; consumed once.
    takeClick() {
      const click = pendingClick;
      pendingClick = null;
      return click;
    },
    hasClick() {
      return pendingClick !== null;
    },
  };
}
