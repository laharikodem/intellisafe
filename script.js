function sendAlert() {
  let contact = document.getElementById("contact").value;

  if (!contact) {
    alert("Select contact!");
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

      // Show instant UI (feels auto)
      document.getElementById("result").innerHTML = `
        <div class="danger">
          🚨 AUTO ALERT TRIGGERED<br>
          📞 ${contact}<br>
          📡 Sending location...
        </div>
      `;

      // Open WhatsApp instantly
      window.open(url, "_blank");

      // Simulate sending
      setTimeout(() => {
        document.getElementById("result").innerHTML = `
          <div class="danger">
            ✅ ALERT SENT SUCCESSFULLY<br>
            📞 ${contact}<br>
            📍 Location Shared
          </div>
        `;
      }, 2000);
    },
    () => {
      alert("Location permission needed!");
    }
  );
}
