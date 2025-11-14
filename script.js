// ===== Element selection =====
const board = document.querySelector(".board");
const startButton = document.querySelector(".btn-start");
const modal = document.querySelector(".modal");
const startGameModal = document.querySelector(".start-game");
const gameOverModal = document.querySelector(".game-over");
const restartButton = document.querySelector(".btn-restart");
const highScoreElement = document.querySelector("#high-score");
const scoreElement = document.querySelector("#score");
const timeElement = document.querySelector("#time");

// ===== Grid config =====
const blockHeight = 30;
const blockWidth = 30;

// ===== Game state init =====
let highScore = Number(localStorage.getItem("highScore")) || 0;
let score = 0;
let time = "00:00"; // use colon format

highScoreElement.innerText = highScore;

const cols = Math.floor(board.clientWidth / blockWidth);
const rows = Math.floor(board.clientHeight / blockHeight);
let intervalId = null;      // game loop interval
let timerIntervalId = null; // timer interval

const blocks = []; // cell refs
let snake = [{ x: 2, y: 8 }];
let direction = "left";
let nextDirection = direction; // to prevent immediate reverse in same tick

// ===== Create board cells =====
for (let row = 0; row < rows; row++) {
  for (let col = 0; col < cols; col++) {
    const block = document.createElement("div");
    block.classList.add("block");
    board.appendChild(block);
    blocks[`${row}-${col}`] = block;
  }
}

// ===== Helpers =====
function spawnFoodNotOnSnake() {
  let fx, fy, collides;
  do {
    fx = Math.floor(Math.random() * rows);
    fy = Math.floor(Math.random() * cols);
    collides = snake.some(seg => seg.x === fx && seg.y === fy);
  } while (collides);
  return { x: fx, y: fy };
}

// ensure initial food
let food = spawnFoodNotOnSnake();

// End game cleanly
function endGame() {
  clearAllIntervals();
  modal.style.display = "flex";
  startGameModal.style.display = "none";
  gameOverModal.style.display = "flex";
}

// Clear both intervals safely
function clearAllIntervals() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  if (timerIntervalId !== null) {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
}

// update timer display (MM:SS)
function startTimer() {
  time = "00:00";
  timeElement.innerText = time;
  timerIntervalId = setInterval(() => {
    let [min, sec] = time.split(":").map(Number);
    sec += 1;
    if (sec === 60) {
      min += 1;
      sec = 0;
    }
    time = `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    timeElement.innerText = time;
  }, 1000);
}

// ===== Render / game tick =====
function render() {
  // allow direction change once per tick
  direction = nextDirection;

  // ensure food visible
  blocks[`${food.x}-${food.y}`].classList.add("food");

  const head = { x: snake[0].x, y: snake[0].y };

  if (direction === "left") head.y -= 1;
  else if (direction === "right") head.y += 1;
  else if (direction === "up") head.x -= 1;
  else if (direction === "down") head.x += 1;

  // wall collision
  if (head.x < 0 || head.x >= rows || head.y < 0 || head.y >= cols) {
    endGame();
    return;
  }

  // self collision
  if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
    endGame();
    return;
  }

  const ateFood = head.x === food.x && head.y === food.y;

  if (ateFood) {
    // remove old food visual
    blocks[`${food.x}-${food.y}`].classList.remove("food");
    // grow snake by adding head (do not pop tail)
    snake.unshift(head);
    // spawn new food (not on snake)
    food = spawnFoodNotOnSnake();
    blocks[`${food.x}-${food.y}`].classList.add("food");

    // update score
    score += 10;
    scoreElement.innerText = score;

    // update high score
    if (score > highScore) {
      highScore = score;
      localStorage.setItem("highScore", highScore.toString()); // call toString()
      highScoreElement.innerText = highScore;
    }
  } else {
    // normal move: remove tail visual, pop tail, add head
    const tail = snake.pop();
    blocks[`${tail.x}-${tail.y}`].classList.remove("fill");
    snake.unshift(head);
  }

  // render snake segments
  snake.forEach(seg => {
    blocks[`${seg.x}-${seg.y}`].classList.add("fill");
  });
}

// ===== Start the game safely =====
function startGame() {
  clearAllIntervals(); // prevent duplicates

  // reset state
  score = 0;
  scoreElement.innerText = score;
  snake = [{ x: 2, y: 8 }];
  direction = "left";
  nextDirection = direction;
  food = spawnFoodNotOnSnake();

  // clear board visuals
  Object.keys(blocks).forEach(k => blocks[k].classList.remove("fill", "food"));

  // show initial visuals
  blocks[`${food.x}-${food.y}`].classList.add("food");
  snake.forEach(s => blocks[`${s.x}-${s.y}`].classList.add("fill"));

  modal.style.display = "none";
  startGameModal.style.display = "none";
  gameOverModal.style.display = "none";

  // start loops
  intervalId = setInterval(render, 300);
  startTimer();
}

// ===== Restart =====
function restartGame() {
  clearAllIntervals();

  // reset visuals & state like start
  Object.keys(blocks).forEach(k => blocks[k].classList.remove("fill", "food"));

  score = 0;
  scoreElement.innerText = score;
  snake = [{ x: 2, y: 8 }];
  direction = "left";
  nextDirection = direction;
  food = spawnFoodNotOnSnake();

  blocks[`${food.x}-${food.y}`].classList.add("food");
  snake.forEach(s => blocks[`${s.x}-${s.y}`].classList.add("fill"));

  modal.style.display = "none";
  startGameModal.style.display = "none";
  gameOverModal.style.display = "none";

  intervalId = setInterval(render, 300);
  startTimer();
}

// ===== Event listeners =====
startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", restartGame);

// keyboard controls with immediate-reverse prevention
addEventListener("keydown", (event) => {
  const key = event.key;
  if (key === "ArrowUp" && direction !== "down") nextDirection = "up";
  else if (key === "ArrowDown" && direction !== "up") nextDirection = "down";
  else if (key === "ArrowLeft" && direction !== "right") nextDirection = "left";
  else if (key === "ArrowRight" && direction !== "left") nextDirection = "right";
});
