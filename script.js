// Add contact
function addContact(name, phone) {
  let contacts = JSON.parse(localStorage.getItem("contacts")) || [];
  contacts.push({name: name, phone: phone});
  localStorage.setItem("contacts", JSON.stringify(contacts));
  displayContacts();
}

// Display contacts
function displayContacts() {
  let contacts = JSON.parse(localStorage.getItem("contacts")) || [];
  let list = document.getElementById("contact-list");
  list.innerHTML = "";
  contacts.forEach((c, i) => {
    list.innerHTML += `<li>${c.name} - ${c.phone} <button onclick="deleteContact(${i})">Delete</button></li>`;
  });
}

// Delete contact
function deleteContact(index) {
  let contacts = JSON.parse(localStorage.getItem("contacts"));
  contacts.splice(index, 1);
  localStorage.setItem("contacts", JSON.stringify(contacts));
  displayContacts();
}

// Send alert to all contacts
function sendAlert(message) {
  let contacts = JSON.parse(localStorage.getItem("contacts")) || [];
  contacts.forEach(contact => {
    console.log(`Sending "${message}" to ${contact.phone}`);
    // integrate Twilio API here to actually send
  });
}
