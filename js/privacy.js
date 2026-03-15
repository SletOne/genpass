import { initTheme, toggleTheme } from "./theme.js";

// Appliquer le thème sauvegardé dès le chargement (modules sont différés, DOM déjà prêt)
initTheme();

const themeToggle = document.getElementById("themeToggle");
if (themeToggle) {
  themeToggle.addEventListener("click", toggleTheme);
}
