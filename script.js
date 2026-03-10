/**
 * GenPass — Générateur de mots de passe sécurisé
 * Toute la logique est exécutée côté client uniquement.
 * Aucune donnée ne quitte le navigateur.
 */

/* ===== Sécurité : protection XSS ===== */

/**
 * Échappe les caractères HTML spéciaux pour prévenir les injections XSS.
 * Utilisé systématiquement avant tout innerHTML contenant du contenu dynamique.
 * @param {string} str - Chaîne brute à sécuriser
 * @returns {string} Chaîne avec entités HTML encodées
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ===== Configuration des jeux de caractères ===== */

// CONFIG et WORDS_FR sont définis dans data.js, chargé avant ce fichier.

/* ===== État de l'application ===== */

/** Paramètres courants de génération (mis à jour par les contrôles UI) */
let passwordSettings = {
  length: 16,
  uppercase: true,
  numbers: true,
  symbols: true,
  ambiguous: false,
  type: "random",
  // Options spécifiques au mode mémorable
  memUppercase: true,
  memNumbers: true,
  memSymbolsInWords: false,
  memSeparator: "-", // '-' | '.' | ' ' | '' | 'random'
  memAmbiguous: false,
  memMode: "words", // 'words' | 'citation'
};

/* ===== Références aux éléments du DOM ===== */

const lengthSlider = document.getElementById("lengthSlider");
const lengthValue = document.getElementById("lengthValue");
const lengthUnit = document.getElementById("lengthUnit");
const uppercaseCheck = document.getElementById("uppercaseCheck");
const numbersCheck = document.getElementById("numbersCheck");
const symbolsCheck = document.getElementById("symbolsCheck");
const ambiguousCheck = document.getElementById("ambiguousCheck");
const generatedPassword = document.getElementById("generatedPassword");
const generateBtn = document.getElementById("generateBtn");
const copyBtn = document.getElementById("copyBtn");
const toggleBtns = document.querySelectorAll(".toggle-btn");
const passwordList = document.getElementById("passwordList");
const strengthLabel = document.getElementById("strengthLabel");
const crackTimeEl = document.getElementById("crackTime");
const themeToggle = document.getElementById("themeToggle");

// Panneaux d'options spécifiques au mode
const randomOptions = document.getElementById("randomOptions");
const memorableOptions = document.getElementById("memorableOptions");

// Contrôles mode mémorable
const memUppercaseCheck = document.getElementById("memUppercaseCheck");
const memNumbersCheck = document.getElementById("memNumbersCheck");
const memSymbolsInWordsCheck = document.getElementById(
  "memSymbolsInWordsCheck",
);
const separatorSelect = document.getElementById("separatorSelect");
const memAmbiguousCheck = document.getElementById("memAmbiguousCheck");

// Contrôles mode citation
const memModeBtns = document.querySelectorAll(".mem-mode-btn");
const citationHint = document.getElementById("citationHint");
const citationText = document.getElementById("citationText");
const citationAuthor = document.getElementById("citationAuthor");

/** Dernière citation utilisée (pour l'affichage de l'indice) */
let lastCitationUsed = null;

/* ===== Initialisation ===== */

/**
 * Point d'entrée principal.
 * Toutes les initialisations sont groupées ici pour garantir
 * que le DOM est complètement chargé avant toute manipulation.
 */
document.addEventListener("DOMContentLoaded", () => {
  initTheme(); // Restaurer le thème sauvegardé (ou clair par défaut)
  generatePassword(); // Générer le mot de passe principal
  generateOtherPasswords(); // Générer les 5 suggestions
  attachEventListeners(); // Brancher tous les événements UI
  initKeyboardShortcuts(); // Raccourcis clavier
  initFaq(); // Initialiser l'accordéon FAQ
  initScrollTop(); // Initialiser le bouton retour en haut
  registerServiceWorker(); // PWA : mode hors ligne
});

/* ===== Gestion des événements ===== */

/**
 * Attache tous les écouteurs d'événements aux contrôles UI.
 * Séparé de l'initialisation pour clarté et maintenabilité.
 */
