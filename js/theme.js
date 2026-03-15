/**
 * Gestion du thème clair/sombre.
 * Partagé entre ui.js (index.html) et privacy.js (privacy.html).
 */

/**
 * Lit le thème sauvegardé en localStorage et l'applique au document.
 * Appelé au chargement de la page pour éviter le flash de thème incorrect.
 */
export function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
}

/**
 * Bascule entre thème clair et sombre, et persiste le choix.
 */
export function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
}
