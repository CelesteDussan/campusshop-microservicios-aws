import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const services = {
  users: process.env.USERS_URL ?? "http://localhost:3001",
  catalog: process.env.CATALOG_URL ?? "http://localhost:3002",
  orders: process.env.ORDERS_URL ?? "http://localhost:3003",
  payments: process.env.PAYMENTS_URL ?? "http://localhost:3004",
  notifications: process.env.NOTIFICATIONS_URL ?? "http://localhost:3005",
};
const allowed = new Set([
  "POST users/register",
  "POST users/login",
  "GET users/me",
  "GET catalog/products",
  "GET orders/orders",
  "POST orders/orders",
  "GET payments/payments",
  "GET notifications/notifications",
]);
const rates = new Map();
setInterval(() => rates.clear(), 60000).unref();
const server = createServer(async (req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; frame-ancestors 'none'",
  );
  const pathname = new URL(req.url, "http://localhost").pathname;
  try {
    if (pathname === "/health") {
      res.end("ok");
      return;
    }
    if (pathname.startsWith("/api/")) {
      const route = pathname.slice(5);
      const [service, ...rest] = route.split("/");
      if (!allowed.has(`${req.method} ${route}`)) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end('{"error":"Ruta no encontrada"}');
        return;
      }
      const ip = req.socket.remoteAddress;
      const count = (rates.get(ip) ?? 0) + 1;
      rates.set(ip, count);
      if (count > 120) {
        res.writeHead(429, { "Content-Type": "application/json" });
        res.end('{"error":"Demasiadas solicitudes; espera un minuto"}');
        return;
      }
      let body = "";
      for await (const chunk of req) {
        body += chunk;
        if (Buffer.byteLength(body) > 32768) {
          res.writeHead(413);
          res.end();
          return;
        }
      }
      const response = await fetch(`${services[service]}/${rest.join("/")}`, {
        method: req.method,
        headers: {
          "Content-Type": "application/json",
          ...(req.headers.authorization
            ? { Authorization: req.headers.authorization }
            : {}),
          ...(req.headers["idempotency-key"]
            ? { "Idempotency-Key": req.headers["idempotency-key"] }
            : {}),
        },
        body: body || undefined,
        signal: AbortSignal.timeout(20000),
      });
      res.writeHead(response.status, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end(await response.text());
      return;
    }
    const files = {
      "/": ["index.html", "text/html"],
      "/app.js": ["app.js", "text/javascript"],
      "/style.css": ["style.css", "text/css"],
    };
    const file = files[pathname];
    if (!file || req.method !== "GET") {
      res.writeHead(404);
      res.end();
      return;
    }
    res.setHeader("Content-Type", `${file[1]}; charset=utf-8`);
    res.end(
      await readFile(
        fileURLToPath(new URL(`../frontend/${file[0]}`, import.meta.url)),
      ),
    );
  } catch {
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end('{"error":"No se pudo contactar el servicio. Reintenta."}');
  }
});
server.listen(process.env.PORT ?? 8080, "0.0.0.0", () =>
  console.log("CampusShop gateway listo"),
);
process.on("SIGTERM", () => server.close(() => process.exit(0)));