function attachEventListeners() {
  // Curseur de longueur : mise à jour immédiate à chaque changement
  // aria-valuenow et aria-valuetext maintenus pour l'accessibilité (lecteurs d'écran)
  lengthSlider.addEventListener("input", (e) => {
    passwordSettings.length = parseInt(e.target.value);
    lengthValue.textContent = passwordSettings.length;
    let unit;
    if (passwordSettings.type === "memorable") {
      unit =
        passwordSettings.memMode === "citation" ? "mots-cl\u00e9s" : "mots";
    } else {
      unit = "caract\u00e8res";
    }
    lengthSlider.setAttribute("aria-valuenow", passwordSettings.length);
    lengthSlider.setAttribute(
      "aria-valuetext",
      `${passwordSettings.length} ${unit}`,
    );
    generatePassword();
  });

  // Case à cocher majuscules
  uppercaseCheck.addEventListener("change", (e) => {
    passwordSettings.uppercase = e.target.checked;
    generatePassword();
  });

  // Case à cocher chiffres
  numbersCheck.addEventListener("change", (e) => {
    passwordSettings.numbers = e.target.checked;
    generatePassword();
  });

  // Case à cocher symboles
  symbolsCheck.addEventListener("change", (e) => {
    passwordSettings.symbols = e.target.checked;
    generatePassword();
  });

  // Case à cocher caractères ambigus (0, O, l, 1, I)
  ambiguousCheck.addEventListener("change", (e) => {
    passwordSettings.ambiguous = e.target.checked;
    generatePassword();
  });

  // Bouton "Générer à nouveau" : régénère principal + suggestions
  generateBtn.addEventListener("click", () => {
    generatePassword();
    generateOtherPasswords();
  });

  // Bouton "Copier" principal
  copyBtn.addEventListener("click", () => {
    copyToClipboard(generatedPassword.textContent);
  });

  // Boutons de bascule Random / Mémorable
  // aria-pressed mis à jour pour indiquer l'état aux technologies d'assistance
  toggleBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      toggleBtns.forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
      passwordSettings.type = btn.dataset.type;
      updateOptionsPanel(passwordSettings.type);
      updateSliderForMode(passwordSettings.type);
      generatePassword();
      generateOtherPasswords();
    });
  });

  // Contrôles spécifiques au mode mémorable
  memUppercaseCheck.addEventListener("change", (e) => {
    passwordSettings.memUppercase = e.target.checked;
    generatePassword();
  });

  memNumbersCheck.addEventListener("change", (e) => {
    passwordSettings.memNumbers = e.target.checked;
    generatePassword();
  });

  memSymbolsInWordsCheck.addEventListener("change", (e) => {
    passwordSettings.memSymbolsInWords = e.target.checked;
    generatePassword();
  });

  separatorSelect.addEventListener("change", (e) => {
    passwordSettings.memSeparator = e.target.value;
    generatePassword();
  });

  memAmbiguousCheck.addEventListener("change", (e) => {
    passwordSettings.memAmbiguous = e.target.checked;
    generatePassword();
  });

  // Sous-toggle mode mémorable : Mots aléatoires / Phrase connue
  memModeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      memModeBtns.forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
      passwordSettings.memMode = btn.dataset.memmode;
      // Mettre à jour le label du slider (mots vs mots-clés)
      const wordLabel =
        btn.dataset.memmode === "citation" ? "mots-cl\u00e9s" : "mots";
      lengthUnit.textContent = wordLabel;
      generatePassword();
      generateOtherPasswords();
    });
  });

  // Toggle du thème clair/sombre
  themeToggle.addEventListener("click", toggleTheme);
}

/**
 * Affiche le panneau d'options correspondant au mode actif.
 */
function updateOptionsPanel(mode) {
  if (mode === "memorable") {
    randomOptions.style.display = "none";
    memorableOptions.style.display = "flex";
  } else {
    randomOptions.style.display = "flex";
    memorableOptions.style.display = "none";
  }
}

/* ===== Configuration du slider selon le mode ===== */

/**
 * Adapte le slider et son label au mode de génération actif.
 * Mode random : 8–32 caractères | Mode mémorable : 3–8 mots
 */
