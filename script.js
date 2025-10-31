// script.js - Integrated features:
// - random pastel + dark theme palettes (soft transitions)
// - ambient synth via WebAudio with smooth fade
// - voice selector and chosen voice persisted
// - typing animation for messages (cancel-safe)
// - sponge waving on message generate + hover/click reactions
// - multiple floating anims (hearts, stars, bubbles) remain
// - respects prefers-reduced-motion

/* ---------- Elements ---------- */
const heartsLayer = document.querySelector('.hearts-layer');
const changeButton = document.getElementById('change-message-button');
const dynamicMessage = document.getElementById('dynamic-message');
const mainTitle = document.getElementById('main-message');
const themeToggle = document.getElementById('theme-toggle');
const muteVoiceBtn = document.getElementById('mute-voice');
const voiceSelect = document.getElementById('voice-select');
const musicToggle = document.getElementById('music-toggle');
const sponge = document.getElementById('sponge-character');
const rightArm = document.getElementById('right-arm');

/* ---------- Data ---------- */
const messages = [
  "You are enough, just as you are. 🌟",
  "Believe in yourself and all that you are. 💪",
  "You are capable of amazing things. 🚀",
  "The world is a better place with you in it. 💖",
  "Your smile can change the world. 😊",
  "You are stronger than you think. 💪",
  "You are loved more than you know. ❤️",
  "You are unique and special. 🌈",
  "You have the power to make a difference. 🌍",
  "You are worthy of love and happiness. 💕",
  "You are doing better than you think. 🌟",
  "You are a work of art. 🎨",
  "You are a beautiful person inside and out. 🌼",
  "Small steps forward still move you forward. 🌱",
  "It's okay to rest — rest is productive too. 🛌",
  "Be kind to yourself today. 🕊️"
];

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/* ---------- Theme palettes ---------- */
const dayPalettes = [
  ['#ff9a9e','#fad0c4','#fbc2eb','#a6c1ee'], // rose
  ['#d9f7ff','#e6ffe9','#fbefff','#d9e9ff'], // soft sky
  ['#ffdede','#fff0d9','#eaf6ff','#fbe8ff']  // soft warm
];
const nightPalettes = [
  ['#0f1724','#241436','#2b1b4a','#4b2b7f'], // deep purple
  ['#081229','#142033','#2a2740','#3b2b5d']  // midnight
];
/* ---------- Ambient calm stream audio ---------- */
const music = new Audio("https://cdn.pixabay.com/download/audio/2022/10/24/audio_1f19070f70.mp3?filename=gentle-stream-ambient-124997.mp3");
music.loop = true;
music.volume = 0.25;

musicToggle.addEventListener("click", () => {
  if (music.paused) {
    music.play().catch(()=>{});          // browsers require gesture
    musicToggle.setAttribute("aria-pressed","true");
  } else {
    music.pause();
    musicToggle.setAttribute("aria-pressed","false");
  }
});


function applyRandomTheme() {
  const isNight = document.body.classList.contains('night');
  const palettes = isNight ? nightPalettes : dayPalettes;
  const p = pickRandom(palettes);
  document.body.style.background = `linear-gradient(135deg, ${p[0]}, ${p[1]}, ${p[2]}, ${p[3]})`;
  document.body.style.backgroundSize = '400% 400%';
  // gentle GSAP animate background-position for subtle motion if not reduced motion
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.to(document.body, { backgroundPosition: '100% 50%', duration: 14, ease: 'sine.inOut', repeat: -1, yoyo: true });
  }
}

/* ---------- GSAP fade message helper ---------- */
function animateMessageSwap(newText) {
  const dur = 0.45;
  gsap.to(dynamicMessage, { duration: dur, y: -18, opacity: 0, ease: "power2.in", onComplete() {
    // typing animation will set final text
    gsap.fromTo(dynamicMessage, { y: 18, opacity: 0 }, { duration: dur, y: 0, opacity: 1, ease: "power2.out" });
    // small title pulse
    gsap.fromTo(mainTitle, { scale: 1 }, { duration: 0.6, scale: 1.04, yoyo: true, repeat: 1, ease: "power1.inOut" });
  }});
}

