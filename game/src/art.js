// All of Gobble Dash's art is drawn in code: the turkey, the farmer, the
// oven and the knives, the farmyard, the cornfield and the kitchen. No
// images, no fonts, nothing to download — every frame is painted here.
import { GROUND_Y, PIXELS_PER_METER, STAGES, VIEW_H, VIEW_W } from './config.js';

function circle(ctx, x, y, radius) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function ellipse(ctx, x, y, rx, ry, rotation = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
}

function hash(index) {
  let value = (index * 2654435761) >>> 0;
  value ^= value >>> 13;
  value = Math.imul(value, 0x5bd1e995);
  value ^= value >>> 15;
  return (value >>> 0) / 4294967296;
}

// ---------------------------------------------------------------------------
// Backgrounds
// ---------------------------------------------------------------------------

export function drawSky(ctx, stage, time, distancePx) {
  const gradient = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  gradient.addColorStop(0, stage.skyTop);
  gradient.addColorStop(0.62, stage.skyBottom);
  gradient.addColorStop(0.63, stage.hillFar);
  gradient.addColorStop(1, stage.hillNear);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // Low autumn sun with soft rays, clear of the HUD panels at the corners.
  const sunX = 640;
  const sunY = 105;
  ctx.fillStyle = stage.sun;
  circle(ctx, sunX, sunY, 52);
  ctx.strokeStyle = 'rgba(255, 243, 196, 0.55)';
  ctx.lineWidth = 5;
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2 + time * 0.05;
    ctx.beginPath();
    ctx.moveTo(sunX + Math.cos(angle) * 64, sunY + Math.sin(angle) * 64);
    ctx.lineTo(sunX + Math.cos(angle) * 82, sunY + Math.sin(angle) * 82);
    ctx.stroke();
  }

  // Drifting clouds, slow parallax, spread across the sky.
  ctx.fillStyle = 'rgba(255, 250, 235, 0.9)';
  for (let i = 0; i < 5; i += 1) {
    const speed = 0.1 + (i % 3) * 0.04;
    const baseX = i * 397 + 80;
    const x = ((baseX - distancePx * speed) % 1700 + 1700) % 1700 - 210;
    const y = 56 + ((i * 67) % 150);
    ellipse(ctx, x, y, 62, 20);
    ellipse(ctx, x + 42, y + 6, 46, 16);
    ellipse(ctx, x - 44, y + 8, 40, 14);
  }

  // A few birds heading home for the winter.
  ctx.strokeStyle = 'rgba(90, 50, 20, 0.7)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i += 1) {
    const bx = ((i * 420 + 900 - time * 26) % 1500 + 1500) % 1500 - 110;
    const by = 150 + i * 34;
    const flap = Math.sin(time * 6 + i * 2) * 6;
    ctx.beginPath();
    ctx.moveTo(bx - 12, by - flap);
    ctx.quadraticCurveTo(bx, by + 4, bx + 12, by - flap);
    ctx.stroke();
  }
}

function drawHills(ctx, stage, distancePx) {
  ctx.fillStyle = stage.hillFar;
  ctx.beginPath();
  ctx.moveTo(0, 520);
  for (let x = 0; x <= VIEW_W; x += 40) {
    const worldX = x + distancePx * 0.3;
    ctx.lineTo(x, 500 - Math.sin(worldX * 0.004) * 42 - Math.sin(worldX * 0.011) * 14);
  }
  ctx.lineTo(VIEW_W, 560);
  ctx.lineTo(0, 560);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = stage.hillNear;
  ctx.beginPath();
  ctx.moveTo(0, 560);
  for (let x = 0; x <= VIEW_W; x += 40) {
    const worldX = x + distancePx * 0.55;
    ctx.lineTo(x, 545 - Math.sin(worldX * 0.006 + 2) * 26);
  }
  ctx.lineTo(VIEW_W, 610);
  ctx.lineTo(0, 610);
  ctx.closePath();
  ctx.fill();

  // Distant trees on the near hill, for depth.
  for (let i = 0; i < 7; i += 1) {
    const spacing = 260;
    const x = ((i * spacing - distancePx * 0.55) % (spacing * 7) + spacing * 7) % (spacing * 7) - 60;
    const treeH = 34 + hash(i + 3) * 26;
    const baseY = 545 - Math.sin((x + distancePx * 0.55) * 0.006 + 2) * 26;
    ctx.fillStyle = '#7a5a34';
    ctx.fillRect(x - 3, baseY - treeH * 0.4, 6, treeH * 0.4);
    ctx.fillStyle = hash(i) > 0.5 ? '#8a6a2e' : '#6e5a26';
    circle(ctx, x, baseY - treeH * 0.55, treeH * 0.42);
    circle(ctx, x - treeH * 0.3, baseY - treeH * 0.35, treeH * 0.28);
    circle(ctx, x + treeH * 0.3, baseY - treeH * 0.35, treeH * 0.28);
  }
}

