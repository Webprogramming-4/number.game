// ===== 전역 변수 및 초기화 =====
let currentGame = null;

// ===== 게임 전환 함수 =====
function showGame(gameType) {
  document.querySelector('.game-selector').style.display = 'none';
  document.querySelector('header').style.display = 'none';
  
  document.querySelectorAll('.game-container').forEach(el => {
    el.classList.add('hidden');
  });
  
  if (gameType === '지연') {
    document.getElementById('lee-game').classList.remove('hidden');
    initLeeGame();
  } else if (gameType === '지우') {
    document.getElementById('yang-game').classList.remove('hidden');
    initYangGame();
  } else if (gameType === '예은') {
    document.getElementById('number-game').classList.remove('hidden');
    initNumberGame();
  }
}

function backToMenu() {
  document.querySelectorAll('.game-container').forEach(el => {
    el.classList.add('hidden');
  });
  document.querySelector('.game-selector').style.display = 'grid';
  document.querySelector('header').style.display = 'block';
  
  // 게임 정리
  if (currentGame === 'yang' && yangGame) {
    yangGame.isPlaying = false;
    if (yangGame.animationId) cancelAnimationFrame(yangGame.animationId);
  }
  if (currentGame === 'number' && numberTimerInterval) {
    clearInterval(numberTimerInterval);
  }
  if (currentGame === 'lee' && leeTimer) {
    clearInterval(leeTimer);
  }
}

// ===== 이지연 게임 (순서 기억력) =====
const LEE_COLORS = [
  '#ff595e','#ffca3a','#8ac926','#1982c4','#6a4c93','#f72585','#b5179e','#7209b7',
  '#4361ee','#4cc9f0','#43aa8b','#f9c74f','#f9844a','#f3722c','#577590','#277da1',
  '#e63946','#a8dadc','#457b9d','#1d3557','#ffb4a2','#b5ead7','#cdb4db','#ffc8dd',
  '#b7e4c7','#a2d2ff','#f7b801','#f18701','#f35b04','#9d4edd','#5f0a87','#4361ee',
  '#b9fbc0','#f9c74f','#f9844a','#f3722c','#43aa8b','#577590','#277da1','#e07a5f'
];
const LEE_CELLS = 40;
let leeShowCount = 4;
let leeAnswerIdxs = new Set();
let leeCellColors = [];
let leeFound = new Set();
let leeRound = 1;
let leeScore = 0;
let leePrevScore = 0;
let leeBestRound = 1;
let leeLock = false;
let leeHardMode = false;
let leeTimer = null;
let leeTimeLeft = 0;

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function initLeeGame() {
  currentGame = 'lee';
  leeRound = 1;
  leeScore = 0;
  leePrevScore = 0;
  leeHardMode = false;
  
  const boardEl = document.getElementById('lee-board');
  const restartBtn = document.getElementById('lee-restart');
  const hardModeBtn = document.getElementById('lee-hardModeBtn');
  
  // 클릭 이벤트 등록
  boardEl.onclick = (e) => {
    if (leeLock) return;
    const cell = e.target.closest('.cell');
    if (!cell || cell.classList.contains('correct') || cell.classList.contains('wrong')) return;
    
    const idx = parseInt(cell.dataset.idx, 10);
    if (leeAnswerIdxs.has(idx)) {
      if (leeFound.has(idx)) return;
      cell.classList.remove('hidden');
      cell.classList.add('correct');
      cell.style.background = '#222';
      leeFound.add(idx);
      
      if (leeFound.size === leeAnswerIdxs.size) {
        leeScore++;
        if (leeRound + 1 > leeBestRound) leeBestRound = leeRound + 1;
        document.getElementById('lee-message').textContent = '정답! 다음 라운드!';
        leeLock = true;
        if (leeHardMode) clearInterval(leeTimer);
        setTimeout(() => {
          leeRound++;
          startLeeRound();
        }, 1000);
      }
    } else {
      cell.classList.add('wrong');
      cell.style.background = '#ffd6d6';
      if (leeHardMode) {
        clearInterval(leeTimer);
        document.getElementById('lee-message').textContent = '오답! 게임오버(하드모드)';
        leeLock = true;
        setTimeout(() => {
          leePrevScore = leeScore;
          leeRound = 1;
          leeScore = 0;
          leeHardMode = false;
          document.getElementById('lee-timer').style.display = 'none';
          startLeeRound();
        }, 1500);
      } else {
        document.getElementById('lee-message').textContent = '오답! 1단계로 돌아갑니다.';
        leeLock = true;
        setTimeout(() => {
          boardEl.querySelectorAll('.cell').forEach((c, i) => {
            if (leeAnswerIdxs.has(i)) {
              c.classList.remove('hidden', 'wrong');
              c.classList.add('correct');
              c.style.background = '#222';
            } else {
              c.classList.add('hidden');
              c.classList.remove('correct', 'wrong');
              c.style.background = '#e0e7ef';
            }
          });
          setTimeout(() => {
            leePrevScore = leeScore;
            leeRound = 1;
            leeScore = 0;
            startLeeRound();
          }, 1000);
        }, 900);
      }
    }
  };
  
  restartBtn.onclick = () => {
    leePrevScore = leeScore;
    leeHardMode = false;
    document.getElementById('lee-timer').style.display = 'none';
    leeRound = 1;
    leeScore = 0;
    startLeeRound();
  };
  
  hardModeBtn.onclick = () => {
    leePrevScore = leeScore;
    leeHardMode = true;
    leeRound = 1;
    leeScore = 0;
    startLeeRound();
  };
  
  startLeeRound();
}