function updateSliderForMode(mode) {
  if (mode === "memorable") {
    // Convertir la valeur actuelle en nombre de mots approximatif
    const currentWords = Math.max(
      3,
      Math.min(8, Math.floor(passwordSettings.length / 4)),
    );
    lengthSlider.min = 3;
    lengthSlider.max = 8;
    lengthSlider.value = currentWords;
    passwordSettings.length = currentWords;
    lengthValue.textContent = currentWords;
    const wordLabel =
      passwordSettings.memMode === "citation" ? "mots-cl\u00e9s" : "mots";
    lengthUnit.textContent = wordLabel;
    lengthSlider.setAttribute("aria-valuemin", "3");
    lengthSlider.setAttribute("aria-valuemax", "8");
    lengthSlider.setAttribute("aria-valuenow", currentWords);
    lengthSlider.setAttribute("aria-valuetext", `${currentWords} ${wordLabel}`);
  } else {
    lengthSlider.min = 8;
    lengthSlider.max = 32;
    // Restaurer une valeur raisonnable en caractères
    const currentChars = Math.max(
      8,
      Math.min(32, passwordSettings.length < 8 ? 16 : passwordSettings.length),
    );
    lengthSlider.value = currentChars;
    passwordSettings.length = currentChars;
    lengthValue.textContent = currentChars;
    lengthUnit.textContent = "caractères";
    lengthSlider.setAttribute("aria-valuemin", "8");
    lengthSlider.setAttribute("aria-valuemax", "32");
    lengthSlider.setAttribute("aria-valuenow", currentChars);
    lengthSlider.setAttribute("aria-valuetext", `${currentChars} caractères`);
  }
}

/* ===== Génération de mots de passe ===== */

/**
 * Génère un mot de passe aléatoire cryptographiquement sûr.
 * Utilise l'API Web Crypto (crypto.getRandomValues) pour garantir
 * une entropie de qualité cryptographique (pas Math.random).
 *
 * @param {number} length       - Longueur souhaitée
 * @param {boolean} useUppercase - Inclure les majuscules
 * @param {boolean} useNumbers   - Inclure les chiffres
 * @param {boolean} useSymbols   - Inclure les symboles
 * @returns {string} Mot de passe généré
 */
function generateRandomPassword(length, useUppercase, useNumbers, useSymbols) {
  // Construire le jeu de caractères selon les options actives
  let charset = CONFIG.lowercase; // Minuscules toujours incluses

  if (useUppercase) charset += CONFIG.uppercase;
  if (useNumbers) charset += CONFIG.numbers;
  if (useSymbols) charset += CONFIG.symbols;

  // Fallback : si tout est décoché, on garde au moins les minuscules
  if (charset.length === 0) {
    charset = CONFIG.lowercase;
  }

  // Exclure les caractères visuellement ambigus si l'option est activée
  // (confondus facilement à l'œil : 0 et O, 1 et l et I)
  if (passwordSettings.ambiguous) {
    charset = charset
      .split("")
      .filter((c) => !"0Ol1I".includes(c))
      .join("");
    if (charset.length === 0) charset = CONFIG.lowercase;
  }

  let password = "";
  // Uint32Array fournit des entiers 32 bits aléatoires via CSPRNG du navigateur
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  for (let i = 0; i < length; i++) {
    // Modulo biaisé négligeable pour des charsets < quelques centaines
    password += charset[array[i] % charset.length];
  }

  return password;
}

/**
 * Génère un mot de passe mémorable (phrase secrète).
 * Format : Mot0-Mot1-Mot2[...] avec un chiffre aléatoire collé à chaque mot.
 *
 * Entropie avec la wordlist data.js (~511 mots) :
 *   511³ × 10³ ≈ 1,34 × 10¹¹ combinaisons → ~37 bits
 *   (vs ~28 bits avec l'ancienne liste de 64 mots)
 *
 * La wordlist WORDS_FR est définie dans data.js.
 *
 * @returns {string} Phrase secrète séparée par des tirets
 */
function generateMemorablePassword() {
  // En mode mémorable, le slider contrôle directement le nombre de mots (3–8)
  const numWords = passwordSettings.length;

  const useNumbers = passwordSettings.memNumbers;
  const useUppercase = passwordSettings.memUppercase;
  const useSymbolsInWords = passwordSettings.memSymbolsInWords;
  const sepSetting = passwordSettings.memSeparator;

  // Symboles pour insertion dans les mots
  const wordSymbols = "!@#$%&*+?";

  // Chiffres disponibles (filtrage des ambigus si activé)
  let digits = "0123456789";
  if (passwordSettings.memAmbiguous) {
    digits = digits
      .split("")
      .filter((c) => !"01".includes(c))
      .join("");
  }

  // Séparateurs possibles pour le mode aléatoire
  const randomSeparators = ["-", ".", "!", "@", "#", "*", "+", "="];

  // 4 valeurs aléatoires par mot : index du mot, chiffre, symbole, position symbole
  // + 1 pour le séparateur global
  const array = new Uint32Array(numWords * 4 + 1);
  crypto.getRandomValues(array);

  // Déterminer le séparateur
  let sep;
  if (sepSetting === "random") {
    sep = randomSeparators[array[numWords * 4] % randomSeparators.length];
  } else {
    sep = sepSetting; // '-', '.', ' ', ou ''
  }

  const passphrase = [];
  for (let i = 0; i < numWords; i++) {
    let word = WORDS_FR[array[i * 4] % WORDS_FR.length];

    // Appliquer la casse
    word = useUppercase ? word : word.toLowerCase();

    // Insérer un symbole à une position aléatoire dans le mot
    if (useSymbolsInWords && word.length > 1) {
      const sym = wordSymbols[array[i * 4 + 2] % wordSymbols.length];
      // Position aléatoire : entre 1 et length-1 (jamais tout début/fin pour la lisibilité et pas juste concaténé)
      const pos = 1 + (array[i * 4 + 3] % (word.length - 1));
      word = word.slice(0, pos) + sym + word.slice(pos);
    }

    // Ajouter un chiffre seulement si l'option chiffres est active
    if (useNumbers) {
      const digit = digits[array[i * 4 + 1] % digits.length];
      word += digit;
    }

    passphrase.push(word);
  }

  return passphrase.join(sep);
}

