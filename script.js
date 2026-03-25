// Load saved contacts from localStorage
window.onload = function () {
  let saved = JSON.parse(localStorage.getItem("contacts")) || [];
  let dropdown = document.getElementById("contact");

  saved.forEach(c => {
    let option = document.createElement("option");
    option.value = c.number;
    option.text = `${c.name} (${c.number})`;
    dropdown.appendChild(option);
  });
};

// Add new contact
function addContact() {
  let name = document.getElementById("newName").value;
  let number = document.getElementById("newNumber").value;

  if (!name || !number) {
    alert("Enter both name and number!");
    return;
  }

  let contacts = JSON.parse(localStorage.getItem("contacts")) || [];
  contacts.push({ name, number });
  localStorage.setItem("contacts", JSON.stringify(contacts));

  alert("✅ Contact saved!");

  let dropdown = document.getElementById("contact");
  let option = document.createElement("option");
  option.value = number;
  option.text = `${name} (${number})`;
  dropdown.appendChild(option);

  document.getElementById("newName").value = "";
  document.getElementById("newNumber").value = "";
}

// Check emergency
function checkSafety() {
  let text = document.getElementById("textInput").value.toLowerCase();
  let result = document.getElementById("result");

  if (text.includes("help") || text.includes("danger") || text.includes("accident")) {
    result.innerHTML = "🚨 Emergency Detected!";
    result.className = "danger";
    getLocation();
  } else {
    result.innerHTML = "✅ You are safe";
    result.className = "safe";
  }
}

// Get location
function getLocation() {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      let lat = position.coords.latitude;
      let lon = position.coords.longitude;
      document.getElementById("location").innerHTML =
        `📍 <a href="https://www.google.com/maps?q=${lat},${lon}" target="_blank">
        Open Live Location
        </a>`;
    },
    () => {
      document.getElementById("location").innerHTML = "⚠️ Location access denied";
    }
  );
}

// Voice input
function startVoice() {
  let recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.start();
  recognition.onresult = function(event) {
    let speech = event.results[0][0].transcript;
    document.getElementById("textInput").value = speech;
  };
}

// WhatsApp Alert
function sendAlert() {
  let contact = document.getElementById("contact").value;
  if (!contact) {
    alert("Select a contact!");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      let lat = position.coords.latitude;
      let lon = position.coords.longitude;

      let message = `🚨 EMERGENCY ALERT!
I need immediate help.
📍 Live Location: https://www.google.com/maps?q=${lat},${lon}`;

      let url = `https://wa.me/${contact}?text=${encodeURIComponent(message)}`;
      window.open(url, "_blank");

      showSuccess(contact);
    },
    () => {
      let message = "🚨 Emergency! I need help!";
      let url = `https://wa.me/${contact}?text=${encodeURIComponent(message)}`;
      window.open(url, "_blank");
      showSuccess(contact);
    }
  );
}

// Show alert status
function showSuccess(contact) {
  document.getElementById("result").innerHTML = `
    <div class="danger">
      🚨 ALERT SENT VIA WHATSAPP<br>
      📞 ${contact}<br>
      📍 Location Shared
    </div>
  `;
  alert("✅ Alert triggered (WhatsApp opened)!");
}
