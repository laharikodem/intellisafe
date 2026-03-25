// ─── STATE ───────────────────────────────────────────────
const state = {
  location: null,
  contacts: JSON.parse(localStorage.getItem('is_contacts') || '[]'),
  features: JSON.parse(localStorage.getItem('is_features') || '{"autoloc":true,"repeat":true,"ai":false,"shake":false,"battery":false,"checkin":false,"photo":false,"countdown":false}'),
  log: JSON.parse(localStorage.getItem('is_log') || '[]'),
  isRecording: false,
  countdownTimer: null,
  countdownVal: 5,
  repeatTimer: null,
  checkInTimer: null,
  shakeDetecting: false,
  lastShakeTime: 0,
  shakeCount: 0,
  batteryChecked: false,
};

// ─── INIT ─────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  restoreContacts();
  restoreFeatureUI();
  restoreLog();
  getLocation();
  startClock();
  getBattery();
  getNetwork();
  generatePreview();
  initShakeDetector();
  startCheckIn();
  addLog('System initialized. All modules loaded.', 'system');
});

// ─── LOCATION ─────────────────────────────────────────────
function getLocation() {
  if (!navigator.geolocation) return;

  navigator.geolocation.watchPosition(pos => {
    state.location = pos.coords;

    const { latitude: lat, longitude: lon, accuracy } = pos.coords;

    document.getElementById('locCoords').textContent = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    document.getElementById('locAccuracy').textContent = `±${Math.round(accuracy)}m`;
    document.getElementById('locStatusText').textContent = 'Live tracking active';
    document.getElementById('locDot').classList.add('ready');

    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
      .then(r => r.json())
      .then(d => {
        const addr = d.display_name?.split(',').slice(0, 3).join(', ') || 'Address unavailable';
        document.getElementById('locAddress').textContent = addr;
      })
      .catch(() => {
        document.getElementById('locAddress').textContent = 'Address lookup unavailable';
      });

  }, () => {
    document.getElementById('locStatusText').textContent = 'Location blocked';
  }, { enableHighAccuracy: true });
}

// ─── CLOCK ───────────────────────────────────────────────
function startClock() {
  const chip = document.getElementById('chipTime');
  setInterval(() => {
    chip.textContent = `🕐 ${new Date().toLocaleTimeString()}`;
  }, 1000);
}

// ─── NETWORK ─────────────────────────────────────────────
function getNetwork() {
  const chip = document.getElementById('chipNetwork');
  chip.textContent = navigator.onLine ? '📡 Online' : '📡 Offline';
}

// ─── BATTERY ─────────────────────────────────────────────
async function getBattery() {
  try {
    const battery = await navigator.getBattery();

    const update = () => {
      const pct = Math.round(battery.level * 100);
      const chip = document.getElementById('chipBattery');
      chip.textContent = `🔋 ${pct}%`;
    };

    update();
    battery.addEventListener('levelchange', update);
  } catch {}
}

// ─── 🔥 MAIN FIX: WHATSAPP MULTI-CONTACT SOS ─────────────
function sendSOSAlert(message) {

  const contacts = JSON.parse(localStorage.getItem('is_contacts') || '[]');

  if (!contacts.length) {
    alert("No emergency contacts found!");
    return;
  }

  if (!state.location) {
    alert("Location not ready!");
    return;
  }

  const lat = state.location.latitude;
  const lon = state.location.longitude;

  const locationLink = `https://www.google.com/maps?q=${lat},${lon}`;

  const finalMessage = encodeURIComponent(
    `${message}\n\n📍 Live Location:\n${locationLink}`
  );

  // Open WhatsApp chats for ALL contacts
  contacts.forEach((contact, i) => {
    setTimeout(() => {
      const url = `https://wa.me/${contact}?text=${finalMessage}`;
      window.open(url, '_blank');
    }, i * 700);
  });

  addLog('WhatsApp SOS sent to all contacts', 'system');
  alert("WhatsApp alerts opened for all contacts!");
}

// ─── AI ANALYSIS (UNCHANGED LOGIC) ───────────────────────
function analyzeSituation() {
  const txt = document.getElementById('situationInput').value.trim();
  if (!txt) return alert("Enter situation");

  const lower = txt.toLowerCase();

  const criticalWords = ['attack','fire','accident','bleeding','help','emergency'];

  const isCritical = criticalWords.some(w => lower.includes(w));

  if (isCritical) {
    sendSOSAlert("🚨 EMERGENCY ALERT! Immediate help needed.");
  } else {
    alert("Situation noted");
  }
}

// ─── VOICE INPUT (UNCHANGED CORE) ───────────────────────
function toggleVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return alert("Not supported");

  const rec = new SR();
  rec.lang = 'en-US';

  rec.onresult = (e) => {
    document.getElementById('situationInput').value =
      e.results[0][0].transcript;
  };

  rec.start();
}
