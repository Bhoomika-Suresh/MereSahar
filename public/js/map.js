// map.js
export const initializeMap = (issues) => {
  const map = L.map("map").setView([20.5937, 78.9629], 5);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  const issueMarkers = L.markerClusterGroup();

  issues.forEach((issue) => {
    let popupContent = `
      <b>${issue.username || "Anonymous"}</b><br>
      <b>Category:</b> ${issue.category}<br>
      <b>Description:</b> ${issue.description}<br>
      <b>Status:</b> ${issue.status || "Pending"}<br>
      <b>Location:</b> (${issue.latitude}, ${issue.longitude})<br>
    `;

    if (issue.image) {
      popupContent += `<img src="${issue.image}" alt="Issue Image" class="popup-img"/>`;
    }

    const marker = L.marker([issue.latitude, issue.longitude]).bindPopup(popupContent);
    issueMarkers.addLayer(marker);
  });

  map.addLayer(issueMarkers);
  return map;
};
