import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { webcrypto } from "node:crypto";

test("checkout HTTP sin randomUUID conserva la clave al reintentar", async () => {
  const nodes = new Map();
  const element = () => ({
    append() {}, replaceChildren() {}, setAttribute() {},
    classList: { remove() {}, add() {} },
  });
  const select = (name) => {
    if (!nodes.has(name)) nodes.set(name, element());
    return nodes.get(name);
  };
  const keys = [];
  const context = {
    document: { querySelector: select, querySelectorAll: () => [], createElement: element },
    Intl, Uint8Array,
    crypto: { getRandomValues: (bytes) => webcrypto.getRandomValues(bytes) },
    setTimeout: () => 0, clearTimeout() {},
    fetch: async (path, options) => {
      if (path.includes("catalog")) return { ok: true, json: async () => [] };
      keys.push(options.headers["Idempotency-Key"]);
      return { ok: false, json: async () => ({ error: "Fallo temporal" }) };
    },
  };
  runInNewContext(readFileSync(new URL("../frontend/app.js", import.meta.url), "utf8"), context);
  await new Promise((resolve) => setImmediate(resolve));
  runInNewContext('session = {token: "demo"}; cart = [{productId: "coffee", quantity: 2}];', context);
  await select("#checkout").onclick();
  await select("#checkout").onclick();
  assert.equal(keys.length, 2);
  assert.match(keys[0], /^[a-f0-9]{32}$/);
  assert.equal(keys[0], keys[1]);
  assert.equal(select("#checkout").disabled, false);
});
