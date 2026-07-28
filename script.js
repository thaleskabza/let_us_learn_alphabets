const letters = [
  { letter: "A", word: "Apple", emoji: "🍎", soundLabel: "ah", soundSpeech: "ah, as in apple" },
  { letter: "B", word: "Ball", emoji: "⚽", soundLabel: "buh", soundSpeech: "buh, as in ball" },
  { letter: "C", word: "Cat", emoji: "🐱", soundLabel: "kuh", soundSpeech: "kuh, as in cat" },
  { letter: "D", word: "Dog", emoji: "🐶", soundLabel: "duh", soundSpeech: "duh, as in dog" },
  { letter: "E", word: "Egg", emoji: "🥚", soundLabel: "eh", soundSpeech: "eh, as in egg" },
  { letter: "F", word: "Fish", emoji: "🐟", soundLabel: "fff", soundSpeech: "fff, as in fish" },
  { letter: "G", word: "Goat", emoji: "🐐", soundLabel: "guh", soundSpeech: "guh, as in goat" },
  { letter: "H", word: "Hat", emoji: "🎩", soundLabel: "huh", soundSpeech: "huh, as in hat" },
  { letter: "I", word: "Igloo", emoji: "🧊", soundLabel: "ih", soundSpeech: "ih, as in igloo" },
  { letter: "J", word: "Jam", emoji: "🍓", soundLabel: "juh", soundSpeech: "juh, as in jam" },
  { letter: "K", word: "Kite", emoji: "🪁", soundLabel: "kuh", soundSpeech: "kuh, as in kite" },
  { letter: "L", word: "Lion", emoji: "🦁", soundLabel: "lll", soundSpeech: "lll, as in lion" },
  { letter: "M", word: "Moon", emoji: "🌙", soundLabel: "mmm", soundSpeech: "mmm, as in moon" },
  { letter: "N", word: "Nest", emoji: "🪺", soundLabel: "nnn", soundSpeech: "nnn, as in nest" },
  { letter: "O", word: "Orange", emoji: "🍊", soundLabel: "oh", soundSpeech: "oh, as in orange" },
  { letter: "P", word: "Pig", emoji: "🐷", soundLabel: "puh", soundSpeech: "puh, as in pig" },
  { letter: "Q", word: "Queen", emoji: "👑", soundLabel: "kwuh", soundSpeech: "kwuh, as in queen" },
  { letter: "R", word: "Rabbit", emoji: "🐰", soundLabel: "rrr", soundSpeech: "rrr, as in rabbit" },
  { letter: "S", word: "Sun", emoji: "☀️", soundLabel: "sss", soundSpeech: "sss, as in sun" },
  { letter: "T", word: "Tiger", emoji: "🐯", soundLabel: "tuh", soundSpeech: "tuh, as in tiger" },
  { letter: "U", word: "Umbrella", emoji: "☂️", soundLabel: "uh", soundSpeech: "uh, as in umbrella" },
  { letter: "V", word: "Van", emoji: "🚐", soundLabel: "vvv", soundSpeech: "vvv, as in van" },
  { letter: "W", word: "Watch", emoji: "⌚", soundLabel: "wuh", soundSpeech: "wuh, as in watch" },
  { letter: "X", word: "Fox", emoji: "🦊", soundLabel: "ks", soundSpeech: "ks, as at the end of fox" },
  { letter: "Y", word: "Yo-yo", emoji: "🪀", soundLabel: "yuh", soundSpeech: "yuh, as in yo yo" },
  { letter: "Z", word: "Zebra", emoji: "🦓", soundLabel: "zzz", soundSpeech: "zzz, as in zebra" }
];

const guideCanvas = document.getElementById("guideCanvas");
const guideCtx = guideCanvas.getContext("2d");
const canvas = document.getElementById("traceCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

const maskCanvas = document.createElement("canvas");
maskCanvas.width = canvas.width;
maskCanvas.height = canvas.height;
const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });

const uppercaseLetter = document.getElementById("uppercaseLetter");
const lowercaseLetter = document.getElementById("lowercaseLetter");
const letterTitle = document.getElementById("letterTitle");
const phonicText = document.getElementById("phonicText");
const progressText = document.getElementById("progressText");
const starsText = document.getElementById("starsText");
const progressBar = document.getElementById("progressBar");
const letterDots = document.getElementById("letterDots");
const successMessage = document.getElementById("successMessage");

const speakNameBtn = document.getElementById("speakNameBtn");
const speakSoundBtn = document.getElementById("speakSoundBtn");
const speakWordBtn = document.getElementById("speakWordBtn");
const soundToggle = document.getElementById("soundToggle");
const uppercaseBtn = document.getElementById("uppercaseBtn");
const lowercaseBtn = document.getElementById("lowercaseBtn");
const clearBtn = document.getElementById("clearBtn");
const checkBtn = document.getElementById("checkBtn");
const showGuideBtn = document.getElementById("showGuideBtn");
const previousBtn = document.getElementById("previousBtn");
const nextBtn = document.getElementById("nextBtn");

