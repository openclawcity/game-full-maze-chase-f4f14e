// === Main entry point ===
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const TILE = 24;
const COLS = 19;
const ROWS = 21;
canvas.width = COLS * TILE;
canvas.height = ROWS * TILE;

document.body.prepend(canvas);

// 0=empty, 1=wall, 2=dot, 3=power pellet, 4=ghost house door
const MAP_TEMPLATE = [
  "1111111111111111111",
  "1222222221222222221",
  "1311121121211211131",
  "1211121121211211121",
  "1222222222222222221",
  "1211212111112121121",
  "1222122211222122221",
  "1112111144111121111",
  "0002111100011122000",
  "1112110100101121111",
  "0002000100010020000",
  "1112110111110121111",
  "0002110000000120000",
  "1112110111110121111",
  "1222222211222222221",
  "1211121121211211121",
  "1322122200022212231",
  "1112121111111212111",
  "1222222221222222221",
  "1111111111111111111",
];

let map, dotsRemaining, player, ghosts, score, lives, level, gameState;
const POWER_DURATION = 360; // 6 seconds at 60fps

function initLevel() {
  map = MAP_TEMPLATE.map(r => [...r].map(c => parseInt(c)));
  dotsRemaining = 0;
  for (let y=0;y<ROWS;y++) for (let x=0;x<COLS;x++) if(map[y][x]===2||map[y][x]===3) dotsRemaining++;
  player = { x:9, y:15, dir: 'left', nextDir: null };
  ghosts = [
    { x:9, y:8, color:'red', dir:'up', frightened:false, eaten:false, scatter:{x:17,y:0}, modeTimer:0 },
    { x:8, y:9, color:'pink', dir:'left', frightened:false, eaten:false, scatter:{x:1,y:0}, modeTimer:300 },
    { x:10, y:9, color:'cyan', dir:'right', frightened:false, eaten:false, scatter:{x:17,y:20}, modeTimer:600 },
    { x:9, y:10, color:'orange', dir:'down', frightened:false, eaten:false, scatter:{x:1,y:20}, modeTimer:900 },
  ];
  score = 0;
  lives = 3;
  level = 1;
  gameState = 'playing';
  gameLoop();
}

function isWall(x, y) {
  if (x<0||x>=COLS||y<0||y>=ROWS) return true;
  return map[y][x]===1;
}

function canMove(x, y, ghost, ghostDoor) {
  if (ghost && y===9 && x>=8 && x<=10 && map[9][5]===4) return true;
  if (!ghost && y===8 && x>=8 && x<=10 && map[y][x]===4) return false;
  if (isWall(x, y)) return false;
  return true;
}

function moveGhost(g) {
  const dirs = [{dx:-1,dy:0,d:'left'},{dx:1,dy:0,d:'right'},{dx:0,dy:-1,d:'up'},{dx:0,dy:1,d:'down'}];
  const opposites = {left:'right',right:'left',up:'down',down:'up'};
  
  if (g.eaten) {
    // Return to ghost house
    const target = {x:9, y:9};
    let best = null, bestDist = Infinity;
    for (const d of dirs) {
      if (d.d === opposites[g.dir]) continue;
      const nx = g.x+d.dx, ny = g.y+d.dy;
      if (!isWall(nx,ny)) {
        const dist = Math.abs(nx-target.x)+Math.abs(ny-target.y);
        if (dist < bestDist) { bestDist=dist; best=d.d; }
      }
    }
    if (best === opposites[g.dir] && dirs.length > 1) best = dirs[0].d;
    if (best) {
      const dd = dirs.find(d=>d.d===best);
      g.x += dd.dx; g.y += dd.dy; g.dir = dd.d;
    }
    if (g.x===9 && g.y===9) { g.eaten=false; g.frightened=false; }
    return;
  }

  if (g.frightened) {
    const valid = dirs.filter(d => d.d!==opposites[g.dir] && canMove(g.x+d.dx,g.y+d.dy,true));
    if (valid.length===0) return;
    const pick = valid[Math.floor(Math.random()*valid.length)];
    g.x+=pick.dx; g.y+=pick.dy; g.dir=pick.d;
    return;
  }

  // Chase player
  let target;
  switch(g.color) {
    case 'red': target={x:player.x,y:player.y}; break;
    case 'pink': target={x:player.x+(player.dir==='left'?-4:player.dir==='right'?4:0), y:player.y+(player.dir==='up'?-4:player.dir==='down'?4:0)}; break;
    case 'cyan': { const dist=ghostDist(g); if(dist<8){target={...g.scatter}} else {target={x:player.x+2,y:player.y}}; } break;
    default: target={x:player.x,y:player.y};
  }

  let best=null, bestDist=Infinity;
  for (const d of dirs) {
    if (d.d===opposites[g.dir]) continue;
    const nx=g.x+d.dx, ny=g.y+d.dy;
    if (canMove(nx,ny,true)) {
      const dist=Math.abs(nx-target.x)+Math.abs(ny-target.y);
      if(dist<bestDist){bestDist=dist;best=d.d}
    }
  }
  if(best===opposites[g.dir]&&dirs.length>1) best=dirs[0].d;
  if(best){
    const dd=dirs.find(d=>d.d===best);
    g.x+=dd.dx; g.y+=dd.dy; g.dir=dd.d;
  }
}

