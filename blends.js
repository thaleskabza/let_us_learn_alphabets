const blends = [
  { blend: "br", letters: ["b", "r"], words: ["brag", "brick", "brim"] },
  { blend: "cr", letters: ["c", "r"], words: ["crop", "crab"] },
  { blend: "gr", letters: ["g", "r"], words: ["grin", "grab"] },
  { blend: "dr", letters: ["d", "r"], words: ["drag", "drum", "drop"] },
  { blend: "bl", letters: ["b", "l"], words: ["black", "blob", "blot"] },
  { blend: "cl", letters: ["c", "l"], words: ["clap", "clip", "click"] },
  { blend: "fl", letters: ["f", "l"], words: ["flag", "flip", "flat"] },
  { blend: "gl", letters: ["g", "l"], words: ["glad", "glum", "glow"] },
  { blend: "pl", letters: ["p", "l"], words: ["plan", "plot", "plum"] },
  { blend: "sl", letters: ["s", "l"], words: ["slap", "slim", "slot"] },
  { blend: "sm", letters: ["s", "m"], words: ["smog", "smug", "smell"] },
  { blend: "sn", letters: ["s", "n"], words: ["snap", "snip", "snug"] },
  { blend: "sp", letters: ["s", "p"], words: ["spot", "spin", "span"] },
  { blend: "st", letters: ["s", "t"], words: ["stop", "step", "stem"] },
  { blend: "sw", letters: ["s", "w"], words: ["swim", "swam", "swap"] },
  { blend: "tr", letters: ["t", "r"], words: ["trap", "trip", "trot"] }
];

const STORAGE_KEY = "littleLetterTracer.blendsProgress";

const successMessages = [
  { text: "Great tracing! ⭐", speech: "Great job! You traced" },
  { text: "Wonderful! ⭐", speech: "Wonderful! You traced" },
  { text: "You did it! ⭐", speech: "You did it! You traced" }
];

