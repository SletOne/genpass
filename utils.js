/**
 * Échappe les caractères HTML spéciaux pour prévenir les injections XSS.
 * Utilisé systématiquement avant tout innerHTML contenant du contenu dynamique.
 * @param {string} str - Chaîne brute à sécuriser
 * @returns {string} Chaîne avec entités HTML encodées
 */
export function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

let toastContainer = null;

/**
 * Affiche une notification toast.
 * @param {string} message - Message à afficher
 * @param {boolean} isError - Si true, le style sera "erreur"
 * @param {function} [actionCallback] - Action optionnelle au clic
 * @param {string} [actionText="Recharger"] - Texte de l'action
 */
export function showToast(message, isError = false, actionCallback = null, actionText = "Recharger") {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${isError ? 'toast-error' : ''}`;
  toast.textContent = message;

  if (actionCallback) {
    const actionBtn = document.createElement('button');
    actionBtn.className = 'toast-action';
    actionBtn.textContent = actionText;
    actionBtn.addEventListener('click', () => {
      actionCallback();
      toast.classList.remove('show');
    });
    toast.appendChild(actionBtn);
  }

  toastContainer.appendChild(toast);

  // Déclencher l'animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Suppression automatique sauf si actionCallback
  if (!actionCallback) {
    setTimeout(() => {
      toast.classList.remove('show');
      toast.addEventListener('transitionend', () => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      });
    }, 3000);
  }
}