function startLeeRound() {
  let showTime = 800;
  if (leeHardMode) {
    leeShowCount = Math.min(10 + Math.floor((leeRound - 1) / 1.5), LEE_CELLS - 1);
    showTime = 400;
    leeTimeLeft = Math.max(3, 10 - Math.floor(leeRound / 2));
    document.getElementById('lee-timer').style.display = 'inline';
    document.getElementById('lee-timer').textContent = `⏱️ ${leeTimeLeft}s`;
  } else {
    leeShowCount = Math.min(4 + Math.floor((leeRound - 1) / 2), LEE_CELLS - 2);
    document.getElementById('lee-timer').style.display = 'none';
  }
  
  leeCellColors = shuffle(LEE_COLORS.slice()).slice(0, LEE_CELLS);
  leeAnswerIdxs = new Set(shuffle([...Array(LEE_CELLS).keys()]).slice(0, leeShowCount));
  leeFound = new Set();
  leeLock = true;
  
  const boardEl = document.getElementById('lee-board');
  boardEl.innerHTML = '';
  boardEl.style.gridTemplateColumns = 'repeat(10, 1fr)';
  
  for (let i = 0; i < LEE_CELLS; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.idx = i;
    cell.dataset.color = leeCellColors[i];
    if (leeAnswerIdxs.has(i)) {
      cell.style.background = '#222';
    } else {
      cell.style.background = '#eee';
    }
    boardEl.appendChild(cell);
  }
  
  setTimeout(() => {
    boardEl.querySelectorAll('.cell').forEach(cell => {
      cell.classList.add('hidden');
      cell.style.background = '#e0e7ef';
    });
    leeLock = false;
    if (leeHardMode) startLeeTimer();
  }, showTime);
  
  document.getElementById('lee-message').textContent = '';
  document.getElementById('lee-round').textContent = leeRound;
  document.getElementById('lee-score').textContent = leeScore;
  document.getElementById('lee-prevScore').textContent = leePrevScore;
  document.getElementById('lee-bestRound').textContent = leeBestRound;
}

