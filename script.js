// Geng or Blur? Web Game (v2 clean)

const GAME_NAME = "Geng or Blur?";
const LEVELS = [
  { key: "rookie",  label: "Rookie",  basePoints: 10, timeBonusPer2s: 1, wrongPenalty: -2,  timeLimit: 20 },
  { key: "elite",   label: "Elite",   basePoints: 20, timeBonusPer2s: 2, wrongPenalty: -5,  timeLimit: 15 },
  { key: "insane",  label: "Insane",  basePoints: 40, timeBonusPer2s: 3, wrongPenalty: -10, timeLimit: 12 },
];
const THEMES = ["Black & White","Colour","Food","Logo","Art"];
const QUESTIONS_PER_LEVEL = 1;

// ---- assets 路径映射 ----
const DIFF_BY_LEVEL = { rookie: "easy", elite: "medium", insane: "hard" };
const SET_COUNTS    = { easy: 5, medium: 3, hard: 3 };
const THEME_DIR = {
  "Black & White": "black_white",
  "Colour": "colour",
  "Food": "food",
  "Logo": "logo",
  "Art": "art",
};

// 路径辅助：主题名 → 文件夹名
function themeDirName(themeDisplay){
  return THEME_DIR[themeDisplay] || themeDisplay.toLowerCase().replace(/\s+/g,'_');
}

// 自动选择 png / jpg（你的素材有 .png）
function buildImgSrc(theme, difficulty, setId, idx0to8){
  const tdir = themeDirName(theme);
  const n = idx0to8 + 1; // img1..img9
  return {
    png: `assets/${tdir}/${difficulty}/set${setId}/img${n}.png`,
    jpg: `assets/${tdir}/${difficulty}/set${setId}/img${n}.jpg`
  };
}

// 创建 <img> 元素，优先 .png，404 再回退 .jpg
function createAssetImg(theme, difficulty, setId, idx0to8, alt){
  const { png, jpg } = buildImgSrc(theme, difficulty, setId, idx0to8);
  const img = document.createElement("img");
  img.alt = alt || "";
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.objectFit = "cover";
  img.src = png;
  img.onerror = ()=>{ img.onerror = null; img.src = jpg; };
  return img;
}
//Testing Use Only_Finish putting imgs const READY_THEMES = ["Colour"]; need to be cmd
const READY_THEMES = ["Black & White","Colour","Food","Logo","Art"]; // 有哪个就填哪个，比如 ["Colour","Logo"]
// 随机选定本题参数（主题/难度/组号/正确索引）
function pickRoundParams(){
  // ✅ 用 READY_THEMES 而不是 THEMES
  const pool = READY_THEMES.length ? READY_THEMES : THEMES;

  // 从已完成主题池里随机选
  state.theme = pool[Math.floor(Math.random() * pool.length)];
  themeNameEl.textContent = state.theme;

  // 难度映射
  const lvlKey = LEVELS[state.levelIndex].key; // rookie/elite/insane
  state.difficulty = DIFF_BY_LEVEL[lvlKey];    // easy/medium/hard

  // 随机 setX
  const maxSet = SET_COUNTS[state.difficulty];
  state.setId = Math.floor(Math.random() * maxSet) + 1;

  // 在 0..8 中选一个正确格子
  state.correctIndex = Math.floor(Math.random() * 9);
}


