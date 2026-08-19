const TILE = 20;
const COLS = 21;
const ROWS = 23;

// 0=empty, 1=wall, 2=dot, 3=power pellet, 4=ghost house door
const MAZE_TEMPLATE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,1],
  [1,3,1,1,2,1,1,1,2,1,1,1,2,1,1,1,2,1,1,3,1],
  [1,2,2,1,2,2,2,2,2,2,2,2,2,2,2,2,2,1,2,2,1],
  [1,2,1,1,2,1,2,1,1,1,1,1,1,1,2,1,2,1,1,2,1],
  [1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1],
  [1,1,1,1,2,1,1,1,0,1,1,1,0,1,1,1,2,1,1,1,1],
  [0,0,0,1,2,1,0,0,0,0,0,0,0,0,0,1,2,1,0,0,0],
  [1,1,1,1,2,1,0,1,1,4,4,4,1,1,0,1,2,1,1,1,1],
  [0,0,0,0,2,0,0,1,0,0,0,0,0,1,0,0,2,0,0,0,0],
  [1,1,1,1,2,1,0,1,1,1,1,1,1,1,0,1,2,1,1,1,1],
  [0,0,0,1,2,1,0,0,0,0,0,0,0,0,0,1,2,1,0,0,0],
  [1,1,1,1,2,1,0,1,1,1,1,1,1,1,0,1,2,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,1,1,1,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,1,1,2,1,1,1,2,1,1,1,2,1,1,2,1],
  [1,3,2,1,2,2,2,2,2,2,2,2,2,2,2,2,2,1,2,3,1],
  [1,1,2,1,2,1,2,1,1,1,1,1,1,1,2,1,2,1,2,1,1],
  [1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1],
  [1,2,1,1,1,1,1,1,2,1,1,1,2,1,1,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,2,1,2,1,2,1,2,1,2,1,2,1,2,1,2,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

class Maze {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.maze = MAZE_TEMPLATE.map(row => [...row]);
    this.totalDots = 0;
    this.dotsEaten = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.maze[r][c] === 2 || this.maze[r][c] === 3) this.totalDots++;
      }
    }
    canvas.width = COLS * TILE;
    canvas.height = ROWS * TILE;
  }

  reset() {
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        this.maze[r][c] = MAZE_TEMPLATE[r][c];
    this.dotsEaten = 0;
  }

  isWall(r, c) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return true;
    return this.maze[r][c] === 1;
  }

  isDoor(r, c) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
    return this.maze[r][c] === 4;
  }

  canPass(r, c, allowDoor = false) {
    const cell = this.maze[r]?.[c];
    if (cell === undefined) return false;
    if (cell === 1) return false;
    if (cell === 4 && !allowDoor) return false;
    return true;
  }

  eatDot(r, c) {
    const cell = this.maze[r][c];
    if (cell === 2) {
      this.maze[r][c] = 0;
      this.dotsEaten++;
      return { type: 'dot', points: 10 };
    }
    if (cell === 3) {
      this.maze[r][c] = 0;
      this.dotsEaten++;
      return { type: 'power', points: 50 };
    }
    return null;
  }

  allDotsGone() {
    return this.dotsEaten >= this.totalDots;
  }

  draw() {
    const ctx = this.ctx;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = this.maze[r][c];
        const x = c * TILE, y = r * TILE;
        if (cell === 1) {
          ctx.fillStyle = '#2244aa';
          ctx.fillRect(x, y, TILE, TILE);
          ctx.strokeStyle = '#4466cc';
          ctx.strokeRect(x + 1, y + 1, TILE - 2, TILE - 2);
        } else if (cell === 2) {
          ctx.fillStyle = '#ffcc88';
          ctx.beginPath();
          ctx.arc(x + TILE/2, y + TILE/2, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (cell === 3) {
          ctx.fillStyle = '#ffcc88';
          ctx.beginPath();
          ctx.arc(x + TILE/2, y + TILE/2, 6, 0, Math.PI * 2);
          ctx.fill();
        } else if (cell === 4) {
          ctx.fillStyle = '#ff88cc';
          ctx.fillRect(x, y + TILE/2 - 2, TILE, 4);
        }
      }
    }
  }
}

const maze = new Maze(document.getElementById('game'));
