/**
 * GenPass — Tests unitaires
 *
 * Fichier de tests autonome pour les fonctions pures de script.js.
 * Exécutable dans Node.js ou dans le navigateur (via tests.html).
 *
 * Usage Node : node tests.js
 * Usage navigateur : ouvrir tests.html
 */

import { CONFIG, WORDS_FR, QUOTES_FR } from "../js/data.js";

// ===== Mini framework de test =====

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(message);
    console.error(`FAIL: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  assert(
    actual === expected,
    `${message} — attendu: ${JSON.stringify(expected)}, reçu: ${JSON.stringify(actual)}`,
  );
}

function assertInRange(value, min, max, message) {
  assert(
    value >= min && value <= max,
    `${message} — ${value} hors de [${min}, ${max}]`,
  );
}

// ===== Import des fonctions à tester =====
// Fonctions pures réparties dans les modules métier (pas de dépendances DOM)

import { escapeHtml } from "../js/utils.js";
import { generateRandomPassword, extractKeywords, truncateWord } from "../js/generator.js";
import { logSecondsToDuration } from "../js/security.js";

// ===== Simuler passwordSettings pour les tests =====
// generateMemorablePassword et calculatePasswordStrength lisent la variable globale passwordSettings
// On doit la définir dans le scope global pour que les imports fonctionnent

// ===== Tests : escapeHtml =====

console.log("--- escapeHtml ---");

assertEqual(escapeHtml("<script>"), "&lt;script&gt;", "Escape balises HTML");
assertEqual(escapeHtml('a"b'), "a&quot;b", "Escape guillemets doubles");
assertEqual(escapeHtml("a'b"), "a&#039;b", "Escape guillemets simples");
assertEqual(escapeHtml("a&b"), "a&amp;b", "Escape esperluette");
assertEqual(escapeHtml("hello"), "hello", "Texte sans caractères spéciaux");
assertEqual(escapeHtml(""), "", "Chaîne vide");

// ===== Tests : generateRandomPassword =====

console.log("--- generateRandomPassword ---");

// Test longueur
for (const len of [8, 12, 16, 24, 32]) {
  const pwd = generateRandomPassword(len, true, true, true);
  assertEqual(pwd.length, len, `Longueur attendue ${len}`);
}

// Test minuscules seulement
{
  const pwd = generateRandomPassword(20, false, false, false);
  assert(/^[a-z]+$/.test(pwd), "Minuscules uniquement quand tout est décoché");
}

// Test avec majuscules
{
  const pwd = generateRandomPassword(100, true, false, false);
  assert(
    /[A-Z]/.test(pwd),
    "Contient des majuscules quand activé (échantillon 100 chars)",
  );
  assert(/[a-z]/.test(pwd), "Contient aussi des minuscules");
}

// Test avec chiffres
{
  const pwd = generateRandomPassword(100, false, true, false);
  assert(
    /[0-9]/.test(pwd),
    "Contient des chiffres quand activé (échantillon 100 chars)",
  );
}

// Test avec symboles
{
  const pwd = generateRandomPassword(100, false, false, true);
  assert(
    /[^a-zA-Z0-9]/.test(pwd),
    "Contient des symboles quand activé (échantillon 100 chars)",
  );
}

// Test type retour
{
  const pwd = generateRandomPassword(16, true, true, true);
  assertEqual(typeof pwd, "string", "Retourne une string");
}

// ===== Tests : extractKeywords =====

console.log("--- extractKeywords ---");

{
  const kw = extractKeywords("Le petit chat est sur la table");
  assert(!kw.includes("le"), "Filtre le mot vide 'le'");
  assert(!kw.includes("est"), "Filtre le mot vide 'est'");
  assert(!kw.includes("sur"), "Filtre le mot vide 'sur'");
  assert(kw.includes("petit"), "Garde 'petit'");
  assert(kw.includes("chat"), "Garde 'chat'");
  assert(kw.includes("table"), "Garde 'table'");
}

{
  const kw = extractKeywords("Je suis le maître de mon destin");
  assert(!kw.includes("je"), "Filtre 'je'");
  assert(!kw.includes("de"), "Filtre 'de'");
  assert(!kw.includes("mon"), "Filtre 'mon'");
  assert(
    kw.includes("matre"),
    "Garde 'matre' (accents retirés par la regex ASCII)",
  );
  assert(kw.includes("destin"), "Garde 'destin'");
}

{
  const kw = extractKeywords("");
  assertEqual(kw.length, 0, "Chaîne vide → tableau vide");
}

// ===== Tests : truncateWord =====

console.log("--- truncateWord ---");

assertEqual(truncateWord("bonjour", 3), "bon", "Tronque à 3 caractères");
assertEqual(truncateWord("bonjour", 5), "bonjo", "Tronque à 5 caractères");
assertEqual(truncateWord("hi", 5), "hi", "Ne rallonge pas un mot court");
assertEqual(truncateWord("abc", 3), "abc", "Mot exactement à la limite");
assertEqual(truncateWord("a", 3), "a", "Mot d'un seul caractère");

// ===== Tests : logSecondsToDuration =====

console.log("--- logSecondsToDuration ---");

assertEqual(logSecondsToDuration(-1), "moins d'une seconde", "Valeur négative");
assertEqual(logSecondsToDuration(0), "1 seconde", "0 log secondes = 1 seconde");
{
  const result = logSecondsToDuration(30);
  assert(result.includes("milliard"), "30 log secondes → milliards d'années");
}

// ===== Tests : data.js =====

console.log("--- data.js ---");

assert(CONFIG.lowercase.length === 26, "CONFIG.lowercase a 26 caractères");
assert(CONFIG.uppercase.length === 26, "CONFIG.uppercase a 26 caractères");
assert(CONFIG.numbers.length === 10, "CONFIG.numbers a 10 caractères");
assert(CONFIG.symbols.length > 0, "CONFIG.symbols n'est pas vide");

assert(WORDS_FR.length > 400, `WORDS_FR a ${WORDS_FR.length} mots (> 400)`);
assert(
  WORDS_FR.every((w) => typeof w === "string" && w.length > 0),
  "Tous les mots FR sont des strings non vides",
);

assert(
  QUOTES_FR.length > 10,
  `QUOTES_FR a ${QUOTES_FR.length} citations (> 10)`,
);
assert(
  QUOTES_FR.every((q) => q.text && q.author),
  "Toutes les citations ont text et author",
);

// ===== Tests : unicité crypto =====

console.log("--- Unicité crypto ---");

{
  const passwords = new Set();
  for (let i = 0; i < 100; i++) {
    passwords.add(generateRandomPassword(16, true, true, true));
  }
  assert(
    passwords.size === 100,
    "100 mots de passe random de 16 chars sont tous uniques",
  );
}

// ===== Résumé =====

console.log("\n========================================");
console.log(`Tests terminés : ${passed} passés, ${failed} échoués`);
if (failures.length > 0) {
  console.log("\nÉchecs :");
  failures.forEach((f) => console.log(`  - ${f}`));
}
console.log("========================================");

// Affichage dans le navigateur si présent
if (typeof document !== "undefined") {
  const el = document.getElementById("results");
  if (el) {
    el.innerHTML = `
      <h2 style="color:${failed === 0 ? "#10B981" : "#EF4444"}">
        ${failed === 0 ? "✅ Tous les tests passent" : `❌ ${failed} test(s) échoué(s)`}
      </h2>
      <p>${passed} passés, ${failed} échoués</p>
      ${failures.length > 0 ? "<ul>" + failures.map((f) => `<li style="color:#EF4444">${f}</li>`).join("") + "</ul>" : ""}
    `;
  }
}
