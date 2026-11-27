// Gobble Dash — the great turkey escape: tuning, stages and shared constants.
// One file, one job: every number the world, the art and the screenshots agree on.
export const VIEW_W = 1280;
export const VIEW_H = 720;
export const GROUND_Y = 600;
export const STEP = 1 / 60;

export const GRAVITY = 2600;
export const JUMP_VELOCITY = 1020;
export const JUMP_CUT = 0.45;
export const COYOTE_TIME = 0.09;
export const JUMP_BUFFER = 0.12;

export const PLAYER_X = 280;
export const PLAYER_W = 62;
export const PLAYER_H = 66;
export const PLAYER_SLIDE_H = 34;

export const START_SPEED = 400;
export const MAX_SPEED = 660;
export const SPEED_PER_METER = 0.22;
export const PIXELS_PER_METER = 25;
export const ESCAPE_DISTANCE = 1200;

export const START_LIVES = 3;
export const FARMER_START_GAP = 130;
export const FARMER_MAX_GAP = 170;
export const FARMER_CATCH_GAP = 8;
export const FARMER_RECOVER_PER_SECOND = 3.5;
export const HIT_GAP_COST = 52;
export const HIDE_GAP_BONUS = 70;
export const MUD_GAP_DRAIN = 26;

export const CORN_POINTS = 50;
export const FEATHER_POINTS = 150;
export const COMBO_WINDOW = 3;
export const COMBO_MAX = 5;

export const BEST_KEY = 'gobble-dash-best-v1';

// The run crosses three places on the way out: the farmyard at dawn, the
// cornfield at noon, then the farmhouse kitchen — and the forest gate after it.
export const STAGES = [
  {
    id: 'farmyard',
    name: 'Farmyard',
    from: 0,
    skyTop: '#ffd98a',
    skyBottom: '#ff9e57',
    sun: '#fff3c4',
    hillFar: '#c98a4b',
    hillNear: '#a8652f',
    ground: '#b97a35',
    grass: '#7fae4e',
    tagline: 'Dawn in the farmyard — run!',
  },
  {
    id: 'cornfield',
    name: 'Cornfield',
    from: 400,
    skyTop: '#ffe9a8',
    skyBottom: '#ffb347',
    sun: '#fff8d6',
    hillFar: '#d9a441',
    hillNear: '#b57e2c',
    ground: '#c98f3a',
    grass: '#e0b13c',
    tagline: 'Through the corn — keep low, keep moving!',
  },
  {
    id: 'kitchen',
    name: 'Farmhouse Kitchen',
    from: 800,
    skyTop: '#f7b267',
    skyBottom: '#e07a4e',
    sun: '#ffe9b0',
    hillFar: '#8a5a3b',
    hillNear: '#6e452c',
    ground: '#9c6b43',
    grass: '#c98f4e',
    tagline: 'The kitchen! Dodge the oven and the knives!',
  },
];

export const STAGE_NAMES = STAGES.map((stage) => stage.name);