const tryAgainMessages = [
  { text: "Nice try! Trace a little more. 💜", speech: "Nice try! Let's trace a little more together." },
  { text: "So close! Keep going. 💜", speech: "So close! Keep tracing a little more." },
  { text: "You're doing great, just a bit more! 💜", speech: "You're doing great. Let's trace a little bit more." }
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

function speak(text, rate = 0.82) {
  if (!soundEnabled || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = selectedVoice?.lang || "en-GB";
  utterance.voice = selectedVoice;
  utterance.rate = rate;
  utterance.pitch = 1.35;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
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

  setText(text) {
    this.text = text;
    this._buildMask();
    this._drawGuide();
    this.clearInk();
  }

  setGuideVisible(visible) {
    this.guideVisible = visible;
    this._drawGuide();
  }

  _drawGuide() {
    const g = this.guideCtx;
    const size = this.size;
    g.save();
    g.clearRect(0, 0, size, size);

    if (this.guideVisible) {
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
const blendDots = document.getElementById("blendDots");
const previousBtn = document.getElementById("previousBtn");
const nextBtn = document.getElementById("nextBtn");
const soundToggle = document.getElementById("soundToggle");

const blendBig = document.getElementById("blendBig");
const blendPhonic = document.getElementById("blendPhonic");
const speakBlendBtn = document.getElementById("speakBlendBtn");
const wordsHeading = document.getElementById("wordsHeading");
const wordGrid = document.getElementById("wordGrid");

const letter1Label = document.getElementById("letter1Label");
const letter2Label = document.getElementById("letter2Label");
const letter1SpeakBtn = document.getElementById("letter1SpeakBtn");
const letter2SpeakBtn = document.getElementById("letter2SpeakBtn");
const letter1ClearBtn = document.getElementById("letter1ClearBtn");
const letter2ClearBtn = document.getElementById("letter2ClearBtn");

const clearBlendBtn = document.getElementById("clearBlendBtn");
const checkBlendBtn = document.getElementById("checkBlendBtn");
const showBlendGuideBtn = document.getElementById("showBlendGuideBtn");
const blendSuccessMessage = document.getElementById("blendSuccessMessage");

let currentIndex = 0;
let soundEnabled = true;
let completedBlends = new Set();
let stars = 0;

const letterPad1 = new TracePad({
  guideCanvas: document.getElementById("letter1GuideCanvas"),
  traceCanvas: document.getElementById("letter1TraceCanvas"),
  size: 320,
  lineWidth: 16,
  guideLineWidth: 12,
  maskLineWidth: 40
});

const letterPad2 = new TracePad({
  guideCanvas: document.getElementById("letter2GuideCanvas"),
  traceCanvas: document.getElementById("letter2TraceCanvas"),
  size: 320,
  lineWidth: 16,
  guideLineWidth: 12,
  maskLineWidth: 40
});

const blendPad = new TracePad({
  guideCanvas: document.getElementById("blendGuideCanvas"),
  traceCanvas: document.getElementById("blendTraceCanvas"),
  size: 700,
  lineWidth: 24,
  guideLineWidth: 18,
  maskLineWidth: 70,
  showLabel: true
});

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (Number.isInteger(data.currentIndex) && data.currentIndex >= 0 && data.currentIndex < blends.length) {
      currentIndex = data.currentIndex;
    }
    if (Array.isArray(data.completedBlends)) {
      completedBlends = new Set(
        data.completedBlends.filter(n => Number.isInteger(n) && n >= 0 && n < blends.length)
      );
    }
    if (Number.isInteger(data.stars) && data.stars >= 0) {
      stars = data.stars;
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
        currentIndex,
        stars,
        completedBlends: Array.from(completedBlends)
      })
    );
  } catch (err) {
    // Storage may be unavailable (e.g. private browsing) - progress just won't persist.
  }
}

function renderDots() {
  blendDots.innerHTML = "";
  blends.forEach((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "letter-dot";
    button.textContent = item.blend;
    button.setAttribute("aria-label", `Go to blend ${item.blend}`);
    if (index === currentIndex) button.classList.add("active");
    if (completedBlends.has(index)) button.classList.add("completed");
    button.addEventListener("click", () => {
      currentIndex = index;
      updateBlend(true);
    });
    blendDots.appendChild(button);
  });
}

function renderWordGrid(item) {
  wordGrid.innerHTML = "";
  item.words.forEach(word => {
    const rime = word.slice(item.blend.length);
    const card = document.createElement("button");
    card.type = "button";
    card.className = "word-card";
    card.innerHTML = `
      <span class="word-formula">${item.blend} + ${rime}</span>
      <span class="word-text">${word}</span>
    `;
    card.addEventListener("click", () => speak(word));
    wordGrid.appendChild(card);
  });
}

function updateBlend(announce = false) {
  const item = blends[currentIndex];

  blendBig.textContent = item.blend;
  blendPhonic.textContent = `Sounds like “${item.blend}”, as in “${item.words[0]}”.`;
  wordsHeading.textContent = `3. Words with “${item.blend}”`;
  progressText.textContent = `Blend ${currentIndex + 1} of ${blends.length}`;
  starsText.textContent = `⭐ ${stars} ${stars === 1 ? "star" : "stars"}`;
  progressBar.style.width = `${((currentIndex + 1) / blends.length) * 100}%`;

  previousBtn.disabled = currentIndex === 0;
  nextBtn.textContent = currentIndex === blends.length - 1 ? "Start again ↻" : "Next →";

  letter1Label.textContent = item.letters[0];
  letter2Label.textContent = item.letters[1];
  letterPad1.setText(item.letters[0]);
  letterPad2.setText(item.letters[1]);
  blendPad.setText(item.blend);
  blendSuccessMessage.classList.remove("show");

  renderWordGrid(item);
  renderDots();
  saveProgress();

  if (announce) {
    speak(`${item.blend}. ${item.blend}, as in ${item.words[0]}.`);
  }
}

checkBlendBtn.addEventListener("click", () => {
  const item = blends[currentIndex];
  const enoughTracing = blendPad.checkTrace();

  if (enoughTracing) {
    if (!completedBlends.has(currentIndex)) {
      completedBlends.add(currentIndex);
      stars += 1;
    }
    const msg = successMessages[Math.floor(Math.random() * successMessages.length)];
    blendSuccessMessage.textContent = msg.text;
    blendSuccessMessage.classList.add("show");
    speak(`${msg.speech} ${item.blend}.`);
    renderDots();
    starsText.textContent = `⭐ ${stars} ${stars === 1 ? "star" : "stars"}`;
    saveProgress();
  } else {
    const msg = tryAgainMessages[Math.floor(Math.random() * tryAgainMessages.length)];
    blendSuccessMessage.textContent = msg.text;
    blendSuccessMessage.classList.add("show");
    speak(msg.speech);
  }

  window.setTimeout(() => {
    blendSuccessMessage.classList.remove("show");
  }, 2600);
});

clearBlendBtn.addEventListener("click", () => {
  blendPad.clearInk();
  blendSuccessMessage.classList.remove("show");
});

showBlendGuideBtn.addEventListener("click", () => {
  const visible = !blendPad.guideVisible;
  blendPad.setGuideVisible(visible);
  showBlendGuideBtn.textContent = visible ? "Hide guide" : "Show guide";
});

speakBlendBtn.addEventListener("click", () => {
  const item = blends[currentIndex];
  speak(`${item.blend}, as in ${item.words[0]}.`);
});

letter1SpeakBtn.addEventListener("click", () => {
  speak(`The letter is ${blends[currentIndex].letters[0].toUpperCase()}.`);
});

letter2SpeakBtn.addEventListener("click", () => {
  speak(`The letter is ${blends[currentIndex].letters[1].toUpperCase()}.`);
});

letter1ClearBtn.addEventListener("click", () => letterPad1.clearInk());
letter2ClearBtn.addEventListener("click", () => letterPad2.clearInk());

soundToggle.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundToggle.textContent = soundEnabled ? "🔊 Sound On" : "🔇 Sound Off";
  soundToggle.setAttribute("aria-pressed", String(soundEnabled));
  if (!soundEnabled && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
});

previousBtn.addEventListener("click", () => {
  if (currentIndex > 0) {
    currentIndex -= 1;
    updateBlend(true);
  }
});

nextBtn.addEventListener("click", () => {
  currentIndex = currentIndex === blends.length - 1 ? 0 : currentIndex + 1;
  updateBlend(true);
});

loadProgress();
renderDots();
updateBlend(false);
