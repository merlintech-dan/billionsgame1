const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const eatSound = document.getElementById('eatSound');
const startBtn = document.getElementById('startBtn');
const playerNameInput = document.getElementById('playerName');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const leaderboardList = document.getElementById('leaderboardList');

const headerSection = document.querySelector('header');
const setupSection = document.querySelector('#setup');

const gridSize = 20;
let snake, food, score, level, direction, nextDirection, speed, loop, playerName;
let tryAgainBtn = null;
let gameOver = false;

// 🖼️ Custom images
const headImg = new Image();
headImg.src = 'bilion.jpeg';

const fruitImg = new Image();
fruitImg.src = 'Screenshot_2-11-2025_13225_www.bing.com.jpeg';

// 🍎 Fruit pop animation
let fruitPop = 1;
let fruitPopFrame = 0;
let fruitAnimating = false;

// 🟢 Initialize / Reset Game
function resetGame() {
  snake = [{ x: 10, y: 10 }];
  spawnFruit();
  direction = 'right';
  nextDirection = 'right';
  score = 0;
  level = 1;
  speed = 150;
  scoreEl.textContent = score;
  levelEl.textContent = level;
  gameOver = false;

  if (tryAgainBtn) {
    tryAgainBtn.remove();
    tryAgainBtn = null;
  }
}

// 🟢 Draw functions
function drawRect(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * gridSize, y * gridSize, gridSize - 1, gridSize - 1);
}

function draw() {
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw walls
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, gridSize);
  ctx.fillRect(0, canvas.height - gridSize, canvas.width, gridSize);
  ctx.fillRect(0, 0, gridSize, canvas.height);
  ctx.fillRect(canvas.width - gridSize, 0, gridSize, canvas.height);

  // Draw snake
  snake.forEach((seg, i) => {
    if (i === 0) {
      ctx.save();
      ctx.translate(seg.x * gridSize + gridSize / 2, seg.y * gridSize + gridSize / 2);
      let angle = 0;
      if (direction === 'up') angle = -Math.PI / 2;
      if (direction === 'down') angle = Math.PI / 2;
      if (direction === 'left') angle = Math.PI;
      ctx.rotate(angle);
      ctx.drawImage(headImg, -gridSize / 2, -gridSize / 2, gridSize, gridSize);
      ctx.restore();
    } else {
      drawRect(seg.x, seg.y, '#007BFF'); // blue body
    }
  });

  // Draw fruit with pop animation
  if (fruitAnimating) {
    fruitPopFrame++;
    fruitPop = 1 + Math.sin(fruitPopFrame * 0.3) * 0.3;
    if (fruitPopFrame > 10) {
      fruitAnimating = false;
      fruitPop = 1;
    }
  }

  ctx.save();
  ctx.translate(food.x * gridSize + gridSize / 2, food.y * gridSize + gridSize / 2);
  ctx.scale(fruitPop, fruitPop);
  ctx.drawImage(fruitImg, -gridSize / 2, -gridSize / 2, gridSize, gridSize);
  ctx.restore();
}

// 🟢 Main update loop
function update() {
  if (gameOver) return;

  direction = nextDirection;
  const head = { ...snake[0] };

  if (direction === 'up') head.y--;
  if (direction === 'down') head.y++;
  if (direction === 'left') head.x--;
  if (direction === 'right') head.x++;

  // Check wall collision
  if (
    head.x <= 0 ||
    head.y <= 0 ||
    head.x >= canvas.width / gridSize - 1 ||
    head.y >= canvas.height / gridSize - 1
  ) {
    endGame();
    return;
  }

  // Check self collision
  if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
    endGame();
    return;
  }

  snake.unshift(head);

  // Check fruit
  if (head.x === food.x && head.y === food.y) {
    eatSound.play();
    score++;
    scoreEl.textContent = score;

    // Level up every 10 points
    if (score % 10 === 0) {
      level++;
      levelEl.textContent = level;
      // 🏎️ Increase speed by 10% per level (minimum 40ms)
      speed = Math.max(40, speed * 0.9);
    }

    spawnFruit();
  } else {
    snake.pop();
  }

  draw();
}

// 🟢 Game loop
function gameLoop() {
  if (!gameOver) {
    update();
    loop = setTimeout(gameLoop, speed);
  }
}

