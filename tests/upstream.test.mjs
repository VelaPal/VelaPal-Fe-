import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const code = ts.transpileModule(
  fs.readFileSync(new URL("../lib/api-upstream.ts", import.meta.url), "utf8"),
  {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
    },
  },
).outputText;
const { resolveApiUpstream } = await import(
  `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`
);
test("Express is the default upstream and proxy loops are rejected", () => {
  assert.equal(resolveApiUpstream({}), "http://localhost:4000");
  for (const upstream of [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://[::1]:3000",
  ]) {
    assert.throws(() => resolveApiUpstream({ upstream }), /cannot point back/);
  }
  for (const upstream of [
    "ftp://localhost:4000",
    "http://name:password@localhost:4000",
    "http://localhost:4000/internal/v1",
    "http://localhost:4000?token=x",
  ]) {
    assert.throws(() => resolveApiUpstream({ upstream }));
  }
  assert.equal(
    resolveApiUpstream({ upstream: "http://127.0.0.1:4000/" }),
    "http://127.0.0.1:4000",
  );
});
