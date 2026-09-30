import { requireValue } from "../../shared/domain.mjs";
export class Notifications {
  constructor(repository) {
    this.repository = repository;
  }
  deliver({ orderId, userId, total }) {
    requireValue(
      typeof orderId === "string" &&
        typeof userId === "string" &&
        Number.isSafeInteger(total) &&
        total > 0,
      "Notificación inválida",
    );
    return (
      this.repository.get(orderId) ??
      this.repository.put({
        id: orderId,
        userId,
        message: `Tu pedido ${orderId.slice(0, 8)} fue confirmado. Total: $${total} COP.`,
        createdAt: new Date().toISOString(),
      })
    );
  }
  list(userId) {
    return this.repository.list().filter((x) => x.userId === userId);
  }
}
