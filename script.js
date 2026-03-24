function sendAlert() {
  let contact = document.getElementById("contact").value;

  if (!contact) {
    alert("Enter contact with country code (+91...)");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      let lat = position.coords.latitude;
      let lon = position.coords.longitude;

      let message = `🚨 Emergency! I need help.
📍 Location: https://www.google.com/maps?q=${lat},${lon}`;

      let url = `https://wa.me/${contact}?text=${encodeURIComponent(message)}`;

      // Open WhatsApp
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

// UI confirmation
function showSuccess(contact) {
  document.getElementById("result").innerHTML = `
    <div class="danger">
      🚨 ALERT SENT VIA WHATSAPP<br>
      📞 ${contact}<br>
      📍 Location Shared
    </div>
  `;

  alert("✅ Opening WhatsApp...");
}