/* ===== Mode Citation : génération à partir de phrases connues ===== */

/**
 * Mots vides français à filtrer lors de l'extraction des mots-clés.
 * Ne restent que les mots porteurs de sens (noms, verbes, adjectifs, adverbes).
 */
const STOPWORDS_FR = new Set([
  "le",
  "la",
  "les",
  "l",
  "un",
  "une",
  "des",
  "de",
  "du",
  "d",
  "a",
  "au",
  "aux",
  "en",
  "et",
  "ou",
  "ni",
  "ne",
  "pas",
  "n",
  "ce",
  "se",
  "s",
  "c",
  "y",
  "il",
  "elle",
  "on",
  "je",
  "tu",
  "nous",
  "vous",
  "ils",
  "elles",
  "que",
  "qui",
  "dont",
  "qu",
  "dans",
  "sur",
  "par",
  "pour",
  "avec",
  "sans",
  "sous",
  "vers",
  "est",
  "sont",
  "ai",
  "as",
  "me",
  "te",
  "lui",
  "leur",
  "mon",
  "ton",
  "son",
  "ma",
  "ta",
  "sa",
  "mes",
  "tes",
  "ses",
  "nos",
  "vos",
  "leurs",
  "tout",
  "tous",
  "toute",
  "toutes",
]);

/**
 * Extrait les mots-clés d'une phrase en retirant les mots vides et la ponctuation.
 * @param {string} text - Phrase source
 * @returns {string[]} Mots-clés en minuscules
 */
function extractKeywords(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z\s-]/g, "") // retirer la ponctuation (garder les tirets)
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS_FR.has(w));
}

/**
 * Tronque un mot de façon déterministe pour lui donner un aspect phonétique.
 * Si le mot fait plus de maxLen caractères, on coupe à maxLen.
 * @param {string} word - Mot à tronquer
 * @param {number} maxLen - Longueur maximale (3-5)
 * @returns {string} Mot tronqué
 */
function truncateWord(word, maxLen) {
  if (word.length <= maxLen) return word;
  return word.slice(0, maxLen);
}

/**
 * Génère une passphrase à partir d'une citation célèbre.
 *
 * Algorithme :
 * 1. Choisir une citation aléatoire dans QUOTES_FR
 * 2. Extraire les mots-clés (sans les stopwords)
 * 3. Garder N mots-clés (selon le slider)
 * 4. Tronquer chaque mot à 3-5 caractères pour l'effet phonétique
 * 5. Appliquer les mêmes options que le mode mémorable (casse, chiffres, symboles, séparateur)
 *
 * @returns {{ password: string, quote: object }} Passphrase générée et citation source
 */
