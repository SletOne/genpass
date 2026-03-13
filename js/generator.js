import { passwordSettings, appState } from './state.js';
import { CONFIG, WORDS_FR, QUOTES_FR } from './data.js';

export function generateRandomPassword(
  length,
  useUppercase,
  useNumbers,
  useSymbols,
) {
  let charset = CONFIG.lowercase;

  if (useUppercase) charset += CONFIG.uppercase;
  if (useNumbers) charset += CONFIG.numbers;
  if (useSymbols) charset += CONFIG.symbols;

  if (charset.length === 0) {
    charset = CONFIG.lowercase;
  }

  if (passwordSettings.ambiguous) {
    charset = charset
      .split("")
      .filter((c) => !"0Ol1I".includes(c))
      .join("");
    if (charset.length === 0) charset = CONFIG.lowercase;
  }

  let password = "";
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }

  return password;
}

export function generateMemorablePassword() {
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

  const array = new Uint32Array(numWords * 4 + 1);
  crypto.getRandomValues(array);

  let sep;
  if (sepSetting === "random") {
    sep = randomSeparators[array[numWords * 4] % randomSeparators.length];
  } else {
    sep = sepSetting;
  }

  const passphrase = [];
  for (let i = 0; i < numWords; i++) {
    let word = WORDS_FR[array[i * 4] % WORDS_FR.length];

    word = useUppercase ? word : word.toLowerCase();

    if (useSymbolsInWords && word.length > 1) {
      const sym = wordSymbols[array[i * 4 + 2] % wordSymbols.length];
      const pos = 1 + (array[i * 4 + 3] % (word.length - 1));
      word = word.slice(0, pos) + sym + word.slice(pos);
    }

    if (useNumbers) {
      const digit = digits[array[i * 4 + 1] % digits.length];
      word += digit;
    }

    passphrase.push(word);
  }

  return passphrase.join(sep);
}

const STOPWORDS_FR = new Set([
  "le", "la", "les", "l", "un", "une", "des", "de", "du", "d", "a", "au", "aux", "en", "et", "ou", "ni", "ne", "pas", "n", "ce", "se", "s", "c", "y", "il", "elle", "on", "je", "tu", "nous", "vous", "ils", "elles", "que", "qui", "dont", "qu", "dans", "sur", "par", "pour", "avec", "sans", "sous", "vers", "est", "sont", "ai", "as", "me", "te", "lui", "leur", "mon", "ton", "son", "ma", "ta", "sa", "mes", "tes", "ses", "nos", "vos", "leurs", "tout", "tous", "toute", "toutes"
]);

export function extractKeywords(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z\s-]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS_FR.has(w));
}

export function truncateWord(word, maxLen) {
  if (word.length <= maxLen) return word;
  return word.slice(0, maxLen);
}

export function generateCitationPassword() {
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

  const array = new Uint32Array(10 + numWords * 4 + 1);
  crypto.getRandomValues(array);

  let quote, keywords;
  let attempts = 0;
  do {
    quote = QUOTES_FR[array[attempts] % QUOTES_FR.length];
    keywords = extractKeywords(quote.text);
    attempts++;
  } while (keywords.length < 2 && attempts < 10);

  if (keywords.length === 0) {
    keywords = ["phrase", "connue", "secret"];
  }

  const selectedWords = [];
  for (let i = 0; i < numWords; i++) {
    selectedWords.push(keywords[i % keywords.length]);
  }

  let sep;
  if (sepSetting === "random") {
    sep = randomSeparators[array[10 + numWords * 4] % randomSeparators.length];
  } else {
    sep = sepSetting;
  }

  const passphrase = [];
  for (let i = 0; i < numWords; i++) {
    const truncLen = 3 + (array[10 + i * 4] % 3);
    let word = truncateWord(selectedWords[i], truncLen);

    if (useUppercase) {
      word = word.charAt(0).toUpperCase() + word.slice(1);
    }

    if (useSymbolsInWords && word.length > 1) {
      const sym = wordSymbols[array[10 + i * 4 + 2] % wordSymbols.length];
      const pos = 1 + (array[10 + i * 4 + 3] % (word.length - 1));
      word = word.slice(0, pos) + sym + word.slice(pos);
    }

    if (useNumbers) {
      const digit = digits[array[10 + i * 4 + 1] % digits.length];
      word += digit;
    }

    passphrase.push(word);
  }

  return { password: passphrase.join(sep), quote };
}

export function generatePassword() {
  let password;

  if (passwordSettings.type === "memorable") {
    if (passwordSettings.memMode === "citation") {
      const result = generateCitationPassword();
      password = result.password;
      appState.lastCitationUsed = result.quote;
    } else {
      password = generateMemorablePassword();
      appState.lastCitationUsed = null;
    }
  } else {
    password = generateRandomPassword(
      passwordSettings.length,
      passwordSettings.uppercase,
      passwordSettings.numbers,
      passwordSettings.symbols,
    );
    appState.lastCitationUsed = null;
  }

  return password;
}
