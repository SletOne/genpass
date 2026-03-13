import { initUI } from './ui.js';
import { showToast } from './utils.js';

document.addEventListener("DOMContentLoaded", () => {
  initUI();
  registerServiceWorker();
});

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").then((reg) => {
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            showToast("Nouvelle version disponible", false, () => {
              window.location.reload();
            }, "Recharger");
          }
        });
      });
    }).catch((err) => {
      console.error("Service Worker registration failed:", err);
    });
  }
}