function generateCitationPassword() {
  const numWords = passwordSettings.length;
  const useNumbers = passwordSettings.memNumbers;
  const useUppercase = passwordSettings.memUppercase;
  const useSymbolsInWords = passwordSettings.memSymbolsInWords;
  const sepSetting = passwordSettings.memSeparator;

  const wordSymbols = "!@#$%&*+?";

  let digits = "0123456789";
  if (passwordSettings.memAmbiguous) {
    digits = digits
      .split("")
      .filter((c) => !"01".includes(c))
      .join("");
  }

  const randomSeparators = ["-", ".", "!", "@", "#", "*", "+", "="];

  // Valeurs aléatoires : 10 pour la citation (avec retry), 4 par mot, 1 séparateur
  const array = new Uint32Array(10 + numWords * 4 + 1);
  crypto.getRandomValues(array);

  // Choisir une citation avec suffisamment de mots-clés
  let quote, keywords;
  let attempts = 0;
  do {
    quote = QUOTES_FR[array[attempts] % QUOTES_FR.length];
    keywords = extractKeywords(quote.text);
    attempts++;
  } while (keywords.length < 2 && attempts < 10);

  // Fallback ultime si aucune citation valide
  if (keywords.length === 0) {
    keywords = ["phrase", "connue", "secret"];
  }

  // Si la citation n'a pas assez de mots-clés, on les réutilise cycliquement
  const selectedWords = [];
  for (let i = 0; i < numWords; i++) {
    selectedWords.push(keywords[i % keywords.length]);
  }

  // Déterminer le séparateur
  let sep;
  if (sepSetting === "random") {
    sep = randomSeparators[array[10 + numWords * 4] % randomSeparators.length];
  } else {
    sep = sepSetting;
  }

  const passphrase = [];
  for (let i = 0; i < numWords; i++) {
    // Tronquer le mot : longueur entre 3 et 5, choisie aléatoirement
    const truncLen = 3 + (array[10 + i * 4] % 3); // 3, 4, ou 5
    let word = truncateWord(selectedWords[i], truncLen);

    // Appliquer la casse : première lettre majuscule
    if (useUppercase) {
      word = word.charAt(0).toUpperCase() + word.slice(1);
    }

    // Insérer un symbole à une position aléatoire dans le mot
    if (useSymbolsInWords && word.length > 1) {
      const sym = wordSymbols[array[10 + i * 4 + 2] % wordSymbols.length];
      const pos = 1 + (array[10 + i * 4 + 3] % (word.length - 1));
      word = word.slice(0, pos) + sym + word.slice(pos);
    }

    // Ajouter un chiffre
    if (useNumbers) {
      const digit = digits[array[10 + i * 4 + 1] % digits.length];
      word += digit;
    }

    passphrase.push(word);
  }

  return { password: passphrase.join(sep), quote };
}

/**
 * Génère le mot de passe principal et met à jour l'interface.
 * Orchestre le choix entre mode aléatoire et mode mémorable.
 */
function generatePassword() {
  let password;

  if (passwordSettings.type === "memorable") {
    if (passwordSettings.memMode === "citation") {
      const result = generateCitationPassword();
      password = result.password;
      lastCitationUsed = result.quote;
      // Afficher l'indice de citation
      citationHint.style.display = "flex";
      citationText.textContent = "\u00ab " + result.quote.text + " \u00bb";
      citationAuthor.textContent = "\u2014 " + result.quote.author;
    } else {
      password = generateMemorablePassword();
      lastCitationUsed = null;
      citationHint.style.display = "none";
    }
  } else {
    password = generateRandomPassword(
      passwordSettings.length,
      passwordSettings.uppercase,
      passwordSettings.numbers,
      passwordSettings.symbols,
    );
    lastCitationUsed = null;
    citationHint.style.display = "none";
  }

  generatedPassword.textContent = password;
  updateSecurityGauge(password); // Mettre à jour la jauge de force
}

/**
 * Génère 5 suggestions de mots de passe avec les paramètres courants.
 * Recrée dynamiquement le DOM de la liste et réattache les listeners de copie.
 * Note : les listeners sont rattachés ici (et non dans attachEventListeners)
 * car innerHTML recrée entièrement les nœuds DOM à chaque appel.
 */
function generateOtherPasswords() {
  const passwords = [];

  // Générer 5 mots de passe selon le mode actif
  for (let i = 0; i < 5; i++) {
    if (passwordSettings.type === "memorable") {
      if (passwordSettings.memMode === "citation") {
        passwords.push(generateCitationPassword().password);
      } else {
        passwords.push(generateMemorablePassword());
      }
    } else {
      passwords.push(
        generateRandomPassword(
          passwordSettings.length,
          passwordSettings.uppercase,
          passwordSettings.numbers,
          passwordSettings.symbols,
        ),
      );
    }
  }

  // Injecter le HTML en échappant chaque mot de passe (protection XSS)
  passwordList.innerHTML = passwords
    .map(
      (pwd) => `
        <div class="password-item">
            <span class="password-text-small">${escapeHtml(pwd)}</span>
            <button class="btn-icon-small copy-btn-small" aria-label="Copier ce mot de passe">
                <i class="ti ti-copy icon-small"></i>
            </button>
        </div>
    `,
    )
    .join("");

  // Rattacher les événements de copie sur les nouveaux boutons
  document.querySelectorAll(".copy-btn-small").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const item = e.target.closest(".password-item");
      const passwordText = item.querySelector(
        ".password-text-small",
      ).textContent;
      const icon = btn.querySelector("i");

      copyToClipboard(passwordText);

      // Feedback visuel : icône check pendant 2 secondes
      icon.classList.replace("ti-copy", "ti-check");
      setTimeout(() => icon.classList.replace("ti-check", "ti-copy"), 2000);
    });
  });
}

