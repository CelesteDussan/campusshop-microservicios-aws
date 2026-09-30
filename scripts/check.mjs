import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
function walk(path) {
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    if (
      entry.name.startsWith(".") ||
      ["data", "node_modules"].includes(entry.name)
    )
      continue;
    const file = `${path}/${entry.name}`;
    if (entry.isDirectory()) walk(file);
    else if (/\.(mjs|js)$/.test(file)) {
      const check = spawnSync(process.execPath, ["--check", file], {
        stdio: "inherit",
      });
      if (check.status) process.exit(check.status);
    }
  }
}
walk(".");
console.log("Sintaxis verificada.");
