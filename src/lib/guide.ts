import fs from "node:fs";
import path from "node:path";

export function readGuide(): string {
  return fs.readFileSync(path.join(process.cwd(), "GUIDE.md"), "utf8");
}
