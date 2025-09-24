// language-api.js
const apiUrl = "https://libretranslate.com/translate"; 
let currentLang = "en";
const originalText = new WeakMap();

// Show loader while translating
const loader = document.createElement("div");
loader.id = "translation-loader";
loader.textContent = "Translating...";
Object.assign(loader.style, {
  position: "fixed",
  top: "10px",
  right: "10px",
  background: "#000",
  color: "#fff",
  padding: "5px 10px",
  zIndex: 9999,
  display: "none",
});
document.body.appendChild(loader);

// Translate single text
async function translateText(text, target) {
  if (!text || target === "en") return text;
  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      body: JSON.stringify({ q: text, source: "en", target, format: "text" }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    return data.translatedText || text;
  } catch (err) {
    console.error("Translation error:", err);
    return text;
  }
}

// Recursively get all text nodes and placeholders
function getAllNodes(node) {
  const nodes = [];
  if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() !== "") nodes.push(node);
  else if (node.nodeType === Node.ELEMENT_NODE) {
    if (node.placeholder) nodes.push(node);
    node.childNodes.forEach(child => nodes.push(...getAllNodes(child)));
  }
  return nodes;
}

// Translate the page
export async function translatePage(targetLang) {
  loader.style.display = "block";
  const nodes = getAllNodes(document.body);

  for (const node of nodes) {
    if (!originalText.has(node)) {
      if (node.nodeType === Node.TEXT_NODE) originalText.set(node, node.nodeValue);
      else if (node.placeholder) originalText.set(node, node.placeholder);
    }

    if (node.nodeType === Node.TEXT_NODE) {
      node.nodeValue = targetLang === "en" ? originalText.get(node) : await translateText(originalText.get(node), targetLang);
    } else if (node.placeholder) {
      node.placeholder = targetLang === "en" ? originalText.get(node) : await translateText(originalText.get(node), targetLang);
    }
  }
  loader.style.display = "none";
}

// Initialize dropdown listener
window.addEventListener("DOMContentLoaded", () => {
  const languageDropdown = document.getElementById("language");
  languageDropdown.addEventListener("change", async (e) => {
    currentLang = e.target.value;
    await translatePage(currentLang);
  });
  // Initial scan
  translatePage("en");
});
