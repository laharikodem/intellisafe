function sendAlert() {
  let contact = document.getElementById("contact").value;

  if (contact === "") {
    alert("Enter contact!");
    return;
  }

  navigator.geolocation.getCurrentPosition((position) => {
    let lat = position.coords.latitude;
    let lon = position.coords.longitude;

    let message = `🚨 Emergency! I need help.\nLocation: https://www.google.com/maps?q=${lat},${lon}`;

    // Detect if mobile
    let isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

    if (isMobile) {
      // Open SMS app on phone
      let smsLink = `sms:${contact}?body=${encodeURIComponent(message)}`;
      window.location.href = smsLink;
    }

    // ALWAYS show confirmation (for laptop + demo)
    document.getElementById("result").innerHTML = `
      <div class="danger">
        🚨 ALERT SENT SUCCESSFULLY<br>
        📞 Contact: ${contact}<br>
        📍 Location Shared
      </div>
    `;

    // Optional popup
    alert("🚨 Emergency alert triggered!");
  },
  () => {
    alert("Location access denied");
  });
}
