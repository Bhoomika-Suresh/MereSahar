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

// ==== Camera functionality ====

// Elements from index.ejs
const cameraBtn = document.getElementById("cameraBtn");
const cameraOptions = document.getElementById("cameraOptions");
const frontCam = document.getElementById("frontCam");
const backCam = document.getElementById("backCam");
const video = document.getElementById("video");
const captureBtn = document.getElementById("captureBtn");
const canvas = document.getElementById("canvas");
const photoPreview = document.getElementById("photoPreview");
const capturedImage = document.getElementById("capturedImage");

let stream;

// Show options when "Open Camera" is clicked
cameraBtn.addEventListener("click", () => {
  cameraOptions.classList.remove("hidden");
});

// Start camera with chosen facing mode
async function startCamera(facingMode) {
  const constraints = { video: { facingMode }, audio: false };

  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    video.classList.remove("hidden");
    captureBtn.classList.remove("hidden");
    cameraOptions.classList.add("hidden"); // hide buttons after selection
  } catch (err) {
    alert("Camera access denied or not available.");
    console.error(err);
  }
}

// Handle front/back camera buttons
frontCam.addEventListener("click", () => startCamera("user"));
backCam.addEventListener("click", () => startCamera("environment"));

// Capture photo
captureBtn.addEventListener("click", () => {
  const context = canvas.getContext("2d");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Convert to Base64
  const imageData = canvas.toDataURL("image/png");
  capturedImage.value = imageData;

  // Show preview
  photoPreview.src = imageData;
  photoPreview.classList.remove("hidden");

  // Stop camera
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }

  video.classList.add("hidden");
  captureBtn.classList.add("hidden");
});
