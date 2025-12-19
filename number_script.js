// 설정
const WRONG_MODE = "time"; // "time" = +1초, "death" = 즉사

// ---------------------------
let numbers = [];
let next = 1;
let startTime = null;
let timerInterval = null;
let addedPenalty = 0;

// 숫자 1~25 섞기
for (let i = 1; i <= 25; i++) numbers.push(i);
numbers = numbers.sort(() => Math.random() - 0.5);

// 기록 불러오기
function loadBest() {
  const best = localStorage.getItem("bestTime");
  document.getElementById("best").innerText =
    best ? `최고 기록: ${best}s` : "최고 기록: 없음";
}
loadBest();

function drawBoard() {
  const board = document.getElementById("game");
  board.innerHTML = "";

  numbers.forEach(num => {
    const div = document.createElement("div");
    div.className = "btn";
    div.innerText = num;
    div.dataset.num = num;
    div.onclick = () => press(div);
    board.appendChild(div);
  });
}

function press(btn) {
  const num = Number(btn.dataset.num);

  // 타이머 시작
  if (next === 1) startTimer();

  // 틀린 경우
  if (num !== next) {
    if (WRONG_MODE === "time") {
      addedPenalty += 1;
      btn.classList.add("die");
      setTimeout(() => btn.classList.remove("die"), 300);
    } else {
      gameOver(" 틀려서 사망!");
    }
    return;
  }

  // ✔ 정답
  if (num <= 25) {
    btn.innerText = num + 25;
    btn.dataset.num = num + 25;
  } else {
    btn.style.visibility = "hidden";
  }

  next++;

  // 클리어
  if (next > 50) {
    stopTimer();
    const record = parseFloat(document.getElementById("timer").innerText);

    // 최고기록 업데이트
    const best = localStorage.getItem("bestTime");
    if (!best || record < parseFloat(best)) {
      localStorage.setItem("bestTime", record);
    }
    loadBest();

    alert("클리어! 기록: " + record + "s");
  }
}

function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const t = (Date.now() - startTime) / 1000 + addedPenalty;
    document.getElementById("timer").innerText = t.toFixed(2) + "s";
  }, 10);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function gameOver(msg) {
  alert(msg);
  location.reload();
}

drawBoard();