function drawBarn(ctx, distancePx) {
  const x = ((420 - distancePx * 0.55) % 2200 + 2200) % 2200 - 300;
  const y = 470;
  ctx.fillStyle = '#a63a2a';
  ctx.fillRect(x, y, 210, 130);
  ctx.beginPath();
  ctx.moveTo(x - 12, y);
  ctx.lineTo(x + 105, y - 62);
  ctx.lineTo(x + 222, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#7e2a1e';
  ctx.beginPath();
  ctx.moveTo(x - 12, y);
  ctx.lineTo(x + 105, y - 62);
  ctx.lineTo(x + 222, y);
  ctx.lineTo(x + 222, y + 14);
  ctx.lineTo(x + 105, y - 48);
  ctx.lineTo(x - 12, y + 14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f5ead2';
  ctx.fillRect(x + 78, y + 52, 54, 78);
  ctx.strokeStyle = '#f5ead2';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + 78, y + 52);
  ctx.lineTo(x + 132, y + 130);
  ctx.moveTo(x + 132, y + 52);
  ctx.lineTo(x + 78, y + 130);
  ctx.stroke();
  ctx.fillStyle = '#f5ead2';
  ctx.fillRect(x + 88, y + 14, 34, 26);
}

function drawFenceRow(ctx, distancePx) {
  ctx.fillStyle = '#8a5a30';
  const spacing = 120;
  const offset = -(distancePx * 0.85) % spacing;
  for (let x = offset; x < VIEW_W + spacing; x += spacing) {
    ctx.fillRect(x, 512, 10, 92);
  }
  ctx.fillStyle = '#a06a38';
  ctx.fillRect(0, 528, VIEW_W, 9);
  ctx.fillRect(0, 556, VIEW_W, 9);
}

function drawCornfield(ctx, distancePx) {
  // Tall corn stalks marching past at the back of the field.
  for (let i = 0; i < 9; i += 1) {
    const spacing = 170;
    const x = ((i * spacing - distancePx * 0.7) % (spacing * 9) + spacing * 9) % (spacing * 9) - 40;
    const sway = Math.sin((distancePx + i * 90) * 0.01) * 6;
    ctx.strokeStyle = '#5d7a2e';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, 560);
    ctx.quadraticCurveTo(x + sway, 480, x + sway * 2, 400);
    ctx.stroke();
    ctx.fillStyle = '#e8b93c';
    ellipse(ctx, x + sway * 2 - 8, 440, 10, 26, 0.2);
    ellipse(ctx, x + sway * 2 + 10, 462, 9, 24, -0.25);
  }
}

