import { Orders } from "./application.mjs";
import { SqliteRepository } from "../../shared/repository.mjs";
import { serve, callService } from "../../shared/http.mjs";
import { secret } from "../../shared/security.mjs";
const repository = new SqliteRepository(
  process.env.DB_PATH ?? "data/orders.sqlite",
);
const internalSecret = secret("INTERNAL_SECRET");
const app = new Orders(repository, {
  quote: (items) =>
    callService(process.env.CATALOG_URL ?? "http://localhost:3002", "/quote", {
      body: { items },
      internalSecret,
    }),
  charge: (body) =>
    callService(
      process.env.PAYMENTS_URL ?? "http://localhost:3004",
      "/charge",
      { body, internalSecret },
    ),
  notify: (body) =>
    callService(
      process.env.NOTIFICATIONS_URL ?? "http://localhost:3005",
      "/deliver",
      { body, internalSecret },
    ),
});
serve({
  name: "orders",
  port: process.env.PORT ?? 3003,
  repository,
  tokenSecret: secret("TOKEN_SECRET"),
  routes: [
    {
      method: "GET",
      path: "/orders",
      access: "user",
      handle: ({ user }) => app.list(user.sub),
    },
    {
      method: "POST",
      path: "/orders",
      access: "user",
      status: 201,
      handle: ({ body, user, req }) =>
        app.create(user.sub, body.items, req.headers["idempotency-key"]),
    },
  ],
});
