// Elements
const contactListEl = document.getElementById('contactList');
const addContactBtn = document.getElementById('addContactBtn');
const contactModal = document.getElementById('contactModal');
const closeBtn = document.querySelector('.closeBtn');
const contactForm = document.getElementById('contactForm');
const modalTitle = document.getElementById('modalTitle');
const emergencyBtn = document.getElementById('emergencyBtn');
const testBtn = document.getElementById('testBtn');
const startLocationBtn = document.getElementById('startLocationBtn');
const riskLevel = document.getElementById('riskLevel');

let contacts = JSON.parse(localStorage.getItem('contacts')) || [];
let editIndex = null;
let liveLocation = null;
let locationInterval = null;

// ---------- Contact Functions ----------
function saveContacts() {
  localStorage.setItem('contacts', JSON.stringify(contacts));
}

function renderContacts() {
  contactListEl.innerHTML = '';
  contacts.forEach((c,i)=>{
    const card = document.createElement('div');
    card.classList.add('contact-card');
    card.innerHTML = `<span>${c.name} | ${c.phone} | ${c.email}</span>
      <button class="edit">Edit</button>
      <button class="delete">Delete</button>`;
    card.querySelector('.edit').onclick = ()=>openModal(i);
    card.querySelector('.delete').onclick = ()=>{ contacts.splice(i,1); saveContacts(); renderContacts(); }
    contactListEl.appendChild(card);
  });
}

function openModal(index=null){
  contactModal.style.display = 'flex';
  if(index!==null){
    editIndex = index;
    modalTitle.textContent = 'Edit Contact';
    contactForm.contactName.value = contacts[index].name;
    contactForm.contactPhone.value = contacts[index].phone;
    contactForm.contactEmail.value = contacts[index].email;
  } else {
    editIndex = null;
    modalTitle.textContent = 'Add Contact';
    contactForm.reset();
  }
}

// Add/Edit Contact
contactForm.onsubmit = function(e){
  e.preventDefault();
  const c = {
    name: contactForm.contactName.value,
    phone: contactForm.contactPhone.value,
    email: contactForm.contactEmail.value
  };
  if(editIndex!==null) contacts[editIndex]=c;
  else contacts.push(c);
  saveContacts();
  renderContacts();
  contactModal.style.display='none';
}

// Open modal
addContactBtn.onclick = ()=>openModal();
closeBtn.onclick = ()=>contactModal.style.display='none';
window.onclick = e => { if(e.target==contactModal) contactModal.style.display='none'; }

// ---------- Location Functions ----------
function startLiveLocation(){
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(pos=>{
      liveLocation = pos.coords;
      alert(`Live location started: ${liveLocation.latitude}, ${liveLocation.longitude}`);
      if(locationInterval) clearInterval(locationInterval);
      locationInterval = setInterval(()=>{
        navigator.geolocation.getCurrentPosition(p=>liveLocation=p.coords);
      },15000);
    });
  } else alert('Geolocation not supported');
}
startLocationBtn.onclick = startLiveLocation;

// ---------- Alert Functions ----------
function sendAlert(fake=false){
  if(!liveLocation) { alert('Start live location first'); return; }
  const level = riskLevel.value;
  const link = `https://www.google.com/maps?q=${liveLocation.latitude},${liveLocation.longitude}`;
  const msg = `🚨 IntelliSafe Alert 🚨
I need help.
Risk Level: ${level.toUpperCase()}
Location: ${link}`;

  if(fake) alert('[Fake Mode] Alert would be sent:\n'+msg);
  else {
    contacts.forEach(c=>{
      // WhatsApp Link
      window.open(`https://wa.me/${c.phone}?text=${encodeURIComponent(msg)}`, '_blank');
      // EmailJS placeholder (requires setup)
      console.log(`Email to ${c.email}: ${msg}`);
    });
    alert('Alert sent successfully!');
  }
}

emergencyBtn.onclick = ()=>sendAlert(false);
testBtn.onclick = ()=>sendAlert(true);

renderContacts();