// 🟢 Spawn fruit
function spawnFruit() {
  let valid = false;
  const cols = canvas.width / gridSize;
  const rows = canvas.height / gridSize;
  while (!valid) {
    food = {
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows)
    };
    if (
      food.x > 0 &&
      food.x < cols - 1 &&
      food.y > 0 &&
      food.y < rows - 1 &&
      !snake.some(seg => seg.x === food.x && seg.y === food.y)
    ) {
      valid = true;
    }
  }
  fruitAnimating = true;
  fruitPopFrame = 0;
  fruitPop = 1.3;
}

// 🟢 End game
function endGame() {
  clearTimeout(loop);
  gameOver = true;
  saveScore(playerName, score);
  updateLeaderboard();

  if (tryAgainBtn) return;

  tryAgainBtn = document.createElement('button');
  tryAgainBtn.textContent = '🔁 Try Again';
  Object.assign(tryAgainBtn.style, {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#007BFF',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    fontSize: '1.1rem',
    borderRadius: '10px',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
    zIndex: '1000'
  });
  tryAgainBtn.onclick = () => {
    resetGame();
    draw();
    clearTimeout(loop);
    gameLoop();
  };

  document.body.appendChild(tryAgainBtn);
}

// 🟢 Leaderboard (local for now)
function saveScore(name, score) {
  const leaderboard = JSON.parse(localStorage.getItem('snakeLeaderboard') || '[]');
  leaderboard.push({ name, score });
  leaderboard.sort((a, b) => b.score - a.score);
  localStorage.setItem('snakeLeaderboard', JSON.stringify(leaderboard.slice(0, 10)));
}

function updateLeaderboard() {
  leaderboardList.innerHTML = '';
  const leaderboard = JSON.parse(localStorage.getItem('snakeLeaderboard') || '[]');
  leaderboard.forEach(entry => {
    const li = document.createElement('li');
    li.textContent = `${entry.name} - ${entry.score}`;
    leaderboardList.appendChild(li);
  });
}

// 🟢 Controls
document.addEventListener('keydown', e => {
  if (gameOver) return;
  const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
  if (map[e.key] && !isOpposite(map[e.key], direction)) nextDirection = map[e.key];
});

function isOpposite(dir1, dir2) {
  return (
    (dir1 === 'up' && dir2 === 'down') ||
    (dir1 === 'down' && dir2 === 'up') ||
    (dir1 === 'left' && dir2 === 'right') ||
    (dir1 === 'right' && dir2 === 'left')
  );
}

// 🟢 Swipe controls
let touchStartX = 0, touchStartY = 0, touchEndX = 0, touchEndY = 0;

canvas.addEventListener('touchstart', e => {
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
});
canvas.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
canvas.addEventListener('touchend', e => {
  if (gameOver) return;
  const touch = e.changedTouches[0];
  touchEndX = touch.clientX;
  touchEndY = touch.clientY;
  handleSwipe();
});

function handleSwipe() {
  const diffX = touchEndX - touchStartX;
  const diffY = touchEndY - touchStartY;
  if (Math.abs(diffX) > Math.abs(diffY)) {
    if (diffX > 30 && !isOpposite('right', direction)) nextDirection = 'right';
    else if (diffX < -30 && !isOpposite('left', direction)) nextDirection = 'left';
  } else {
    if (diffY > 30 && !isOpposite('down', direction)) nextDirection = 'down';
    else if (diffY < -30 && !isOpposite('up', direction)) nextDirection = 'up';
  }
}

// 🟢 Player name + start game
window.addEventListener('load', () => {
  const savedName = localStorage.getItem('snakePlayerName');
  if (savedName) {
    playerName = savedName;
    playerNameInput.value = savedName;
    playerNameInput.style.display = 'none';
  }
  updateLeaderboard();
});

startBtn.addEventListener('click', () => {
  if (gameOver) return;
  if (!playerName) {
    const inputName = playerNameInput.value.trim();
    if (!inputName) {
      alert('Please enter your name before starting!');
      return;
    }
    playerName = inputName;
    localStorage.setItem('snakePlayerName', playerName);
    playerNameInput.style.display = 'none';
  }

  // Hide header and setup
  if (headerSection) headerSection.style.display = 'none';
  if (setupSection) setupSection.style.display = 'none';

  resetGame();
  draw();
  clearTimeout(loop);
  gameLoop();
});