function drawKitchenWall(ctx, stage, time) {
  ctx.fillStyle = '#e8b06a';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#df9a52';
  for (let y = 0; y < 480; y += 56) {
    ctx.fillRect(0, y, VIEW_W, 3);
  }
  ctx.fillStyle = '#c97e3e';
  for (let y = 0; y < 480; y += 56) {
    for (let x = ((y / 56) % 2) * 60; x < VIEW_W; x += 120) {
      ctx.fillRect(x, y, 3, 56);
    }
  }
  // Window on a dusky evening, with the farm outside — below the score panel.
  ctx.fillStyle = '#7a4a26';
  roundRect(ctx, 120, 140, 260, 220, 10);
  ctx.fillStyle = '#f7c873';
  ctx.fillRect(136, 156, 228, 188);
  ctx.fillStyle = '#ff9e57';
  ctx.fillRect(136, 280, 228, 64);
  ctx.fillStyle = '#7fae4e';
  ctx.fillRect(136, 320, 228, 24);
  ctx.fillStyle = '#7a4a26';
  ctx.fillRect(244, 156, 12, 188);
  ctx.fillRect(136, 242, 228, 12);
  // Shelf with jars and a hanging row of pans.
  ctx.fillStyle = '#8a5a30';
  ctx.fillRect(820, 218, 340, 14);
  const jars = ['#d94f30', '#e8b93c', '#7fae4e', '#c97e3e'];
  jars.forEach((color, i) => {
    ctx.fillStyle = color;
    roundRect(ctx, 840 + i * 80, 164, 52, 54, 8);
    ctx.fillStyle = '#f5ead2';
    ctx.fillRect(852 + i * 80, 176, 28, 8);
  });
  ctx.strokeStyle = '#5a3a20';
  ctx.lineWidth = 4;
  for (let i = 0; i < 3; i += 1) {
    const px = 900 + i * 90;
    const sway = Math.sin(time * 1.2 + i) * 3;
    ctx.beginPath();
    ctx.moveTo(px, 300);
    ctx.lineTo(px, 330);
    ctx.stroke();
    ctx.fillStyle = '#3f3a35';
    circle(ctx, px + sway, 352, 26);
    ctx.fillStyle = '#6b6560';
    circle(ctx, px + sway, 352, 16);
  }
  // The big stove silhouette at the back, glowing.
  ctx.fillStyle = '#4a3a32';
  roundRect(ctx, 470, 380, 340, 220, 12);
  ctx.fillStyle = '#ff7a2e';
  roundRect(ctx, 520, 430, 240, 120, 8);
  ctx.fillStyle = '#ffd94a';
  ellipse(ctx, 640, 490, 60, 34 + Math.sin(time * 3) * 5);
  ctx.fillStyle = '#4a3a32';
  for (let i = 0; i < 4; i += 1) circle(ctx, 520 + i * 80, 410, 12);
}

export function drawGround(ctx, stage, distancePx) {
  ctx.fillStyle = stage.ground;
  ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
  ctx.fillStyle = stage.grass;
  ctx.fillRect(0, GROUND_Y, VIEW_W, 14);
  // Scattered straw, pebbles and leaves on the ground.
  for (let i = 0; i < 40; i += 1) {
    const spacing = 90;
    const x = ((i * spacing - distancePx) % (spacing * 40) + spacing * 40) % (spacing * 40) - 40;
    const y = GROUND_Y + 24 + hash(i) * 84;
    ctx.fillStyle = hash(i + 100) > 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,240,200,0.25)';
    ellipse(ctx, x, y, 8 + hash(i + 7) * 8, 3, 0);
  }
  // Grass tufts waving at the ground line.
  ctx.strokeStyle = stage.grass;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let i = 0; i < 26; i += 1) {
    const spacing = 110;
    const x = ((i * spacing - distancePx * 1.0) % (spacing * 26) + spacing * 26) % (spacing * 26) - 20;
    const sway = Math.sin(distancePx * 0.02 + i) * 3;
    ctx.beginPath();
    ctx.moveTo(x, GROUND_Y + 2);
    ctx.lineTo(x + sway - 4, GROUND_Y - 12);
    ctx.moveTo(x + 6, GROUND_Y + 2);
    ctx.lineTo(x + 6 + sway + 4, GROUND_Y - 14);
    ctx.stroke();
  }
}

export function drawBackground(ctx, stage, stageIndex, time, distancePx) {
  if (stageIndex === 2) {
    drawKitchenWall(ctx, stage, time);
  } else {
    drawSky(ctx, stage, time, distancePx);
    drawHills(ctx, stage, distancePx);
    if (stageIndex === 0) drawBarn(ctx, distancePx);
    if (stageIndex === 1) drawCornfield(ctx, distancePx);
    drawFenceRow(ctx, distancePx);
  }
  drawGround(ctx, stage, distancePx);
}