/* ===== Calcul et affichage de la force ===== */

/**
 * Convertit un log10 de secondes en chaîne lisible en français.
 * Utilisé par estimateCrackTime pour les deux modes (random et mémorable).
 *
 * @param {number} logSeconds - log10 du nombre de secondes
 * @returns {string} Durée estimée en langage naturel
 */
function logSecondsToDuration(logSeconds) {
  if (logSeconds < 0) return "moins d'une seconde";
  if (logSeconds < Math.log10(60)) {
    const s = Math.round(10 ** logSeconds);
    return `${s} seconde${s > 1 ? "s" : ""}`;
  }
  if (logSeconds < Math.log10(3600)) {
    const m = Math.round(10 ** (logSeconds - Math.log10(60)));
    return `${m} minute${m > 1 ? "s" : ""}`;
  }
  if (logSeconds < Math.log10(86400)) {
    const h = Math.round(10 ** (logSeconds - Math.log10(3600)));
    return `${h} heure${h > 1 ? "s" : ""}`;
  }
  if (logSeconds < Math.log10(2592000)) {
    const d = Math.round(10 ** (logSeconds - Math.log10(86400)));
    return `${d} jour${d > 1 ? "s" : ""}`;
  }
  if (logSeconds < Math.log10(31536000)) {
    const mo = Math.round(10 ** (logSeconds - Math.log10(2592000)));
    return `${mo} mois`;
  }
  const logYears = logSeconds - Math.log10(31536000);
  if (logYears < 0) return "moins d'un an";
  const years = 10 ** logYears;
  if (years < 100) {
    const y = Math.round(years);
    return `${y} an${y > 1 ? "s" : ""}`;
  }
  if (years < 1000) return `environ ${Math.round(years / 100) * 100} ans`;
  if (logYears < 6) {
    const k = Math.round(years / 1000);
    return `environ ${k.toLocaleString("fr-FR")} millier${k > 1 ? "s" : ""} d'années`;
  }
  if (logYears < 9) {
    const m = Math.round(10 ** (logYears - 6));
    return `environ ${m.toLocaleString("fr-FR")} million${m > 1 ? "s" : ""} d'années`;
  }
  if (logYears < 12) {
    const b = Math.round(10 ** (logYears - 9));
    return `environ ${b.toLocaleString("fr-FR")} milliard${b > 1 ? "s" : ""} d'années`;
  }
  return "des milliards de milliards d'années";
}

/**
 * Calcule la taille effective du charset random selon les paramètres courants.
 * Reconstruit exactement le même pool que generateRandomPassword pour garantir
 * la cohérence entre génération et estimation de sécurité.
 *
 * @returns {number} Nombre de caractères dans le pool de génération
 */
function getRandomCharsetSize() {
  let charset = CONFIG.lowercase;
  if (passwordSettings.uppercase) charset += CONFIG.uppercase;
  if (passwordSettings.numbers) charset += CONFIG.numbers;
  if (passwordSettings.symbols) charset += CONFIG.symbols;

  if (passwordSettings.ambiguous) {
    charset = charset
      .split("")
      .filter((c) => !"0Ol1I".includes(c))
      .join("");
  }

  return Math.max(charset.length, 1);
}

/**
 * Calcule l'entropie exacte d'une passphrase mémorable en bits.
 * Modèle l'attaque dictionnaire : l'attaquant connaît la wordlist,
 * le format (mot[+chiffre][sep]mot[+chiffre]...) et les options actives.
 *
 * Facteurs d'entropie :
 *   – Mots : WORDS_FR.length choix par position (pas de facteur casse :
 *     la casse est déterministe, pas aléatoire par mot)
 *   – Chiffres : 10 (ou 8 si ambigus exclus) choix par mot, si activé
 *   – Séparateur : 8 choix (1 choix global), si symboles activés
 *
 * @param {number} numWords - Nombre de mots dans la passphrase
 * @returns {number} Entropie en bits
 */