// DOM
const screens = {
  start:     document.getElementById("start-screen"),
  countdown: document.getElementById("countdown-screen"),
  target:    document.getElementById("target-screen"),
  game:      document.getElementById("game-screen"),
  answer:    document.getElementById("answer-screen"),
  summary:   document.getElementById("summary-screen"),
  final:     document.getElementById("final-screen"),
};
const levelNameEl      = document.getElementById("level-name");
const targetPreview    = document.getElementById("target-preview");
const startRoundBtn    = document.getElementById("start-round");
const themeNameEl      = document.getElementById("theme-name");
const timerEl          = document.getElementById("timer");
const scoreEl          = document.getElementById("score");
const gridEl           = document.getElementById("grid");
const feedbackEl       = document.getElementById("feedback");
const answerTitle      = document.getElementById("answer-title");
const answerDetails    = document.getElementById("answer-details");
const nextBtn          = document.getElementById("next-question");
const finalScoreEl     = document.getElementById("final-score");
const finalDurationEl  = document.getElementById("final-duration");
const finalAccuracyEl  = document.getElementById("final-accuracy");
const leaderboardEl    = document.getElementById("leaderboard");
const playerForm       = document.getElementById("player-form");
const devToggle        = document.getElementById("dev-mode");
const downloadCertBtn  = document.getElementById("download-cert");
const playAgainBtn     = document.getElementById("play-again");
// --- My summary DOM ---
const mySummaryEl = document.getElementById("my-summary");
const mysUserEl   = document.getElementById("mys-username");
const mysScoreEl  = document.getElementById("mys-score");   // NEW
const mysDurEl    = document.getElementById("mys-dur");
const mysNextBtn  = document.getElementById("mys-next");



// State
let state = {
  player: { name: "", email: "" },
  devMode: true,
  levelIndex: 0,
  questionIndex: 0,
  theme: "",
  difficulty: "easy",   // 让代码知道你现在处于 easy / medium / hard
  setId: 1,              // 让代码知道这一题用第几组图片（set1~setN）
  score: 0,
  correctCount: 0,
  totalQuestions: LEVELS.length * QUESTIONS_PER_LEVEL,
  totalDurationMs: 0,
  questionStartTs: 0,
  timeLeft: 0,
  timerId: null,
  correctIndex: 0,
  lastPickIndex: null,
};

// ===== Utils =====
function showScreen(nameOrId){
  const target = screens[nameOrId] || document.getElementById(nameOrId);
  if (!target) { console.error("[showScreen] not found:", nameOrId); return; }
  Object.values(screens).forEach(s => s && s.classList.remove("visible"));
  target.classList.add("visible");
}
function pad(n){ return String(n).padStart(2, "0"); }

// ✅ REPLACE 你的旧 msToClock，用这个
function msToClock(ms){
  const sec = Math.max(0, Math.ceil(ms/1000));
  const m = Math.floor(sec/60), s = sec % 60;
  return pad(m) + ":" + pad(s);
}

// Start
// ===== Frontend gatekeeping =====
const ALLOWED_DOMAINS = new Set([
  "gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "utar.edu.my"
]);

const NAME_RE   = /^[A-Za-z0-9_]{1,32}$/;
const EMAIL_TYPOS = ["@gmil.", "@gmal.", "@gmail.con", "@hotnail.", "@outlok."]; // 软提醒

const formErrorEl = document.getElementById("form-error");
const startBtnEl  = document.getElementById("start-btn");

function showFormError(msg) {
  formErrorEl.textContent = msg;
  formErrorEl.style.display = "block";
}

function clearFormError() {
  formErrorEl.textContent = "";
  formErrorEl.style.display = "none";
}

function sanitizeName(raw) {
  // 去前后空格，剔除不可见字符，强制只保留允许字符
  return (raw || "")
    .trim()
    .replace(/[^\x20-\x7E]/g, "")        // 去掉不可见/emoji
    .replace(/[^A-Za-z0-9_]/g, "")       // 非法字符清掉
    .slice(0, 32);
}

function validateEmailStrong(email) {
  if (!email) return { ok: false, msg: "Email is required." };
  // 浏览器已做了一层格式校验，再做一次更稳
  const okFormat = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  if (!okFormat) return { ok: false, msg: "Invalid email format." };

  // 白名单域名
  const domain = email.split("@")[1].toLowerCase();
  if (!ALLOWED_DOMAINS.has(domain)) {
    return { ok: false, msg: "Only gmail/outlook/hotmail/yahoo/utar.edu.my are accepted." };
  }

  // 软提醒：常见拼错（不拦截，只提示）
  if (EMAIL_TYPOS.some(t => email.toLowerCase().includes(t))) {
    return { ok: true, warn: "This email looks misspelled, please double-check the domain." };
  }

  return { ok: true };
}

