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
  if (!navigator.geolocation) {
    setLocUI('GPS not supported', null, null, null);
    return;
  }
  navigator.geolocation.watchPosition(pos => {
    state.location = pos.coords;
    const { latitude: lat, longitude: lon, accuracy } = pos.coords;
    document.getElementById('locCoords').textContent = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    document.getElementById('locAccuracy').textContent = `±${Math.round(accuracy)}m`;
    document.getElementById('locStatusText').textContent = 'Live tracking active';
    document.getElementById('locDot').classList.add('ready');
    document.getElementById('locStatusLabel').textContent = `GPS locked · Updated ${new Date().toLocaleTimeString()}`;

    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
      .then(r => r.json())
      .then(d => {
        const addr = d.display_name?.split(',').slice(0, 3).join(', ') || 'Address unavailable';
        document.getElementById('locAddress').textContent = addr;
      })
      .catch(() => {
        document.getElementById('locAddress').textContent = 'Address lookup unavailable';
      });

    generatePreview();
  }, () => {
    setLocUI('Permission denied / unavailable', null, null, null);
  }, { enableHighAccuracy: true, maximumAge: 10000 });
}

function setLocUI(status, coords, address, accuracy) {
  document.getElementById('locStatusText').textContent = status;
  if (coords)   document.getElementById('locCoords').textContent = coords;
  if (address)  document.getElementById('locAddress').textContent = address;
  if (accuracy) document.getElementById('locAccuracy').textContent = accuracy;
}

// ─── BATTERY ──────────────────────────────────────────────
async function getBattery() {
  try {
    const b = await navigator.getBattery();
    const update = () => {
      const pct = Math.round(b.level * 100);
      const chip = document.getElementById('chipBattery');
      chip.textContent = `🔋 ${pct}%`;
      chip.className = 'info-chip ' + (pct > 30 ? 'ok' : 'warn');

      if (pct <= 15 && state.features.battery && !state.batteryChecked) {
        state.batteryChecked = true;
        addLog(`⚠️ Battery at ${pct}% — sending low battery alert`, 'warn');
        showToast(`⚠️ Battery critical (${pct}%) — notifying contacts`, 'error');
        triggerSOSCore(`🪫 BATTERY LOW ALERT: My phone battery is at ${pct}%. I may become unreachable soon.`);
      }
    };
    b.addEventListener('levelchange', update);
    b.addEventListener('chargingchange', update);
    update();
  } catch {}
}

// ─── NETWORK ─────────────────────────────────────────────
function getNetwork() {
  const chip = document.getElementById('chipNetwork');
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn) {
    const update = () => {
      chip.textContent = `📡 ${conn.effectiveType?.toUpperCase() || 'WIFI'}`;
      chip.className = 'info-chip ok';
    };
    conn.addEventListener('change', update);
    update();
  } else {
    chip.textContent = '📡 Online';
    chip.className = 'info-chip ok';
  }
}

// ─── CLOCK ───────────────────────────────────────────────
function startClock() {
  const chip = document.getElementById('chipTime');
  const update = () => {
    chip.textContent = `🕐 ${new Date().toLocaleTimeString()}`;
    chip.className = 'info-chip';
  };
  update();
  setInterval(update, 1000);
}

// ─── AI ANALYSIS ─────────────────────────────────────────
const SEVERITY_KEYWORDS = {
  critical: ['attack','stabbed','shot','unconscious','not breathing','dying','fire','explosion','flood','drowning','heart attack','stroke','seizure','overdose'],
  high:     ['accident','injury','injured','bleeding','trapped','fall','broken','chest pain','breathing','fainted','help'],
  medium:   ['lost','scared','unsafe','threat','following','stalked','sick','unwell','pain'],
  low:      ['worried','concerned','need help','confused','support'],
};

function analyzeSituation() {
  const txt = document.getElementById('situationInput').value.trim();
  if (!txt) { showToast('Please describe your situation first', 'error'); return; }

  const lower = txt.toLowerCase();
  let level = 'low';
  for (const [sev, words] of Object.entries(SEVERITY_KEYWORDS)) {
    if (words.some(w => lower.includes(w))) { level = sev; break; }
  }

  const advice = {
    critical: {
      text: '⚡ CRITICAL — Immediate action needed. Call 112/911 NOW. Stay on the line.',
      actions: ['📞 Call emergency services', '📍 Share live location immediately', '🚨 Trigger SOS alert'],
    },
    high: {
      text: '🔴 HIGH RISK — Urgent situation detected. Alert contacts immediately.',
      actions: ['🚨 Send emergency alert', '📍 Share location with contacts', '📞 Standby to call 112'],
    },
    medium: {
      text: '🟡 MODERATE — Situation requires attention. Keep contacts informed.',
      actions: ['💬 Message contacts', '📍 Share your location', '🔄 Enable auto check-in'],
    },
    low: {
      text: '🟢 LOW RISK — Situation noted. Precautionary measures recommended.',
      actions: ['✅ Enable safe check-in', '👥 Inform a trusted contact'],
    },
  };

  const res = advice[level];
  const el = document.getElementById('aiResult');
  el.innerHTML = `
    <div class="severity ${level}">${level.toUpperCase()} SEVERITY</div>
    <p style="margin-bottom:8px">${res.text}</p>
    <div style="font-size:12px;color:var(--muted);font-weight:600;margin-bottom:4px">RECOMMENDED ACTIONS:</div>
    ${res.actions.map(a => `<div style="font-size:12px;padding:3px 0;color:var(--text)">→ ${a}</div>`).join('')}
  `;
  el.classList.add('show');
  addLog(`AI analyzed situation · Severity: ${level.toUpperCase()}`, 'ai');
  generatePreview();
}

// ─── VOICE INPUT ─────────────────────────────────────────
let recognition;

function toggleVoice() {
  if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    showToast('Speech recognition not supported in this browser', 'error');
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
  };

  recognition.onend = () => {
    state.isRecording = false;
    document.getElementById('recordBars').classList.remove('active');
    document.getElementById('voiceBtn').style.background = 'linear-gradient(135deg,#8b5cf6,#7c3aed)';
    addLog('Voice input captured', 'voice');
    analyzeSituation();
  };
