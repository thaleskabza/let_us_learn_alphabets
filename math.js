const numbers = Array.from({ length: 101 }, (_, i) => i);

const countingChallenges = [
  { step: 2, start: 30 },
  { step: 2, start: 40 },
  { step: 2, start: 50 },
  { step: 5, start: 30 },
  { step: 5, start: 50 },
  { step: 5, start: 70 },
  { step: 5, start: 80 }
];

const equations = [
  { display: "7 = 4 + __", answer: 3 },
  { display: "6 = __ − 3", answer: 9 },
  { display: "8 = __ − 5", answer: 13 },
  { display: "5 = __ − 3", answer: 8 },
  { display: "5 = 8 − __", answer: 3 },
  { display: "6 = 7 − __", answer: 1 },
  { display: "4 = 7 − __", answer: 3 },
  { display: "5 = 10 − __", answer: 5 },
  { display: "5 + 3 = __", answer: 8 },
  { display: "3 + 5 = __", answer: 8 }
];

const ONES_WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"
];
const TENS_WORDS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function numberToWords(n) {
  if (n === 100) return "one hundred";
  if (n < 20) return ONES_WORDS[n];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return ones === 0 ? TENS_WORDS[tens] : `${TENS_WORDS[tens]} ${ONES_WORDS[ones]}`;
}

const STORAGE_KEY = "littleLetterTracer.mathProgress";

const traceSuccessMessages = [
  { text: "Great tracing! ⭐", speech: "Great job! You traced" },
  { text: "Wonderful! ⭐", speech: "Wonderful! You traced" },
  { text: "You did it! ⭐", speech: "You did it! You traced" }
];

const traceTryAgainMessages = [
  { text: "Nice try! Trace a little more. 💜", speech: "Nice try! Let's trace a little more together." },
  { text: "So close! Keep going. 💜", speech: "So close! Keep tracing a little more." },
  { text: "You're doing great, just a bit more! 💜", speech: "You're doing great. Let's trace a little bit more." }
];

const quizSuccessMessages = [
  { text: "Yes! ⭐", speech: "Yes! That's right!" },
  { text: "You got it! ⭐", speech: "You got it!" },
  { text: "Great counting! ⭐", speech: "Great counting!" }
];

const quizTryAgainMessages = [
  { text: "Not quite, try again! 💜", speech: "Not quite. Try again." },
  { text: "So close! 💜", speech: "So close! Try again." },
  { text: "Keep thinking! 💜", speech: "Keep thinking. You can do it." }
];

const KID_VOICE_PATTERN = /\bkid\b|\bchild\b|junior|\bjr\b|\bboy\b|\bgirl\b|kathy/i;
const FEMALE_VOICE_PATTERN = /female|samantha|victoria|karen|moira|tessa|fiona|serena|zira|susan|kate|allison|ava|emma|joanna|kimberly|salli|nicole|amy|hazel|libby|olivia|sonia/i;

let selectedVoice = null;

function pickVoice(voices, langPattern) {
  const inLang = voices.filter(v => langPattern.test(v.lang));
  return (
    inLang.find(v => KID_VOICE_PATTERN.test(v.name)) ||
    inLang.find(v => FEMALE_VOICE_PATTERN.test(v.name)) ||
    inLang[0] ||
    null
  );
}

function setupVoice() {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  selectedVoice =
    pickVoice(voices, /en-GB/i) ||
    pickVoice(voices, /en-ZA/i) ||
    pickVoice(voices, /^en/i) ||
    voices.find(v => KID_VOICE_PATTERN.test(v.name)) ||
    voices.find(v => FEMALE_VOICE_PATTERN.test(v.name)) ||
    null;
}

if ("speechSynthesis" in window) {
  setupVoice();
  window.speechSynthesis.onvoiceschanged = setupVoice;
}

let speechGeneration = 0;

function speak(text, rate = 0.82) {
  speakSequence([{ text, rate }]);
}

