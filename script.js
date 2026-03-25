// =================== STATE =====================
const state = {
  contacts: JSON.parse(localStorage.getItem('is_contacts')||'[]'),
  features: JSON.parse(localStorage.getItem('is_features')||'{"autoloc":true,"repeat":true,"ai":false,"shake":false,"battery":false,"checkin":false,"photo":false,"countdown":false}'),
  log: JSON.parse(localStorage.getItem('is_log')||'[]'),
  isRecording:false,
  location:null,
  countdownTimer:null,
  countdownVal:5
};

// =================== INIT =====================
window.addEventListener('DOMContentLoaded',()=>{
  restoreContacts();
  restoreFeatureUI();
  restoreLog();
  generatePreview();
});

// =================== CONTACTS =================
function restoreContacts(){
  const sel = document.getElementById('contactSelect');
  sel.innerHTML = '<option value="">Select Saved Contact</option>';
  state.contacts.forEach((c,i)=>{
    const opt = document.createElement('option');
    opt.value=i;
    opt.textContent=`${c.name} (${c.number})`;
    sel.appendChild(opt);
  });
  renderContactChips();
}

function addContact(){
  const name=document.getElementById('contactName').value.trim();
  const number=document.getElementById('contactNumber').value.trim();
  if(!name||!number){ showToast('Enter both name & number','error'); return; }
  state.contacts.push({name,number});
  localStorage.setItem('is_contacts',JSON.stringify(state.contacts));
  document.getElementById('contactName').value='';
  document.getElementById('contactNumber').value='';
  restoreContacts();
  addLog(`Added contact: ${name} (${number})`);
}

function selectContact(){
  const idx=document.getElementById('contactSelect').value;
  if(idx==='') return;
  const c=state.contacts[idx];
  document.getElementById('contactName').value=c.name;
  document.getElementById('contactNumber').value=c.number;
}

function renderContactChips(){
  const container=document.getElementById('contactChips');
  container.innerHTML='';
  state.contacts.forEach((c,i)=>{
    const chip=document.createElement('div');
    chip.className='chip';
    chip.innerHTML=`${c.name} <span class="remove" onclick="removeContact(${i})">✕</span>`;
    container.appendChild(chip);
  });
}

function removeContact(i){
  const c=state.contacts.splice(i,1)[0];
  localStorage.setItem('is_contacts',JSON.stringify(state.contacts));
  renderContactChips();
  restoreContacts();
  addLog(`Removed contact: ${c.name}`);
}

// =================== FEATURES =================
function restoreFeatureUI(){
  for(const f in state.features){
    const el=document.getElementById(`feat-${f}`);
    if(!el) continue;
    if(state.features[f]) el.classList.add('active'); else el.classList.remove('active');
  }
}

function toggleFeature(f){
  state.features[f]=!state.features[f];
  localStorage.setItem('is_features',JSON.stringify(state.features));
  restoreFeatureUI();
  addLog(`${f} feature ${state.features[f]?'enabled':'disabled'}`);
}

// =================== MESSAGE ==================
function generatePreview(){
  const loc=state.location?`${state.location.latitude.toFixed(5)},${state.location.longitude.toFixed(5)}`:'Unknown';
  document.getElementById('msgPreview').value=`EMERGENCY ALERT!\nLocation: ${loc}\nPlease help me!`;
}

function copyMessage(){
  const txt=document.getElementById('msgPreview');
  txt.select();
  navigator.clipboard.writeText(txt.value).then(()=>showToast('Message copied','success'));
}

// =================== SOS ======================
function triggerSOS(){
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

function cancelSOS(){
  clearInterval(state.countdownTimer);
  document.getElementById('countdownOverlay').style.display='none';
  addLog('SOS canceled');
}

function sendSOS(){
  document.getElementById('countdownOverlay').style.display='none';
  addLog('SOS alert sent!');
  showToast('🚨 SOS Alert Sent!','success');
}

// =================== LOG & TOAST =================
function addLog(msg){
  const log=document.getElementById('activityLog');
  const div=document.createElement('div');
  div.textContent=`[${new Date().toLocaleTimeString()}] ${msg}`;
  log.appendChild(div);
  log.scrollTop=log.scrollHeight;
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
  t.style.background=type==='error'?'var(--red)':type==='success'?'var(--green)':'var(--accent)';
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2500);
}