/* ---------- Typing animation (cancel-safe) ---------- */
let typingToken = { canceled: false };
async function typeText(fullText, speed = 24) {
  // show fullText char-by-char; speed = ms per char or adaptive
  typingToken.canceled = false;
  dynamicMessage.textContent = '';
  // caret
  const caret = document.createElement('span'); caret.className = 'caret'; caret.setAttribute('aria-hidden','true');
  dynamicMessage.appendChild(caret);

  // type each char
  for (let i = 0; i < fullText.length; i++) {
    if (typingToken.canceled) {
      dynamicMessage.textContent = fullText; // show full instantly
      dynamicMessage.appendChild(caret);
      return;
    }
    const ch = fullText[i];
    // insert before caret
    caret.insertAdjacentText('beforebegin', ch);
    // adaptive pause for punctuation
    if (/[.,!?]/.test(ch)) {
      await new Promise(res => setTimeout(res, speed * 8));
    } else {
      await new Promise(res => setTimeout(res, speed + Math.random() * 10));
    }
  }
  // leave caret visible for a short moment then remove
  await new Promise(res => setTimeout(res, 400));
  caret.remove();
}

/* ---------- Voice: clean and speak ---------- */
function cleanTextForVoice(text) {
  // strip emojis and non-basic characters: keep letters, numbers and common punctuation
  let cleaned = text.replace(/[^a-zA-Z0-9\s\.\,\!\?\-\'\"]/g, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  // stop at first terminal punctuation to avoid reading trailing clauses if present
  const terminal = cleaned.match(/([^\.\!\?]+[\.\!\?])/);
  if (terminal) return terminal[0].trim();
  return cleaned;
}

/* ---------- Voice selection and speak settings ---------- */
let chosenVoice = null;
let voicesLoaded = false;

function populateVoiceList() {
  if (!('speechSynthesis' in window)) return;
  const voices = window.speechSynthesis.getVoices();
  voiceSelect.innerHTML = '';
  voices.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v.name;
    opt.textContent = `${v.name} (${v.lang})${v.default ? ' — default' : ''}`;
    voiceSelect.appendChild(opt);
  });
  // restore saved choice
  const saved = localStorage.getItem('you-are-loved-voice');
  if (saved) {
    voiceSelect.value = saved;
    chosenVoice = voices.find(v => v.name === saved) || voices[0];
  } else {
    // pick a warm voice heuristically
    chosenVoice = pickPreferredVoice(voices);
    if (chosenVoice) voiceSelect.value = chosenVoice.name;
  }
  voicesLoaded = true;
}

function pickPreferredVoice(voices) {
  if (!voices || voices.length === 0) return null;
  const prefer = ['Google UK English Female','Google US English','Microsoft Zira','Samantha','Amy','Kendra','Aria','Alloy'];
  for (const name of prefer) {
    const match = voices.find(v => v.name.includes(name) || (v.lang && v.lang.toLowerCase().includes('en-gb') && name.includes('UK')));
    if (match) return match;
  }
  // fallback female
  return voices.find(v => /female/i.test(v.name)) || voices.find(v => /en/i.test(v.lang)) || voices[0];
}

if ('speechSynthesis' in window) {
  populateVoiceList();
  window.speechSynthesis.onvoiceschanged = populateVoiceList;
}

voiceSelect.addEventListener('change', () => {
  try {
    localStorage.setItem('you-are-loved-voice', voiceSelect.value);
  } catch (e) {}
  const vlist = window.speechSynthesis.getVoices();
  chosenVoice = vlist.find(v => v.name === voiceSelect.value) || null;
});

let voiceEnabled = true;
muteVoiceBtn.addEventListener('click', () => {
  voiceEnabled = !voiceEnabled;
  muteVoiceBtn.setAttribute('aria-pressed', String(!voiceEnabled));
  muteVoiceBtn.textContent = voiceEnabled ? '🔈 Voice' : '🔇 Muted';
  if (!voiceEnabled && 'speechSynthesis' in window) window.speechSynthesis.cancel();
});

