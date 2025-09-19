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
    return;0
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

// ✅ Camera functionality
const cameraBtn = document.getElementById("cameraBtn");
const cameraContainer = document.getElementById("cameraContainer");
const cameraPreview = document.getElementById("cameraPreview");
const captureBtn = document.getElementById("captureBtn");
const cameraCanvas = document.getElementById("cameraCanvas");
const imageDataInput = document.getElementById("imageData");
const photoPreview = document.getElementById("photoPreview");
const previewImg = document.getElementById("previewImg");

let stream;

// Open camera (front/back)
cameraBtn.addEventListener("click", async () => {
  const choice = confirm("Click OK for Front Camera, Cancel for Back Camera");

  const constraints = {
    video: { facingMode: choice ? "user" : "environment" },
    audio: false
  };

  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    cameraPreview.srcObject = stream;
    cameraContainer.style.display = "block";
  } catch (err) {
    alert("Camera access denied or not available.");
    console.error(err);
  }
});

// Capture photo
captureBtn.addEventListener("click", () => {
  const context = cameraCanvas.getContext("2d");
  cameraCanvas.width = cameraPreview.videoWidth;
  cameraCanvas.height = cameraPreview.videoHeight;
  context.drawImage(cameraPreview, 0, 0, cameraCanvas.width, cameraCanvas.height);

  // Convert to Base64
  const imageData = cameraCanvas.toDataURL("image/png");
  imageDataInput.value = imageData;

  // Show preview
  previewImg.src = imageData;
  photoPreview.style.display = "block";

  // Stop camera
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
  cameraContainer.style.display = "none";
});
