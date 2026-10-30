import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const sourceDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "src");

async function collectCssFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectCssFiles(file);
    return entry.name.endsWith(".css") ? [file] : [];
  }));
  return nested.flat();
}

const violations = [];
for (const file of await collectCssFiles(sourceDir)) {
  const lines = (await readFile(file, "utf8")).split(/\r?\n/);
  lines.forEach((line, index) => {
    if (/!important|\[[^\]]*data-slot/i.test(line)) {
      violations.push(`${path.relative(sourceDir, file)}:${index + 1}: ${line.trim()}`);
    }
  });
}

if (violations.length) {
  console.error(`CSS policy violations:\n${violations.join("\n")}`);
  process.exitCode = 1;
} else {
  console.log("CSS policy check passed");
}