function speakMessage(raw) {
  if (!voiceEnabled) return;
  if (!('speechSynthesis' in window)) return;
  const cleaned = cleanTextForVoice(raw);
  if (!cleaned) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(cleaned);
  // warmer, slower tone
  utter.rate = 0.86;
  utter.pitch = 1.12;
  utter.volume = 1;
  utter.lang = 'en-US';
  if (chosenVoice) utter.voice = chosenVoice;
  utter.onstart = () => muteVoiceBtn.classList.add('speaking');
  utter.onend = () => muteVoiceBtn.classList.remove('speaking');
  window.speechSynthesis.speak(utter);
}


/* ---------- Floating decorations (hearts, stars, bubbles) ---------- */
const decoHearts = ['❤️','🧡','💛'];
const decoStars  = ['✨','⭐','🌟'];
const decoBubbles= ['◯','●','◦'];

function spawnDecorElement(pool, opts = {}) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const el = document.createElement('div');
  el.className = 'floating-emoji float-tint-' + (opts.tintIndex || 1);
  el.textContent = pool[Math.floor(Math.random()*pool.length)];
  heartsLayer.appendChild(el);

  const startX = opts.fromX ?? (Math.random()*window.innerWidth);
  const startY = opts.fromY ?? (window.innerHeight + 30);
  el.style.left = startX + 'px';
  el.style.top = startY + 'px';
  el.style.fontSize = (12 + Math.random()*34) + 'px';
  el.style.opacity = 0.95;

  const endX = (opts.toX !== undefined) ? startX + opts.toX : startX + (Math.random()*200 - 100);
  const endY = (opts.toY !== undefined) ? opts.toY : (-(80 + Math.random()*120));
  const dur = opts.duration || (6 + Math.random()*6);

  gsap.to(el, {
    duration: dur,
    x: endX - startX,
    y: endY - (window.innerHeight + 20),
    rotation: (Math.random()*100 - 50),
    opacity: 0,
    ease: "sine.inOut",
    onComplete() { el.remove(); }
  });
}

for (let i=0;i<8;i++){ setTimeout(()=> spawnDecorElement(decoHearts,{fromX: Math.random()*window.innerWidth, tintIndex:1+Math.floor(Math.random()*4)}), i * 300 + Math.random()*600); }
setInterval(()=> spawnDecorElement(decoHearts,{fromX: Math.random()*window.innerWidth, tintIndex:1+Math.floor(Math.random()*4)}), 1300 + Math.random()*900);
setInterval(()=> spawnDecorElement(decoStars,{fromX: Math.random()*window.innerWidth, fromY: Math.random()*window.innerHeight*0.8, toX:(Math.random()* (Math.random()<0.5 ? -1 : 1) * 200), tintIndex:1+Math.floor(Math.random()*4)}), 2800 + Math.random()*2000);
setInterval(()=> spawnDecorElement(decoBubbles,{fromX: Math.random()*window.innerWidth, fromY: window.innerHeight + 30, toX:(Math.random()* (Math.random()<0.5 ? -1 : 1) * 160), toY: -80 - Math.random()*80, tintIndex:1+Math.floor(Math.random()*4)}), 2200 + Math.random()*1600);

/* ---------- Burst on click ---------- */
const burstEmojis = ['💖','❤️','✨','🌟','💫','💛','💜','🤍'];
function burstAt(x, y, count = 10) {
  for (let i=0;i<count;i++){
    const el = document.createElement('div');
    el.className = 'floating-emoji';
    el.textContent = burstEmojis[Math.floor(Math.random()*burstEmojis.length)];
    el.classList.add('float-tint-' + (1 + Math.floor(Math.random()*4)));
    document.body.appendChild(el);
    el.style.left = (x - 8 + (Math.random()*60 - 30)) + 'px';
    el.style.top = (y - 8 + (Math.random()*20 - 10)) + 'px';
    el.style.fontSize = (12 + Math.random()*28) + 'px';
    el.style.opacity = 1;

    const dx = (Math.random()*140 - 70);
    const dy = - (60 + Math.random()*140);
    const rot = (Math.random()*360 - 180);

    gsap.to(el, {
      duration: 1.6 + Math.random()*0.6,
      x: dx,
      y: dy,
      rotation: rot,
      opacity: 0,
      scale: 0.85 + Math.random()*0.5,
      ease: "power2.out",
      onComplete() { el.remove(); }
    });
  }
}

