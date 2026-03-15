import { passwordSettings, appState } from "./state.js";
import { calculatePasswordStrength, estimateCrackTime } from "./security.js";
import {
  generatePassword,
  generateRandomPassword,
  generateMemorablePassword,
  generateCitationPassword,
} from "./generator.js";
import { escapeHtml, showToast } from "./utils.js";
import { initTheme, toggleTheme } from "./theme.js";

let lengthSlider,
  lengthValue,
  lengthUnit,
  uppercaseCheck,
  numbersCheck,
  symbolsCheck,
  ambiguousCheck,
  generatedPassword,
  generateBtn,
  copyBtn,
  toggleBtns,
  passwordList,
  strengthLabel,
  crackTimeEl,
  themeToggle;

let randomOptions, memorableOptions;

let memUppercaseCheck,
  memNumbersCheck,
  memSymbolsInWordsCheck,
  separatorSelect,
  memAmbiguousCheck;

let memModeBtns, citationHint, citationText, citationAuthor;

export function initUI() {
  lengthSlider = document.getElementById("lengthSlider");
  lengthValue = document.getElementById("lengthValue");
  lengthUnit = document.getElementById("lengthUnit");
  uppercaseCheck = document.getElementById("uppercaseCheck");
  numbersCheck = document.getElementById("numbersCheck");
  symbolsCheck = document.getElementById("symbolsCheck");
  ambiguousCheck = document.getElementById("ambiguousCheck");
  generatedPassword = document.getElementById("generatedPassword");
  generateBtn = document.getElementById("generateBtn");
  copyBtn = document.getElementById("copyBtn");
  toggleBtns = document.querySelectorAll(".toggle-btn");
  passwordList = document.getElementById("passwordList");
  strengthLabel = document.getElementById("strengthLabel");
  crackTimeEl = document.getElementById("crackTime");
  themeToggle = document.getElementById("themeToggle");
  randomOptions = document.getElementById("randomOptions");
  memorableOptions = document.getElementById("memorableOptions");
  memUppercaseCheck = document.getElementById("memUppercaseCheck");
  memNumbersCheck = document.getElementById("memNumbersCheck");
  memSymbolsInWordsCheck = document.getElementById("memSymbolsInWordsCheck");
  separatorSelect = document.getElementById("separatorSelect");
  memAmbiguousCheck = document.getElementById("memAmbiguousCheck");
  memModeBtns = document.querySelectorAll(".mem-mode-btn");
  citationHint = document.getElementById("citationHint");
  citationText = document.getElementById("citationText");
  citationAuthor = document.getElementById("citationAuthor");

  initTheme();
  updatePasswordDisplay();
  generateOtherPasswords();
  attachEventListeners();
  initKeyboardShortcuts();
  initFaq();
  initScrollTop();
}

function attachEventListeners() {
  lengthSlider.addEventListener("input", (e) => {
    passwordSettings.length = parseInt(e.target.value);
    lengthValue.textContent = passwordSettings.length;
    let unit;
    if (passwordSettings.type === "memorable") {
      unit = passwordSettings.memMode === "citation" ? "mots-clés" : "mots";
    } else {
      unit = "caractères";
    }
    lengthSlider.setAttribute("aria-valuenow", passwordSettings.length);
    lengthSlider.setAttribute(
      "aria-valuetext",
      `${passwordSettings.length} ${unit}`,
    );
    updatePasswordDisplay();
  });

  uppercaseCheck.addEventListener("change", (e) => {
    passwordSettings.uppercase = e.target.checked;
    updatePasswordDisplay();
  });

  numbersCheck.addEventListener("change", (e) => {
    passwordSettings.numbers = e.target.checked;
    updatePasswordDisplay();
  });

  symbolsCheck.addEventListener("change", (e) => {
    passwordSettings.symbols = e.target.checked;
    updatePasswordDisplay();
  });

  ambiguousCheck.addEventListener("change", (e) => {
    passwordSettings.ambiguous = e.target.checked;
    updatePasswordDisplay();
  });

  generateBtn.addEventListener("click", () => {
    updatePasswordDisplay();
    generateOtherPasswords();
  });

  copyBtn.addEventListener("click", () => {
    copyToClipboard(generatedPassword.textContent);
  });

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
      updatePasswordDisplay();
      generateOtherPasswords();
    });
  });

  memUppercaseCheck.addEventListener("change", (e) => {
    passwordSettings.memUppercase = e.target.checked;
    updatePasswordDisplay();
  });

  memNumbersCheck.addEventListener("change", (e) => {
    passwordSettings.memNumbers = e.target.checked;
    updatePasswordDisplay();
  });

  memSymbolsInWordsCheck.addEventListener("change", (e) => {
    passwordSettings.memSymbolsInWords = e.target.checked;
    updatePasswordDisplay();
  });

  separatorSelect.addEventListener("change", (e) => {
    passwordSettings.memSeparator = e.target.value;
    updatePasswordDisplay();
  });

  memAmbiguousCheck.addEventListener("change", (e) => {
    passwordSettings.memAmbiguous = e.target.checked;
    updatePasswordDisplay();
  });

  memModeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      memModeBtns.forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
      passwordSettings.memMode = btn.dataset.memmode;
      const wordLabel =
        btn.dataset.memmode === "citation" ? "mots-clés" : "mots";
      lengthUnit.textContent = wordLabel;
      updatePasswordDisplay();
      generateOtherPasswords();
    });
  });

  themeToggle.addEventListener("click", toggleTheme);
}