function getMemorableEntropy(numWords) {
  const bitsPerWord = Math.log2(WORDS_FR.length);

  // Chiffres : 10 (ou 8 si ambigus exclus) choix par mot, si activé
  const digitsCount = passwordSettings.memNumbers
    ? passwordSettings.memAmbiguous
      ? 8
      : 10
    : 0;
  const bitsDigit = digitsCount > 0 ? Math.log2(digitsCount) : 0;

  // Symbole dans le mot : choix du symbole + position d'insertion
  // 9 symboles possibles, position entre 1 et avgWordLen-1 (≈ 5 positions en moyenne)
  let bitsSymbol = 0;
  if (passwordSettings.memSymbolsInWords) {
    const numSymbols = 9; // !@#$%&*+?
    const avgPositions = 5; // longueur moyenne des mots ≈ 6 → 5 positions internes
    bitsSymbol = Math.log2(numSymbols) + Math.log2(avgPositions);
  }

  // Séparateur : 1 choix global
  let bitsSep = 0;
  if (passwordSettings.memSeparator === "random") {
    bitsSep = Math.log2(8); // 8 séparateurs possibles
  }

  return numWords * (bitsPerWord + bitsDigit + bitsSymbol) + bitsSep;
}

/**
 * Calcule l'entropie d'une passphrase en mode citation.
 *
 * Facteurs d'entropie :
 *   – Choix de la citation : log2(QUOTES_FR.length) (1 choix global)
 *   – Troncature : 3 longueurs possibles (3,4,5) par mot → log2(3) par mot
 *   – Chiffres : 10 (ou 8) choix par mot, si activé
 *   – Symboles : 9 × ~3 positions dans les mots tronqués, si activé
 *   – Séparateur : 8 choix (1 global), si aléatoire
 *
 * @param {number} numWords - Nombre de mots-clés gardés
 * @returns {number} Entropie en bits
 */
function getCitationEntropy(numWords) {
  // Citation choisie parmi QUOTES_FR
  const bitsQuote = Math.log2(QUOTES_FR.length);

  // Troncature : 3 longueurs possibles par mot
  const bitsTrunc = Math.log2(3);

  // Chiffres
  const digitsCount = passwordSettings.memNumbers
    ? passwordSettings.memAmbiguous
      ? 8
      : 10
    : 0;
  const bitsDigit = digitsCount > 0 ? Math.log2(digitsCount) : 0;

  // Symboles dans les mots tronqués (avg ~3 positions internes pour des mots de 3-5 chars)
  let bitsSymbol = 0;
  if (passwordSettings.memSymbolsInWords) {
    const numSymbols = 9;
    const avgPositions = 3;
    bitsSymbol = Math.log2(numSymbols) + Math.log2(avgPositions);
  }

  // Séparateur aléatoire
  let bitsSep = 0;
  if (passwordSettings.memSeparator === "random") {
    bitsSep = Math.log2(8);
  }

  return bitsQuote + numWords * (bitsTrunc + bitsDigit + bitsSymbol) + bitsSep;
}

/**
 * Estime le temps de craquage réaliste selon le mode de génération.
 *
 * Mode random : brute force sur le charset configuré (~10^10 essais/s, GPU offline).
 * Mode mémorable : attaque dictionnaire sur le pattern structurel.
 *
 * @param {string} password - Mot de passe à évaluer
 * @returns {string} Durée estimée en langage naturel
 */
function estimateCrackTime(password) {
  if (passwordSettings.type === "memorable") {
    const numWords = passwordSettings.length;
    const entropy =
      passwordSettings.memMode === "citation"
        ? getCitationEntropy(numWords)
        : getMemorableEntropy(numWords);
    const logSeconds = entropy * Math.log10(2) - 10;
    return logSecondsToDuration(logSeconds);
  }

  // Mode random : charset dérivé des paramètres (pas du contenu du mot de passe)
  const charsetSize = getRandomCharsetSize();
  const logSeconds = password.length * Math.log10(charsetSize) - 10;
  return logSecondsToDuration(logSeconds);
}

/**
 * Calcule un score de force du mot de passe sur 100.
 *
 * Mode mémorable : basé sur le nombre de mots réels (entropie dictionnaire).
 * Mode random    : longueur (60 pts max) + variété des caractères (40 pts max).
 *
 * @param {string} password - Mot de passe à évaluer
 * @returns {number} Score entre 0 et 100
 */