function startLeeTimer() {
  clearInterval(leeTimer);
  document.getElementById('lee-timer').textContent = `⏱️ ${leeTimeLeft}s`;
  leeTimer = setInterval(() => {
    leeTimeLeft--;
    document.getElementById('lee-timer').textContent = `⏱️ ${leeTimeLeft}s`;
    if (leeTimeLeft <= 0) {
      clearInterval(leeTimer);
      leeLock = true;
      document.getElementById('lee-message').textContent = '시간초과! 게임오버(하드모드)';
      setTimeout(() => {
        leePrevScore = leeScore;
        leeRound = 1;
        leeScore = 0;
        leeHardMode = false;
        document.getElementById('lee-timer').style.display = 'none';
        startLeeRound();
      }, 1500);
    }
  }, 1000);
}

// ===== 양지우 게임 (타이핑 레인) =====
let yangGame = null;

const YANG_WORDS = [
  "apple", "banana", "cat", "dog", "egg", "fish", "gold", "hat", "ice", "jam",
  "kite", "lemon", "moon", "night", "orange", "pen", "queen", "rain", "sun", "tree",
  "umbrella", "violin", "water", "box", "yellow", "zebra", "cloud", "dream", "earth", "flower",
  "garden", "house", "island", "jungle", "king", "lion", "mouse", "nurse", "ocean", "party",
  "robot", "snake", "tiger", "train", "virus", "window", "xmas", "yacht", "zone",
  "brave", "clean", "dance", "enjoy", "fresh", "happy", "lucky", "magic", "power", "quick",
  "smart", "super", "sweet", "today", "voice", "watch", "young", "start", "world", "space"
];

