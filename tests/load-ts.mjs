import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";
const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL("../", import.meta.url));
const modules = new Map();
export async function loadTs(relative) {
  const absolute = path.resolve(root, relative);
  async function compile(file) {
    if (modules.has(file)) return modules.get(file);
    let code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
      },
    }).outputText;
    for (const match of [...code.matchAll(/from ["']([^"']+)["']/g)]) {
      const specifier = match[1];
      const resolved = specifier.startsWith("@/")
        ? path.resolve(root, specifier.slice(2) + ".ts")
        : specifier.startsWith(".")
          ? path.resolve(path.dirname(file), specifier + ".ts")
          : null;
      const url = resolved
        ? await compile(resolved)
        : pathToFileURL(require.resolve(specifier)).href;
      code = code.replace(match[0], 'from "' + url + '"');
    }
    const url =
      "data:text/javascript;base64," + Buffer.from(code).toString("base64");
    modules.set(file, url);
    return url;
  }
  return import(await compile(absolute));
}
