import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getAuth,
  signInWithCustomToken,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

// =========================================================
// FIREBASE CONFIGURATION
// =========================================================

const firebaseConfig = {
  apiKey: "AIzaSyBA9MG04RH4wVICI1lzIYQepVaTCNM7zDQ",
  authDomain: "simon-memory-game-6a98f.firebaseapp.com",
  projectId: "simon-memory-game-6a98f",
  storageBucket: "simon-memory-game-6a98f.firebasestorage.app",
  messagingSenderId: "549627763133",
  appId: "1:549627763133:web:edb9818d7d8be8d0465ad4",
  measurementId: "G-YCY2L8JZBD",
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

// =========================================================
// AUTHENTICATION
// =========================================================

const authPanel = document.querySelector("#authPanel");
const authUsername = document.querySelector("#authUsername");
const authPassword = document.querySelector("#authPassword");

const loginBtn = document.querySelector("#loginBtn");
const registerBtn = document.querySelector("#registerBtn");
const authMessage = document.querySelector("#authMessage");

// USER PANEL
const userPanel = document.querySelector("#userPanel");
const userNameDisplay = document.querySelector("#userNameDisplay");
const signOutBtn = document.querySelector("#signOutBtn");

let currentUsername = null;

// =========================================================
// AUTH MESSAGE
// =========================================================

function showAuthMessage(text) {
  authMessage.innerText = text;
}

// =========================================================
// LOGIN
// =========================================================

loginBtn.addEventListener("click", async () => {
  const username = authUsername.value.trim();
  const password = authPassword.value;

  if (!username || !password) {
    showAuthMessage("ENTER USERNAME AND PASSWORD");
    return;
  }

  loginBtn.disabled = true;
  registerBtn.disabled = true;

  showAuthMessage("AUTHENTICATING…");

  try {
    const response = await fetch("/api/login", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        username,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Login failed");
    }

    // Sign into Firebase
    await signInWithCustomToken(auth, data.token);

    currentUsername = data.username;

    authPanel.style.display = "none";

    // Show username
    userNameDisplay.innerText = currentUsername || "PLAYER";
    userPanel.style.display = "flex";

    message.innerText = `Welcome, ${currentUsername}!`;

    // Refresh leaderboard
    await renderLeaderboard();
  } catch (error) {
    console.error("Login error:", error);

    showAuthMessage(error.message || "LOGIN FAILED");
  } finally {
    loginBtn.disabled = false;
    registerBtn.disabled = false;
  }
});

// =========================================================
// CREATE ACCOUNT
// =========================================================

registerBtn.addEventListener("click", async () => {
  const username = authUsername.value.trim();
  const password = authPassword.value;

  if (!username || !password) {
    showAuthMessage("ENTER USERNAME AND PASSWORD");
    return;
  }

  registerBtn.disabled = true;
  loginBtn.disabled = true;

  showAuthMessage("CREATING ACCOUNT…");

  try {
    const response = await fetch("/api/register", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        username,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Registration failed");
    }

    // Sign into Firebase
    await signInWithCustomToken(auth, data.token);

    currentUsername = data.username;

    authPanel.style.display = "none";

    // Show username
    userNameDisplay.innerText = currentUsername || "PLAYER";
    userPanel.style.display = "flex";

    message.innerText = `Welcome, ${currentUsername}!`;

    // Refresh leaderboard
    await renderLeaderboard();
  } catch (error) {
    console.error("Registration error:", error);

    showAuthMessage(error.message || "ACCOUNT CREATION FAILED");
  } finally {
    registerBtn.disabled = false;
    loginBtn.disabled = false;
  }
});

// =========================================================
// SIGN OUT
// =========================================================

signOutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);

    currentUsername = null;

    userPanel.style.display = "none";

    authPanel.style.display = "flex";

    authUsername.value = "";
    authPassword.value = "";

    showAuthMessage("LOGGED OUT");

    message.innerText = "Please login to play";

    resetGame();
  } catch (error) {
    console.error("Sign out error:", error);
  }
});