// ---------------------------------------------------------------------------
// The turkey
// ---------------------------------------------------------------------------

export function drawTurkey(ctx, x, feetY, options) {
  const phase = options.runPhase || 0;
  const airborne = options.airborne === true;
  const sliding = options.sliding === true;
  const scared = options.scared === true;
  const hidden = options.hidden === true;
  const blink = options.blink === true;
  if (blink) return;
  ctx.save();
  ctx.translate(x, feetY);
  if (sliding) {
    ctx.rotate(0.12);
    ctx.translate(0, 26);
    ctx.scale(1.25, 0.62);
  }

  const legSwing = airborne ? 0.5 : Math.sin(phase) * 0.7;
  const legSwing2 = airborne ? -0.4 : Math.sin(phase + Math.PI) * 0.7;

  // Legs.
  ctx.strokeStyle = '#e07a2e';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-8, -26);
  ctx.lineTo(-8 + legSwing * 16, 0);
  ctx.moveTo(8, -26);
  ctx.lineTo(8 + legSwing2 * 16, 0);
  ctx.stroke();
  ctx.fillStyle = '#e07a2e';
  ellipse(ctx, -8 + legSwing * 16, -2, 9, 3);
  ellipse(ctx, 8 + legSwing2 * 16, -2, 9, 3);

  // Tail feathers, fanned and swaying.
  const tailSway = Math.sin(phase * 0.7) * 0.08 + (airborne ? -0.25 : 0);
  for (let i = -2; i <= 2; i += 1) {
    const angle = -2.2 + (i + 2) * 0.42 + tailSway;
    const length = 52 - Math.abs(i) * 7;
    ctx.save();
    ctx.translate(-22, -52);
    ctx.rotate(angle);
    ctx.fillStyle = i % 2 === 0 ? '#7a4a22' : '#a06a35';
    ellipse(ctx, 0, -length / 2, 11, length / 2);
    ctx.fillStyle = '#e8b06a';
    ellipse(ctx, 0, -length + 8, 6, 8);
    ctx.restore();
  }

  // Body and belly.
  ctx.fillStyle = '#8b5a2b';
  ellipse(ctx, 0, -40, 34, 30);
  ctx.fillStyle = '#c98a4b';
  ellipse(ctx, 6, -34, 22, 18);

  // Wing, flapping hard when airborne.
  const flap = airborne ? Math.sin(phase * 2.4) * 0.9 - 0.4 : Math.sin(phase) * 0.18;
  ctx.save();
  ctx.translate(-4, -46);
  ctx.rotate(flap);
  ctx.fillStyle = '#6e4522';
  ellipse(ctx, -6, 0, 20, 12, -0.5);
  ctx.restore();

  // Head, beak, wattle and snood.
  ctx.fillStyle = '#8b5a2b';
  circle(ctx, 26, -72, 15);
  ctx.fillStyle = '#f2a65a';
  ctx.beginPath();
  ctx.moveTo(38, -76);
  ctx.lineTo(54, -70);
  ctx.lineTo(38, -66);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d94f30';
  ellipse(ctx, 34, -60, 5, 9);
  ctx.fillStyle = '#d94f30';
  ellipse(ctx, 30, -82, 3, 8, 0.3);
  ctx.fillStyle = '#ffffff';
  circle(ctx, 30, -76, scared ? 5.5 : 4.5);
  ctx.fillStyle = '#1c1410';
  circle(ctx, 31.5, -76, scared ? 3 : 2.2);
  if (hidden) {
    ctx.fillStyle = '#1c1410';
    ctx.fillRect(24, -80, 12, 2);
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// The farmer
// ---------------------------------------------------------------------------

export function drawFarmer(ctx, x, feetY, options) {
  const phase = options.runPhase || 0;
  const mood = options.mood || 'chase';
  const grab = mood === 'grab';
  const scale = options.scale || 1;
  ctx.save();
  ctx.translate(x, feetY);
  ctx.scale(scale, scale);
  if (grab) ctx.rotate(-0.06);

  const swing = Math.sin(phase) * 0.8;
  const swing2 = Math.sin(phase + Math.PI) * 0.8;

  // Legs: blue overalls, running hard.
  ctx.strokeStyle = '#2e4a7a';
  ctx.lineWidth = 13;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-6, -58);
  ctx.lineTo(-6 + swing * 20, 0);
  ctx.moveTo(8, -58);
  ctx.lineTo(8 + swing2 * 20, 0);
  ctx.stroke();
  ctx.fillStyle = '#3a2a1a';
  ellipse(ctx, -6 + swing * 20, -3, 11, 4);
  ellipse(ctx, 8 + swing2 * 20, -3, 11, 4);

  // Torso: red plaid shirt under overalls.
  ctx.fillStyle = '#c93a2a';
  roundRect(ctx, -24, -108, 48, 56, 10);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-24, -88);
  ctx.lineTo(24, -88);
  ctx.moveTo(-24, -70);
  ctx.lineTo(24, -70);
  ctx.moveTo(-8, -108);
  ctx.lineTo(-8, -52);
  ctx.moveTo(8, -108);
  ctx.lineTo(8, -52);
  ctx.stroke();
  ctx.fillStyle = '#2e4a7a';
  ctx.fillRect(-20, -108, 40, 18);

  // Arms pumping; the right one grips the pitchfork.
  ctx.strokeStyle = '#c93a2a';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(-20, -100);
  ctx.lineTo(-38, -78 + swing * 10);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(20, -100);
  ctx.lineTo(40, -84 - swing * 8);
  ctx.stroke();

  // Pitchfork, angled back over the shoulder.
  ctx.save();
  ctx.translate(40, -84);
  ctx.rotate(0.7 + swing * 0.06);
  ctx.strokeStyle = '#8a6a3a';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -86);
  ctx.stroke();
  ctx.strokeStyle = '#c8c8c8';
  ctx.lineWidth = 4;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * 8, -86);
    ctx.lineTo(i * 9, -106);
    ctx.stroke();
  }
  ctx.restore();

  // Head: sun-reddened, moustached, furious.
  ctx.fillStyle = '#e8b184';
  circle(ctx, 2, -124, 17);
  ctx.fillStyle = '#5a3a20';
  ellipse(ctx, 2, -112, 12, 5);
  ctx.fillStyle = '#ffffff';
  circle(ctx, 10, -128, 4);
  circle(ctx, -4, -128, 4);
  ctx.fillStyle = '#1c1410';
  circle(ctx, 11, -128, 2);
  circle(ctx, -3, -128, 2);
  ctx.strokeStyle = '#1c1410';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(2, -136);
  ctx.lineTo(14, -132);
  ctx.moveTo(2, -136);
  ctx.lineTo(-10, -132);
  ctx.stroke();
  // Shouting mouth when he is close.
  ctx.fillStyle = grab ? '#7a1e12' : '#8a3a22';
  ellipse(ctx, 4, -114, grab ? 7 : 4, grab ? 5 : 3);

  // Straw hat.
  ctx.fillStyle = '#e8c85a';
  ellipse(ctx, 0, -138, 30, 7);
  ctx.fillStyle = '#d9b13c';
  ellipse(ctx, 0, -144, 17, 12);
  ctx.fillStyle = '#c93a2a';
  ctx.fillRect(-17, -142, 34, 5);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Obstacles, pickups and particles