function calculatePasswordStrength(password) {
  if (passwordSettings.type === "memorable") {
    const numWords = passwordSettings.length;
    const entropy =
      passwordSettings.memMode === "citation"
        ? getCitationEntropy(numWords)
        : getMemorableEntropy(numWords);
    return Math.min(Math.round((entropy * 100) / 128), 100);
  }

  // Score basé sur l'entropie réelle : length × log2(charsetSize)
  // Échelle : 0 bits → 0, 128 bits → 100 (plafond)
  const charsetSize = getRandomCharsetSize();
  const entropy = password.length * Math.log2(charsetSize);
  return Math.min(Math.round((entropy * 100) / 128), 100);
}

/**
 * Met à jour la jauge SVG demi-cercle et son texte selon la force calculée.
 * Les couleurs sont adaptées dynamiquement au thème actif (clair/sombre).
 *
 * @param {string} password - Mot de passe dont on affiche la force
 */
function updateSecurityGauge(password) {
  const strength = calculatePasswordStrength(password);

  // Couleurs adaptées au thème courant
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const colorStrong = isDark ? "#34D399" : "#10B981"; // Emerald
  const colorMedium = isDark ? "#FBBF24" : "#F59E0B"; // Amber
  const colorWeak = "#EF4444"; // Rouge (identique dans les deux thèmes)

  // Mettre à jour le label de force et sa couleur
  if (strength >= 75) {
    strengthLabel.textContent = "fort";
    strengthLabel.style.color = colorStrong;
  } else if (strength >= 50) {
    strengthLabel.textContent = "moyen";
    strengthLabel.style.color = colorMedium;
  } else {
    strengthLabel.textContent = "faible";
    strengthLabel.style.color = colorWeak;
  }

  // Mettre à jour le temps de craquage estimé
  crackTimeEl.textContent = estimateCrackTime(password);
}

/* ===== Presse-papiers ===== */

/**
 * Copie un texte dans le presse-papiers et met à jour le bouton principal.
 * Utilise l'API Clipboard asynchrone (HTTPS requis).
 *
 * @param {string} text - Texte à copier
 */
function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      // Feedback visuel sur le bouton principal "Copier"
      const span = copyBtn.querySelector("span");
      const originalText = span.textContent;
      span.textContent = "Copié !";

      setTimeout(() => {
        span.textContent = originalText;
      }, 2000);
    })
    .catch((err) => {
      console.error("Erreur lors de la copie dans le presse-papiers :", err);
    });
}

/* ===== Gestion du thème ===== */

/**
 * Initialise le thème au chargement de la page.
 * Lit la préférence sauvegardée dans localStorage (ou 'light' par défaut).
 */
function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
}

/**
 * Bascule entre le thème clair et sombre.
 * Persiste le choix dans localStorage pour les visites suivantes.
 */
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "light" ? "dark" : "light";

  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
}

/* ===== Bouton retour en haut ===== */

/**
 * Initialise le bouton de retour en haut de page.
 * Le bouton apparaît après 300px de défilement et remonte en douceur au clic.
 * Le listener scroll utilise { passive: true } pour améliorer les performances
 * de défilement (le navigateur n'a pas besoin d'attendre le handler).
 */
function initScrollTop() {
  const btn = document.getElementById("scrollTop");

  window.addEventListener(
    "scroll",
    () => {
      if (window.scrollY > 300) {
        btn.classList.add("visible");
      } else {
        btn.classList.remove("visible");
      }
    },
    { passive: true },
  ); // Optimisation : indique au navigateur que scroll ne sera pas annulé

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* ===== Accordéon FAQ ===== */

/**
 * Initialise l'accordéon FAQ.
 * Chaque bouton question bascule la classe .open sur son .faq-item parent,
 * ce qui déclenche la transition CSS max-height sur la réponse.
 */
function initFaq() {
  document.querySelectorAll(".faq-question").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".faq-item");
      const isOpen = item.classList.toggle("open");
      // Synchroniser aria-expanded pour les lecteurs d'écran
      btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  });
}

/* ===== Raccourcis clavier ===== */

/**
 * Initialise les raccourcis clavier globaux.
 * - Entrée : régénérer le mot de passe (sauf si focus dans un champ)
 * - Ctrl+C / Cmd+C : copier le mot de passe affiché (quand aucun texte n'est sélectionné)
 */
function initKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    // Ignorer si le focus est dans un champ de saisie ou un select
    const tag = document.activeElement.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

    if (e.key === "Enter") {
      e.preventDefault();
      generatePassword();
      generateOtherPasswords();
    }
  });
}

/* ===== Service Worker (PWA) ===== */

/**
 * Enregistre le Service Worker pour permettre le fonctionnement hors ligne.
 */
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}