// =========================================================
// CHECK LOGIN STATE
// =========================================================

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUsername = user.displayName || currentUsername;

    authPanel.style.display = "none";

    userNameDisplay.innerText = currentUsername || "PLAYER";

    userPanel.style.display = "flex";
  } else {
    currentUsername = null;

    authPanel.style.display = "flex";

    userPanel.style.display = "none";
  }
});

// =========================================================
// LEADERBOARD SERVICE
// =========================================================
// NOTE:
// This is still localStorage for now.
// Next step will replace this with Firestore
// so everyone can see the same Top 20 leaderboard.
// =========================================================

class LeaderboardService {
  constructor(storageKey = "cyber_simon_top20", maxLimit = 20) {
    this.storageKey = storageKey;
    this.maxLimit = maxLimit;
  }

  // =======================================================
  // GET TOP 20
  // =======================================================

  async getTopScores() {
    try {
      const data = localStorage.getItem(this.storageKey);

      const scores = data ? JSON.parse(data) : [];

      return scores.sort((a, b) => b.score - a.score).slice(0, this.maxLimit);
    } catch (err) {
      console.error("Error retrieving scores:", err);

      return [];
    }
  }

  // =======================================================
  // CHECK IF SCORE ENTERS TOP 20
  // =======================================================

  async isTopScore(score) {
    if (score <= 0) {
      return false;
    }

    const scores = await this.getTopScores();

    if (scores.length < this.maxLimit) {
      return true;
    }

    return score > scores[scores.length - 1].score;
  }

  // =======================================================
  // SAVE SCORE
  // =======================================================

  async saveScore(name, score) {
    try {
      const newEntry = {
        id: "score_" + Date.now(),

        name: name.trim().slice(0, 12).toUpperCase() || "OPERATOR",

        score: parseInt(score, 10),

        timestamp: Date.now(),
      };

      const currentScores = await this.getTopScores();

      currentScores.push(newEntry);

      currentScores.sort((a, b) => b.score - a.score);

      const trimmed = currentScores.slice(0, this.maxLimit);

      localStorage.setItem(this.storageKey, JSON.stringify(trimmed));

      return trimmed;
    } catch (err) {
      console.error("Error saving score:", err);

      return [];
    }
  }
}

const leaderboard = new LeaderboardService();

// =========================================================
// GAME ENGINE & STATE
// =========================================================

let gameSeq = [];
let userSeq = [];

let level = 0;

let started = false;

let isPlayingSequence = false;

let highScore = 0;

// =========================================================
// GAME BUTTONS
// =========================================================

const btns = ["red", "green", "yellow", "blue"];

const frequencies = {
  red: 329.63,

  green: 392.0,

  yellow: 440.0,

  blue: 523.25,
};

// =========================================================
// DOM ELEMENTS
// =========================================================

const levelText = document.querySelector("#level");

const highScoreText = document.querySelector("#highScore");

const message = document.querySelector("#message");

const startBtn = document.querySelector("#startBtn");

const resetBtn = document.querySelector("#resetBtn");

const board = document.querySelector("#board");

const particlesContainer = document.querySelector("#particles");

// =========================================================
// LEADERBOARD DOM
// =========================================================

const leaderboardList = document.querySelector("#leaderboardList");

// =========================================================
// LEADERBOARD RENDER
// =========================================================

function formatDate(timestamp) {
  const d = new Date(timestamp);

  return `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d
    .getDate()
    .toString()
    .padStart(2, "0")}`;
}

