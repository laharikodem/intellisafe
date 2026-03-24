function checkSafety() {
  let text = document.getElementById("textInput").value.toLowerCase();
  let result = document.getElementById("result");

  if (text.includes("help") || text.includes("danger") || text.includes("accident")) {
    result.innerHTML = "🚨 Emergency Detected!";
    result.classList.add("danger");
    getLocation();
  } else {
    result.innerHTML = "✅ You are safe";
    result.classList.remove("danger");
  }
}

// 📍 LOCATION
function getLocation() {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      let lat = position.coords.latitude;
      let lon = position.coords.longitude;

      document.getElementById("location").innerHTML =
        `📍 <a href="https://www.google.com/maps?q=${lat},${lon}" target="_blank" style="color:yellow;">
        Open Live Location
        </a>`;
    },
    () => {
      alert("Location access denied");
    }
  );
}

// 🎤 VOICE
function startVoice() {
  let recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.start();

  recognition.onresult = function(event) {
    let speech = event.results[0][0].transcript;
    document.getElementById("textInput").value = speech;
  };
}

// 🚨 ALERT
function sendAlert() {
  let contact = document.getElementById("contact").value;

  if (contact === "") {
    alert("Enter contact first!");
    return;
  }

  alert("🚨 Alert sent to " + contact + "\nHelp needed! Check location.");
}