function speakSequence(parts) {
  if (!soundEnabled || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  speechGeneration += 1;
  const myGeneration = speechGeneration;

  let i = 0;
  function playNext() {
    if (myGeneration !== speechGeneration) return;
    if (i >= parts.length) return;
    const part = parts[i];
    i += 1;
    const utterance = new SpeechSynthesisUtterance(part.text);
    utterance.lang = selectedVoice?.lang || "en-GB";
    utterance.voice = selectedVoice;
    utterance.rate = part.rate ?? 0.82;
    utterance.pitch = 1.35;
    utterance.volume = 1;
    utterance.onend = () => window.setTimeout(playNext, part.pauseAfter ?? 150);
    utterance.onerror = () => window.setTimeout(playNext, part.pauseAfter ?? 150);
    window.speechSynthesis.speak(utterance);
  }
  playNext();
}

class TracePad {
  constructor({ guideCanvas, traceCanvas, size, lineWidth = 24, guideLineWidth = 18, maskLineWidth = 70, showLabel = false }) {
    this.guideCanvas = guideCanvas;
    this.guideCtx = guideCanvas.getContext("2d");
    this.traceCanvas = traceCanvas;
    this.ctx = traceCanvas.getContext("2d", { willReadFrequently: true });
    this.size = size;
    this.lineWidth = lineWidth;
    this.guideLineWidth = guideLineWidth;
    this.maskLineWidth = maskLineWidth;
    this.showLabel = showLabel;
    this.fontPx = Math.round(size * 0.7);

    this.maskCanvas = document.createElement("canvas");
    this.maskCanvas.width = size;
    this.maskCanvas.height = size;
    this.maskCtx = this.maskCanvas.getContext("2d", { willReadFrequently: true });

    this.guideMask = null;
    this.guideMaskTotal = 0;
    this.guideVisible = true;
    this.drawing = false;
    this.text = "";

    traceCanvas.addEventListener("pointerdown", e => this._start(e));
    traceCanvas.addEventListener("pointermove", e => this._move(e));
    traceCanvas.addEventListener("pointerup", e => this._stop(e));
    traceCanvas.addEventListener("pointerleave", e => this._stop(e));
    traceCanvas.addEventListener("pointercancel", e => this._stop(e));
  }

  _point(event) {
    const rect = this.traceCanvas.getBoundingClientRect();
    const clientX = event.touches?.[0]?.clientX ?? event.clientX;
    const clientY = event.touches?.[0]?.clientY ?? event.clientY;
    return {
      x: (clientX - rect.left) * (this.traceCanvas.width / rect.width),
      y: (clientY - rect.top) * (this.traceCanvas.height / rect.height)
    };
  }

  _start(event) {
    event.preventDefault();
    this.drawing = true;
    const p = this._point(event);
    this.ctx.beginPath();
    this.ctx.moveTo(p.x, p.y);
  }

  _move(event) {
    if (!this.drawing) return;
    event.preventDefault();
    const p = this._point(event);
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
    this.ctx.strokeStyle = "#263238";
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.lineTo(p.x, p.y);
    this.ctx.stroke();
  }

  _stop(event) {
    if (event) event.preventDefault();
    this.drawing = false;
    this.ctx.closePath();
  }

  _computeFontPx(text) {
    const len = text.length;
    if (len <= 1) return Math.round(this.size * 0.7);
    if (len === 2) return Math.round(this.size * 0.6);
    return Math.round(this.size * 0.4);
  }

  setText(text) {
    this.text = text;
    this.fontPx = this._computeFontPx(text);
    this._buildMask();
    this._drawGuide();
    this.clearInk();
  }

  setGuideVisible(visible) {
    this.guideVisible = visible;
    this.guideCanvas.style.opacity = visible ? "1" : "0";
  }

  _drawGuide() {
    const g = this.guideCtx;
    const size = this.size;
    g.save();
    g.clearRect(0, 0, size, size);

    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = `bold ${this.fontPx}px Arial, sans-serif`;
    g.lineWidth = this.guideLineWidth;
    g.setLineDash([this.guideLineWidth * 1.3, this.guideLineWidth * 1.1]);
    g.strokeStyle = "rgba(108, 92, 231, 0.34)";
    g.strokeText(this.text, size / 2, size / 2 + size * 0.04);
    g.setLineDash([]);

    g.fillStyle = "#2ecc71";
    g.beginPath();
    g.arc(size * 0.28, size * 0.2, Math.max(6, size * 0.02), 0, Math.PI * 2);
    g.fill();

    if (this.showLabel) {
      g.fillStyle = "#263238";
      g.font = `bold ${Math.max(14, Math.round(size * 0.034))}px Arial`;
      g.textAlign = "left";
      g.fillText("START", size * 0.28 + size * 0.03, size * 0.2 + size * 0.01);
    }

    g.restore();
  }

  _buildMask() {
    const m = this.maskCtx;
    const size = this.size;
    m.clearRect(0, 0, size, size);
    m.textAlign = "center";
    m.textBaseline = "middle";
    m.font = `bold ${this.fontPx}px Arial, sans-serif`;
    m.lineWidth = this.maskLineWidth;
    m.strokeStyle = "#000";
    m.strokeText(this.text, size / 2, size / 2 + size * 0.04);

    const data = m.getImageData(0, 0, size, size).data;
    this.guideMask = new Uint8Array(size * size);
    this.guideMaskTotal = 0;
    for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
      if (data[i + 3] > 0) {
        this.guideMask[p] = 1;
        this.guideMaskTotal += 1;
      }
    }
  }

  clearInk() {
    this.ctx.clearRect(0, 0, this.traceCanvas.width, this.traceCanvas.height);
  }

  checkTrace() {
    const { data } = this.ctx.getImageData(0, 0, this.traceCanvas.width, this.traceCanvas.height);
    let inkCount = 0;
    let onGuideCount = 0;
    for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
      if (data[i + 3] > 10) {
        inkCount += 1;
        if (this.guideMask && this.guideMask[p]) onGuideCount += 1;
      }
    }
    const accuracy = inkCount > 0 ? onGuideCount / inkCount : 0;
    const minInk = Math.max(150, this.guideMaskTotal * 0.04);
    return inkCount > minInk && accuracy > 0.45;
  }
}

