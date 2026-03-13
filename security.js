import { passwordSettings } from './state.js';
import { CONFIG, WORDS_FR, QUOTES_FR } from './data.js';

export function logSecondsToDuration(logSeconds) {
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

export function getRandomCharsetSize() {
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

export function getMemorableEntropy(numWords) {
  const bitsPerWord = Math.log2(WORDS_FR.length);

  const digitsCount = passwordSettings.memNumbers
    ? passwordSettings.memAmbiguous
      ? 8
      : 10
    : 0;
  const bitsDigit = digitsCount > 0 ? Math.log2(digitsCount) : 0;

  let bitsSymbol = 0;
  if (passwordSettings.memSymbolsInWords) {
    const numSymbols = 9; // !@#$%&*+?
    const avgPositions = 5; 
    bitsSymbol = Math.log2(numSymbols) + Math.log2(avgPositions);
  }

  let bitsSep = 0;
  if (passwordSettings.memSeparator === "random") {
    bitsSep = Math.log2(8);
  }

  return numWords * (bitsPerWord + bitsDigit + bitsSymbol) + bitsSep;
}

export function getCitationEntropy(numWords) {
  const bitsQuote = Math.log2(QUOTES_FR.length);
  const bitsTrunc = Math.log2(3);

  const digitsCount = passwordSettings.memNumbers
    ? passwordSettings.memAmbiguous
      ? 8
      : 10
    : 0;
  const bitsDigit = digitsCount > 0 ? Math.log2(digitsCount) : 0;

  let bitsSymbol = 0;
  if (passwordSettings.memSymbolsInWords) {
    const numSymbols = 9;
    const avgPositions = 3;
    bitsSymbol = Math.log2(numSymbols) + Math.log2(avgPositions);
  }

  let bitsSep = 0;
  if (passwordSettings.memSeparator === "random") {
    bitsSep = Math.log2(8);
  }

  return bitsQuote + numWords * (bitsTrunc + bitsDigit + bitsSymbol) + bitsSep;
}

export function estimateCrackTime(password) {
  if (passwordSettings.type === "memorable") {
    const numWords = passwordSettings.length;
    const entropy =
      passwordSettings.memMode === "citation"
        ? getCitationEntropy(numWords)
        : getMemorableEntropy(numWords);
    const logSeconds = entropy * Math.log10(2) - 10;
    return logSecondsToDuration(logSeconds);
  }

  const charsetSize = getRandomCharsetSize();
  const logSeconds = password.length * Math.log10(charsetSize) - 10;
  return logSecondsToDuration(logSeconds);
}

export function calculatePasswordStrength(password) {
  if (passwordSettings.type === "memorable") {
    const numWords = passwordSettings.length;
    const entropy =
      passwordSettings.memMode === "citation"
        ? getCitationEntropy(numWords)
        : getMemorableEntropy(numWords);
    return Math.min(Math.round((entropy * 100) / 128), 100);
  }

  const charsetSize = getRandomCharsetSize();
  const entropy = password.length * Math.log2(charsetSize);
  return Math.min(Math.round((entropy * 100) / 128), 100);
}
