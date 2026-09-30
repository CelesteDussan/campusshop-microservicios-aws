import {
  createHmac,
  timingSafeEqual,
  randomBytes,
  scryptSync,
} from "node:crypto";
import { requireValue } from "./domain.mjs";
export function secret(name) {
  const value = process.env[name];
  if (!value || value.length < 32 || value.startsWith("replace-"))
    throw new Error(
      `${name}: configura un secreto aleatorio de al menos 32 caracteres`,
    );
  return value;
}
export function equal(a, b) {
  const x = Buffer.from(a ?? "");
  const y = Buffer.from(b ?? "");
  return x.length === y.length && timingSafeEqual(x, y);
}
export function signToken(user, key) {
  const payload = Buffer.from(
    JSON.stringify({
      sub: user.id,
      name: user.name,
      exp: Date.now() + 3600000,
    }),
  ).toString("base64url");
  return `${payload}.${createHmac("sha256", key).update(payload).digest("base64url")}`;
}
export function verifyToken(token, key) {
  const [payload, signature, extra] = (token ?? "").split(".");
  requireValue(
    payload &&
      signature &&
      !extra &&
      equal(
        signature,
        createHmac("sha256", key).update(payload).digest("base64url"),
      ),
    "Sesión inválida",
    401,
  );
  let user;
  try {
    user = JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    requireValue(false, "Sesión inválida", 401);
  }
  requireValue(
    typeof user.sub === "string" && user.exp > Date.now(),
    "Sesión vencida",
    401,
  );
  return user;
}
export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function checkPassword(password, hash) {
  const [salt, value] = hash.split(":");
  return equal(scryptSync(password, salt, 64).toString("hex"), value);
}
