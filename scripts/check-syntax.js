import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

function scan(dir) {
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, item.name);
    if (item.isDirectory()) scan(p);
    else if (p.endsWith(".js")) execFileSync(process.execPath, ["--check", p], { stdio: "inherit" });
  }
}
for (const dir of ["src", "scripts", "test", "demo"]) scan(dir);
console.log("syntax OK");