const STORAGE_KEY = "littleLetterTracer.progress";

const successMessages = [
  { text: "Great tracing! ⭐", speech: "Great job! You traced the letter" },
  { text: "Wonderful! ⭐", speech: "Wonderful! You traced the letter" },
  { text: "You did it! ⭐", speech: "You did it! You traced the letter" }
];

const tryAgainMessages = [
  { text: "Nice try! Trace a little more. 💜", speech: "Nice try! Let's trace a little more together." },
  { text: "So close! Keep going. 💜", speech: "So close! Keep tracing a little more." },
  { text: "You're doing great, just a bit more! 💜", speech: "You're doing great. Let's trace a little bit more." }
];

let currentIndex = 0;
let currentCase = "uppercase";
let drawing = false;
let guideVisible = true;
let soundEnabled = true;
let completedLetters = new Set();
let stars = 0;
let selectedVoice = null;
let guideMask = null;
let guideMaskTotal = 0;

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (Number.isInteger(data.currentIndex) && data.currentIndex >= 0 && data.currentIndex < letters.length) {
      currentIndex = data.currentIndex;
    }
    if (Array.isArray(data.completedLetters)) {
      completedLetters = new Set(
        data.completedLetters.filter(n => Number.isInteger(n) && n >= 0 && n < letters.length)
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
        completedLetters: Array.from(completedLetters)
      })
    );
  } catch (err) {
    // Storage may be unavailable (e.g. private browsing) - progress just won't persist.
  }
}

const KID_VOICE_PATTERN = /\bkid\b|\bchild\b|junior|\bjr\b|\bboy\b|\bgirl\b|kathy/i;
const FEMALE_VOICE_PATTERN = /female|samantha|victoria|karen|moira|tessa|fiona|serena|zira|susan|kate|allison|ava|emma|joanna|kimberly|salli|nicole|amy|hazel|libby|olivia|sonia/i;

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

function renderDots() {
  letterDots.innerHTML = "";
  letters.forEach((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "letter-dot";
    button.textContent = item.letter;
    button.setAttribute("aria-label", `Go to letter ${item.letter}`);
    if (index === currentIndex) button.classList.add("active");
    if (completedLetters.has(index)) button.classList.add("completed");
    button.addEventListener("click", () => {
      currentIndex = index;
      updateLetter(true);
    });
    letterDots.appendChild(button);
  });
}

function updateLetter(announce = false) {
  const item = letters[currentIndex];
  uppercaseLetter.textContent = item.letter;
  lowercaseLetter.textContent = item.letter.toLowerCase();
  letterTitle.textContent = `${item.letter} is for ${item.word} ${item.emoji}`;
  phonicText.textContent = `Sounds like “${item.soundLabel}”`;
  progressText.textContent = `Letter ${currentIndex + 1} of ${letters.length}`;
  starsText.textContent = `⭐ ${stars} ${stars === 1 ? "star" : "stars"}`;
  progressBar.style.width = `${((currentIndex + 1) / letters.length) * 100}%`;

  previousBtn.disabled = currentIndex === 0;
  nextBtn.textContent = currentIndex === letters.length - 1 ? "Start again ↻" : "Next →";

  renderDots();
  buildGuideMask();
  drawGuide();
  clearCanvas();
  saveProgress();
  if (announce) {
    speak(`${item.letter}. ${item.letter} is for ${item.word}.`);
  }
}

function letterFont() {
  return currentCase === "uppercase"
    ? "bold 500px Arial, sans-serif"
    : "bold 520px Arial, sans-serif";
}

function displayLetter() {
  const item = letters[currentIndex];
  return currentCase === "uppercase" ? item.letter : item.letter.toLowerCase();
}

function buildGuideMask() {
  maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
  maskCtx.textAlign = "center";
  maskCtx.textBaseline = "middle";
  maskCtx.font = letterFont();
  maskCtx.lineWidth = 70;
  maskCtx.strokeStyle = "#000";
  maskCtx.strokeText(displayLetter(), maskCanvas.width / 2, maskCanvas.height / 2 + 28);

  const data = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height).data;
  guideMask = new Uint8Array(maskCanvas.width * maskCanvas.height);
  guideMaskTotal = 0;
  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    if (data[i + 3] > 0) {
      guideMask[p] = 1;
      guideMaskTotal += 1;
    }
  }
}

function drawGuide() {
  guideCtx.save();
  guideCtx.clearRect(0, 0, guideCanvas.width, guideCanvas.height);

  if (guideVisible) {
    guideCtx.textAlign = "center";
    guideCtx.textBaseline = "middle";
    guideCtx.font = letterFont();
    guideCtx.lineWidth = 18;
    guideCtx.setLineDash([24, 20]);
    guideCtx.strokeStyle = "rgba(108, 92, 231, 0.34)";
    guideCtx.strokeText(displayLetter(), guideCanvas.width / 2, guideCanvas.height / 2 + 28);
    guideCtx.setLineDash([]);

    guideCtx.fillStyle = "#2ecc71";
    guideCtx.beginPath();
    guideCtx.arc(guideCanvas.width * 0.32, guideCanvas.height * 0.18, 14, 0, Math.PI * 2);
    guideCtx.fill();

    guideCtx.fillStyle = "#263238";
    guideCtx.font = "bold 24px Arial";
    guideCtx.textAlign = "left";
    guideCtx.fillText("START", guideCanvas.width * 0.32 + 22, guideCanvas.height * 0.18 + 8);
  }

  guideCtx.restore();
}