// ---------------------------------------------------------------------------

export function drawObstacle(ctx, obstacle, time) {
  const { kind, x, y, w, h } = obstacle;
  ctx.save();
  if (kind === 'fence') {
    ctx.fillStyle = '#8a5a30';
    ctx.fillRect(x, y, 9, h);
    ctx.fillRect(x + w - 9, y, 9, h);
    ctx.fillStyle = '#a06a38';
    ctx.fillRect(x - 4, y + 12, w + 8, 9);
    ctx.fillRect(x - 4, y + 34, w + 8, 9);
  } else if (kind === 'bale') {
    ctx.fillStyle = '#d9a441';
    circle(ctx, x + w / 2, y + h / 2, w / 2);
    ctx.strokeStyle = '#b57e2c';
    ctx.lineWidth = 3;
    for (let r = 8; r < w / 2; r += 8) {
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = '#e8c85a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 10);
    ctx.lineTo(x + w - 8, y + h - 12);
    ctx.moveTo(x + w - 8, y + 10);
    ctx.lineTo(x + 8, y + h - 12);
    ctx.stroke();
  } else if (kind === 'pumpkin') {
    ctx.fillStyle = '#e07a2e';
    ellipse(ctx, x + w / 2, y + h / 2, w / 2, h / 2);
    ctx.strokeStyle = '#b8522e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + w / 2 - 12, y + 4);
    ctx.quadraticCurveTo(x + w / 2 - 16, y + h / 2, x + w / 2 - 12, y + h - 4);
    ctx.moveTo(x + w / 2 + 12, y + 4);
    ctx.quadraticCurveTo(x + w / 2 + 16, y + h / 2, x + w / 2 + 12, y + h - 4);
    ctx.stroke();
    ctx.fillStyle = '#5d7a2e';
    ctx.fillRect(x + w / 2 - 3, y - 8, 7, 12);
    // A grinning jack-o-lantern face.
    ctx.fillStyle = '#3a1c08';
    ellipse(ctx, x + w / 2 - 12, y + h / 2 - 6, 5, 7);
    ellipse(ctx, x + w / 2 + 12, y + h / 2 - 6, 5, 7);
    ctx.beginPath();
    ctx.moveTo(x + w / 2 - 14, y + h / 2 + 10);
    ctx.lineTo(x + w / 2 - 6, y + h / 2 + 16);
    ctx.lineTo(x + w / 2 + 2, y + h / 2 + 10);
    ctx.lineTo(x + w / 2 + 10, y + h / 2 + 16);
    ctx.lineTo(x + w / 2 + 14, y + h / 2 + 10);
    ctx.lineTo(x + w / 2 + 8, y + h / 2 + 20);
    ctx.lineTo(x + w / 2 - 8, y + h / 2 + 20);
    ctx.closePath();
    ctx.fill();
  } else if (kind === 'pin') {
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(obstacle.spin || 0);
    ctx.fillStyle = '#c98a4b';
    roundRect(ctx, -w / 2 + 8, -h / 2, w - 16, h, h / 2);
    ctx.fillStyle = '#8a5a30';
    circle(ctx, -w / 2 + 4, 0, 7);
    circle(ctx, w / 2 - 4, 0, 7);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(-w / 2 + 12, -h / 2 + 3, w - 24, 5);
    ctx.restore();
  } else if (kind === 'oven') {
    ctx.fillStyle = '#3f3a35';
    roundRect(ctx, x, y, w, h, 8);
    ctx.fillStyle = '#5a534c';
    roundRect(ctx, x + 8, y + 8, w - 16, 26, 5);
    ctx.fillStyle = '#ffd94a';
    for (let i = 0; i < 3; i += 1) circle(ctx, x + 24 + i * 26, y + 21, 5);
    ctx.fillStyle = '#ff7a2e';
    roundRect(ctx, x + 14, y + 44, w - 28, 58, 6);
    ctx.fillStyle = '#ffd94a';
    const flicker = Math.sin(time * 6 + x) * 4;
    ellipse(ctx, x + w / 2, y + 73, 26, 16 + flicker);
    ctx.fillStyle = '#3f3a35';
    ctx.fillRect(x + w / 2 - 30, y + 44, 8, 58);
    ctx.fillRect(x + w / 2 + 22, y + 44, 8, 58);
    ctx.strokeStyle = '#2e2a26';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 10, y + h - 4);
    ctx.lineTo(x + w - 10, y + h - 4);
    ctx.stroke();
    // A pie cooling on top — the reason to run.
    ctx.fillStyle = '#d9a441';
    ellipse(ctx, x + w / 2, y - 2, 26, 9);
    ctx.fillStyle = '#b8522e';
    ellipse(ctx, x + w / 2, y - 5, 20, 6);
  } else if (kind === 'knife') {
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate((obstacle.spin || 0) * 0.12);
    ctx.fillStyle = '#dfe6ea';
    ctx.beginPath();
    ctx.moveTo(-w / 2, -4);
    ctx.lineTo(w / 2 - 12, -9);
    ctx.lineTo(w / 2, 0);
    ctx.lineTo(w / 2 - 12, 9);
    ctx.lineTo(-w / 2, 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-w / 2 + 4, -5, w - 24, 3);
    ctx.fillStyle = '#3a2a1a';
    roundRect(ctx, -w / 2 - 16, -7, 18, 14, 4);
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(x - 4, y - 16, 3, 8);
  } else if (kind === 'mud') {
    ctx.fillStyle = '#6e4a26';
    ellipse(ctx, x + w / 2, y + h / 2 + 4, w / 2, 9);
    ctx.fillStyle = '#8a5f33';
    ellipse(ctx, x + w / 2 - 20, y + h / 2 + 3, 26, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ellipse(ctx, x + w / 2 - 30, y + h / 2, 16, 3);
  } else if (kind === 'haystack') {
    drawHaystack(ctx, x, y, w, h, time, obstacle.hiddenTurkey === true);
  }
  ctx.restore();
}

export function drawHaystack(ctx, x, y, w, h, time, hiddenTurkey) {
  ctx.fillStyle = '#e8c85a';
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.quadraticCurveTo(x + w / 2, y - 26, x + w, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#b57e2c';
  ctx.lineWidth = 2;
  for (let i = 0; i < 7; i += 1) {
    const t = (i + 1) / 8;
    const sx = x + w * t;
    ctx.beginPath();
    ctx.moveTo(sx, y + h * 0.85);
    ctx.quadraticCurveTo(sx + 4, y + h * 0.4, x + w / 2 + (sx - x - w / 2) * 0.4, y + 8);
    ctx.stroke();
  }
  if (hiddenTurkey) {
    // Two worried turkey eyes peeking out of the hay.
    ctx.fillStyle = '#ffffff';
    circle(ctx, x + w / 2 - 10, y + h * 0.45, 6);
    circle(ctx, x + w / 2 + 10, y + h * 0.45, 6);
    ctx.fillStyle = '#1c1410';
    circle(ctx, x + w / 2 - 9, y + h * 0.45, 3);
    circle(ctx, x + w / 2 + 11, y + h * 0.45, 3);
  }
}

export function drawPickup(ctx, pickup, time) {
  const bobY = Math.sin(pickup.bob) * 5;
  const x = pickup.x;
  const y = pickup.y + bobY;
  if (pickup.kind === 'corn') {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(time * 2 + pickup.bob) * 0.15);
    ctx.fillStyle = '#5d7a2e';
    ellipse(ctx, -12, 6, 7, 16, -0.5);
    ellipse(ctx, 12, 6, 7, 16, 0.5);
    ctx.fillStyle = '#ffd94a';
    ellipse(ctx, 0, 0, 11, 17);
    ctx.fillStyle = '#e8b93c';
    for (let row = -1; row <= 1; row += 1) {
      for (let col = -1; col <= 1; col += 1) {
        circle(ctx, col * 6, row * 9, 2.4);
      }
    }
    ctx.restore();
  } else {
    const glow = 0.5 + Math.sin(time * 4) * 0.2;
    ctx.fillStyle = `rgba(255, 242, 207, ${glow})`;
    circle(ctx, x, y, 24);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.6 + Math.sin(time * 2) * 0.1);
    ctx.fillStyle = '#e8b06a';
    ellipse(ctx, 0, 0, 6, 16);
    ctx.fillStyle = '#fff2cf';
    ellipse(ctx, 0, -4, 3, 10);
    ctx.restore();
  }
}

export function drawParticles(ctx, particles) {
  for (const particle of particles) {
    const alpha = Math.max(0, particle.life / particle.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    if (particle.kind === 'feather' || particle.kind === 'leaf') {
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rot);
      ellipse(ctx, 0, 0, particle.size, particle.size * 0.55);
    } else if (particle.kind === 'spark') {
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rot);
      ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
    } else {
      circle(ctx, particle.x, particle.y, particle.size * alpha + 1);
    }
    ctx.restore();
  }
}
