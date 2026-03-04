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
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
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
    ambiguous: false, // Exclure les caractères ambigus (0, O, l, 1, I)
    type: 'random'    // 'random' | 'memorable'
};

/* ===== Références aux éléments du DOM ===== */

const lengthSlider       = document.getElementById('lengthSlider');
const lengthValue        = document.getElementById('lengthValue');
const uppercaseCheck     = document.getElementById('uppercaseCheck');
const numbersCheck       = document.getElementById('numbersCheck');
const symbolsCheck       = document.getElementById('symbolsCheck');
const ambiguousCheck     = document.getElementById('ambiguousCheck');
const generatedPassword  = document.getElementById('generatedPassword');
const generateBtn        = document.getElementById('generateBtn');
const copyBtn            = document.getElementById('copyBtn');
const toggleBtns         = document.querySelectorAll('.toggle-btn');
const passwordList       = document.getElementById('passwordList');
const strengthLabel      = document.getElementById('strengthLabel');
const crackTimeEl        = document.getElementById('crackTime');
const themeToggle        = document.getElementById('themeToggle');

/* ===== Initialisation ===== */

/**
 * Point d'entrée principal.
 * Toutes les initialisations sont groupées ici pour garantir
 * que le DOM est complètement chargé avant toute manipulation.
 */
document.addEventListener('DOMContentLoaded', () => {
    initTheme();           // Restaurer le thème sauvegardé (ou clair par défaut)
    generatePassword();    // Générer le mot de passe principal
    generateOtherPasswords(); // Générer les 5 suggestions
    attachEventListeners(); // Brancher tous les événements UI
    initFaq();             // Initialiser l'accordéon FAQ
    initScrollTop();       // Initialiser le bouton retour en haut
});

/* ===== Gestion des événements ===== */

/**
 * Attache tous les écouteurs d'événements aux contrôles UI.
 * Séparé de l'initialisation pour clarté et maintenabilité.
 */
function attachEventListeners() {
    // Curseur de longueur : mise à jour immédiate à chaque changement
    // aria-valuenow et aria-valuetext maintenus pour l'accessibilité (lecteurs d'écran)
    lengthSlider.addEventListener('input', (e) => {
        passwordSettings.length = parseInt(e.target.value);
        lengthValue.textContent = passwordSettings.length;
        lengthSlider.setAttribute('aria-valuenow', passwordSettings.length);
        lengthSlider.setAttribute('aria-valuetext', `${passwordSettings.length} caractères`);
        generatePassword();
    });

    // Case à cocher majuscules
    uppercaseCheck.addEventListener('change', (e) => {
        passwordSettings.uppercase = e.target.checked;
        generatePassword();
    });

    // Case à cocher chiffres
    numbersCheck.addEventListener('change', (e) => {
        passwordSettings.numbers = e.target.checked;
        generatePassword();
    });

    // Case à cocher symboles
    symbolsCheck.addEventListener('change', (e) => {
        passwordSettings.symbols = e.target.checked;
        generatePassword();
    });

    // Case à cocher caractères ambigus (0, O, l, 1, I)
    ambiguousCheck.addEventListener('change', (e) => {
        passwordSettings.ambiguous = e.target.checked;
        generatePassword();
    });

    // Bouton "Générer à nouveau" : régénère principal + suggestions
    generateBtn.addEventListener('click', () => {
        generatePassword();
        generateOtherPasswords();
    });

    // Bouton "Copier" principal
    copyBtn.addEventListener('click', () => {
        copyToClipboard(generatedPassword.textContent);
    });

    // Boutons de bascule Random / Mémorable
    // aria-pressed mis à jour pour indiquer l'état aux technologies d'assistance
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            toggleBtns.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');
            passwordSettings.type = btn.dataset.type;
            generatePassword();
            generateOtherPasswords();
        });
    });

    // Toggle du thème clair/sombre
    themeToggle.addEventListener('click', toggleTheme);
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
    if (useNumbers)   charset += CONFIG.numbers;
    if (useSymbols)   charset += CONFIG.symbols;

    // Fallback : si tout est décoché, on garde au moins les minuscules
    if (charset.length === 0) {
        charset = CONFIG.lowercase;
    }

    // Exclure les caractères visuellement ambigus si l'option est activée
    // (confondus facilement à l'œil : 0 et O, 1 et l et I)
    if (passwordSettings.ambiguous) {
        charset = charset.split('').filter(c => !'0Ol1I'.includes(c)).join('');
        if (charset.length === 0) charset = CONFIG.lowercase;
    }

    let password = '';
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
    // Nombre de mots : diviseur /4 pour que le slider soit réactif sur toute sa plage
    // 8-11 → 3 mots | 12-15 → 3 | 16-19 → 4 | 20-23 → 5 | 24-27 → 6 | 28+ → 7+
    const numWords = Math.max(3, Math.floor(passwordSettings.length / 4));

    // 2 valeurs aléatoires par mot : index du mot + chiffre
    const array = new Uint32Array(numWords * 2);
    crypto.getRandomValues(array);

    const passphrase = [];
    for (let i = 0; i < numWords; i++) {
        const word   = WORDS_FR[array[i * 2] % WORDS_FR.length]; // Mot aléatoire
        const number = array[i * 2 + 1] % 10;                    // Chiffre 0–9
        passphrase.push(word + number);
    }

    return passphrase.join('-');
}

