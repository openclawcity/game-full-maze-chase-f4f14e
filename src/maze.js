// Maze generation using recursive backtracker
class Maze {
  constructor(cols, rows) {
    this.cols = cols;
    this.rows = rows;
    this.cellSize = 0;
    this.grid = [];
    this.stack = [];
    this.generate();
  }

  generate() {
    const totalCells = this.cols * this.rows;
    this.grid = [];
    for (let i = 0; i < totalCells; i++) {
      this.grid.push({
        row: Math.floor(i / this.cols),
        col: i % this.cols,
        walls: { top: true, right: true, bottom: true, left: true },
        visited: false
      });
    }

    let current = this.grid[0];
    current.visited = true;
    this.stack.push(current);

    while (this.stack.length > 0) {
      const neighbors = this.getUnvisitedNeighbors(current);
      if (neighbors.length > 0) {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        this.removeWalls(current, next);
        next.visited = true;
        this.stack.push(current);
        current = next;
      } else {
        current = this.stack.pop();
      }
    }
  }

  getUnvisitedNeighbors(cell) {
    const neighbors = [];
    const { row, col } = cell;
    if (row > 0 && !this.getCell(col, row - 1).visited) neighbors.push(this.getCell(col, row - 1));
    if (col < this.cols - 1 && !this.getCell(col + 1, row).visited) neighbors.push(this.getCell(col + 1, row));
    if (row < this.rows - 1 && !this.getCell(col, row + 1).visited) neighbors.push(this.getCell(col, row + 1));
    if (col > 0 && !this.getCell(col - 1, row).visited) neighbors.push(this.getCell(col - 1, row));
    return neighbors;
  }

  getCell(x, y) {
    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return null;
    return this.grid[y * this.cols + x];
  }

  removeWalls(a, b) {
    const dx = a.col - b.col;
    const dy = a.row - b.row;
    if (dx === 1) { a.walls.left = false; b.walls.right = false; }
    else if (dx === -1) { a.walls.right = false; b.walls.left = false; }
    if (dy === 1) { a.walls.top = false; b.walls.bottom = false; }
    else if (dy === -1) { a.walls.bottom = false; b.walls.top = false; }
  }

  draw(ctx, cellSize) {
    this.cellSize = cellSize;
    ctx.strokeStyle = '#0000ff';
    ctx.lineWidth = 2;
    for (const cell of this.grid) {
      const x = cell.col * cellSize;
      const y = cell.row * cellSize;
      if (cell.walls.top) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + cellSize, y); ctx.stroke(); }
      if (cell.walls.right) { ctx.beginPath(); ctx.moveTo(x + cellSize, y); ctx.lineTo(x + cellSize, y + cellSize); ctx.stroke(); }
      if (cell.walls.bottom) { ctx.beginPath(); ctx.moveTo(x, y + cellSize); ctx.lineTo(x + cellSize, y + cellSize); ctx.stroke(); }
      if (cell.walls.left) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + cellSize); ctx.stroke(); }
    }
  }

  canMove(cell, direction) {
    return !cell.walls[direction];
  }

  getCellAt(x, y) {
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);
    return this.getCell(col, row);
  }
}
