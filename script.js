// =================== STATE =====================
const state = {
  contacts: JSON.parse(localStorage.getItem('is_contacts') || '[]'),
  features: JSON.parse(localStorage.getItem('is_features') || '{"autoloc":true,"repeat":true,"ai":false,"shake":false,"battery":false,"checkin":false,"photo":false,"countdown":false}'),
  log: JSON.parse(localStorage.getItem('is_log') || '[]'),
  isRecording: false,
  location: null,
  countdownTimer: null,
  countdownVal: 5,
  recognition: null
};

// =================== INIT =====================
window.addEventListener('DOMContentLoaded', () => {
  restoreContacts();
  restoreFeatureUI();
  restoreLog();
  generatePreview();
  initLocation();
});

// =================== CONTACTS =================
function restoreContacts() {
  const sel = document.getElementById('contactSelect');
  sel.innerHTML = '<option value="">Select Saved Contact</option>';
  state.contacts.forEach((c, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `${c.name} (${c.number})`;
    sel.appendChild(opt);
  });
  renderContactChips();
}

function addContact() {
  const name = document.getElementById('contactName').value.trim();
  const number = document.getElementById('contactNumber').value.trim();
  if (!name || !number) { showToast('Enter both name & number','error'); return; }
  state.contacts.push({ name, number });
  localStorage.setItem('is_contacts', JSON.stringify(state.contacts));
  document.getElementById('contactName').value='';
  document.getElementById('contactNumber').value='';
  restoreContacts();
  addLog(`Added contact: ${name} (${number})`);
}

function selectContact() {
  const idx = document.getElementById('contactSelect').value;
  if (idx === '') return;
  const c = state.contacts[idx];
  document.getElementById('contactName').value = c.name;
  document.getElementById('contactNumber').value = c.number;
}

function renderContactChips() {
  const container = document.getElementById('contactChips');
  container.innerHTML = '';
  state.contacts.forEach((c,i)=>{
    const chip = document.createElement('div');
    chip.className='chip';
    chip.innerHTML = `${c.name} <span class="remove" onclick="removeContact(${i})">✕</span>`;
    container.appendChild(chip);
  });
}

function removeContact(i){
  const c = state.contacts.splice(i,1)[0];
  localStorage.setItem('is_contacts', JSON.stringify(state.contacts));
  renderContactChips();
  restoreContacts();
  addLog(`Removed contact: ${c.name}`);
}

// =================== FEATURES =================
function restoreFeatureUI() {
  for (const f in state.features) {
    const el = document.getElementById(`feat-${f}`);
    if (!el) continue;
    if (state.features[f]) el.classList.add('active'); else el.classList.remove('active');
  }
}

function toggleFeature(f) {
  state.features[f] = !state.features[f];
  localStorage.setItem('is_features', JSON.stringify(state.features));
  restoreFeatureUI();
  addLog(`${f} feature ${state.features[f]?'enabled':'disabled'}`);
}

// =================== MESSAGE ==================
function generatePreview() {
  const loc = state.location ? `${state.location.latitude.toFixed(5)},${state.location.longitude.toFixed(5)}` : 'Unknown';
  document.getElementById('msgPreview').value = `EMERGENCY ALERT!\nLocation: ${loc}\nPlease help me!`;
}

function copyMessage() {
  const txt = document.getElementById('msgPreview');
  txt.select();
  navigator.clipboard.writeText(txt.value).then(()=>showToast('Message copied','success'));
}

// =================== SOS ======================
function triggerSOS() {
  if(state.features.countdown){
    document.getElementById('countdownOverlay').style.display='flex';
    state.countdownVal=5;
    document.getElementById('countdownNum').textContent=state.countdownVal;
    state.countdownTimer=setInterval(()=>{
      state.countdownVal--;
      document.getElementById('countdownNum').textContent=state.countdownVal;
      if(state.countdownVal<=0){ clearInterval(state.countdownTimer); sendSOS(); }
    },1000);
  } else sendSOS();
}

function cancelSOS() {
  clearInterval(state.countdownTimer);
  document.getElementById('countdownOverlay').style.display='none';
  addLog('SOS canceled');
}

function sendSOS() {
  document.getElementById('countdownOverlay').style.display='none';
  addLog('SOS alert sent!');
  showToast('🚨 SOS Alert Sent!','success');
}

