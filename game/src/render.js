// The renderer: one canvas, one job — paint the world, the HUD and the
// screens. The world simulates; this file decides what the player sees.
import {
  ESCAPE_DISTANCE,
  FARMER_MAX_GAP,
  GROUND_Y,
  PIXELS_PER_METER,
  PLAYER_H,
  STAGES,
  VIEW_H,
  VIEW_W,
} from './config.js';
import {
  drawBackground,
  drawFarmer,
  drawHaystack,
  drawObstacle,
  drawParticles,
  drawPickup,
  drawTurkey,
} from './art.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

function panel(ctx, x, y, w, h, alpha = 0.55) {
  ctx.fillStyle = `rgba(28, 18, 10, ${alpha})`;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 14);
  ctx.fill();
}

function heart(ctx, x, y, size, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 16, size / 16);
  ctx.fillStyle = filled ? '#e84a5a' : 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.bezierCurveTo(-11, -4, -6, -13, 0, -6);
  ctx.bezierCurveTo(6, -13, 11, -4, 0, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const buttons = { start: null, restart: null, mute: null };

  function drawHud(state, best, muted) {
    const distance = Math.floor(state.distance);
    // Score and distance, top left.
    panel(ctx, 16, 14, 344, 96);
    ctx.fillStyle = '#ffd94a';
    ctx.font = 'bold 34px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`SCORE ${Math.floor(state.score)}`, 32, 52);
    ctx.fillStyle = '#fff2cf';
    ctx.font = 'bold 22px Georgia, serif';
    ctx.fillText(`${distance} m`, 32, 84);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '16px Georgia, serif';
    ctx.fillText(`BEST ${Math.max(best, Math.floor(state.score))}`, 200, 84);

    // Progress bar to the forest gate, under the score.
    const barX = 32;
    const barY = 94;
    const barW = 220;
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, 10, 5);
    ctx.fill();
    const progress = Math.min(1, state.distance / ESCAPE_DISTANCE);
    ctx.fillStyle = '#7fae4e';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW * progress, 10, 5);
    ctx.fill();
    ctx.fillStyle = '#fff2cf';
    ctx.font = '12px Georgia, serif';
    ctx.fillText('FOREST GATE', barX + barW + 8, barY + 10);

    // Lives, combo and stage, top right.
    panel(ctx, VIEW_W - 316, 14, 300, 96);
    for (let i = 0; i < 3; i += 1) {
      heart(ctx, VIEW_W - 286 + i * 34, 52, 30, i < state.lives);
    }
    ctx.fillStyle = '#fff2cf';
    ctx.font = 'bold 20px Georgia, serif';
    ctx.textAlign = 'right';
    ctx.fillText(STAGES[state.stageIndex].name.toUpperCase(), VIEW_W - 32, 52);
    if (state.combo > 1) {
      ctx.fillStyle = '#ffd94a';
      ctx.font = 'bold 22px Georgia, serif';
      ctx.fillText(`COMBO x${state.combo}`, VIEW_W - 32, 86);
    } else {
      ctx.fillStyle = 'rgba(255,242,207,0.7)';
      ctx.font = '16px Georgia, serif';
      ctx.fillText(`CORN ${state.corn}`, VIEW_W - 32, 86);
    }
    ctx.textAlign = 'left';

    // Mute button, bottom right.
    buttons.mute = { x: VIEW_W - 64, y: VIEW_H - 64, w: 48, h: 48 };
    panel(ctx, VIEW_W - 64, VIEW_H - 64, 48, 48, 0.45);
    ctx.fillStyle = '#fff2cf';
    ctx.font = '22px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(muted ? '✕' : '♪', VIEW_W - 40, VIEW_H - 32);
    ctx.textAlign = 'left';

    // Farmer proximity meter, bottom left: the closer he is, the redder.
    const gapRatio = Math.max(0, Math.min(1, state.farmerGap / FARMER_MAX_GAP));
    panel(ctx, 16, VIEW_H - 64, 300, 48, 0.5);
    ctx.fillStyle = '#fff2cf';
    ctx.font = 'bold 15px Georgia, serif';
    ctx.fillText('FARMER', 30, VIEW_H - 34);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.roundRect(108, VIEW_H - 46, 180, 12, 6);
    ctx.fill();
    const danger = gapRatio < 0.25;
    ctx.fillStyle = danger ? '#e84a5a' : gapRatio < 0.5 ? '#e07a2e' : '#7fae4e';
    ctx.beginPath();
    ctx.roundRect(108, VIEW_H - 46, 180 * gapRatio, 12, 6);
    ctx.fill();
    if (danger && state.over === null) {
      const pulse = 0.5 + Math.sin(state.time * 8) * 0.5;
      ctx.fillStyle = `rgba(232, 74, 90, ${0.55 + pulse * 0.45})`;
      ctx.font = 'bold 20px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText("HE'S RIGHT BEHIND YOU!", VIEW_W / 2, 150);
      ctx.textAlign = 'left';
    }
  }

  function drawWorld(state, time) {
    const stage = STAGES[state.stageIndex];
    const distancePx = state.distance * PIXELS_PER_METER;
    drawBackground(ctx, stage, state.stageIndex, time, distancePx);

    // Haystacks first so a hidden turkey's eyes show over the straw.
    for (const obstacle of state.obstacles) {
      if (obstacle.kind === 'haystack') {
        drawObstacle(ctx, obstacle, time);
      }
    }
    for (const pickup of state.pickups) drawPickup(ctx, pickup, time);
    for (const obstacle of state.obstacles) {
      if (obstacle.kind !== 'haystack') drawObstacle(ctx, obstacle, time);
    }

    // The farmer runs behind the turkey, closing in as the gap shrinks.
    const farmerX = state.player.x - state.farmerGap - 96;
    drawFarmer(ctx, farmerX, GROUND_Y, {
      runPhase: state.player.runPhase * 1.15,
      mood: state.farmerMood,
      scale: 1.15,
    });

    // The turkey — or just its eyes, when it is hiding in a haystack.
    const player = state.player;
    if (player.hidden) {
      const stack = state.obstacles.find((ob) => ob.kind === 'haystack' && ob.x < player.x + 60 && ob.x + ob.w > player.x);
      if (stack) {
        drawHaystack(ctx, stack.x, stack.y, stack.w, stack.h, time, true);
      }
    } else {
      // Invulnerability blink only while the run is live: on the end screen
      // the turkey must stay visible, caught or escaped.
      const blink = state.over === null && player.invulnTime > 0 && Math.floor(time * 12) % 2 === 0;
      drawTurkey(ctx, player.x + 30, player.y + PLAYER_H, {
        runPhase: player.runPhase,
        airborne: !player.onGround,
        sliding: player.sliding,
        scared: state.farmerGap < 55,
        blink,
      });
    }

    drawParticles(ctx, state.particles);

    // Floating score popups.
    ctx.textAlign = 'center';
    for (const floater of state.floaters) {
      ctx.globalAlpha = Math.max(0, floater.life / floater.maxLife);
      ctx.fillStyle = floater.color;
      ctx.font = 'bold 22px Georgia, serif';
      ctx.fillText(floater.text, floater.x, floater.y);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';

    // The forest gate at the end of the run, when it comes into view.
    const gateDistance = ESCAPE_DISTANCE - state.distance;
    if (gateDistance < 40 && state.over === null) {
      const gateX = VIEW_W - 120 + (40 - gateDistance) * PIXELS_PER_METER * 0.4;
      ctx.fillStyle = '#5d7a2e';
      ctx.fillRect(gateX, GROUND_Y - 190, 16, 190);
      ctx.fillRect(gateX + 120, GROUND_Y - 190, 16, 190);
      ctx.fillStyle = '#7fae4e';
      ctx.beginPath();
      ctx.roundRect(gateX - 10, GROUND_Y - 210, 156, 34, 12);
      ctx.fill();
      ctx.fillStyle = '#fff2cf';
      ctx.font = 'bold 18px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('FOREST', gateX + 68, GROUND_Y - 188);
      ctx.textAlign = 'left';
    }
  }

  function drawButton(rect, label, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 16);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.roundRect(rect.x, rect.y + rect.h - 10, rect.w, 10, 8);
    ctx.fill();
    ctx.fillStyle = '#fff8e6';
    ctx.font = 'bold 28px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 10);
    ctx.textAlign = 'left';
  }

  function drawTitle(state, best, time) {
    drawWorld(state, time);
    ctx.fillStyle = 'rgba(40, 20, 8, 0.45)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd94a';
    ctx.font = 'bold 96px Georgia, serif';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;
    ctx.fillText('GOBBLE DASH', VIEW_W / 2, 170);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = '#fff2cf';
    ctx.font = 'italic bold 34px Georgia, serif';
    ctx.fillText('The Great Turkey Escape', VIEW_W / 2, 222);

    ctx.font = '20px Georgia, serif';
    ctx.fillStyle = '#ffe9b0';
    ctx.fillText('Thanksgiving is coming. The farmer wants dinner. Run for the forest!', VIEW_W / 2, 268);
    ctx.fillText('Jump the fences, bales and the oven — slide under the carving knives.', VIEW_W / 2, 298);
    ctx.fillText('Hide in a haystack when the farmer gets too close.', VIEW_W / 2, 328);

    buttons.start = { x: VIEW_W / 2 - 150, y: 380, w: 300, h: 64 };
    drawButton(buttons.start, '▶  START RUNNING', '#c93a2a');

    ctx.font = '18px Georgia, serif';
    ctx.fillStyle = '#fff2cf';
    ctx.fillText('SPACE / ↑ / CLICK — jump      ↓ / S — slide & hide      P — pause      M — mute', VIEW_W / 2, 486);
    if (best > 0) {
      ctx.fillStyle = '#ffd94a';
      ctx.font = 'bold 22px Georgia, serif';
      ctx.fillText(`BEST SCORE  ${best}`, VIEW_W / 2, 524);
    }
    ctx.font = '16px Georgia, serif';
    ctx.fillStyle = 'rgba(255,242,207,0.75)';
    ctx.fillText('Farmyard  →  Cornfield  →  Farmhouse Kitchen  →  Forest Gate (1200 m)', VIEW_W / 2, 560);
    ctx.textAlign = 'left';
  }

  function drawPaused() {
    ctx.fillStyle = 'rgba(20, 12, 6, 0.6)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff2cf';
    ctx.font = 'bold 72px Georgia, serif';
    ctx.fillText('PAUSED', VIEW_W / 2, 330);
    ctx.font = '22px Georgia, serif';
    ctx.fillText('The farmer waits. So does the oven. Press P or click to keep running.', VIEW_W / 2, 380);
    ctx.textAlign = 'left';
  }

  function drawOver(state, best) {
    const escaped = state.over === 'escaped';
    ctx.fillStyle = escaped ? 'rgba(30, 60, 20, 0.55)' : 'rgba(60, 10, 8, 0.6)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    ctx.textAlign = 'center';
    ctx.fillStyle = escaped ? '#a8e063' : '#ff6a5a';
    ctx.font = 'bold 88px Georgia, serif';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 5;
    ctx.fillText(escaped ? 'ESCAPED!' : 'CAUGHT!', VIEW_W / 2, 190);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.fillStyle = '#fff2cf';
    ctx.font = 'italic 26px Georgia, serif';
    ctx.fillText(
      escaped
        ? 'You made it to the forest. Happy Thanksgiving — from a safe distance.'
        : 'The farmer is already preheating the oven. Next time, run faster!',
      VIEW_W / 2,
      240,
    );

    // The run's numbers.
    panel(ctx, VIEW_W / 2 - 250, 280, 500, 150, 0.6);
    ctx.fillStyle = '#ffd94a';
    ctx.font = 'bold 40px Georgia, serif';
    ctx.fillText(`SCORE  ${Math.floor(state.score)}`, VIEW_W / 2, 330);
    ctx.fillStyle = '#fff2cf';
    ctx.font = '22px Georgia, serif';
    ctx.fillText(
      `${Math.floor(state.distance)} m  •  ${state.corn} corn  •  ${state.feathers} feathers`,
      VIEW_W / 2,
      372,
    );
    ctx.fillStyle = Math.floor(state.score) > best ? '#a8e063' : '#ffe9b0';
    ctx.font = 'bold 20px Georgia, serif';
    ctx.fillText(
      Math.floor(state.score) > best ? '★ NEW BEST SCORE! ★' : `BEST  ${best}`,
      VIEW_W / 2,
      408,
    );

    buttons.restart = { x: VIEW_W / 2 - 150, y: 470, w: 300, h: 64 };
    drawButton(buttons.restart, '↻  RUN AGAIN', escaped ? '#5d7a2e' : '#c93a2a');
    ctx.font = '18px Georgia, serif';
    ctx.fillStyle = '#fff2cf';
    ctx.fillText('Press R or click the button to run again', VIEW_W / 2, 574);
    ctx.textAlign = 'left';
  }

  function draw(state, screen, best, muted, time) {
    buttons.start = null;
    buttons.restart = null;
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    if (screen === SCREEN_TITLE) {
      drawTitle(state, best, time);
    } else if (screen === SCREEN_OVER) {
      drawWorld(state, time);
      drawOver(state, best);
    } else {
      drawWorld(state, time);
      drawHud(state, best, muted);
      if (screen === SCREEN_PAUSED) drawPaused();
    }
    // Danger vignette while the farmer is about to grab the turkey.
    if (screen === SCREEN_PLAY && state.farmerGap < 55 && state.over === null) {
      const pulse = 0.12 + Math.sin(time * 8) * 0.08;
      const gradient = ctx.createRadialGradient(
        VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.45,
        VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.85,
      );
      gradient.addColorStop(0, 'rgba(200,30,20,0)');
      gradient.addColorStop(1, `rgba(200,30,20,${pulse})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
  }

  return { draw, buttons };
}
