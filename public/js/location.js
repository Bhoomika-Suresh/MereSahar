// ---------------------------------------------------------
// Initialize Leaflet map and set default view (India center)
// ---------------------------------------------------------
const map = L.map("map").setView([20.5937, 78.9629], 5); // Lat/Lng of India, zoom = 5

// ---------------------------------------------------------
// Add OpenStreetMap tiles (map layer)
// ---------------------------------------------------------
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19, // Maximum zoom level
  attribution: "&copy; OpenStreetMap contributors", // Attribution required by OSM
}).addTo(map);

// ---------------------------------------------------------
// Marker variable (will hold the user's location marker)
// ---------------------------------------------------------
let userMarker;

// ---------------------------------------------------------
// Event listener for "Get My Location" button
// ---------------------------------------------------------
document.getElementById("getLoc").addEventListener("click", () => {
  const output = document.getElementById("output"); // Paragraph to display lat/lng

  // Check if browser supports Geolocation API
  if (!navigator.geolocation) {
    output.textContent = "Geolocation not supported.";
    return;
  }

  // Ask browser for current position
  navigator.geolocation.getCurrentPosition(success, error);

  // -------------------------------------------------------
  // SUCCESS: Runs if location is retrieved successfully
  // -------------------------------------------------------
  function success(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    // Show coordinates on page
    output.textContent = `Lat: ${latitude}, Lng: ${longitude}`;

    // Save coordinates into hidden form inputs (for submitting to server)
    document.getElementById("lat").value = latitude;
    document.getElementById("lng").value = longitude;

    // Add a marker if none exists, otherwise update its position
    if (userMarker) {
      userMarker.setLatLng([latitude, longitude]); // Move marker
    } else {
      userMarker = L.marker([latitude, longitude]).addTo(map) // Create marker
        .bindPopup("📍 You are here") // Add popup text
        .openPopup();
    }

    // Zoom in to user's location
    map.setView([latitude, longitude], 13);
  }

  // -------------------------------------------------------
  // ERROR: Runs if user denies or there is an issue
  // -------------------------------------------------------
  function error() {
    output.textContent = "Unable to retrieve location (user denied or error).";
  }
});