// =================== LOCATION ==================
function initLocation() {
  if (!navigator.geolocation) {
    showToast('GPS not supported','error'); return;
  }
  navigator.geolocation.watchPosition(pos => {
    state.location = pos.coords;
    const { latitude, longitude, accuracy } = pos.coords;
    document.getElementById('locCoords').textContent = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    document.getElementById('locAccuracy').textContent = `±${Math.round(accuracy)}m`;
    document.getElementById('locStatusText').textContent = 'Live tracking active';
    document.getElementById('locDot').classList.add('ready');
    document.getElementById('locStatusLabel').textContent = `GPS locked · Updated ${new Date().toLocaleTimeString()}`;

    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
      .then(r=>r.json())
      .then(d=>{
        const addr = d.display_name?.split(',').slice(0,3).join(', ') || 'Address unavailable';
        document.getElementById('locAddress').textContent = addr;
      }).catch(()=>document.getElementById('locAddress').textContent='Address lookup unavailable');

    generatePreview();
  }, () => {
    document.getElementById('locStatusText').textContent = 'GPS Permission denied / unavailable';
  }, { enableHighAccuracy:true, maximumAge:10000 });
}

// =================== VOICE INPUT ==================
function toggleVoice() {
  if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    showToast('Speech recognition not supported','error'); return;
  }
  if(state.isRecording){
    state.recognition.stop(); return;
  }

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  state.recognition = new SR();
  state.recognition.lang = 'en-US';
  state.recognition.interimResults = true;

  state.recognition.onstart = () => {
    state.isRecording=true;
    document.getElementById('recordBars').classList.add('active');
    document.getElementById('voiceBtn').style.background = 'linear-gradient(135deg,#ef4444,#dc2626)';
  };

  state.recognition.onresult = (e) => {
    const transcript = Array.from(e.results).map(r=>r[0].transcript).join('');
    document.getElementById('situationInput').value = transcript;
  };

  state.recognition.onend = () => {
    state.isRecording=false;
    document.getElementById('recordBars').classList.remove('active');
    document.getElementById('voiceBtn').style.background = 'linear-gradient(135deg,#8b5cf6,#7c3aed)';
    addLog('Voice input captured');
    analyzeSituation();
  };

  state.recognition.start();
}

// =================== AI ANALYSIS ==================
const SEVERITY_KEYWORDS = {
  critical: ['attack','stabbed','shot','unconscious','not breathing','dying','fire','explosion','flood','drowning','heart attack','stroke','seizure','overdose'],
  high: ['accident','injury','injured','bleeding','trapped','fall','broken','chest pain','breathing','fainted','help'],
  medium: ['lost','scared','unsafe','threat','following','stalked','sick','unwell','pain'],
  low: ['worried','concerned','need help','confused','support']
};

function analyzeSituation() {
  const txt=document.getElementById('situationInput').value.trim();
  if(!txt){ showToast('Please describe your situation','error'); return; }

  const lower=txt.toLowerCase();
  let level='low';
  for(const [sev,words] of Object.entries(SEVERITY_KEYWORDS)){
    if(words.some(w=>lower.includes(w))){ level=sev; break; }
  }

  const advice={
    critical:{ text:'⚡ CRITICAL — Call emergency services NOW!', actions:['📞 Call 112/911','📍 Share location','🚨 Trigger SOS'] },
    high:{ text:'🔴 HIGH RISK — Alert contacts immediately', actions:['🚨 Send emergency alert','📍 Share location','📞 Standby call'] },
    medium:{ text:'🟡 MODERATE — Inform contacts', actions:['💬 Message contacts','📍 Share location','🔄 Auto check-in'] },
    low:{ text:'🟢 LOW RISK — Precautionary', actions:['✅ Enable safe check-in','👥 Inform a trusted contact'] }
  };

  const res=advice[level];
  const el=document.getElementById('aiResult');
  el.innerHTML=`<div class="severity ${level}">${level.toUpperCase()} SEVERITY</div>
  <p style="margin-bottom:8px">${res.text}</p>
  <div style="font-size:12px;color:var(--muted);font-weight:600;margin-bottom:4px">RECOMMENDED ACTIONS:</div>
  ${res.actions.map(a=>`<div style="font-size:12px;padding:3px 0;color:var(--text)">→ ${a}</div>`).join('')}`;
  el.classList.add('show');
  addLog(`AI analyzed situation · Severity: ${level.toUpperCase()}`);
  generatePreview();
}

// =================== LOG & TOAST =================
function addLog(msg){
  const log=document.getElementById('activityLog');
  const div=document.createElement('div');
  div.textContent=`[${new Date().toLocaleTimeString()}] ${msg}`;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
  state.log.push({msg,time:Date.now()});
  localStorage.setItem('is_log',JSON.stringify(state.log));
}

function restoreLog(){
  const log=document.getElementById('activityLog');
  log.innerHTML='';
  if(state.log.length===0){ log.innerHTML='<div class="log-empty">No activity yet</div>'; return; }
  state.log.forEach(l=>{
    const div=document.createElement('div');
    div.textContent=`[${new Date(l.time).toLocaleTimeString()}] ${l.msg}`;
    log.appendChild(div);
  });
}

function showToast(msg,type='info'){
  const t=document.getElementById('toast');
  t.textContent=msg;
  t.style.background = type==='error'?'var(--red)':type==='success'?'var(--green)':'var(--accent)';
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2500);
}
