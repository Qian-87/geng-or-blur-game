// Flash Match Challenge Web Game

const GAME_NAME = "Flash Match Challenge";
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

// ✅ 新增在这里（不要动上面三行）
const THEME_SET_COUNTS = {
  "Black & White": { easy: 3, medium: 3, hard: 3 }, // ← 改成你素材真实数量
  "Colour":        { easy: 5, medium: 3, hard: 3 },
  "Food":          { easy: 5, medium: 3, hard: 3 },
  "Logo":          { easy: 5, medium: 3, hard: 3 },
  "Art":           { easy: 5, medium: 3, hard: 3 },
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

// === PRELOAD: 先把一轮的9张图全部拉到本地 ===
function loadImageOnce(src){
  return new Promise((resolve)=>{
    const img = new Image();
    img.onload  = () => resolve(true);   // 下载+解码OK
    img.onerror = () => resolve(false);  // 失败也放行，避免卡住
    img.src = src;
    // 有 decode() 的浏览器更稳（减少短暂空白）
    if (img.decode) img.decode().catch(()=>{});
  });
}

async function preloadRoundAssets(theme, difficulty, setId){
  const jobs = [];
  for (let i = 0; i < 9; i++){
    const { png, jpg } = buildImgSrc(theme, difficulty, setId, i);
    jobs.push(loadImageOnce(png).then(ok => ok ? true : loadImageOnce(jpg)));
  }
  await Promise.all(jobs); // 等9张都处理完（到/失败都算完）
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
const READY_THEMES = ["Black & White","Art"]; // 有哪个就填哪个，比如 ["Colour","Logo","Black & White"]
// 随机选定本题参数（主题/难度/组号/正确索引）

// ✅ 测试开关：true = 只测指定主题/难度/set，false = 恢复随机
/*
const TEST_ONE_SET = False;                 // 测完改 false
const TEST_SET_BY_DIFF = {                 // ← 改成你要测的 set 编号
  easy:   5,   // Rookie 用 set1
  medium: 1,   // Elite  用 set2
  hard:   2    // Insane 用 set3 
};
*/

function pickRoundParams(){
  // --- Test Only(Use to test specific theme and set) ---
  /*
    if (TEST_ONE_SET) {
    // 主题固定黑白（要是你没锁 READY_THEMES，这里也强制一下）
    state.theme = "Art";

    // 难度仍按关卡映射：rookie→easy, elite→medium, insane→hard
    const lvlKey = LEVELS[state.levelIndex].key;
    state.difficulty = DIFF_BY_LEVEL[lvlKey];

    // 每个难度用你上面指定好的 set
    state.setId = TEST_SET_BY_DIFF[state.difficulty] ?? 1;

    // 正确格子随便给个随机
    state.correctIndex = Math.floor(Math.random() * 9);

    themeNameEl.textContent = state.theme;
    return; // 结束，后面随机逻辑不走
  }
    */
  
  /*
  // --- Test for single set and theme only---  
  if (TEST_ONE_SET) {
    state.theme        = "Colour"; // 想测的主题
    state.difficulty   = "medium";   // easy / medium / hard 三选一
    state.setId        = 1;        // 想测第几组 set
    state.correctIndex = Math.floor(Math.random() * 9);
    return;                       // 直接结束，后面随机逻辑不执行
  } 
    */

  // ✅ 用 READY_THEMES 而不是 THEMES
  const pool = READY_THEMES.length ? READY_THEMES : THEMES;

  // 从已完成主题池里随机选
  state.theme = pool[Math.floor(Math.random() * pool.length)];
  themeNameEl.textContent = state.theme;

  // 难度映射
  const lvlKey = LEVELS[state.levelIndex].key; // rookie/elite/insane
  state.difficulty = DIFF_BY_LEVEL[lvlKey];    // easy/medium/hard

 // 新的（用主题优先，否则退回全局 SET_COUNTS）
 const themeCounts = THEME_SET_COUNTS[state.theme] || {};
 const maxSet = themeCounts[state.difficulty] ?? SET_COUNTS[state.difficulty];
 state.setId = Math.floor(Math.random() * maxSet) + 1;
 console.log(`[round] theme=${state.theme} diff=${state.difficulty} set=${state.setId}`);


  // 在 0..8 中选一个正确格子
  state.correctIndex = Math.floor(Math.random() * 9);
}


// DOM
const screens = {
  start:     document.getElementById("start-screen"), 
  instruction: document.getElementById("instruction-screen"),
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
// 🟢 Instruction screen elements
const instrNextBtn = document.getElementById("instr-next");
const instrNameEl  = document.getElementById("instr-player-name");
// 小蓝字 DOM（你已经在 HTML 插了 email-hint / allow-other）
const hintWrap      = document.getElementById("email-hint");
const allowOtherBtn = document.getElementById("allow-other");



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
const NAME_RE   = /^[A-Za-z ]{1,32}$/;

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

    .replace(/[^\x20-\x7E]/g, "")        // 去掉不可见/emoji
    .replace(/[^A-Za-z ]/g, "")       // 非法字符清掉
    .replace(/\s{2,}/g, " ")     // 多空格合并为单空格
}



// ===== Hook inputs for instant feedback =====
const nameInput  = document.getElementById("player-name");
const emailInput = document.getElementById("player-email");



// === 公共域名白名单 + 小蓝字解锁 ===
const PUBLIC_DOMAINS = new Set([
  "gmail.com","googlemail.com","yahoo.com","yahoo.com.my","ymail.com",
  "outlook.com","hotmail.com","live.com","msn.com","icloud.com","me.com",
  "proton.me","protonmail.com","aol.com","zoho.com","mail.com","gmx.com"
]);
const COMMON_MISTYPES = {
  "gmial.com":"gmail.com","gamil.com":"gmail.com",
  "hotnail.com":"hotmail.com","hotmai.com":"hotmail.com",
  "outllok.com":"outlook.com","yahho.com":"yahoo.com"
};

let allowOtherDomains = false;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

function getDomain(v){
  const at = v.lastIndexOf("@");
  return at > -1 ? v.slice(at+1).toLowerCase().trim() : "";
}
function autocorrectMistype(email){
  const d = getDomain(email);
  return COMMON_MISTYPES[d] ? email.replace(d, COMMON_MISTYPES[d]) : email;
}

// 合并你的旧监听：即时纠错 + 校验 + 清错误
emailInput.addEventListener("input", ()=>{
  const fixed = autocorrectMistype(emailInput.value.trim());
  if (fixed !== emailInput.value) emailInput.value = fixed;
  clearFormError();
  validateEmail();
});

// 点击小蓝字→允许任意合法域名
if (allowOtherBtn) {
  allowOtherBtn.addEventListener("click", ()=>{
    allowOtherDomains = true;
    hintWrap?.classList.add("hidden");
    validateEmail();
  });
}

// 控制按钮状态 & 提示的核心函数
function validateEmail(){
  const v = emailInput.value.trim();
  const okFormat = emailRegex.test(v);
  const domain   = getDomain(v);

  let ok=false, needHint=false;
  if (!okFormat) ok=false;
  else if (allowOtherDomains) ok=true;
  else { ok = PUBLIC_DOMAINS.has(domain); needHint = !ok; }

  hintWrap?.classList.toggle("hidden", !needHint);
  emailInput.classList.toggle("input-error", !ok && v.length>0);
  startBtnEl.disabled = !ok;
  return ok;
}

// 初始禁用，防止未校验就提交；并触发一次校验（应对浏览器自动填充）
startBtnEl.disabled = true;
setTimeout(validateEmail, 0);


nameInput.addEventListener("input", () => {
  const sanitized = sanitizeName(nameInput.value);
  if (sanitized !== nameInput.value) nameInput.value = sanitized;
  if (sanitized && !NAME_RE.test(sanitized)) {
    showFormError("Name: only letters and spaces");
  } else {
    clearFormError();
  }
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
    showFormError("Name: only letters and spaces");
    nameInput.focus();
    return;
  }
// 新的 —— 使用 validateEmail()
if (!validateEmail()) {
  showFormError("请输入公共邮箱或点击上方蓝字允许学校/公司邮箱。");
  emailInput.focus();
  return;
}


  // disable 连点
  startBtnEl.disabled = true;
  startBtnEl.textContent = "Starting...";

  try {
    // 走你现有的开局流程
    state.player = { name, email };
    state.devMode = false; //devToggle.checked;

    state.levelIndex = 0;
    state.questionIndex = 0;
    state.score = 0;
    state.correctCount = 0;
    state.totalDurationMs = 0;

    instrNameEl.textContent = name;
    showScreen("instruction");
  } finally {
    setTimeout(() => {
      startBtnEl.disabled = false;
      startBtnEl.textContent = "START";
    }, 1000);
  }
});

// 🟢 说明画面按钮
instrNextBtn.addEventListener("click", () => {
  runLevelIntro();
});
//-------------------------------------------------------

// Countdown -> Target 
    function runLevelIntro()
    { const level = LEVELS[state.levelIndex];
    levelNameEl.textContent = level.label; 
    showScreen("countdown"); 
    const s3 = document.getElementById("count-3"); 
    const s2 = document.getElementById("count-2"); 
    const s1 = document.getElementById("count-1"); 
    const go = document.getElementById("count-go"); 
    [s3,s2,s1,go].forEach(n => n.classList.remove("show")); 
    
    let c = 3; 
    const seq = setInterval(()=>{ if(c===3) s3.classList.add("show"); 
        if(c===2) s2.classList.add("show"); 
        if(c===1) s1.classList.add("show"); 
        if(c===0){ go.classList.add("show"); 
        clearInterval(seq); 
        setTimeout(()=>prepareTargetAndShow(), 600);
     } 
     c--; }, 
     600); 
    }

async function prepareTargetAndShow(){
  // 先确定本题参数（主题/难度/set/正确格）
  pickRoundParams();

  // 清掉上一题的 DOM，避免“迟到图”插进来
  gridEl.innerHTML = "";
  targetPreview.innerHTML = "";

  // ⭐关键：预加载本轮9张图（解决答案先出、干扰图后到/空白）
  await preloadRoundAssets(state.theme, state.difficulty, state.setId);

  // 图片都准备好了，再渲染预览与切屏
  renderTargetPreview();
  showScreen("target");

  // 给布局一点缓冲，再进九宫格
  setTimeout(()=> startQuestionRound(), 2700);
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
  state.lastDelta = delta;  // 新增，记录该题得分
  scoreEl.textContent = state.score;
  
}

// Compare
function showAnswer(isCorrect, level, secsLeft){
  showScreen("answer");
  answerTitle.textContent = isCorrect ? "Correct ✅" : "Wrong ❌";

  const pick = state.lastPickIndex;
  const correct = state.correctIndex;
const timeUsed = Math.round((performance.now() - state.questionStartTs) / 1000);
const detailText = `
  ${isCorrect ? "You picked the right image!" : "Correct image shown on the left. Your choice on the right."}
  <br><br>
<span style="margin-right: 65px;"><strong>Time Used:</strong> ${timeUsed}s</span>
<strong>Score:</strong> ${state.lastDelta >= 0 ? "+" + state.lastDelta : state.lastDelta} <br>
<span style="margin-right: 40px;"><strong>Time Left:</strong> ${secsLeft}s</span>
<strong>Total Score:</strong> ${state.score}<br>
  

`;
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


//Fullscreen Settings
const fullscreenBtn = document.getElementById("fullscreen-btn");

fullscreenBtn.addEventListener("click", () => {
  const elem = document.documentElement; // 整个网页

  if (!document.fullscreenElement) {
    // 进入全屏
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { // Safari
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { // IE/Edge
      elem.msRequestFullscreen();
    }
    fullscreenBtn.textContent = "⛶ Exit Fullscreen";
  } else {
    // 退出全屏
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
    fullscreenBtn.textContent = "⛶ Fullscreen";
  }
});



// Certificate
downloadCertBtn.addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // 背景与边框
  doc.setFillColor(255, 255, 225);
  doc.setDrawColor(255, 196, 0);
  doc.setLineWidth(6);
  doc.rect(24, 24, w - 48, h - 48);

  // Logo 设置
  const logoPath = "logo/MMLM_logo.png"; // logo 路径
  const logoWidth = 350;
  const logoHeight = 130;
  const logoY = 65;

  // 加载图片（异步）
  const img = new Image();
  img.src = logoPath;
  img.onload = function () {
    const logoX = (w - logoWidth) / 2;
    doc.addImage(img, "PNG", logoX, logoY, logoWidth, logoHeight);

    // 所有文字整体往下移
    const yOffset = logoHeight + 5;

    doc.setTextColor(255, 140, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(30);
    doc.text(GAME_NAME, w / 2, 120 + yOffset, { align: "center" });

    doc.setTextColor(0, 0, 0);
    doc.setFont("times", "italic bold");
    doc.setFontSize(36);
    doc.text("Certificate of Achievement", w / 2, 180 + yOffset, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(18);
    doc.text(`This certificate is awarded to`, w / 2, 220 + yOffset, { align: "center" });

    doc.setTextColor(36, 36, 36);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(30);
    doc.text(state.player.name || "Player", w / 2, 270 + yOffset, { align: "center" });

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.8);
    doc.line(w * 0.25, 280 + yOffset, w * 0.75, 280 + yOffset);

    const acc = Math.round((state.correctCount / state.totalQuestions) * 100);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);
    doc.text(`with the following results:`, w / 2, 300 + yOffset, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.text(
      `Score: ${state.score}             Duration: ${msToClock(state.totalDurationMs)}`,
      w / 2,
      340 + yOffset,
      { align: "center" }
    );

    const dateStr = new Date().toLocaleDateString();
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${dateStr}`, w / 2, 390 + yOffset, { align: "center" });

    // 保存 PDF 到本地（可选）
    const fileName = `Certificate_${state.player.name || "player"}.pdf`;
    doc.save(fileName);

    // 生成 Blob 上传给后端
    const pdfBlob = doc.output("blob");

    // ⚠️ 确保 email 存在
    if (!state.player.email) {
      alert("⚠️ 未找到玩家邮箱，无法寄送证书。");
      return;
    }

    const formData = new FormData();
    formData.append("file", pdfBlob, fileName);
    formData.append("email", state.player.email);

    fetch("api/send_cert.php", {
      method: "POST",
      body: formData
    })
      .then(async (res) => {
        let text = await res.text(); // 安全读取（防止 HTML 错误）
        try {
          const data = JSON.parse(text);
          if (data.ok) {
            alert("✅ 证书已成功寄出到 " + state.player.email);
          } else {
            alert("❌ 无法寄出证书: " + (data.error || "未知错误"));
          }
        } catch (e) {
          alert("⚠️ 服务器返回格式错误:\n" + text);
        }
      })
      .catch((err) => {
        alert("⚠️ 上传失败: " + err.message);
      });
  };
});



playAgainBtn.addEventListener("click", ()=>{
  window.location.href = "./index.html";
});