// ===== Hook inputs for instant feedback =====
const nameInput  = document.getElementById("player-name");
const emailInput = document.getElementById("player-email");

nameInput.addEventListener("input", () => {
  const sanitized = sanitizeName(nameInput.value);
  if (sanitized !== nameInput.value) nameInput.value = sanitized;
  if (sanitized && !NAME_RE.test(sanitized)) {
    showFormError("Name: only letters, numbers and underscore (_), up to 32 chars.");
  } else {
    clearFormError();
  }
});

emailInput.addEventListener("input", () => {
  clearFormError();
});

// ===== Submit gate =====
playerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearFormError();

  // sanitize + validate
  const name  = sanitizeName(nameInput.value);
  const email = emailInput.value.trim();

  if (!name) {
    showFormError("Name is required.");
    nameInput.focus();
    return;
  }
  if (!NAME_RE.test(name)) {
    showFormError("Name: only letters, numbers and underscore (_), up to 32 chars.");
    nameInput.focus();
    return;
  }

  const emailCheck = validateEmailStrong(email);
  if (!emailCheck.ok) {
    showFormError(emailCheck.msg);
    emailInput.focus();
    return;
  }
  if (emailCheck.warn) {
    // 温柔提醒，不拦截
    showFormError(emailCheck.warn);
    // 2 秒后自动清掉提示，继续走流程
    setTimeout(clearFormError, 2000);
  }

  // disable 连点
  startBtnEl.disabled = true;
  startBtnEl.textContent = "Starting...";

  try {
    // 走你现有的开局流程
    state.player = { name, email };
    state.devMode = devToggle.checked;

    state.levelIndex = 0;
    state.questionIndex = 0;
    state.score = 0;
    state.correctCount = 0;
    state.totalDurationMs = 0;

    runLevelIntro();
  } finally {
    // 1秒后恢复按钮（防手抖多次提交）
    setTimeout(() => {
      startBtnEl.disabled = false;
      startBtnEl.textContent = "START";
    }, 1000);
  }
});



// Countdown -> Target
function runLevelIntro(){
  const level = LEVELS[state.levelIndex];
  levelNameEl.textContent = level.label;
  showScreen("countdown");

  const s3 = document.getElementById("count-3");
  const s2 = document.getElementById("count-2");
  const s1 = document.getElementById("count-1");
  const go = document.getElementById("count-go");
  [s3,s2,s1,go].forEach(n => n.classList.remove("show"));

  let c = 3;
  const seq = setInterval(()=>{
    if(c===3) s3.classList.add("show");
    if(c===2) s2.classList.add("show");
    if(c===1) s1.classList.add("show");
    if(c===0){
      go.classList.add("show");
      clearInterval(seq);
      setTimeout(()=>prepareTargetAndShow(), 600);
    }
    c--;
  }, 600);
}

function prepareTargetAndShow(){
  // 设置本题的主题、难度、组号、正确答案索引
  pickRoundParams();      

  // 显示目标图（根据 devMode = ⭐，否则用真实图片）
  renderTargetPreview();  

  // 切换到“Find This!”画面
  showScreen("target");

  // ✅ 停 2 秒后自动进入九宫格
  setTimeout(()=> startQuestionRound(), 2000);
}

function renderTargetPreview(){
  targetPreview.className = "target-tile";
  targetPreview.innerHTML = "";

  if(state.devMode){
    targetPreview.classList.add("dev");
    targetPreview.textContent = "⭐";
  }else{
    const img = createAssetImg(state.theme, state.difficulty, state.setId, state.correctIndex, "target");
    targetPreview.appendChild(img);
  }
}

//startRoundBtn.addEventListener("click", ()=> startQuestionRound());