/* ---------- theme and page initialization ---------- */
function applyTheme(isNight) {
  document.body.classList.toggle('night', isNight);
  // store pref
  try { localStorage.setItem('you-are-loved-night', isNight ? '1' : '0'); } catch(e){}
  themeToggle.setAttribute('aria-pressed', String(isNight));
  // update background palette gracefully
  applyRandomTheme();
}
themeToggle.addEventListener('click', () => {
  const isNight = !document.body.classList.contains('night');
  applyTheme(isNight);
});
try {
  const saved = localStorage.getItem('you-are-loved-night');
  if (saved === '1') applyTheme(true);
  else applyRandomTheme();
} catch(e){ applyRandomTheme(); }

/* ---------- Sponge interactions ---------- */
sponge.addEventListener('mouseenter', () => {
  document.getElementById('sponge-rect').style.fill = '#fff59d';
});
sponge.addEventListener('mouseleave', () => {
  document.getElementById('sponge-rect').style.fill = '#FFE082';
});
sponge.addEventListener('click', () => {
  // smile change (animate strokeWidth temporarily)
  const smile = document.getElementById('sponge-smile');
  smile.setAttribute('stroke-width','6');
  setTimeout(()=> smile.setAttribute('stroke-width','4'), 900);
  // also wave
  triggerWave();
});
sponge.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sponge.click(); } });

function triggerWave() {
  // add wave class to rightArm group for a short time
  rightArm.classList.add('wave');
  setTimeout(()=> rightArm.classList.remove('wave'), 950);
}

/* ---------- Generate message flow ---------- */
function generateMessage(triggerEvent) {
  const msg = pickRandom(messages);
  // cancel previous typing
  typingToken.canceled = true;
  typingToken = { canceled: false };
  animateMessageSwap(msg);
  typeText(msg, 22); // speed
  // speak cleaned version
  speakMessage(msg);
  // sponge wave
  triggerWave();
  // burst from click (if available)
  if (triggerEvent) {
    let x = window.innerWidth / 2, y = window.innerHeight / 2;
    if (triggerEvent.clientX !== undefined && triggerEvent.clientY !== undefined) {
      x = triggerEvent.clientX; y = triggerEvent.clientY;
    } else {
      const rect = changeButton.getBoundingClientRect();
      x = rect.left + rect.width/2; y = rect.top + rect.height/2;
    }
    burstAt(x,y,12);
  }
}

changeButton.addEventListener('click', (ev) => generateMessage(ev));
changeButton.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); changeButton.click(); } });

// periodic gentle auto-generate
let autoGen = setInterval(() => { generateMessage(); }, 11000);

/* ---------- accessibility: reduce motion respects setting (already checked inside spawn functions) ---------- */

/* ---------- initial load ---------- */
window.addEventListener('load', () => {
  // initial random theme
  applyRandomTheme();
  // pick initial message
  const initial = pickRandom(messages);
  dynamicMessage.textContent = initial;
  // small entrance animations (if allowed)
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.from(dynamicMessage, { duration: 0.9, y: 18, opacity: 0, ease: "power2.out" });
    gsap.from(mainTitle, { duration: 1.1, y: -8, opacity: 0, ease: "elastic.out(1,0.6)" });
  }
  // ensure voices loaded
  if ('speechSynthesis' in window) {
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.addEventListener('voiceschanged', populateVoiceList);
    } else populateVoiceList();
  }
});
