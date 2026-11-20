/**
 * Vérification des design tokens Lumio.
 *
 * Usage :
 *   node --experimental-strip-types scripts/check-tokens.ts
 *   npx vitest run scripts/check-tokens.test.ts
 *
 * Règles contrôlées :
 *  1. Toute variable `var(--x)` utilisée dans src/ (hors design-preview) ou
 *     tailwind.config.js est définie dans :root de tokens.css (l'héritage CSS
 *     garantit sa présence dans chaque thème).
 *  2. Chaque bloc de thème ne référence que des variables définies.
 *  3. Aucun code couleur hexadécimal en dur dans src/ (hors tokens.css et
 *     src/features/design-preview/, prévisualisation temporaire).
 *  4. Contrastes WCAG 2.1 par thème : texte ≥ 4.5:1, composants UI ≥ 3:1.
 */
import * as fs from "node:fs";
import * as path from "node:path";

const FRONTEND = path.resolve(import.meta.dirname, "..");
const SRC = path.join(FRONTEND, "src");
const TOKENS = path.join(SRC, "styles", "tokens.css");
const TAILWIND = path.join(FRONTEND, "tailwind.config.js");
const EXCLUDE_DIRS = new Set(["design-preview"]);
const EXCLUDE_FILES = new Set([TOKENS]);

export interface CheckError {
  rule: string;
  message: string;
}

/* ---------- parsing CSS ---------- */
function parseBlocks(css: string): { selector: string; vars: Map<string, string> }[] {
  const blocks: { selector: string; vars: Map<string, string> }[] = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css))) {
    const selector = m[1].trim().replace(/\/\*[\s\S]*?\*\//g, "").trim();
    const vars = new Map<string, string>();
    const varRe = /(--[a-zA-Z0-9-]+)\s*:\s*([^;]+);/g;
    let v: RegExpExecArray | null;
    while ((v = varRe.exec(m[2]))) vars.set(v[1], v[2].trim());
    blocks.push({ selector, vars });
  }
  return blocks;
}

/* ---------- contraste WCAG 2.1 ---------- */
function luminance(hex: string): number {
  const c = hex.replace("#", "");
  const full = c.length === 3 ? c.split("").map((x) => x + x).join("") : c;
  const f = (v: number) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * f(parseInt(full.slice(0, 2), 16)) +
    0.7152 * f(parseInt(full.slice(2, 4), 16)) +
    0.0722 * f(parseInt(full.slice(4, 6), 16))
  );
}
export function contrast(a: string, b: string): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
function isHex(v: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v.trim());
}

/* ---------- parcours des fichiers ---------- */
function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDE_DIRS.has(entry.name)) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|css)$/.test(entry.name)) out.push(p);
  }
  return out;
}

/** Valeur effective d'une variable dans un thème (thème > :root). */
function effective(blocks: { selector: string; vars: Map<string, string> }[], themeSelector: string | null, name: string): string | undefined {
  const theme = themeSelector ? blocks.find((b) => b.selector === themeSelector) : undefined;
  const root = blocks.find((b) => b.selector === ":root");
  return theme?.vars.get(name) ?? root?.vars.get(name);
}

