// Full Maze Chase Game
canvas = document.getElementById('game');
ctx = canvas.getContext('2d');

function resize() {
  const s = Math.min(window.innerWidth, window.innerHeight);
  canvas.width = s;
  canvas.height = s;
}
resize();
window.addEventListener('resize', resize);

const COLS = 15;
const ROWS = 15;
let cellSize;
let maze;
let player, ghosts, dots, powerPellets;
let score = 0; lives = 3; gameRunning = true; powerMode = false; powerTimer;
let keys = {}; let lastKey = '';

function setupGame() {
  resize();
  cellSize = Math.floor(canvas.width / COLS);
  maze = new Maze(COLS, ROWS);
  player = { col: 0, row: 0, x: 0, y: 0, speed: cellSize * 0.05 };
  ghosts = [
    { col: COLS-1, row: ROWS-1, x: (COLS-1)*cellSize, y: (ROWS-1)*cellSize, color: '#ff0000', dir: 'left' },
    { col: COLS-2, row: ROWS-1, x: (COLS-2)*cellSize, y: (ROWS-1)*cellSize, color: '#ffb8ff', dir: 'right' },
    { col: COLS-1, row: ROWS-2, x: (COLS-1)*cellSize, y: (ROWS-2)*cellSize, color: '#00ffff', dir: 'up' }
  ];
  dots = [];
  powerPellets = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!(c === 0 && r === 0)) {
        dots.push({ col: c, row: r });
      }
      if ((c + r) % 8 === 0 && !(c === 0 && r === 0)) {
        dots = dots.filter(d => !(d.col === c && d.row === r));
        powerPellets.push({ col: c, row: r });
      }
    }
  }
  gameRunning = true;
  score = 0; lives = 3;
  document.addEventListener('keydown', e => { keys[e.key] = true; lastKey = e.key; e.preventDefault(); });
  document.addEventListener('keyup', e => { keys[e.key] = false; });
  requestAnimationFrame(loop);
}

function getPlayerCell() {
  return maze.getCell(player.col, player.row);
}

function getGhostCell(ghost) {
  return maze.getCell(ghost.col, ghost.row);
}

function canPlayerMove(dir) {
  const cell = getPlayerCell();
  if (!cell) return false;
  if (dir === 'ArrowUp' && cell.walls.top) return false;
  if (dir === 'ArrowRight' && cell.walls.right) return false;
  if (dir === 'ArrowDown' && cell.walls.bottom) return false;
  if (dir === 'ArrowLeft' && cell.walls.left) return false;
  return true;
}

function movePlayer(dir) {
  const cell = getPlayerCell();
  if (!cell || !canPlayerMove(dir)) return;
  if (dir === 'ArrowUp') { player.row--; }
  else if (dir === 'ArrowRight') { player.col++; }
  else if (dir === 'ArrowDown') { player.row++; }
  else if (dir === 'ArrowLeft') { player.col--; }
}

function moveGhosts() {
  for (const ghost of ghosts) {
    const cell = getGhostCell(ghost);
    if (!cell) continue;
    const dirs = [];
    if (!cell.walls.top && !(ghost.dir === 'down')) dirs.push('up');
    if (!cell.walls.bottom && !(ghost.dir === 'up')) dirs.push('down');
    if (!cell.walls.left && !(ghost.dir === 'right')) dirs.push('left');
    if (!cell.walls.right && !(ghost.dir === 'left')) dirs.push('right');
    if (dirs.length === 0) {
      if (!cell.walls.top) dirs.push('up');
      if (!cell.walls.bottom) dirs.push('down');
      if (!cell.walls.left) dirs.push('left');
      if (!cell.walls.right) dirs.push('right');
    }
    const chosen = dirs[Math.floor(Math.random() * dirs.length)];
    ghost.dir = chosen;
    if (chosen === 'up') ghost.row--;
    else if (chosen === 'down') ghost.row++;
    else if (chosen === 'left') ghost.col--;
    else if (chosen === 'right') ghost.col++;
  }
}

function checkCollisions() {
  // Dots
  dots = dots.filter(d => {
    if (d.col === player.col && d.row === player.row) {
      score += 10;
      return false;
    }
    return true;
  });

  // Power pellets
  for (let i = powerPellets.length - 1; i >= 0; i--) {
    if (powerPellets[i].col === player.col && powerPellets[i].row === player.row) {
      score += 50;
      powerMode = true;
      clearTimeout(powerTimer);
      powerTimer = setTimeout(() => { powerMode = false; }, 8000);
      powerPellets.splice(i, 1);
    }
  }

  // Ghost collision
  for (const ghost of ghosts) {
    if (ghost.col === player.col && ghost.row === player.row) {
      if (powerMode) {
        score += 200;
        ghost.col = COLS - 1;
        ghost.row = ROWS - 1;
      } else {
        lives--;
        if (lives <= 0) {
          gameRunning = false;
        } else {
          player.col = 0; player.row = 0;
          ghost.col = COLS - 1; ghost.row = ROWS - 1;
        }
      }
    }
  }
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw maze
  maze.draw(ctx, cellSize);

  // Draw dots
  ctx.fillStyle = '#ffffff';
  for (const d of dots) {
    const cx = d.col * cellSize + cellSize / 2;
    const cy = d.row * cellSize + cellSize / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw power pellets
  for (const p of powerPellets) {
    const cx = p.col * cellSize + cellSize / 2;
    const cy = p.row * cellSize + cellSize / 2;
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw player
  const px = player.col * cellSize + cellSize / 2;
  const py = player.row * cellSize + cellSize / 2;
  ctx.fillStyle = powerMode ? '#00ffff' : '#ffff00';
  ctx.beginPath();
  ctx.arc(px, py, cellSize * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Draw ghosts
  for (const g of ghosts) {
    const gx = g.col * cellSize + cellSize / 2;
    const gy = g.row * cellSize + cellSize / 2;
    ctx.fillStyle = powerMode ? '#0000ff' : g.color;
    ctx.beginPath();
    ctx.arc(gx, gy, cellSize * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  // UI
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px monospace';
  ctx.fillText('Score: ' + score, 5, 20);
  ctx.fillText('Lives: ' + lives, 5, 40);
}

function loop() {
  if (!gameRunning) {
    ctx.fillStyle = '#ffffff';
    ctx.font = '30px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 40);
    return;
  }

  if (keys['ArrowUp'] || keys['w']) movePlayer('ArrowUp');
  else if (keys['ArrowRight'] || keys['d']) movePlayer('ArrowRight');
  else if (keys['ArrowDown'] || keys['s']) movePlayer('ArrowDown');
  else if (keys['ArrowLeft'] || keys['a']) movePlayer('ArrowLeft');

  moveGhosts();
  checkCollisions();
  draw();

  if (dots.length === 0 && powerPellets.length === 0) {
    ctx.fillStyle = '#ffffff';
    ctx.font = '30px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('YOU WIN!', canvas.width / 2, canvas.height / 2);
    gameRunning = false;
  }

  requestAnimationFrame(loop);
}

setupGame();