const progressText = document.getElementById("progressText");
const starsText = document.getElementById("starsText");
const progressBar = document.getElementById("progressBar");
const soundToggle = document.getElementById("soundToggle");

let soundEnabled = true;
let stars = 0;

let numberIndex = 0;
let numbersCompleted = new Set();

let countingIndex = 0;
let countingCompleted = new Set();

let equationIndex = 0;
let equationsCompleted = new Set();

let activeTab = "numbers";

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (Number.isInteger(data.stars) && data.stars >= 0) stars = data.stars;
    if (Number.isInteger(data.numberIndex) && data.numberIndex >= 0 && data.numberIndex <= 100) {
      numberIndex = data.numberIndex;
    }
    if (Array.isArray(data.numbersCompleted)) {
      numbersCompleted = new Set(data.numbersCompleted.filter(n => Number.isInteger(n) && n >= 0 && n <= 100));
    }
    if (Number.isInteger(data.countingIndex) && data.countingIndex >= 0 && data.countingIndex < countingChallenges.length) {
      countingIndex = data.countingIndex;
    }
    if (Array.isArray(data.countingCompleted)) {
      countingCompleted = new Set(
        data.countingCompleted.filter(n => Number.isInteger(n) && n >= 0 && n < countingChallenges.length)
      );
    }
    if (Number.isInteger(data.equationIndex) && data.equationIndex >= 0 && data.equationIndex < equations.length) {
      equationIndex = data.equationIndex;
    }
    if (Array.isArray(data.equationsCompleted)) {
      equationsCompleted = new Set(
        data.equationsCompleted.filter(n => Number.isInteger(n) && n >= 0 && n < equations.length)
      );
    }
    if (["numbers", "counting", "equations"].includes(data.activeTab)) {
      activeTab = data.activeTab;
    }
  } catch (err) {
    // Storage may be unavailable or corrupted (e.g. private browsing) - just start fresh.
  }
}

function saveProgress() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        stars,
        numberIndex,
        numbersCompleted: Array.from(numbersCompleted),
        countingIndex,
        countingCompleted: Array.from(countingCompleted),
        equationIndex,
        equationsCompleted: Array.from(equationsCompleted),
        activeTab
      })
    );
  } catch (err) {
    // Storage may be unavailable (e.g. private browsing) - progress just won't persist.
  }
}

function pulseStars() {
  starsText.classList.remove("pulse-pop");
  void starsText.offsetWidth;
  starsText.classList.add("pulse-pop");
}

