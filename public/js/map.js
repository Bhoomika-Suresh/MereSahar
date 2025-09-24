export const initializeMap = (issues) => {
  const map = L.map("map").setView([20.5937, 78.9629], 5);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  const markers = L.markerClusterGroup();

  const getIcon = (status) => {
    let color = "red";
    if (status === "Ongoing") color = "yellow";
    if (status === "Completed") color = "green";
    return L.divIcon({
      className: "custom-marker",
      html: `<i style="background:${color}; width:16px; height:16px; display:block; border-radius:50%; border:2px solid white;"></i>`,
      iconSize: [16, 16],
    });
  };

  issues.forEach((issue) => {
    if (!issue.latitude || !issue.longitude) return;

    const popupContainer = document.createElement("div");
    popupContainer.innerHTML = `
      <b>${issue.username || "Anonymous"}</b><br>
      <b>Category:</b> ${issue.category}<br>
      <b>Description:</b> ${issue.description}<br>
      <b>Status:</b> ${issue.status}<br>
      <b>Location:</b> (${issue.latitude}, ${issue.longitude})<br>
      <div style="display:flex; gap:6px; margin-top:6px;" class="image-container"></div>
    `;

    const imgContainer = popupContainer.querySelector(".image-container");

    // Helper: create wrapper
    const createImageWrapper = (id, type, label) => {
      const wrapper = document.createElement("div");
      wrapper.className = "img-wrapper";
      wrapper.innerHTML = `<span class="img-loading">Loading ${label}...</span>`;

      const img = document.createElement("img");
      img.className = "popup-img";
      img.style.display = "none";
      img.src = `/images/${id}/${type}`;

      img.addEventListener("load", () => {
        wrapper.querySelector(".img-loading").style.display = "none";
        img.style.display = "block";
      });

      img.addEventListener("error", () => {
        wrapper.querySelector(".img-loading").textContent = `${label} image not available`;
      });

      wrapper.appendChild(img);
      return wrapper;
    };

    // CASE HANDLING
    if (!issue.has_before && !issue.has_after) {
      // Case 1: No images at all
      imgContainer.innerHTML = `<span style="color:gray;">No images uploaded yet</span>`;
    } else {
      if (issue.has_before) {
        imgContainer.appendChild(createImageWrapper(issue.id, "before", "Before"));
      }
      if (issue.has_after) {
        imgContainer.appendChild(createImageWrapper(issue.id, "after", "After"));
      }
    }

    const marker = L.marker([issue.latitude, issue.longitude], {
      icon: getIcon(issue.status),
    }).bindPopup(popupContainer);

    markers.addLayer(marker);
  });

  map.addLayer(markers);
  return map;
};