// Round
function startQuestionRound(){
  showScreen("game");
  feedbackEl.textContent = "";
  feedbackEl.className = "feedback";

  // Use chosen theme & correctIndex
  renderBoard();

  const level = LEVELS[state.levelIndex];
  let t = level.timeLimit;
  state.timeLeft = t;
  timerEl.textContent = "00:"+pad(t);
  state.questionStartTs = performance.now();
  state.timerId = setInterval(()=>{
    t--;
    state.timeLeft = t;
    timerEl.textContent = "00:"+pad(Math.max(0,t));
    if (t <= 0) {
      clearInterval(state.timerId);
      lockBoard();

      // ✅ 把本题用时也统计进去（超时同样需要）
      const durationMs = performance.now() - state.questionStartTs;
      state.totalDurationMs += durationMs;

      applyScore(false, level, 0);
      state.lastPickIndex = null;
      showAnswer(false, level, 0);
      }
  }, 1000);
}

function renderBoard(){
  gridEl.innerHTML = "";
  const test = buildImgSrc(state.theme, state.difficulty, state.setId, 0);
  console.log("[DBG] theme=%s diff=%s set=%s → try %s (fallback %s)",
    state.theme, state.difficulty, state.setId, test.png, test.jpg);
 
 
  for (let i = 0; i < 9; i++){
    const tile = document.createElement("div");
    tile.className = "tile";

    if (state.devMode){
      tile.classList.add("dev");
      tile.style.background  = i===state.correctIndex ? "#fffbe6" : "#ffffff";
      tile.style.borderColor = "#ffe299";
      tile.textContent       = i===state.correctIndex ? "⭐" : "•";
    }else{
      tile.appendChild(
        createAssetImg(state.theme, state.difficulty, state.setId, i, `choice-${i+1}`)
      );
    }

    const mark = document.createElement("div");
    mark.className = "mark";
    mark.textContent = "";
    tile.appendChild(mark);

    tile.addEventListener("click", ()=>onPick(i, tile));
    gridEl.appendChild(tile);
  }
}


function lockBoard(){
  Array.from(gridEl.children).forEach(ch => ch.style.pointerEvents = "none");
}

function onPick(i, tileEl){
  if(state.timerId){ clearInterval(state.timerId); }
  lockBoard();
  state.lastPickIndex = i;

  const level = LEVELS[state.levelIndex];
  const durationMs = performance.now() - state.questionStartTs;
  const secsLeft = Math.max(0, state.timeLeft);

  const isCorrect = i===state.correctIndex;

  // Overlays
  const tiles = Array.from(gridEl.children);
  tiles[state.correctIndex].classList.add("correct");
  tiles[state.correctIndex].querySelector(".mark").textContent = "✓";
  if(!isCorrect){
    tileEl.classList.add("wrong");
    tileEl.querySelector(".mark").textContent = "✕";
  }

  applyScore(isCorrect, level, secsLeft);
  state.totalDurationMs += durationMs;
  showAnswer(isCorrect, level, secsLeft);
}

function applyScore(isCorrect, level, secsLeft){
  let delta = 0;
  if(isCorrect){
    delta += level.basePoints;
    const bonus = Math.floor(secsLeft/2) * level.timeBonusPer2s;
    delta += bonus;
    state.correctCount++;
    feedbackEl.textContent = `Correct! +${delta} pts (base ${level.basePoints} + bonus ${delta - level.basePoints})`;
    feedbackEl.classList.add("ok");
  }else{
    delta += level.wrongPenalty;
    feedbackEl.textContent = `Wrong! ${level.wrongPenalty} pts`;
    feedbackEl.classList.add("bad");
  }
  state.score += delta;
  scoreEl.textContent = state.score;
}

// Compare
function showAnswer(isCorrect, level, secsLeft){
  showScreen("answer");
  answerTitle.textContent = isCorrect ? "Correct ✅" : "Wrong ❌";

  const pick = state.lastPickIndex;
  const correct = state.correctIndex;
  const detailText = isCorrect
    ? `You picked the right image. Time left: ${secsLeft}s`
    : `Correct image shown on the left. Your choice on the right. Time left: ${secsLeft}s`;

  if(state.devMode){
    const yourSymbol = (pick === correct) ? "⭐" : "•";
    answerDetails.innerHTML = `
      <div class="compare">
        <div class="small">⭐</div>
        <div class="small">${yourSymbol}</div>
      </div>
      <div class="compare-caption"><span>Correct</span><span>Your Choice</span></div>
      <div>${detailText}</div>`;
  } else {
    // ✅ 用 createAssetImg，带 png→jpg 回退，杜绝裂图
    answerDetails.innerHTML = `
      <div class="compare">
        <div id="cmp-correct" class="small"></div>
        <div id="cmp-your" class="small"></div>
      </div>
      <div class="compare-caption"><span>Correct</span><span>Your Choice</span></div>
      <div>${detailText}</div>`;
    document.getElementById("cmp-correct")
      .appendChild(createAssetImg(state.theme, state.difficulty, state.setId, correct, "correct"));
    document.getElementById("cmp-your")
      .appendChild(createAssetImg(state.theme, state.difficulty, state.setId, pick ?? correct, "your-choice"));
  }
}