function updateProgressPanel() {
  starsText.textContent = `⭐ ${stars} ${stars === 1 ? "star" : "stars"}`;
  if (activeTab === "numbers") {
    progressText.textContent = `Number ${numberIndex} (0-100)`;
    progressBar.style.transform = `scaleX(${Math.max(numberIndex, 1) / 100})`;
  } else if (activeTab === "counting") {
    progressText.textContent = `Challenge ${countingIndex + 1} of ${countingChallenges.length}`;
    progressBar.style.transform = `scaleX(${(countingIndex + 1) / countingChallenges.length})`;
  } else {
    progressText.textContent = `Equation ${equationIndex + 1} of ${equations.length}`;
    progressBar.style.transform = `scaleX(${(equationIndex + 1) / equations.length})`;
  }
}

const tabButtons = {
  numbers: document.getElementById("tabNumbersBtn"),
  counting: document.getElementById("tabCountingBtn"),
  equations: document.getElementById("tabEquationsBtn")
};
const views = {
  numbers: document.getElementById("numbersView"),
  counting: document.getElementById("countingView"),
  equations: document.getElementById("equationsView")
};

function setActiveTab(tab) {
  activeTab = tab;
  Object.keys(views).forEach(key => {
    views[key].hidden = key !== tab;
    tabButtons[key].classList.toggle("active", key === tab);
  });
  updateProgressPanel();
  saveProgress();
}

Object.keys(tabButtons).forEach(key => {
  tabButtons[key].addEventListener("click", () => setActiveTab(key));
});

soundToggle.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundToggle.textContent = soundEnabled ? "🔊 Sound On" : "🔇 Sound Off";
  soundToggle.setAttribute("aria-pressed", String(soundEnabled));
  if (!soundEnabled && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
});

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildOptions(correct, spread, max) {
  const pool = new Set([correct]);
  let guard = 0;
  while (pool.size < 4 && guard < 50) {
    guard += 1;
    const delta = Math.floor(Math.random() * (spread * 2 + 1)) - spread;
    const candidate = correct + delta;
    if (candidate >= 0 && candidate <= max && !pool.has(candidate)) {
      pool.add(candidate);
    }
  }
  return shuffle(Array.from(pool));
}

function renderAnswerPad(container, correct, spread, max, onPick) {
  container.innerHTML = "";
  const options = buildOptions(correct, spread, max);
  const buttons = [];
  options.forEach(value => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "answer-btn";
    btn.textContent = String(value);
    btn.addEventListener("click", () => onPick(value, btn, buttons));
    container.appendChild(btn);
    buttons.push(btn);
  });
}

function celebrateQuiz(el, correct) {
  const pool = correct ? quizSuccessMessages : quizTryAgainMessages;
  const msg = pool[Math.floor(Math.random() * pool.length)];
  el.textContent = msg.text;
  el.classList.add("show");
  speak(msg.speech);
  window.setTimeout(() => el.classList.remove("show"), 2600);
}

function renderDotsFor(kind) {
  const isCounting = kind === "counting";
  const container = isCounting ? countingDots : equationDots;
  const list = isCounting ? countingChallenges : equations;
  const current = isCounting ? countingIndex : equationIndex;
  const completed = isCounting ? countingCompleted : equationsCompleted;

  container.innerHTML = "";
  list.forEach((_, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "letter-dot";
    button.textContent = String(index + 1);
    button.setAttribute("aria-label", `Go to item ${index + 1}`);
    if (index === current) button.classList.add("active");
    if (completed.has(index)) button.classList.add("completed");
    button.addEventListener("click", () => {
      if (isCounting) {
        countingIndex = index;
        renderCounting(true);
      } else {
        equationIndex = index;
        renderEquation(true);
      }
    });
    container.appendChild(button);
  });
}

const numberDisplay = document.getElementById("numberDisplay");
const numberWord = document.getElementById("numberWord");
const numberJumpSelect = document.getElementById("numberJumpSelect");
const speakNumberBtn = document.getElementById("speakNumberBtn");
const clearNumberBtn = document.getElementById("clearNumberBtn");
const checkNumberBtn = document.getElementById("checkNumberBtn");
const showNumberGuideBtn = document.getElementById("showNumberGuideBtn");
const numberSuccessMessage = document.getElementById("numberSuccessMessage");
const numberPrevBtn = document.getElementById("numberPrevBtn");
const numberNextBtn = document.getElementById("numberNextBtn");
const numberGuideCanvas = document.getElementById("numberGuideCanvas");
const numberTraceCanvas = document.getElementById("numberTraceCanvas");