class YangGame {
  constructor() {
    this.canvas = document.getElementById('yang-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.input = document.getElementById('yang-input');
    this.scoreEl = document.getElementById('yang-score');
    this.finalScoreEl = document.getElementById('yang-final-score');
    this.startModal = document.getElementById('yang-start-modal');
    this.gameOverModal = document.getElementById('yang-over-modal');
    
    this.words = [];
    this.score = 0;
    this.isPlaying = false;
    this.spawnRate = 2000;
    this.lastSpawnTime = 0;
    this.difficulty = 1;
    this.animationId = null;
    
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    this.input.addEventListener('keydown', (e) => this.handleInput(e));
  }
  
  resizeCanvas() {
    this.canvas.width = document.getElementById('yang-game').offsetWidth;
    this.canvas.height = 600;
  }
  
  spawnWord() {
    const text = YANG_WORDS[Math.floor(Math.random() * YANG_WORDS.length)];
    const fontSize = Math.floor(Math.random() * 10) + 24;
    const x = Math.random() * (this.canvas.width - 200) + 100;
    const y = -30;
    const speed = (Math.random() * 1 + 0.5) + (this.difficulty * 0.2);
    
    // 더 진한 색상 사용 (밝기를 40%로 낮춤)
    const colors = [
      '#1e3a8a', '#7c2d12', '#166534', '#6b21a8', '#be123c',
      '#0e7490', '#c2410c', '#4d7c0f', '#7e22ce', '#be185d',
      '#0891b2', '#dc2626', '#65a30d', '#9333ea', '#db2777'
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    this.words.push({ text, x, y, speed, color, fontSize });
  }
  
  update(timestamp) {
    if (!this.isPlaying) return;
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    if (timestamp - this.lastSpawnTime > this.spawnRate) {
      this.spawnWord();
      this.lastSpawnTime = timestamp;
      if (this.spawnRate > 500) this.spawnRate -= 10;
    }
    
    for (let i = 0; i < this.words.length; i++) {
      const word = this.words[i];
      word.y += word.speed;
      
      this.ctx.font = `bold ${word.fontSize}px 'Segoe UI', sans-serif`;
      this.ctx.fillStyle = word.color;
      this.ctx.shadowColor = "rgba(255,255,255,0.9)";
      this.ctx.shadowBlur = 8;
      this.ctx.shadowBlur = 4;
      this.ctx.fillText(word.text, word.x, word.y);
      this.ctx.shadowBlur = 0;
      
      if (word.y > this.canvas.height - 10) {
        this.gameOver();
        return;
      }
    }
    
    this.animationId = requestAnimationFrame((ts) => this.update(ts));
  }
  
  handleInput(e) {
    if (e.key !== 'Enter') return;
    if (!this.isPlaying) return;
    
    const typedText = this.input.value.trim();
    const index = this.words.findIndex(w => w.text === typedText);
    
    if (index !== -1) {
      this.words.splice(index, 1);
      this.score += 10;
      this.updateScore();
      
      if (this.score % 50 === 0) {
        this.difficulty++;
      }
    }
    
    this.input.value = '';
  }
  
  updateScore() {
    this.scoreEl.innerText = this.score;
  }
  
  start() {
    this.score = 0;
    this.words = [];
    this.spawnRate = 2000;
    this.difficulty = 1;
    this.isPlaying = true;
    this.updateScore();
    this.input.value = '';
    
    this.startModal.classList.add('hidden');
    this.gameOverModal.classList.add('hidden');
    this.input.focus();
    
    this.lastSpawnTime = performance.now();
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.update(performance.now());
  }
  
  gameOver() {
    this.isPlaying = false;
    cancelAnimationFrame(this.animationId);
    this.finalScoreEl.innerText = this.score;
    this.gameOverModal.classList.remove('hidden');
  }
}

function initYangGame() {
  currentGame = 'yang';
  yangGame = new YangGame();
}

// ===== 김예은 게임 (숫자 연결) =====
let numberNumbers = [];
let numberNext = 1;
let numberStartTime = null;
let numberTimerInterval = null;
let numberPenalty = 0;
const NUMBER_WRONG_MODE = "time";

function initNumberGame() {
  currentGame = 'number';
  numberNumbers = [];
  for (let i = 1; i <= 25; i++) numberNumbers.push(i);
  numberNumbers = numberNumbers.sort(() => Math.random() - 0.5);
  
  loadNumberBest();
  drawNumberBoard();
}

function loadNumberBest() {
  const best = localStorage.getItem("bestTime");
  document.getElementById("number-best").innerText = best ? `최고 기록: ${best}s` : "최고 기록: 없음";
}

function drawNumberBoard() {
  const board = document.getElementById("number-board");
  board.innerHTML = "";
  
  numberNumbers.forEach(num => {
    const div = document.createElement("div");
    div.className = "btn";
    div.innerText = num;
    div.dataset.num = num;
    div.onclick = () => pressNumber(div);
    board.appendChild(div);
  });
}

function pressNumber(btn) {
  const num = Number(btn.dataset.num);
  
  if (numberNext === 1) startNumberTimer();
  
  if (num !== numberNext) {
    if (NUMBER_WRONG_MODE === "time") {
      numberPenalty += 1;
      btn.classList.add("die");
      setTimeout(() => btn.classList.remove("die"), 300);
    } else {
      alert("틀려서 사망!");
      location.reload();
    }
    return;
  }
  
  if (num <= 25) {
    btn.innerText = num + 25;
    btn.dataset.num = num + 25;
  } else {
    btn.style.visibility = "hidden";
  }
  
  numberNext++;
  
  if (numberNext > 50) {
    stopNumberTimer();
    const record = parseFloat(document.getElementById("number-timer").innerText);
    
    const best = localStorage.getItem("bestTime");
    if (!best || record < parseFloat(best)) {
      localStorage.setItem("bestTime", record);
    }
    loadNumberBest();
    
    alert("클리어! 기록: " + record + "s");
  }
}

function startNumberTimer() {
  numberStartTime = Date.now();
  numberTimerInterval = setInterval(() => {
    const t = (Date.now() - numberStartTime) / 1000 + numberPenalty;
    document.getElementById("number-timer").innerText = t.toFixed(2) + "s";
  }, 10);
}

function stopNumberTimer() {
  clearInterval(numberTimerInterval);
}