async function renderLeaderboard() {
  leaderboardList.innerHTML = `<div class="lb-empty">FETCHING SCORES…</div>`;

  const scores = await leaderboard.getTopScores();

  if (scores.length === 0) {
    leaderboardList.innerHTML = `<div class="lb-empty">
        NO RECORDS YET — SET THE BAR!
      </div>`;

    highScore = 0;
    highScoreText.innerText = "0";

    return;
  }

  leaderboardList.innerHTML = scores
    .map((item, index) => {
      const rank = index + 1;

      let rankCls = "";

      if (rank === 1) {
        rankCls = "gold";
      } else if (rank === 2) {
        rankCls = "silver";
      } else if (rank === 3) {
        rankCls = "bronze";
      }

      return `
          <div class="lb-row">

            <span class="lb-rank ${rankCls}">
              #${rank}
            </span>

            <span
              class="lb-name"
              title="${item.name}"
            >
              ${item.name}
            </span>

            <span class="lb-date">
              ${item.timestamp ? formatDate(item.timestamp) : "--/--"}
            </span>

            <span class="lb-score">
              ${item.score}
            </span>

          </div>
        `;
    })
    .join("");

  // Update HUD with #1 score

  highScore = scores.length > 0 ? scores[0].score : 0;

  highScoreText.innerText = highScore;
}

// =========================================================
// INITIAL LEADERBOARD
// =========================================================

renderLeaderboard();

// =========================================================
// AUDIO
// =========================================================

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(freq, duration = 0.22) {
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  const osc = audioContext.createOscillator();

  const gain = audioContext.createGain();

  osc.frequency.value = freq;

  osc.type = "sine";

  gain.gain.setValueAtTime(0.18, audioContext.currentTime);

  gain.gain.exponentialRampToValueAtTime(
    0.001,
    audioContext.currentTime + duration,
  );

  osc.connect(gain);

  gain.connect(audioContext.destination);

  osc.start();

  osc.stop(audioContext.currentTime + duration);
}

function playError() {
  playSound(110, 0.4);

  setTimeout(() => playSound(90, 0.35), 120);
}

// =========================================================
// PARTICLES
// =========================================================

function spawnParticles(x, y, color) {
  const colors = {
    red: "#ff3b3b",

    green: "#00f5a0",

    yellow: "#facc15",

    blue: "#38bdf8",
  };

  const c = colors[color] || "#38bdf8";

  for (let i = 0; i < 10; i++) {
    const p = document.createElement("div");

    p.className = "particle";

    p.style.left = x + "px";

    p.style.top = y + "px";

    p.style.background = c;

    p.style.setProperty("--tx", (Math.random() - 0.5) * 160 + "px");

    p.style.setProperty("--ty", (Math.random() - 0.5) * 160 - 40 + "px");

    particlesContainer.appendChild(p);

    setTimeout(() => p.remove(), 900);
  }
}

// =========================================================
// GAMEPLAY LOGIC
// =========================================================

startBtn.addEventListener("click", startGame);

resetBtn.addEventListener("click", resetGame);

// =========================================================
// START GAME
// =========================================================

function startGame() {
  if (started) {
    return;
  }

  // Don't allow playing without login

  if (!currentUsername) {
    message.innerText = "PLEASE LOGIN FIRST";

    return;
  }

  audioContext.resume();

  started = true;

  level = 0;

  gameSeq = [];

  userSeq = [];

  startBtn.disabled = true;

  startBtn.querySelector("span").innerText = "RUNNING…";

  message.className = "message";

  message.innerText = "Watch the sequence…";

  levelUp();
}

// =========================================================
// RESET GAME
// =========================================================

function resetGame() {
  started = false;

  isPlayingSequence = false;

  gameSeq = [];

  userSeq = [];

  level = 0;

  levelText.innerText = "0";

  message.className = "message";

  message.innerText = currentUsername
    ? "Press PLAY to begin"
    : "Please login to play";

  startBtn.disabled = false;

  startBtn.querySelector("span").innerText = "PLAY";

  board.classList.remove("locked", "game-over");

  document.body.style.background = "";
}

// =========================================================
// FLASH BUTTON
// =========================================================

function flashBtn(btn, color, isUser = false) {
  const cls = isUser ? "active" : "flash";

  btn.classList.add(cls);

  playSound(frequencies[color]);

  if (navigator.vibrate) {
    navigator.vibrate(isUser ? 25 : 40);
  }

  setTimeout(
    () => btn.classList.remove(cls),

    isUser ? 160 : 320,
  );
}

