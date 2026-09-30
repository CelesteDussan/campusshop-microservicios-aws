import { Payments } from "./application.mjs";
import { SqliteRepository } from "../../shared/repository.mjs";
import { serve } from "../../shared/http.mjs";
import { secret } from "../../shared/security.mjs";
const repository = new SqliteRepository(
  process.env.DB_PATH ?? "data/payments.sqlite",
);
const app = new Payments(repository);
serve({
  name: "payments",
  port: process.env.PORT ?? 3004,
  repository,
  tokenSecret: secret("TOKEN_SECRET"),
  internalSecret: secret("INTERNAL_SECRET"),
  routes: [
    {
      method: "POST",
      path: "/charge",
      access: "internal",
      handle: ({ body }) => app.charge(body),
    },
    {
      method: "GET",
      path: "/payments",
      access: "user",
      handle: ({ user }) => app.list(user.sub),
    },
  ],
});