// Next/Final
nextBtn.addEventListener("click", ()=>{
  state.questionIndex++;
  if(state.questionIndex >= QUESTIONS_PER_LEVEL){
    state.levelIndex++;
    state.questionIndex = 0;
    if(state.levelIndex >= LEVELS.length){
      return endGame();
    }
  }
  runLevelIntro();
});


let lastInsertId = 0;   // 放在外层（文件顶部某处），全局保存

function endGame(){
  // 先到 Summary 屏
  showScreen("summary");            // 支持键名/ID 二选一
  renderMySummary();

  lastInsertId = 0;
  const shouldSubmit = !state.devMode;
  const p = shouldSubmit
    ? submitScore(state.player.name, state.player.email, state.score, state.totalDurationMs)
        .then(r => { console.log("[score] submit:", r); lastInsertId = (r && r.id) ? r.id : 0; })
        .catch(e => { console.warn("[score] failed", e); lastInsertId = 0; })
    : Promise.resolve();

  // 注意：这里不 fetchLeaderboard，不切 final
}

// 3) renderMySummary：绑定按钮 + 日志
function renderMySummary(){
  if (mysUserEl)  mysUserEl.textContent  = safeDisplayName(); // 可选：显示安全名
  if (mysScoreEl) mysScoreEl.textContent = state.score;       // ← 分数
  if (mysDurEl)   mysDurEl.textContent   = msToClock(state.totalDurationMs);

  if (mysNextBtn) mysNextBtn.onclick = goToLeaderboard;
}

function safeDisplayName() {
  let n = (state.player?.name || "").trim();
  if (!n) {
    const local = (state.player?.email || "").split("@")[0] || "Player";
    n = local.slice(0, 32);
  }
  return n;
}



function goToLeaderboard(){
  // 不需要再填那三张卡片了，直接注释掉即可
  // finalScoreEl.textContent    = state.score;
  // finalDurationEl.textContent = msToClock(state.totalDurationMs);
  // finalAccuracyEl.textContent = Math.round((state.correctCount / state.totalQuestions) * 100) + "%";

  // 切到排行榜页
  showScreen("final-screen");

  // 关键：给 final-screen 加一个标记类，用于隐藏上面的统计卡 & 标题
  const fs = document.getElementById("final-screen");
  fs.classList.add("ranking-only");

  // 拉排行榜
  fetchLeaderboard(lastInsertId || 0).catch(e=>{
    console.error("[leaderboard] fetch failed:", e);
  });
}



// Backend APIs
async function submitScore(name, email, totalScore, totalDurationMs){
  try{
    const res = await fetch("api/submit_score.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, total_score: totalScore, total_duration_ms: totalDurationMs })
    });
    return await res.json(); // ← 要 JSON
  }catch(e){
    return null;
  }
}

// 5) fetchLeaderboard：加日志，快速分辨返回格式
async function fetchLeaderboard(latestId = 0){
  const url = "api/leaderboard.php?latest_id=" + latestId;
  console.log("[leaderboard] GET", url);
  const res = await fetch(url);
  const data = await res.json();
  console.log("[leaderboard] payload:", data);
  renderLeaderboard(data.rows, data.me);
}