/**
 * Génère le mot de passe principal et met à jour l'interface.
 * Orchestre le choix entre mode aléatoire et mode mémorable.
 */
function generatePassword() {
    let password;

    if (passwordSettings.type === 'memorable') {
        password = generateMemorablePassword();
    } else {
        password = generateRandomPassword(
            passwordSettings.length,
            passwordSettings.uppercase,
            passwordSettings.numbers,
            passwordSettings.symbols
        );
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
        if (passwordSettings.type === 'memorable') {
            passwords.push(generateMemorablePassword());
        } else {
            passwords.push(generateRandomPassword(
                passwordSettings.length,
                passwordSettings.uppercase,
                passwordSettings.numbers,
                passwordSettings.symbols
            ));
        }
    }

    // Injecter le HTML en échappant chaque mot de passe (protection XSS)
    passwordList.innerHTML = passwords.map(pwd => `
        <div class="password-item">
            <span class="password-text-small">${escapeHtml(pwd)}</span>
            <button class="btn-icon-small copy-btn-small" aria-label="Copier ce mot de passe">
                <i class="ti ti-copy icon-small"></i>
            </button>
        </div>
    `).join('');

    // Rattacher les événements de copie sur les nouveaux boutons
    document.querySelectorAll('.copy-btn-small').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const item = e.target.closest('.password-item');
            const passwordText = item.querySelector('.password-text-small').textContent;
            const icon = btn.querySelector('i');

            copyToClipboard(passwordText);

            // Feedback visuel : icône check pendant 2 secondes
            icon.classList.replace('ti-copy', 'ti-check');
            setTimeout(() => icon.classList.replace('ti-check', 'ti-copy'), 2000);
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
    if (logSeconds < 0)                    return 'moins d\'une seconde';
    if (logSeconds < Math.log10(60))       { const s = Math.round(10 ** logSeconds); return `${s} seconde${s > 1 ? 's' : ''}`; }
    if (logSeconds < Math.log10(3600))     { const m = Math.round(10 ** (logSeconds - Math.log10(60)));    return `${m} minute${m > 1 ? 's' : ''}`; }
    if (logSeconds < Math.log10(86400))    { const h = Math.round(10 ** (logSeconds - Math.log10(3600)));  return `${h} heure${h > 1 ? 's' : ''}`; }
    if (logSeconds < Math.log10(2592000))  { const d = Math.round(10 ** (logSeconds - Math.log10(86400))); return `${d} jour${d > 1 ? 's' : ''}`; }
    if (logSeconds < Math.log10(31536000)) { const mo = Math.round(10 ** (logSeconds - Math.log10(2592000))); return `${mo} mois`; }
    const logYears = logSeconds - Math.log10(31536000);
    if (logYears < 3)  { const y = Math.round(10 ** logYears); return `${y} an${y > 1 ? 's' : ''}`; }
    if (logYears < 6)  return 'des milliers d\'années';
    if (logYears < 9)  return 'des millions d\'années';
    return 'des milliards d\'années';
}

/**
 * Estime le temps de craquage réaliste selon le mode de génération.
 *
 * Mode random : brute force caractère par caractère (~10^10 essais/s, GPU offline).
 * Mode mémorable : attaque dictionnaire sur le pattern Mot+chiffre, qui est la vraie
 *   menace — un attaquant connaissant le pattern teste (|wordlist| × 10)^numWords
 *   combinaisons, pas 94^longueur. C'est beaucoup moins.
 *
 * @param {string} password - Mot de passe à évaluer
 * @returns {string} Durée estimée en langage naturel
 */
