// camera.js
export const initCamera = () => {
  const cameraBtn = document.getElementById("cameraBtn");
  const frontCamBtn = document.getElementById("frontCam");
  const backCamBtn = document.getElementById("backCam");
  const video = document.getElementById("video");
  const captureBtn = document.getElementById("captureBtn");
  const canvas = document.getElementById("canvas");
  const photoPreview = document.getElementById("photoPreview");
  const imageInput = document.getElementById("imageInput");

  let currentStream;

  cameraBtn.addEventListener("click", () => {
    document.getElementById("cameraOptions").classList.remove("hidden");
  });

  const openCamera = (facingMode) => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: false })
      .then((stream) => {
        currentStream = stream;
        video.srcObject = stream;
        video.classList.remove("hidden");
        captureBtn.classList.remove("hidden");
      })
      .catch(() => alert("Camera access denied or not available."));
  };

  frontCamBtn.addEventListener("click", () => openCamera("user"));
  backCamBtn.addEventListener("click", () => openCamera("environment"));

  captureBtn.addEventListener("click", () => {
    if (!currentStream) return alert("Camera not started.");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return alert("Failed to capture image.");

      photoPreview.src = URL.createObjectURL(blob);
      photoPreview.classList.remove("hidden");

      const file = new File([blob], "issue.png", { type: "image/png" });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      imageInput.files = dataTransfer.files;
    }, "image/png");

    currentStream.getTracks().forEach(track => track.stop());
    video.classList.add("hidden");
    captureBtn.classList.add("hidden");
  });
};
