// geolocation.js
export const initGeolocation = (map) => {
  let userMarker;

  document.getElementById("getLoc").addEventListener("click", () => {
    const username = document.getElementById("username").value.trim();
    if (!username) return alert("Please enter your name first!");
    if (!navigator.geolocation) return alert("Geolocation not supported");

    navigator.geolocation.getCurrentPosition(success, error);

    function success(position) {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      document.getElementById("issueLat").value = latitude;
      document.getElementById("issueLng").value = longitude;

      if (userMarker) {
        userMarker.setLatLng([latitude, longitude]).bindPopup(`📍 ${username}`).openPopup();
      } else {
        userMarker = L.marker([latitude, longitude])
          .addTo(map)
          .bindPopup(`📍 ${username}`)
          .openPopup();
      }

      map.setView([latitude, longitude], 13);
    }

    function error() {
      alert("Unable to retrieve location.");
    }
  });
};