function estimateCrackTime(password) {
    if (passwordSettings.type === 'memorable') {
        // Compter les mots depuis le mot de passe réel (format Mot1-Mot2-Mot3)
        const numWords      = password.split('-').length;
        const combosPerWord = WORDS_FR.length * 10; // 511 × 10 = 5110 combos par segment
        const logSeconds    = numWords * Math.log10(combosPerWord) - 10;
        return logSecondsToDuration(logSeconds);
    }

    // Mode random : brute force sur le charset réellement présent dans le mot de passe
    let charsetSize = 0;
    if (/[a-z]/.test(password))        charsetSize += 26;
    if (/[A-Z]/.test(password))        charsetSize += 26;
    if (/[0-9]/.test(password))        charsetSize += 10;
    if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32;
    if (charsetSize === 0) charsetSize = 26;

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
    if (passwordSettings.type === 'memorable') {
        // Score basé sur le nombre de mots effectivement générés
        const numWords = password.split('-').length;
        if (numWords >= 5) return 85;  // fort  — ~11 ans
        if (numWords >= 4) return 55;  // moyen — ~19 heures
        return 25;                     // faible — ~13 secondes
    }

    let strength = 0;

    // Points pour la longueur (progressifs)
    if (password.length >= 8)  strength += 20;
    if (password.length >= 12) strength += 20;
    if (password.length >= 16) strength += 20;

    // Points pour la variété des types de caractères
    if (/[a-z]/.test(password))        strength += 10; // Minuscules
    if (/[A-Z]/.test(password))        strength += 10; // Majuscules
    if (/[0-9]/.test(password))        strength += 10; // Chiffres
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10; // Symboles

    return Math.min(strength, 100);
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
    const isDark      = document.documentElement.getAttribute('data-theme') === 'dark';
    const colorStrong = isDark ? '#34D399' : '#10B981'; // Emerald
    const colorMedium = isDark ? '#FBBF24' : '#F59E0B'; // Amber
    const colorWeak   = '#EF4444';                       // Rouge (identique dans les deux thèmes)

    // Mettre à jour le label de force et sa couleur
    if (strength >= 75) {
        strengthLabel.textContent = 'fort';
        strengthLabel.style.color = colorStrong;
    } else if (strength >= 50) {
        strengthLabel.textContent = 'moyen';
        strengthLabel.style.color = colorMedium;
    } else {
        strengthLabel.textContent = 'faible';
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
    navigator.clipboard.writeText(text).then(() => {
        // Feedback visuel sur le bouton principal "Copier"
        const span = copyBtn.querySelector('span');
        const originalText = span.textContent;
        span.textContent = 'Copié !';

        setTimeout(() => {
            span.textContent = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Erreur lors de la copie dans le presse-papiers :', err);
    });
}

/* ===== Gestion du thème ===== */

/**
 * Initialise le thème au chargement de la page.
 * Lit la préférence sauvegardée dans localStorage (ou 'light' par défaut).
 */
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

/**
 * Bascule entre le thème clair et sombre.
 * Persiste le choix dans localStorage pour les visites suivantes.
 */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

/* ===== Bouton retour en haut ===== */

/**
 * Initialise le bouton de retour en haut de page.
 * Le bouton apparaît après 300px de défilement et remonte en douceur au clic.
 * Le listener scroll utilise { passive: true } pour améliorer les performances
 * de défilement (le navigateur n'a pas besoin d'attendre le handler).
 */
function initScrollTop() {
    const btn = document.getElementById('scrollTop');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    }, { passive: true }); // Optimisation : indique au navigateur que scroll ne sera pas annulé

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/* ===== Accordéon FAQ ===== */

/**
 * Initialise l'accordéon FAQ.
 * Chaque bouton question bascule la classe .open sur son .faq-item parent,
 * ce qui déclenche la transition CSS max-height sur la réponse.
 */
function initFaq() {
    document.querySelectorAll('.faq-question').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.faq-item');
            const isOpen = item.classList.toggle('open');
            // Synchroniser aria-expanded pour les lecteurs d'écran
            btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
    });
}
