import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
test("HTTP: cinco servicios, gateway, aislamiento y compra completa", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "campusshop-test-"));
  const children = [];
  let logs = "";
  const names = ["users", "catalog", "orders", "payments", "notifications"];
  const urls = Object.fromEntries(
    names.map((name, i) => [
      `${name.toUpperCase()}_URL`,
      `http://127.0.0.1:${14301 + i}`,
    ]),
  );
  const baseEnv = {
    ...process.env,
    ...urls,
    TOKEN_SECRET: "t".repeat(40),
    INTERNAL_SECRET: "i".repeat(40),
  };
  for (const [index, name] of [...names, "gateway"].entries()) {
    const child = spawn(
      process.execPath,
      [name === "gateway" ? "gateway/main.mjs" : `services/${name}/main.mjs`],
      {
        env: {
          ...baseEnv,
          PORT: String(14301 + index),
          DB_PATH: join(dir, `${name}.sqlite`),
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    child.stdout.on("data", (data) => (logs += data));
    child.stderr.on("data", (data) => (logs += data));
    children.push(child);
  }
  t.after(async () => {
    await Promise.all(
      children.map(
        (child) =>
          new Promise((resolve) => {
            if (child.exitCode !== null) return resolve();
            child.once("exit", resolve);
            child.kill();
          }),
      ),
    );
    rmSync(dir, { recursive: true, force: true });
  });
  for (let i = 0; i < 80; i++) {
    try {
      const results = await Promise.all(
        Array.from({ length: 6 }, (_, j) =>
          fetch(`http://127.0.0.1:${14301 + j}/health`),
        ),
      );
      if (results.every((r) => r.ok)) break;
    } catch {}
    if (i === 79) throw Error(logs);
    await delay(100);
  }
  const root = "http://127.0.0.1:14306";
  async function request(path, body, token, key) {
    const response = await fetch(root + path, {
      method: body ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(key ? { "Idempotency-Key": key } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: response.status, data: await response.json() };
  }
  assert.equal((await fetch(root)).status, 200);
  assert.equal((await request("/api/orders/orders")).status, 401);
  assert.equal(
    (await request("/api/payments/charge", { amount: 1 })).status,
    404,
  );
  assert.equal(
    (await request("/api/users/register", { name: "A" })).status,
    400,
  );
  const session = await request("/api/users/register", {
    name: "Test Student",
    email: "a@example.com",
    password: "goodPassword123",
  });
  assert.equal(session.status, 201);
  const token = session.data.token;
  assert.equal(
    (
      await request("/api/users/login", {
        email: "a@example.com",
        password: "goodPassword123",
      })
    ).status,
    200,
  );
  assert.equal((await request("/api/catalog/products")).data.length, 6);
  const body = { items: [{ productId: "coffee", quantity: 2, unitPrice: 1 }] };
  const order = await request(
    "/api/orders/orders",
    body,
    token,
    "integration-123",
  );
  assert.equal(order.status, 201);
  assert.equal(order.data.total, 9000);
  assert.equal(order.data.notificationStatus, "delivered");
  assert.equal(
    (await request("/api/orders/orders", body, token, "integration-123")).data
      .orderId,
    order.data.orderId,
  );
  assert.equal(
    (await request("/api/payments/payments", null, token)).data.length,
    1,
  );
  assert.equal(
    (await request("/api/notifications/notifications", null, token)).data
      .length,
    1,
  );
  const other = await request("/api/users/register", {
    name: "Other Student",
    email: "b@example.com",
    password: "goodPassword123",
  });
  assert.equal(
    (await request("/api/orders/orders", null, other.data.token)).data.length,
    0,
  );
  const internal = await fetch(urls.PAYMENTS_URL + "/charge", {
    method: "POST",
    body: "{}",
  });
  assert.equal(internal.status, 401);
});