function updateOptionsPanel(mode) {
  if (mode === "memorable") {
    randomOptions.classList.add("hidden");
    memorableOptions.classList.remove("hidden");
  } else {
    randomOptions.classList.remove("hidden");
    memorableOptions.classList.add("hidden");
  }
}

function updateSliderForMode(mode) {
  if (mode === "memorable") {
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
      passwordSettings.memMode === "citation" ? "mots-clés" : "mots";
    lengthUnit.textContent = wordLabel;
    lengthSlider.setAttribute("aria-valuenow", currentWords);
    lengthSlider.setAttribute("aria-valuetext", `${currentWords} ${wordLabel}`);
  } else {
    lengthSlider.min = 8;
    lengthSlider.max = 32;
    const currentChars = Math.max(
      8,
      Math.min(32, passwordSettings.length < 8 ? 16 : passwordSettings.length),
    );
    lengthSlider.value = currentChars;
    passwordSettings.length = currentChars;
    lengthValue.textContent = currentChars;
    lengthUnit.textContent = "caractères";
    lengthSlider.setAttribute("aria-valuenow", currentChars);
    lengthSlider.setAttribute("aria-valuetext", `${currentChars} caractères`);
  }
}

function updatePasswordDisplay() {
  let password;
  try {
    password = generatePassword();
  } catch {
    showToast("Erreur : Web Crypto API indisponible sur ce navigateur", true);
    return;
  }

  if (
    passwordSettings.type === "memorable" &&
    passwordSettings.memMode === "citation" &&
    appState.lastCitationUsed
  ) {
    citationHint.classList.remove("hidden");
    citationText.textContent = "« " + appState.lastCitationUsed.text + " »";
    citationAuthor.textContent = "— " + appState.lastCitationUsed.author;
  } else {
    citationHint.classList.add("hidden");
  }

  // Adding visual loading state
  generatedPassword.style.opacity = "0.5";

  setTimeout(() => {
    generatedPassword.textContent = password;
    generatedPassword.style.opacity = "1";
    updateSecurityGauge(password);
  }, 100);
}

function generateOtherPasswords() {
  const passwords = [];

  try {
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
  } catch {
    showToast("Erreur : Web Crypto API indisponible sur ce navigateur", true);
    return;
  }

  passwordList.style.opacity = "0.5";

  setTimeout(() => {
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

    passwordList.style.opacity = "1";

    document.querySelectorAll(".copy-btn-small").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const item = e.target.closest(".password-item");
        const passwordText = item.querySelector(
          ".password-text-small",
        ).textContent;
        const icon = btn.querySelector("i");

        copyToClipboard(passwordText);

        icon.classList.replace("ti-copy", "ti-check");
        setTimeout(() => icon.classList.replace("ti-check", "ti-copy"), 2000);
      });
    });
  }, 100);
}

function updateSecurityGauge(password) {
  const strength = calculatePasswordStrength(password);

  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  // Couleurs avec contraste WCAG AA (4.5:1 minimum)
  // Thème clair : versions foncées (Emerald-800, Amber-700, Red-700)
  // Thème sombre : versions claires (Emerald-400, Amber-400, Red-400)
  const colorStrong = isDark ? "#34D399" : "#065F46";
  const colorMedium = isDark ? "#FBBF24" : "#B45309";
  const colorWeak = isDark ? "#F87171" : "#B91C1C";

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

  crackTimeEl.textContent = estimateCrackTime(password);
}

function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      const span = copyBtn.querySelector("span");
      const originalText = span.textContent;
      span.textContent = "Copié !";

      setTimeout(() => {
        span.textContent = originalText;
      }, 2000);
      showToast("Mot de passe copié !");
    })
    .catch((err) => {
      console.error("Erreur lors de la copie dans le presse-papiers :", err);
      showToast("Erreur lors de la copie", true);
    });
}


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
  );

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function initFaq() {
  document.querySelectorAll(".faq-question").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".faq-item");
      const isOpen = item.classList.toggle("open");
      btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  });
}

function initKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    const tag = document.activeElement.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

    if (e.key === "Enter") {
      e.preventDefault();
      updatePasswordDisplay();
      generateOtherPasswords();
    }
  });
}
