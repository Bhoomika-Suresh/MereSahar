export const initializeMap = (issues) => {
  const map = L.map("map").setView([20.5937, 78.9629], 5);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  const markers = L.markerClusterGroup({
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    chunkedLoading: true,
    maxClusterRadius: 50,
  });

  const getIcon = (status) => {
    let color = "#e74c3c"; // Pending - red
    if (status === "Ongoing") color = "#f39c12"; // Ongoing - orange
    if (status === "Completed") color = "#2ecc71"; // Completed - green

    return L.divIcon({
      className: "custom-marker",
      html: `<i style="background:${color}; width:20px; height:20px; display:block; border-radius:50%; border:3px solid white; box-shadow:0 2px 8px rgba(0,0,0,0.3);"></i>`,
      iconSize: [20, 20],
    });
  };

  issues.forEach((issue) => {
    if (!issue.latitude || !issue.longitude) return;

    const popupHtml = `
      <div class="popup-card">
        <div class="popup-header">
          <div class="popup-title">
            <span>${issue.username || "Anonymous"}</span>
            <span class="popup-category">${issue.category}</span>
          </div>
        </div>
        <div class="popup-content">
          <div class="popup-detail">
            <span class="popup-label">Status:</span>
            <span class="popup-value">
              <span class="status-badge status-${(issue.status||'pending').toLowerCase()}">
                ${issue.status || 'Pending'}
              </span>
            </span>
          </div>
          <div class="popup-detail">
            <span class="popup-label">Description:</span>
            <span class="popup-value">${issue.description}</span>
          </div>
          <div class="popup-detail">
            <span class="popup-label">Location:</span>
            <span class="popup-value location-coords">${Number(issue.latitude).toFixed(4)}, ${Number(issue.longitude).toFixed(4)}</span>
          </div>
          <div class="popup-images">
            <div class="images-section-title">Images</div>
            <div class="image-grid">
              ${issue.has_before ? `
                <div class="image-wrapper">
                  <span class="img-loading">Loading Before...</span>
                  <img class="popup-img" src="/images/${issue.id}/before" alt="Before Image" 
                    onload="this.previousElementSibling.remove(); this.style.display='block';" 
                    onerror="this.previousElementSibling.textContent='Before image not available'; this.style.display='block';" 
                    style="display:none;"/>
                </div>` : ''}
              ${issue.has_after ? `
                <div class="image-wrapper">
                  <span class="img-loading">Loading After...</span>
                  <img class="popup-img" src="/images/${issue.id}/after" alt="After Image" 
                    onload="this.previousElementSibling.remove(); this.style.display='block';" 
                    onerror="this.previousElementSibling.textContent='After image not available'; this.style.display='block';" 
                    style="display:none;"/>
                </div>` : ''}
              ${!issue.has_before && !issue.has_after ? `<div class="no-images">No images uploaded yet</div>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;

    const marker = L.marker([issue.latitude, issue.longitude], { icon: getIcon(issue.status) })
                    .bindPopup(popupHtml);

    markers.addLayer(marker);
  });

  map.addLayer(markers);
  return map;
};
