// Emergency keywords
const dangerKeywords = ["help", "emergency", "attack", "danger", "fire", "accident"];

// Predefined contacts
let contacts = [
  { name: "Mom", number: "919391512953" },
  { name: "Dad", number: "919640234022" }
];

// Check safety function
function checkSafety() {
  const text = document.getElementById("textInput").value.toLowerCase();
  const resultDiv = document.getElementById("result");

  let danger = dangerKeywords.some(word => text.includes(word));

  if(danger) {
    resultDiv.innerHTML = "⚠️ Danger Detected!";
    resultDiv.className = "danger";
    sendAlert(); // Immediately send alert
  } else {
    resultDiv.innerHTML = "✅ Seems Safe";
    resultDiv.className = "safe";
  }
}

// Voice input function
function startVoice() {
  if (!('webkitSpeechRecognition' in window)) {
    alert("Your browser does not support voice recognition");
    return;
  }
  
  const recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.start();

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    document.getElementById("textInput").value = transcript;
    checkSafety(); // Auto-check safety after voice input
  };

  recognition.onerror = (event) => {
    alert("Voice recognition error: " + event.error);
  };
}

// Add new contact
function addContact() {
  const name = document.getElementById("newName").value;
  const number = document.getElementById("newNumber").value;

  if(name && number) {
    contacts.push({ name, number });
    const select = document.getElementById("contact");
    const option = document.createElement("option");
    option.value = number;
    option.text = `👤 ${name}`;
    select.add(option);
    document.getElementById("newName").value = "";
    document.getElementById("newNumber").value = "";
    alert("Contact added!");
  }
}

// Send emergency alert
function sendAlert() {
  const locationDiv = document.getElementById("location");

  if (!navigator.geolocation) {
    locationDiv.innerHTML = "Unable to access location";
    return;
  }

  navigator.geolocation.getCurrentPosition((position) => {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    locationDiv.innerHTML = `Location: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;

    const message = `🚨 Emergency! I need help. My location: https://www.google.com/maps?q=${lat},${lng}`;

    contacts.forEach(contact => {
      // WhatsApp API link to send alert automatically (opens in WhatsApp)
      const url = `https://wa.me/${contact.number}?text=${encodeURIComponent(message)}`;
      window.open(url, "_blank"); // Opens new tab for each contact
    });

  }, (error) => {
    locationDiv.innerHTML = "Location access denied";
  });
}
