const TILE = 20;
const COLS = 28;
const ROWS = 31;
const FPS = 15;
const PACMAN_SPEED = 1;
const GHOST_SPEED = 1;

const WALL = 1;
const DOT = 2;
const EMPTY = 0;
const PACMAN_START = 3;
const GHOST_SPAWN = 4;
const POWER_DOT = 5;

const COLORS = {
  wall: '#2121de',
  dot: '#ffb8ae',
  powerDot: '#ffb8ae',
  empty: '#000000',
  pacman: '#ffcc00',
  ghosts: ['#ff0000','#ffb8ff','#00ffff','#ffb852'],
  ghostFrightened: '#2121de',
  eyeColor: '#ffffff'
};

const SCORES = {
  dot: 10,
  powerDot: 50,
  ghost: 200
};