function ghostDist(g) {
  return Math.abs(g.x-player.x)+Math.abs(g.y-player.y);
}

function movePlayer() {
  if (player.nextDir) {
    const d = DIRS.find(d=>d.d===player.nextDir);
    if (d && canMove(player.x+d.dx, player.y+d.dy)) {
      player.dir = player.nextDir;
      player.nextDir = null;
    }
  }
  const d = DIRS.find(d=>d.d===player.dir);
  if (d) { player.x+=d.dx; player.y+=d.dy; }
}

const DIRS = [{dx:-1,dy:0,d:'left'},{dx:1,dy:0,d:'right'},{dx:0,dy:-1,d:'up'},{dx:0,dy:1,d:'down'}];

function eat() {
  if (map[player.y][player.x]===2) { map[player.y][player.x]=0; score+=10; dotsRemaining--; }
  else if (map[player.y][player.x]===3) { map[player.y][player.x]=0; score+=50; dotsRemaining--; player.frightenedTimer=POWER_DURATION; ghosts.forEach(g=>{if(!g.frightened&&!g.eaten){g.frightened=true;g.modeTimer=POWER_DURATION}}); }
}

function checkCollisions() {
  for (const g of ghosts) {
    if (g.x!==player.x||g.y!==player.y) continue;
    if (g.eaten) continue;
    if (g.frightened) { g.eaten=true; g.frightened=false; score+=200; }
    else { lives--; gameState='dying'; setTimeout(()=>{if(lives>0){initLevel()}else{gameState='gameover'}},1000);
      return;
    }
  }
  if (dotsRemaining<=0) { level++; initLevel(); }
}

let frame=0;
function gameLoop() {
  frame++;
  ctx.fillStyle='#000';
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // Draw map
  for (let y=0;y<ROWS;y++) for (let x=0;x<COLS;x++) {
    const tile=map[y][x], px=x*TILE, py=y*TILE;
    if(tile===1){ctx.fillStyle='#22f';ctx.fillRect(px,py,TILE,TILE);}
    else if(tile===4){ctx.fillStyle='#f88';ctx.fillRect(px,py,TILE,3);}
    else if(tile===2){ctx.fillStyle='#fc0';ctx.beginPath();ctx.arc(px+TILE/2,py+TILE/2,3,0,Math.PI*2);ctx.fill();}
    else if(tile===3){ctx.fillStyle='#fc0';ctx.beginPath();ctx.arc(px+TILE/2,py+TILE/2,7,0,Math.PI*2);ctx.fill();}
  }

  // Draw player
  ctx.fillStyle='#ff0';
  ctx.beginPath();
  const cx=player.x*TILE+TILE/2, cy=player.y*TILE+TILE/2, r=TILE/2-2;
  let startAngle=0.2*Math.PI, endAngle=1.8*Math.PI;
  if(player.dir==='right'){startAngle=-0.2*Math.PI;endAngle=0.2*Math.PI}
  else if(player.dir==='up'){startAngle=-1.2*Math.PI;endAngle=-0.8*Math.PI}
  else if(player.dir==='down'){startAngle=0.8*Math.PI;endAngle=1.2*Math.PI}
  ctx.arc(cx,cy,r,startAngle,endAngle);
  ctx.lineTo(cx,cy);
  ctx.fill();

  // Draw ghosts
  for (const g of ghosts) {
    ctx.fillStyle = g.eaten ? 'transparent' : (g.frightened ? '#22f' : (g.color==='pink'?'#f88':g.color==='cyan'?'#8ff':g.color==='orange'?'#f80':'#f22'));
    const gx=g.x*TILE, gy=g.y*TILE;
    ctx.beginPath();
    ctx.arc(gx+TILE/2,gy+TILE/3,TILE/2-2,Math.PI,0);
    ctx.lineTo(gx+TILE-2,gy+TILE-2);
    for(let i=3;i>0;i--){ctx.lineTo(gx+TILE/2*i,gy+TILE-(i%2?6:4));ctx.lineTo(gx+TILE/2*(i-1),gy+TILE-2);}
    ctx.fill();
    if(!g.eaten){ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(gx+TILE/3,gy+TILE/3,3,0,Math.PI*2);ctx.arc(gx+2*TILE/3,gy+TILE/3,3,0,Math.PI*2);ctx.fill();}
  }

  // HUD
  ctx.fillStyle='#fff';
  ctx.font='14px monospace';
  ctx.fillText('Score: '+score,10,16);
  ctx.fillText('Lives: '+'♥'.repeat(Math.max(0,lives)),canvas.width-100,16);
  ctx.fillText('Level:'+level,canvas.width/2-20,16);

  if(gameState==='gameover'){
    ctx.fillStyle='#f00';ctx.font='bold 32px monospace';
    ctx.fillText('GAME OVER',canvas.width/2-80,canvas.height/2);
  }

  if(frame%15===0&&gameState==='playing') movePlayer();
  if(frame%12===0&&gameState==='playing') for(const g of ghosts) moveGhost(g);
  if(gameState==='playing'){eat();checkCollisions();}

  if(gameState==='playing'||gameState==='dying') requestAnimationFrame(gameLoop);
}

// Input
document.addEventListener('keydown',e=>{
  const map2={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',a:'left',d:'right',w:'up',s:'down'};
  if(map2[e.key]) player.nextDir=map2[e.key];
  e.preventDefault();
});

initLevel();
