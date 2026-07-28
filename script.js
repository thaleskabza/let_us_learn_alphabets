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

const canvas = document.getElementById("traceCanvas");
const ctx = canvas.getContext("2d");

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

let currentIndex = 0;
let currentCase = "uppercase";
let drawing = false;
let guideVisible = true;
let soundEnabled = true;
let completedLetters = new Set();
let stars = 0;
let inkPixels = 0;
let selectedVoice = null;

function setupVoice() {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  selectedVoice =
    voices.find(v => /en-GB/i.test(v.lang)) ||
    voices.find(v => /en-ZA/i.test(v.lang)) ||
    voices.find(v => /^en/i.test(v.lang)) ||
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
  utterance.pitch = 1.08;
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
  phonicText.textContent = `Sound: “${item.soundLabel}”`;
  progressText.textContent = `Letter ${currentIndex + 1} of ${letters.length}`;
  starsText.textContent = `⭐ ${stars} ${stars === 1 ? "star" : "stars"}`;
  progressBar.style.width = `${((currentIndex + 1) / letters.length) * 100}%`;

  previousBtn.disabled = currentIndex === 0;
  nextBtn.textContent = currentIndex === letters.length - 1 ? "Start again ↻" : "Next →";

  renderDots();
  clearCanvas();
  if (announce) {
    speak(`${item.letter}. ${item.letter} is for ${item.word}.`);
  }
}

function drawGuide() {
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (guideVisible) {
    const item = letters[currentIndex];
    const displayLetter = currentCase === "uppercase"
      ? item.letter
      : item.letter.toLowerCase();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = currentCase === "uppercase"
      ? "bold 500px Arial, sans-serif"
      : "bold 520px Arial, sans-serif";
    ctx.lineWidth = 18;
    ctx.setLineDash([24, 20]);
    ctx.strokeStyle = "rgba(108, 92, 231, 0.34)";
    ctx.strokeText(displayLetter, canvas.width / 2, canvas.height / 2 + 28);
    ctx.setLineDash([]);

    ctx.fillStyle = "#2ecc71";
    ctx.beginPath();
    ctx.arc(canvas.width * 0.32, canvas.height * 0.18, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#263238";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "left";
    ctx.fillText("START", canvas.width * 0.32 + 22, canvas.height * 0.18 + 8);
  }

  ctx.restore();
}

function clearCanvas() {
  inkPixels = 0;
  successMessage.classList.remove("show");
  drawGuide();
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

  inkPixels += 24;
}

function stopDrawing(event) {
  if (event) event.preventDefault();
  drawing = false;
  ctx.closePath();
}

function checkTracing() {
  const enoughTracing = inkPixels > 1300;
  if (enoughTracing) {
    if (!completedLetters.has(currentIndex)) {
      completedLetters.add(currentIndex);
      stars += 1;
    }
    successMessage.textContent = "Great tracing! ⭐";
    successMessage.classList.add("show");
    speak(`Great job! You traced the letter ${letters[currentIndex].letter}.`);
    renderDots();
    starsText.textContent = `⭐ ${stars} ${stars === 1 ? "star" : "stars"}`;
  } else {
    successMessage.textContent = "Keep tracing a little more!";
    successMessage.classList.add("show");
    speak("Keep going. Trace a little more of the letter.");
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
  soundToggle.setAttribute("aria-pressed", String(!soundEnabled));
  if (!soundEnabled && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
});

uppercaseBtn.addEventListener("click", () => {
  currentCase = "uppercase";
  uppercaseBtn.classList.add("active");
  lowercaseBtn.classList.remove("active");
  clearCanvas();
});

lowercaseBtn.addEventListener("click", () => {
  currentCase = "lowercase";
  lowercaseBtn.classList.add("active");
  uppercaseBtn.classList.remove("active");
  clearCanvas();
});

clearBtn.addEventListener("click", clearCanvas);
checkBtn.addEventListener("click", checkTracing);

showGuideBtn.addEventListener("click", () => {
  guideVisible = !guideVisible;
  showGuideBtn.textContent = guideVisible ? "Hide guide" : "Show guide";
  clearCanvas();
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

window.addEventListener("resize", () => {
  drawGuide();
});

renderDots();
updateLetter(false);
