function analyze() {
    let text = document.getElementById("inputText").value.toLowerCase();

    let dangerWords = ["help", "danger", "attack", "save", "emergency", "threat"];

    let isDanger = dangerWords.some(word => text.includes(word));

    if (isDanger) {
        document.getElementById("result").innerText = "🚨 Emergency Detected!";
        document.getElementById("result").style.color = "red";
        getLocation();
    } else {
        document.getElementById("result").innerText = "✅ You are Safe";
        document.getElementById("result").style.color = "lightgreen";
    }
}

// 🎤 Voice input
function startVoice() {
    let recognition = new webkitSpeechRecognition();
    recognition.lang = "en-IN";

    recognition.onresult = function(event) {
        document.getElementById("inputText").value =
            event.results[0][0].transcript;
    };

    recognition.start();
}

// 📍 Location
function getLocation() {
    navigator.geolocation.getCurrentPosition(function(pos) {
        let lat = pos.coords.latitude;
        let lon = pos.coords.longitude;

        document.getElementById("location").innerText =
            "📍 Location: " + lat + ", " + lon;
    });
}

// 🚨 Alert simulation
function sendAlert() {
    alert("🚨 Alert sent to emergency contacts with your location!");
}
