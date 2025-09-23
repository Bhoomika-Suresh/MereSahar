export const initializeMap = (issues) => {
  const map = L.map("map").setView([20.5937, 78.9629], 5);

  // Add OpenStreetMap base layer
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  // Cluster group
  const issueMarkers = L.markerClusterGroup();

  // Custom colored icons by status
  const getIcon = (status) => {
    let color = "red"; // default Pending
    if (status === "Ongoing") color = "yellow";
    if (status === "Completed") color = "green";

    return L.divIcon({
      className: "custom-marker",
      html: `<i style="background:${color};
                      width:16px;
                      height:16px;
                      display:block;
                      border-radius:50%;
                      border:2px solid white;"></i>`,
      iconSize: [16, 16],
    });
  };

  issues.forEach((issue) => {
    if (!issue.latitude || !issue.longitude) return;

    let popupContent = `
      <b>${issue.username || "Anonymous"}</b><br>
      <b>Category:</b> ${issue.category}<br>
      <b>Description:</b> ${issue.description}<br>
      <b>Status:</b> ${issue.status || "Pending"}<br>
      <b>Location:</b> (${issue.latitude}, ${issue.longitude})<br>
    `;

    // Show before & after images side by side
    if (issue.image || issue.after_image) {
      popupContent += `<div style="display:flex; gap:6px; margin-top:6px;">`;
      if (issue.image) {
        popupContent += `<img src="${issue.image}" alt="Before" class="popup-img" style="width:120px; height:100px; object-fit:cover; border-radius:6px;">`;
      }
      if (issue.after_image) {
        popupContent += `<img src="${issue.after_image}" alt="After" class="popup-img" style="width:120px; height:100px; object-fit:cover; border-radius:6px;">`;
      }
      popupContent += `</div>`;
    }

    const marker = L.marker([issue.latitude, issue.longitude], {
      icon: getIcon(issue.status),
    }).bindPopup(popupContent);

    issueMarkers.addLayer(marker);
  });

  map.addLayer(issueMarkers);
  return map;
};