const numberPad = new TracePad({
  guideCanvas: numberGuideCanvas,
  traceCanvas: numberTraceCanvas,
  size: 700,
  lineWidth: 24,
  guideLineWidth: 18,
  maskLineWidth: 70,
  showLabel: true
});

numbers.forEach(n => {
  const opt = document.createElement("option");
  opt.value = String(n);
  opt.textContent = String(n);
  numberJumpSelect.appendChild(opt);
});

function updateNumber(announce = false) {
  const n = numberIndex;
  numberDisplay.textContent = String(n);
  numberWord.textContent = numberToWords(n);
  numberJumpSelect.value = String(n);
  numberPrevBtn.disabled = n === 0;
  numberNextBtn.textContent = n === 100 ? "Start again ↻" : "Next →";
  numberPad.setText(String(n));
  numberSuccessMessage.classList.remove("show");
  updateProgressPanel();
  saveProgress();
  if (announce) {
    speak(`${n}. ${numberToWords(n)}.`);
  }
}

checkNumberBtn.addEventListener("click", () => {
  const enoughTracing = numberPad.checkTrace();
  if (enoughTracing) {
    const earnedNewStar = !numbersCompleted.has(numberIndex);
    if (earnedNewStar) {
      numbersCompleted.add(numberIndex);
      stars += 1;
    }
    const msg = traceSuccessMessages[Math.floor(Math.random() * traceSuccessMessages.length)];
    numberSuccessMessage.textContent = msg.text;
    numberSuccessMessage.classList.add("show");
    speak(`${msg.speech} the number ${numberIndex}.`);
    if (earnedNewStar) pulseStars();
    updateProgressPanel();
    saveProgress();
  } else {
    const msg = traceTryAgainMessages[Math.floor(Math.random() * traceTryAgainMessages.length)];
    numberSuccessMessage.textContent = msg.text;
    numberSuccessMessage.classList.add("show");
    speak(msg.speech);
  }
  window.setTimeout(() => numberSuccessMessage.classList.remove("show"), 2600);
});

clearNumberBtn.addEventListener("click", () => {
  numberPad.clearInk();
  numberSuccessMessage.classList.remove("show");
});

showNumberGuideBtn.addEventListener("click", () => {
  const visible = !numberPad.guideVisible;
  numberPad.setGuideVisible(visible);
  showNumberGuideBtn.textContent = visible ? "Hide guide" : "Show guide";
});

speakNumberBtn.addEventListener("click", () => {
  speak(`${numberIndex}. ${numberToWords(numberIndex)}.`);
});

numberJumpSelect.addEventListener("change", () => {
  numberIndex = Number(numberJumpSelect.value);
  updateNumber(true);
});

numberPrevBtn.addEventListener("click", () => {
  if (numberIndex > 0) {
    numberIndex -= 1;
    updateNumber(true);
  }
});

numberNextBtn.addEventListener("click", () => {
  numberIndex = numberIndex === 100 ? 0 : numberIndex + 1;
  updateNumber(true);
});

const countingSequenceEl = document.getElementById("countingSequence");
const countingAnswerPad = document.getElementById("countingAnswerPad");
const countingTitle = document.getElementById("countingTitle");
const countingSuccessMessage = document.getElementById("countingSuccessMessage");
const countingDots = document.getElementById("countingDots");
const countingPrevBtn = document.getElementById("countingPrevBtn");
const countingNextBtn = document.getElementById("countingNextBtn");

function buildCountingTerms(ch) {
  const terms = [0, 1, 2, 3].map(i => ch.start + i * ch.step);
  const blank = ch.start + 4 * ch.step;
  return { terms, blank };
}

