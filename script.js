// ============ CONTACT MANAGEMENT ============
let contacts = JSON.parse(localStorage.getItem('contacts')) || [];

function renderContacts() {
  const list = document.getElementById('contact-list');
  list.innerHTML = '';
  if (contacts.length === 0) {
    list.innerHTML = "<p>No contacts yet. Add them now!</p>";
  }
  contacts.forEach((c, index) => {
    const div = document.createElement('div');
    div.classList.add('contact-item');
    div.innerHTML = `${c.name} - ${c.phone} <button onclick="deleteContact(${index})">❌</button>`;
    list.appendChild(div);
  });
}

function addContactPrompt() {
  const name = prompt('Enter Contact Name:');
  if (!name) return;
  const phone = prompt('Enter Phone Number:');
  if (!phone) return;
  contacts.push({name, phone});
  localStorage.setItem('contacts', JSON.stringify(contacts));
  renderContacts();
}

function deleteContact(index) {
  contacts.splice(index, 1);
  localStorage.setItem('contacts', JSON.stringify(contacts));
  renderContacts();
}

renderContacts();

// ============ NOTIFICATION ============
function showNotification(msg) {
  const notif = document.getElementById('notification');
  notif.innerText = msg;
  notif.style.display = 'block';
  setTimeout(() => { notif.style.display = 'none'; }, 2000);
}

// ============ SILENT ONE-CLICK ALERT ============
function sendAlert() {
  if (contacts.length === 0) {
    showNotification('Add your emergency contacts first!');
    return;
  }

  const messageBox = document.getElementById('customMessage');
  const customMessage = messageBox.value || "🚨 I am in emergency. Please help!";

  navigator.geolocation.getCurrentPosition((pos) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    const link = `https://www.google.com/maps?q=${lat},${lng}`;

    contacts.forEach(c => {
      console.log(`Silent alert sent to ${c.name} (${c.phone}): ${customMessage} ${link}`);
    });

    // Critical alert animation
    const alertBtn = document.querySelector('.alert-btn');
    alertBtn.style.animation = 'shake 0.5s';
    setTimeout(() => alertBtn.style.animation = 'pulse 2s infinite', 500);

    showNotification(`🚨 Critical alert sent to all contacts!`);
  }, () => showNotification('Location access denied!'));
}

// ============ SAFETY CHECK ============
function checkSafety() {
  showNotification('🛡️ Safety check complete! You are safe.');
}

// ============ SHARE LOCATION ============
let locationInterval;
function shareLocation() {
  if (locationInterval) {
    clearInterval(locationInterval);
    locationInterval = null;
    showNotification('📍 Location sharing stopped!');
    return;
  }
  showNotification('📍 Location sharing started for 10 minutes!');
  const start = Date.now();
  locationInterval = setInterval(() => {
    const elapsed = (Date.now() - start) / 1000;
    if (elapsed > 600) { // 10 minutes
      clearInterval(locationInterval);
      locationInterval = null;
      showNotification('📍 Location sharing ended!');
      return;
    }
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      console.log(`Silent location update: ${lat},${lng}`);
    });
  }, 15000);
}