// =========================================================
// LEVEL UP
// =========================================================

function levelUp() {
  userSeq = [];

  level++;

  levelText.innerText = level;

  levelText.classList.add("pulse");

  setTimeout(
    () => levelText.classList.remove("pulse"),

    300,
  );

  const baseDelay = Math.max(280, 520 - Math.floor((level - 1) / 3) * 55);

  const randomColor = btns[Math.floor(Math.random() * btns.length)];

  gameSeq.push(randomColor);

  message.className = "message";

  message.innerText = "Watch carefully…";

  board.classList.add("locked");

  isPlayingSequence = true;

  let i = 0;

  function playNext() {
    if (i >= gameSeq.length) {
      isPlayingSequence = false;

      board.classList.remove("locked");

      message.innerText = "Your turn!";

      return;
    }

    const color = gameSeq[i];

    const btn = document.getElementById(color);

    flashBtn(btn, color, false);

    i++;

    setTimeout(playNext, baseDelay);
  }

  setTimeout(playNext, 450);
}

// =========================================================
// CHECK ANSWER
// =========================================================

function checkAnswer(idx) {
  if (userSeq[idx] !== gameSeq[idx]) {
    gameOver();

    return;
  }

  if (userSeq.length === gameSeq.length) {
    message.className = "message success";

    message.innerText =
      level % 5 === 0 ? `Round ${level}! Phenomenal!` : "Verified! Next…";

    if (level > highScore) {
      highScore = level;

      highScoreText.innerText = highScore;

      highScoreText.classList.add("pulse");

      setTimeout(
        () => highScoreText.classList.remove("pulse"),

        400,
      );
    }

    const rect = board.getBoundingClientRect();

    spawnParticles(
      rect.left + rect.width / 2,

      rect.top + rect.height / 2,

      userSeq[userSeq.length - 1],
    );

    setTimeout(levelUp, 850);
  }
}

// =========================================================
// BUTTON PRESS
// =========================================================

function btnPress(e) {
  if (!started || isPlayingSequence) {
    return;
  }

  const btn = e.currentTarget;

  const color = btn.id;

  userSeq.push(color);

  flashBtn(btn, color, true);

  checkAnswer(userSeq.length - 1);
}

// =========================================================
// BUTTON EVENTS
// =========================================================

document.querySelectorAll(".btn").forEach((btn) => {
  btn.addEventListener("click", btnPress);

  btn.addEventListener(
    "touchstart",

    (e) => {
      e.preventDefault();

      btnPress(e);
    },

    {
      passive: false,
    },
  );
});

// =========================================================
// GAME OVER
// =========================================================

async function gameOver() {
  const finalRound = level;

  started = false;

  isPlayingSequence = false;

  board.classList.remove("locked");

  board.classList.add("game-over");

  playError();

  if (navigator.vibrate) {
    navigator.vibrate([80, 40, 80]);
  }

  message.className = "message fail";

  message.innerText = `Game Over — Level ${finalRound}`;

  startBtn.disabled = false;

  startBtn.querySelector("span").innerText = "PLAY AGAIN";

  document.body.style.background =
    "radial-gradient(circle at 50% 45%, #450a0a, #06080f 70%)";

  setTimeout(
    () => {
      board.classList.remove("game-over");

      document.body.style.background = "";
    },

    700,
  );

  // =======================================================
  // AUTOMATICALLY SAVE LOGGED-IN USER'S SCORE
  // =======================================================

  if (!currentUsername) {
    return;
  }

  try {
    const qualifies = await leaderboard.isTopScore(finalRound);

    if (qualifies) {
      await leaderboard.saveScore(currentUsername, finalRound);

      await renderLeaderboard();

      message.innerText = `Score saved — ${currentUsername}`;
    }
  } catch (error) {
    console.error("Error saving score:", error);
  }
}
