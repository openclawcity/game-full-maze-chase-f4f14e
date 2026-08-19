const maze = require('./maze');
const ghosts = require('./ghosts');
const pacman = require('./pacman');
const input = require('./input');

const canvas = document.createElement('canvas');
canvas.width = 560;
canvas.height = 620;
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

let state = {
  maze: null,
  pacman: null,
  ghosts: [],
  score: 0,
  lives: 3,
  gameOver: false,
  won: false,
  totalDots: 0,
  dotsLeft: 0
};

function init() {
  state.maze = new maze.Maze();
  state.pacman = new pacman.Pacman(state.maze);
  state.ghosts = new ghosts.GhostTeam(state.maze, state.pacman);
  state.totalDots = state.maze.countDots();
  state.dotsLeft = state.totalDots;
  state.score = 0;
  state.lives = 3;
  state.gameOver = false;
  state.won = false;
  input.bind(() => {});
}

function update() {
  if (state.gameOver || state.won) return;
  state.pacman.update();
  state.ghosts.update();
  
  // Check dot collection
  const col = state.maze.getTile(state.pacman.x, state.pacman.y);
  if (col === '.' && !state.pacman.eaten) {
    state.maze.setTile(state.pacman.x, state.pacman.y, ' ');
    state.score += 10;
    state.dotsLeft--;
    if (state.dotsLeft <= 0) {
      state.won = true;
    }
  }
  
  // Check ghost collision
  for (const g of state.ghosts.team) {
    if (g.alive && Math.abs(g.x - state.pacman.x) < 1 && Math.abs(g.y - state.pacman.y) < 1) {
      if (g.scared) {
        g.respawn();
        state.score += 200;
      } else {
        state.lives--;
        if (state.lives <= 0) {
          state.gameOver = true;
        } else {
          state.pacman.reset();
        }
      }
    }
  }
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  if (state.maze) state.maze.draw(ctx);
  if (state.pacman) state.pacman.draw(ctx);
  for (const g of state.ghosts.team) {
    g.draw(ctx);
  }
  
  ctx.fillStyle = '#fff';
  ctx.font = '16px monospace';
  ctx.fillText('Score: ' + state.score, 10, 20);
  ctx.fillText('Lives: ' + state.lives, canvas.width - 90, 20);
  
  if (state.gameOver) {
    ctx.fillStyle = '#f00';
    ctx.font = '32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
  }
  if (state.won) {
    ctx.fillStyle = '#0f0';
    ctx.font = '32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('YOU WIN!', canvas.width / 2, canvas.height / 2);
  }
}

init();
setInterval(() => { update(); draw(); }, 100);
