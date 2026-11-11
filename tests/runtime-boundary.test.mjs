import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
const root = new URL("../", import.meta.url);
function files(directory) {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory()
        ? files(path.join(directory, e.name))
        : /\.(?:ts|tsx)$/.test(e.name)
          ? [path.join(directory, e.name)]
          : [],
    );
}
test("production dependency boundary has no fixture imports, preview persistence or secondary HTTP implementation", () => {
  for (const directory of [
    "app",
    "components",
    "features",
    "services",
    "lib",
  ]) {
    for (const file of files(fileURLToPath(new URL(directory, root)))) {
      const code = fs.readFileSync(file, "utf8"),
        source = ts.createSourceFile(
          file,
          code,
          ts.ScriptTarget.Latest,
          true,
          file.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
        );
      function walk(node) {
        if (ts.isImportDeclaration(node)) {
          assert.doesNotMatch(
            node.moduleSpecifier.text,
            /(?:mock-api|tests\/|\.mock)/,
            file,
          );
        }
        if (ts.isCallExpression(node)) {
          const expression = node.expression.getText(source);
          if (expression === "fetch")
            assert.ok(
              file.endsWith(path.join("lib", "api.ts")),
              file + " bypasses centralized client",
            );
          assert.doesNotMatch(
            expression,
            /(?:localStorage|sessionStorage)\.(?:setItem|getItem)/,
            file + " reads or persists fake business state",
          );
        }
        ts.forEachChild(node, walk);
      }
      walk(source);
    }
  }
  assert.equal(
    fs.existsSync(new URL("app/api/v1/[...path]/route.ts", root)),
    false,
  );
  assert.equal(
    fs.existsSync(new URL("app/%5F%5Fmock_upload/[uploadId]/route.ts", root)),
    false,
  );
});
