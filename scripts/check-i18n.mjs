import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const localeDir = path.join(root, "src", "i18n");
const sourceDir = path.join(root, "src");

async function collectFiles(dir, extensions, excludedDirs) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return excludedDirs.has(file) ? [] : collectFiles(file, extensions, excludedDirs);
    }
    return extensions.some((extension) => entry.name.endsWith(extension)) ? [file] : [];
  }));
  return nested.flat();
}

const localeSource = await Promise.all(["en.js", "ur.js"].map(async (name) => [
  name,
  await readFile(path.join(localeDir, name), "utf8"),
]));
const localeKeys = new Map(localeSource.map(([name, source]) => [
  name,
  new Set([...source.matchAll(/^\s{2}([A-Za-z0-9_]+):/gm)].map(([, key]) => key)),
]));
const [englishKeys, urduKeys] = [localeKeys.get("en.js"), localeKeys.get("ur.js")];
const missingInUrdu = [...englishKeys].filter((key) => !urduKeys.has(key));
const missingInEnglish = [...urduKeys].filter((key) => !englishKeys.has(key));
const sourceFiles = await collectFiles(sourceDir, [".js", ".jsx", ".ts", ".tsx"], new Set([localeDir]));
const source = (await Promise.all(sourceFiles.map((file) => readFile(file, "utf8")))).join("\n");
const unusedKeys = [...englishKeys].filter((key) => !source.includes(key));

if (missingInUrdu.length || missingInEnglish.length || unusedKeys.length) {
  if (missingInUrdu.length) console.error(`Missing in ur.js: ${missingInUrdu.join(", ")}`);
  if (missingInEnglish.length) console.error(`Missing in en.js: ${missingInEnglish.join(", ")}`);
  if (unusedKeys.length) console.error(`Unused translation keys: ${unusedKeys.join(", ")}`);
  process.exitCode = 1;
} else {
  console.log(`i18n check passed (${englishKeys.size} keys)`);
}
