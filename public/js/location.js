// Initialize map
const map = L.map("map").setView([20.5937, 78.9629], 5);

// Add OpenStreetMap tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

let userMarker;

document.getElementById("getLoc").addEventListener("click", () => {
  const username = document.getElementById("username").value.trim();
  if (!username) {
    alert("Please enter your name first!");
    return;
  }

  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(success, error);

  function success(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    // Fill hidden inputs
    document.getElementById("issueLat").value = latitude;
    document.getElementById("issueLng").value = longitude;

    // Show marker with user's name
    if (userMarker) {
      userMarker.setLatLng([latitude, longitude]);
      userMarker.bindPopup(`📍 ${username}`).openPopup();
    } else {
      userMarker = L.marker([latitude, longitude]).addTo(map)
        .bindPopup(`📍 ${username}`)
        .openPopup();
    }

    map.setView([latitude, longitude], 13);
  }

  function error() {
    alert("Unable to retrieve location.");
  }
});

window.map = map;
