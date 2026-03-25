// Replace or update your send/alert function with this:

function sendAlertWithLocation() {
  if (!contacts || contacts.length === 0) {
    showNotification('Add emergency contacts first!');
    return;
  }

  const msgField = document.getElementById("customMessage");
  const message = msgField?.value || "🚨 Emergency! Please help me!";

  if (!navigator.geolocation) {
    showNotification("❌ Location not supported");
    sendToContacts(message); // fallback
    return;
  }

  navigator.geolocation.getCurrentPosition(position => {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const locationLink = `https://www.google.com/maps?q=${lat},${lng}`;

    contacts.forEach(c => {
      const fullMsg = `${message}\nLocation: ${locationLink}`;
      // Your existing send function here
      sendMessageToContact(c.phone, fullMsg);
    });

    showNotification("🚨 Alert sent with location!");
  }, error => {
    console.error(error);
    showNotification("❌ Location denied — sending without it.");
    contacts.forEach(c => sendMessageToContact(c.phone, message));
  });
}