function renderCounting(announce = false) {
  const ch = countingChallenges[countingIndex];
  const { terms, blank } = buildCountingTerms(ch);

  countingTitle.textContent = `Count by ${ch.step}s`;
  countingSequenceEl.innerHTML = "";
  terms.forEach(t => {
    const chip = document.createElement("span");
    chip.className = "count-chip";
    chip.textContent = String(t);
    countingSequenceEl.appendChild(chip);
  });
  const blankChip = document.createElement("span");
  blankChip.className = "count-chip blank";
  blankChip.textContent = "?";
  countingSequenceEl.appendChild(blankChip);

  countingSuccessMessage.classList.remove("show");

  renderAnswerPad(countingAnswerPad, blank, ch.step * 2, 100, (picked, btn, allButtons) => {
    if (picked === blank) {
      blankChip.textContent = String(blank);
      blankChip.classList.remove("blank");
      blankChip.classList.add("filled");
      btn.classList.add("correct");
      allButtons.forEach(b => { b.disabled = true; });
      const earnedNewStar = !countingCompleted.has(countingIndex);
      if (earnedNewStar) {
        countingCompleted.add(countingIndex);
        stars += 1;
        pulseStars();
      }
      celebrateQuiz(countingSuccessMessage, true);
      renderDotsFor("counting");
      updateProgressPanel();
      saveProgress();
    } else {
      btn.classList.add("wrong");
      btn.disabled = true;
      celebrateQuiz(countingSuccessMessage, false);
    }
  });

  countingPrevBtn.disabled = countingIndex === 0;
  countingNextBtn.textContent = countingIndex === countingChallenges.length - 1 ? "Start again ↻" : "Next →";
  renderDotsFor("counting");
  updateProgressPanel();
  saveProgress();

  if (announce) {
    speak(`Count by ${ch.step}s. ${terms.join(", ")}. And then?`);
  }
}

countingPrevBtn.addEventListener("click", () => {
  if (countingIndex > 0) {
    countingIndex -= 1;
    renderCounting(true);
  }
});

countingNextBtn.addEventListener("click", () => {
  countingIndex = countingIndex === countingChallenges.length - 1 ? 0 : countingIndex + 1;
  renderCounting(true);
});

const equationDisplay = document.getElementById("equationDisplay");
const equationAnswerPad = document.getElementById("equationAnswerPad");
const equationSuccessMessage = document.getElementById("equationSuccessMessage");
const equationDots = document.getElementById("equationDots");
const equationPrevBtn = document.getElementById("equationPrevBtn");
const equationNextBtn = document.getElementById("equationNextBtn");

function renderEquation(announce = false) {
  const eq = equations[equationIndex];
  const [before, after] = eq.display.split("__");

  equationDisplay.innerHTML = "";
  const beforeSpan = document.createElement("span");
  beforeSpan.textContent = before;
  const blankSpan = document.createElement("span");
  blankSpan.className = "equation-blank";
  blankSpan.textContent = "?";
  const afterSpan = document.createElement("span");
  afterSpan.textContent = after;
  equationDisplay.append(beforeSpan, blankSpan, afterSpan);

  equationSuccessMessage.classList.remove("show");

  renderAnswerPad(equationAnswerPad, eq.answer, 4, 15, (picked, btn, allButtons) => {
    if (picked === eq.answer) {
      blankSpan.textContent = String(eq.answer);
      blankSpan.classList.add("filled");
      btn.classList.add("correct");
      allButtons.forEach(b => { b.disabled = true; });
      const earnedNewStar = !equationsCompleted.has(equationIndex);
      if (earnedNewStar) {
        equationsCompleted.add(equationIndex);
        stars += 1;
        pulseStars();
      }
      celebrateQuiz(equationSuccessMessage, true);
      renderDotsFor("equations");
      updateProgressPanel();
      saveProgress();
    } else {
      btn.classList.add("wrong");
      btn.disabled = true;
      celebrateQuiz(equationSuccessMessage, false);
    }
  });

  equationPrevBtn.disabled = equationIndex === 0;
  equationNextBtn.textContent = equationIndex === equations.length - 1 ? "Start again ↻" : "Next →";
  renderDotsFor("equations");
  updateProgressPanel();
  saveProgress();

  if (announce) {
    speak(eq.display.replace("__", "what number"));
  }
}

equationPrevBtn.addEventListener("click", () => {
  if (equationIndex > 0) {
    equationIndex -= 1;
    renderEquation(true);
  }
});

equationNextBtn.addEventListener("click", () => {
  equationIndex = equationIndex === equations.length - 1 ? 0 : equationIndex + 1;
  renderEquation(true);
});

loadProgress();
updateNumber(false);
renderCounting(false);
renderEquation(false);
setActiveTab(activeTab);