export function runChecks(): CheckError[] {
  const errors: CheckError[] = [];
  const css = fs.readFileSync(TOKENS, "utf8");
  const blocks = parseBlocks(css);
  const root = blocks.find((b) => b.selector === ":root");
  if (!root) {
    errors.push({ rule: "tokens", message: "Bloc :root introuvable dans tokens.css" });
    return errors;
  }
  const themes = blocks.filter((b) => b.selector.startsWith("[")).map((b) => b.selector);

  /* 1+2. variables utilisées vs définies */
  const used = new Map<string, string[]>();
  const files = [...walk(SRC), TAILWIND];
  for (const file of files) {
    if (EXCLUDE_FILES.has(file)) continue;
    const content = fs.readFileSync(file, "utf8");
    const re = /var\(\s*(--[a-zA-Z0-9-]+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(content))) {
      const list = used.get(m[1]) ?? [];
      list.push(path.relative(FRONTEND, file));
      used.set(m[1], list);
    }
  }
  for (const [name, where] of used) {
    if (!root.vars.has(name)) {
      errors.push({
        rule: "var-définie",
        message: `${name} utilisé dans ${where.slice(0, 3).join(", ")} mais jamais défini dans :root`,
      });
    }
  }
  for (const b of blocks) {
    if (!b.selector.startsWith("[")) continue;
    for (const [name, value] of b.vars) {
      const refRe = /var\(\s*(--[a-zA-Z0-9-]+)/g;
      let m: RegExpExecArray | null;
      while ((m = refRe.exec(value))) {
        if (!root.vars.has(m[1]) && !b.vars.has(m[1])) {
          errors.push({ rule: "var-définie", message: `${b.selector} : ${name} référence ${m[1]} non défini` });
        }
      }
    }
  }

  /* 3. pas de hex en dur hors tokens.css / design-preview */
  for (const file of files) {
    if (EXCLUDE_FILES.has(file)) continue;
    const content = fs.readFileSync(file, "utf8");
    const lines = content.split("\n");
    lines.forEach((line, i) => {
      const hexRe = /#[0-9a-fA-F]{3,8}\b/g;
      let m: RegExpExecArray | null;
      while ((m = hexRe.exec(line))) {
        errors.push({
          rule: "pas-de-hex-en-dur",
          message: `${path.relative(FRONTEND, file)}:${i + 1} couleur en dur ${m[0]} — utiliser un token`,
        });
      }
    });
  }

  /* 4. contrastes par thème */
  const themeList: (string | null)[] = [null, ...themes]; // null = :root (9-14)
  const textPairs: [string, string, string][] = [
    ["texte", "--color-foreground", "--color-background"],
    ["texte sur surface", "--color-foreground", "--color-surface"],
    ["texte secondaire", "--color-foreground-muted", "--color-background"],
    ["secondaire sur surface-alt", "--color-foreground-muted", "--color-surface-alt"],
    ["succès", "--color-success", "--color-background"],
    ["alerte", "--color-warning", "--color-background"],
    ["danger", "--color-danger", "--color-background"],
    ["info", "--color-info", "--color-background"],
    ["bulle enfant", "--color-bubble-child-text", "--color-bubble-child"],
    ["bulle assistant", "--color-bubble-assistant-text", "--color-bubble-assistant"],
    ["avis système", "--color-bubble-notice-text", "--color-bubble-notice"],
  ];
  const uiPairs: [string, string, string][] = [
    ["bordure", "--color-border", "--color-background"],
    ["focus", "--color-primary", "--color-background"],
  ];
  const whiteOn: [string, string][] = [
    ["blanc sur primaire", "--color-primary"],
    ["blanc sur primaire-hover", "--color-primary-hover"],
    ["blanc sur secondaire", "--color-secondary"],
    ["blanc sur danger", "--color-danger"],
  ];
  for (const theme of themeList) {
    const label = theme ?? ":root (9-14)";
    const get = (n: string) => effective(blocks, theme, n) ?? "";
    for (const [what, fgN, bgN] of textPairs) {
      const fg = get(fgN);
      const bg = get(bgN);
      if (isHex(fg) && isHex(bg)) {
        const r = contrast(fg, bg);
        if (r < 4.5) errors.push({ rule: "contraste-AA", message: `${label} : ${what} ${fg} sur ${bg} = ${r.toFixed(2)} < 4.5` });
      }
    }
    for (const [what, fgN, bgN] of uiPairs) {
      const fg = get(fgN);
      const bg = get(bgN);
      if (isHex(fg) && isHex(bg)) {
        const r = contrast(fg, bg);
        if (r < 3) errors.push({ rule: "contraste-UI", message: `${label} : ${what} ${fg} sur ${bg} = ${r.toFixed(2)} < 3` });
      }
    }
    for (const [what, n] of whiteOn) {
      const fg = get(n);
      if (isHex(fg)) {
        const r = contrast("#ffffff", fg);
        if (r < 4.5) errors.push({ rule: "contraste-AA", message: `${label} : ${what} #FFFFFF sur ${fg} = ${r.toFixed(2)} < 4.5` });
      }
    }
  }

  return errors;
}

/* ---------- point d'entrée CLI ---------- */
export function formatReport(errors: CheckError[]): string {
  if (errors.length === 0) return "OK: tous les tokens sont définis, sans hex en dur, contrastes AA/AA-UI respectés.";
  return errors.map((e) => `[${e.rule}] ${e.message}`).join("\n");
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"));
if (isMain) {
  const errors = runChecks();
  console.log(formatReport(errors));
  if (errors.length > 0) process.exit(1);
}