function clearCanvas() {
  successMessage.classList.remove("show");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function getCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const clientX = event.touches?.[0]?.clientX ?? event.clientX;
  const clientY = event.touches?.[0]?.clientY ?? event.clientY;
  return {
    x: (clientX - rect.left) * (canvas.width / rect.width),
    y: (clientY - rect.top) * (canvas.height / rect.height)
  };
}

function startDrawing(event) {
  event.preventDefault();
  drawing = true;
  const point = getCanvasPoint(event);
  ctx.beginPath();
  ctx.moveTo(point.x, point.y);
}

function draw(event) {
  if (!drawing) return;
  event.preventDefault();
  const point = getCanvasPoint(event);

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#263238";
  ctx.lineWidth = 24;
  ctx.lineTo(point.x, point.y);
  ctx.stroke();
}

function stopDrawing(event) {
  if (event) event.preventDefault();
  drawing = false;
  ctx.closePath();
}

function measureTracing() {
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let inkCount = 0;
  let onGuideCount = 0;
  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    if (data[i + 3] > 10) {
      inkCount += 1;
      if (guideMask && guideMask[p]) onGuideCount += 1;
    }
  }
  const accuracy = inkCount > 0 ? onGuideCount / inkCount : 0;
  const minInk = Math.max(300, guideMaskTotal * 0.04);
  return inkCount > minInk && accuracy > 0.45;
}

function checkTracing() {
  const enoughTracing = measureTracing();
  if (enoughTracing) {
    if (!completedLetters.has(currentIndex)) {
      completedLetters.add(currentIndex);
      stars += 1;
    }
    const msg = successMessages[Math.floor(Math.random() * successMessages.length)];
    successMessage.textContent = msg.text;
    successMessage.classList.add("show");
    speak(`${msg.speech} ${letters[currentIndex].letter}.`);
    renderDots();
    starsText.textContent = `⭐ ${stars} ${stars === 1 ? "star" : "stars"}`;
    saveProgress();
  } else {
    const msg = tryAgainMessages[Math.floor(Math.random() * tryAgainMessages.length)];
    successMessage.textContent = msg.text;
    successMessage.classList.add("show");
    speak(msg.speech);
  }

  window.setTimeout(() => {
    successMessage.classList.remove("show");
  }, 2600);
}

canvas.addEventListener("pointerdown", startDrawing);
canvas.addEventListener("pointermove", draw);
canvas.addEventListener("pointerup", stopDrawing);
canvas.addEventListener("pointerleave", stopDrawing);
canvas.addEventListener("pointercancel", stopDrawing);

speakNameBtn.addEventListener("click", () => {
  speak(`The letter is ${letters[currentIndex].letter}.`);
});

speakSoundBtn.addEventListener("click", () => {
  speak(letters[currentIndex].soundSpeech, 0.72);
});

speakWordBtn.addEventListener("click", () => {
  const item = letters[currentIndex];
  speak(`${item.word}. ${item.letter} is for ${item.word}.`);
});

soundToggle.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundToggle.textContent = soundEnabled ? "🔊 Sound On" : "🔇 Sound Off";
  soundToggle.setAttribute("aria-pressed", String(soundEnabled));
  if (!soundEnabled && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
});

uppercaseBtn.addEventListener("click", () => {
  currentCase = "uppercase";
  uppercaseBtn.classList.add("active");
  lowercaseBtn.classList.remove("active");
  buildGuideMask();
  drawGuide();
  clearCanvas();
});

lowercaseBtn.addEventListener("click", () => {
  currentCase = "lowercase";
  lowercaseBtn.classList.add("active");
  uppercaseBtn.classList.remove("active");
  buildGuideMask();
  drawGuide();
  clearCanvas();
});

clearBtn.addEventListener("click", clearCanvas);
checkBtn.addEventListener("click", checkTracing);

showGuideBtn.addEventListener("click", () => {
  guideVisible = !guideVisible;
  showGuideBtn.textContent = guideVisible ? "Hide guide" : "Show guide";
  drawGuide();
});

previousBtn.addEventListener("click", () => {
  if (currentIndex > 0) {
    currentIndex -= 1;
    updateLetter(true);
  }
});

nextBtn.addEventListener("click", () => {
  currentIndex = currentIndex === letters.length - 1 ? 0 : currentIndex + 1;
  updateLetter(true);
});

loadProgress();
renderDots();
updateLetter(false);
