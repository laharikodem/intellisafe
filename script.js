// ─── STATE ───────────────────────────────────────────────
const state = {
  location: null,
  contacts: JSON.parse(localStorage.getItem('is_contacts') || '[]'),
  features: JSON.parse(localStorage.getItem('is_features') || '{"autoloc":true,"repeat":true,"ai":false,"shake":false,"battery":false,"checkin":false,"photo":false,"countdown":false}'),
  log: JSON.parse(localStorage.getItem('is_log') || '[]'),
  isRecording: false,
  countdownTimer: null,
  shakeDetecting: false,
};

// ─── INIT ─────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  restoreContacts();
  restoreFeatureUI();
  restoreLog();
  startClock();
  getBattery();
  getNetwork();
  generatePreview();
  initShakeDetector();
  startCheckIn();
  addLog('System initialized. All modules loaded.', 'system');
  getLocation(); // Ensure location is fetched at start
});

// ─── LOCATION ─────────────────────────────────────────────
function getLocation() {
  if (!navigator.geolocation) {
    setLocUI('GPS not supported', null, null, null);
    return;
  }
  navigator.geolocation.watchPosition(
    pos => {
      state.location = pos.coords;
      const { latitude: lat, longitude: lon, accuracy } = pos.coords;
      document.getElementById('locCoords').textContent = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
      document.getElementById('locAccuracy').textContent = `±${Math.round(accuracy)}m`;
      document.getElementById('locStatusText').textContent = 'Live tracking active';
      document.getElementById('locDot').classList.add('ready');
      document.getElementById('locStatusLabel').textContent = `GPS locked · Updated ${new Date().toLocaleTimeString()}`;
      generatePreview(); // Update message with latest location
    },
    () => {
      setLocUI('Permission denied / unavailable', null, null, null);
    },
    { enableHighAccuracy: true, maximumAge: 10000 }
  );
}

function setLocUI(status, coords, address, accuracy) {
  document.getElementById('locStatusText').textContent = status;
  if (coords)   document.getElementById('locCoords').textContent = coords;
  if (address)  document.getElementById('locAddress').textContent = address;
  if (accuracy) document.getElementById('locAccuracy').textContent = accuracy;
}

// ─── AI + VOICE INPUT ─────────────────────────────────────
let recognition;

function toggleVoice() {
  if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    showToast('Speech recognition not supported', 'error');
    return;
  }
  if (state.isRecording) { recognition?.stop(); return; }

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.lang = 'en-US';
  recognition.interimResults = true;

  recognition.onstart = () => {
    state.isRecording = true;
    document.getElementById('recordBars').classList.add('active');
    document.getElementById('voiceBtn').style.background = 'linear-gradient(135deg,#ef4444,#dc2626)';
  };

  recognition.onresult = (e) => {
    const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
    document.getElementById('situationInput').value = transcript;
    generatePreview(); // Update message preview live
  };

  recognition.onend = () => {
    state.isRecording = false;
    document.getElementById('recordBars').classList.remove('active');
    document.getElementById('voiceBtn').style.background = 'linear-gradient(135deg,#8b5cf6,#7c3aed)';
    addLog('Voice input captured', 'voice');
    analyzeSituation();
  };

  recognition.start();
}

// ─── GENERATE MESSAGE PREVIEW ─────────────────────────────
function generatePreview() {
  const aiText = document.getElementById('aiResult')?.innerText || '';
  const inputText = document.getElementById('situationInput')?.value || '';
  const loc = state.location
    ? `https://www.google.com/maps/search/?api=1&query=${state.location.latitude},${state.location.longitude}`
    : 'Location unavailable';
  document.getElementById('msgPreview').value = `${inputText}\n${aiText}\nLocation: ${loc}`;
}

// ─── SOS / SEND WHATSAPP ─────────────────────────────────
function sendSOS() {
  if (!state.contacts || state.contacts.length === 0) {
    showToast('No contacts to send', 'error');
    return;
  }

  generatePreview(); // ensure latest AI + voice + location

  const msgText = document.getElementById('msgPreview').value.trim();
  if (!msgText) {
    showToast('Message is empty', 'error');
    return;
  }

  const finalMessage = encodeURIComponent(msgText);

  state.contacts.forEach(c => {
    if (!c.number) return;
    const waURL = `https://wa.me/${c.number}?text=${finalMessage}`;
    window.open(waURL, '_blank'); // Opens WhatsApp ready to send
  });

  addLog('🚨 SOS alert opened in WhatsApp with AI + voice + location');
  showToast('🚨 SOS Alert opened in WhatsApp', 'success');
}

// ─── HELPER: SHOW TOAST ──────────────────────────────────
function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.innerText = msg;
  t.className = `notif ${type}`;
  t.style.opacity = 1;
  setTimeout(() => { t.style.opacity = 0; }, 3000);
}

// ─── RESTORE CONTACTS / LOG / FEATURES ───────────────────
function restoreContacts() {
  const sel = document.getElementById('contactSelect');
  sel.innerHTML = `<option value="">Select Saved Contact</option>`;
  state.contacts.forEach((c, i) => {
    const o = document.createElement('option');
    o.value = i;
    o.text = `${c.name} (${c.number})`;
    sel.appendChild(o);
  });
}

function restoreLog() {
  const logEl = document.getElementById('activityLog');
  logEl.innerHTML = state.log.length ? state.log.map(e => `<div>${e}</div>`).join('') : '<div class="log-empty">No activity yet</div>';
}

function restoreFeatureUI() {
  Object.keys(state.features).forEach(f => {
    const el = document.getElementById(`feat-${f}`);
    if (el) el.classList.toggle('active', state.features[f]);
  });
}

function addLog(msg, type = 'system') {
  state.log.push(`[${new Date().toLocaleTimeString()}][${type}] ${msg}`);
  localStorage.setItem('is_log', JSON.stringify(state.log));
  restoreLog();
}

// ─── CLOCK / BATTERY / NETWORK ───────────────────────────
function startClock() {
  const chip = document.getElementById('chipTime');
  setInterval(() => { chip.textContent = `🕐 ${new Date().toLocaleTimeString()}`; }, 1000);
}

async function getBattery() {
  try {
    const b = await navigator.getBattery();
    const update = () => { 
      const pct = Math.round(b.level*100); 
      const chip = document.getElementById('chipBattery'); 
      chip.textContent = `🔋 ${pct}%`;
    };
    b.addEventListener('levelchange', update); 
    update();
  } catch {}
}

function getNetwork() {
  const chip = document.getElementById('chipNetwork');
  chip.textContent = '📡 Online';
}
