// ================== SEND ALERT WITH LOCATION ==================
function sendAlert() {
  if (contacts.length === 0) {
    showNotification('Add your emergency contacts first!');
    return;
  }

  const messageBox = document.getElementById('customMessage');
  const customMessage = messageBox.value || "🚨 I am in emergency. Please help!";

  // Request location from browser
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const locationLink = `https://www.google.com/maps?q=${lat},${lng}`;

        // Send message to all contacts (replace console.log with your actual send logic)
        contacts.forEach(c => {
          console.log(`Alert sent to ${c.name} (${c.phone}): ${customMessage} ${locationLink}`);
          // Example: sendWhatsAppMessage(c.phone, `${customMessage} Location: ${locationLink}`);
        });

        showNotification("🚨 Critical alert sent with live location!");
      },
      (error) => {
        console.error("Location access denied or failed:", error);
        showNotification("❌ Cannot access location! Alert sent without location.");
        // Send message without location as fallback
        contacts.forEach(c => {
          console.log(`Alert sent to ${c.name} (${c.phone}): ${customMessage}`);
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  } else {
    showNotification("❌ Geolocation is not supported by this browser!");
    // Send message without location as fallback
    contacts.forEach(c => {
      console.log(`Alert sent to ${c.name} (${c.phone}): ${customMessage}`);
    });
  }
}
