import { randomUUID } from "node:crypto";
import { requireValue } from "../../shared/domain.mjs";
import {
  hashPassword,
  checkPassword,
  signToken,
} from "../../shared/security.mjs";
export class Users {
  constructor(repository, key) {
    this.repository = repository;
    this.key = key;
  }
  register({ name, email, password }) {
    requireValue(
      typeof name === "string" && name.trim().length >= 2 && name.length <= 80,
      "Nombre entre 2 y 80 caracteres",
    );
    requireValue(
      typeof email === "string" &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
        email.length <= 254,
      "Correo inválido",
    );
    requireValue(
      typeof password === "string" &&
        password.length >= 10 &&
        password.length <= 128,
      "Contraseña entre 10 y 128 caracteres",
    );
    email = email.toLowerCase().trim();
    requireValue(!this.repository.get(email), "Correo ya registrado", 409);
    const user = this.repository.put({
      id: email,
      userId: randomUUID(),
      name: name.trim(),
      hash: hashPassword(password),
    });
    return this.session(user);
  }
  login({ email, password }) {
    requireValue(
      typeof email === "string" &&
        typeof password === "string" &&
        password.length <= 128,
      "Credenciales inválidas",
      401,
    );
    const user = this.repository.get(email.toLowerCase().trim());
    requireValue(
      user && checkPassword(password, user.hash),
      "Credenciales inválidas",
      401,
    );
    return this.session(user);
  }
  session(user) {
    const profile = { id: user.userId, name: user.name, email: user.id };
    return { user: profile, token: signToken(profile, this.key) };
  }
}