function renderLeaderboard(apiRows, me){
  // 清空现有行
  leaderboardEl.querySelectorAll(".leaderboard-row:not(.header)").forEach(e=>e.remove());

  // allRows：后端 rows 就是已经排好名的前 N
  const allRows = (apiRows || []).map(r => ({
    rank: r.rank,
    id:   r.id,
    name: r.name,
    score: r.score ?? r.total_score,
    duration_ms: r.duration_ms ?? r.total_duration_ms ?? 0
  }));

  // top5
  const top5 = allRows.slice(0, 5);

  // 合并：top5 + （如果“我”不在 top5，则追加“我”）
  let merged = [...top5];
  if (me && !top5.some(r => r.id === me.id)) {
    merged.push({
      rank: me.rank,
      id:   me.id,
      name: me.name,
      score: me.score ?? me.total_score,
      duration_ms: me.duration_ms ?? me.total_duration_ms ?? 0,
      __isMe: true
    });
  } else if (me) {
    // 在 top5 内的“我”高亮
    merged = merged.map(r => (r.id === me.id ? { ...r, __isMe: true } : r));
  }

  // 先渲染折叠态（top5 + 我）
  appendRows(merged);

  // 绑定展开/收起
  const toggleBtn = document.getElementById("lb-toggle");
  if (toggleBtn) {
    let expanded = false;
    toggleBtn.textContent = "Show All";
    toggleBtn.onclick = () => {
      expanded = !expanded;
      toggleBtn.textContent = expanded ? "Show Top 5" : "Show All";
      leaderboardEl.querySelectorAll(".leaderboard-row:not(.header)").forEach(e=>e.remove());
      if (expanded) {
        appendRows(allRows.map(r => ({...r, __isMe: me && r.id === me.id })));
      } else {
        appendRows(merged);
      }
    };
  }

  function appendRows(rows){
    rows.forEach((r) => {
      const row = document.createElement("div");
      row.className = "leaderboard-row";
      if (r.__isMe) row.classList.add("me");
      row.innerHTML = `
        <span>${r.rank}</span>
        <span>${r.name}</span>
        <span>${r.score}</span>
        <span>${msToClock(r.duration_ms)}</span>
      `;
      leaderboardEl.appendChild(row);
    });
  }
}


// Certificate
downloadCertBtn.addEventListener("click", ()=>{
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:"landscape", unit:"pt", format:"a4" });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  doc.setFillColor(255, 248, 225); doc.rect(0,0,w,h,"F");
  doc.setDrawColor(255, 196, 0); doc.setLineWidth(6); doc.rect(24,24,w-48,h-48);

  doc.setTextColor(255,140,0); doc.setFont("helvetica","bold"); doc.setFontSize(36);
  doc.text("Certificate of Achievement", w/2, 130, {align:"center"});

  doc.setTextColor(0,0,0); doc.setFontSize(18);
  doc.text(`This certifies that`, w/2, 180, {align:"center"});

  doc.setTextColor(90,60,0); doc.setFont("helvetica","bold"); doc.setFontSize(26);
  doc.text(state.player.name || "Player", w/2, 220, {align:"center"});

  const acc = Math.round((state.correctCount / state.totalQuestions) * 100);
  doc.setTextColor(0,0,0); doc.setFont("helvetica","normal"); doc.setFontSize(16);
  doc.text(`has completed ${GAME_NAME} with the following results:`, w/2, 260, {align:"center"});

  doc.setFont("helvetica","bold");
  doc.text(`Score: ${state.score}   •   Duration: ${msToClock(state.totalDurationMs)}   •   Accuracy: ${acc}%`, w/2, 300, {align:"center"});

  const dateStr = new Date().toLocaleDateString();
  doc.setFont("helvetica","normal");
  doc.text(`Email: ${state.player.email}    Date: ${dateStr}`, w/2, 340, {align:"center"});

  doc.setTextColor(255,140,0); doc.setFont("helvetica","bold"); doc.setFontSize(22);
  doc.text(GAME_NAME, w/2, 390, {align:"center"});

  doc.save(`Certificate_${state.player.name || "player"}.pdf`);
});

playAgainBtn.addEventListener("click", ()=>{
  window.location.href = "./index.html";
});
