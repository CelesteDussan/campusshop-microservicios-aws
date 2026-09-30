import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { AppError, requireValue } from "./domain.mjs";
import { equal, verifyToken } from "./security.mjs";
export async function readJson(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    requireValue(
      Buffer.byteLength(body) <= 32768,
      "Cuerpo demasiado grande",
      413,
    );
  }
  try {
    return body ? JSON.parse(body) : {};
  } catch {
    throw new AppError(400, "JSON inválido");
  }
}
export function serve({
  port,
  name,
  repository,
  tokenSecret,
  internalSecret,
  routes,
}) {
  const server = createServer(async (req, res) => {
    const requestId = randomUUID();
    const path = new URL(req.url, "http://localhost").pathname;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("X-Request-Id", requestId);
    res.setHeader("Cache-Control", "no-store");
    try {
      if (path === "/health" && req.method === "GET") {
        repository?.list();
        res.end(JSON.stringify({ status: "ok", service: name }));
        return;
      }
      const route = routes.find(
        (route) => route.method === req.method && route.path === path,
      );
      requireValue(route, "Ruta no encontrada", 404);
      let user;
      if (route.access === "internal")
        requireValue(
          equal(req.headers["x-internal-key"], internalSecret),
          "Acceso denegado",
          401,
        );
      if (route.access === "user")
        user = verifyToken(
          req.headers.authorization?.replace(/^Bearer /, ""),
          tokenSecret,
        );
      const body = ["POST", "PUT", "PATCH"].includes(req.method)
        ? await readJson(req)
        : {};
      const result = await route.handle({ body, user, req });
      res.statusCode = route.status ?? 200;
      res.end(JSON.stringify(result));
    } catch (error) {
      res.statusCode = error.status ?? 500;
      res.end(
        JSON.stringify({
          error: error.status ? error.message : "Error interno",
          requestId,
        }),
      );
      if (!error.status)
        console.error(
          JSON.stringify({ service: name, requestId, error: error.message }),
        );
    }
  });
  server.requestTimeout = 15000;
  server.listen(port, "0.0.0.0", () =>
    console.log(`${name} escuchando en ${port}`),
  );
  const stop = () =>
    server.close(() => {
      repository?.close();
      process.exit(0);
    });
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
  return server;
}
export async function callService(
  base,
  path,
  { body, internalSecret, token } = {},
) {
  let response;
  try {
    response = await fetch(`${base}${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        ...(internalSecret ? { "X-Internal-Key": internalSecret } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    throw new AppError(503, "Servicio temporalmente no disponible; reintenta");
  }
  const value = await response.json();
  if (!response.ok)
    throw new AppError(
      response.status,
      value.error ?? "Servicio no disponible",
    );
  return value;
}
