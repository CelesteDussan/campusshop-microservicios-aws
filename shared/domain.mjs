export class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export function requireValue(condition, message, status = 400) {
  if (!condition) throw new AppError(status, message);
}
export function validateItems(items) {
  requireValue(
    Array.isArray(items) && items.length > 0 && items.length <= 20,
    "Selecciona entre 1 y 20 productos",
  );
  const ids = new Set();
  for (const item of items) {
    requireValue(
      typeof item.productId === "string" && !ids.has(item.productId),
      "Producto inválido o duplicado",
    );
    requireValue(
      Number.isInteger(item.quantity) &&
        item.quantity > 0 &&
        item.quantity <= 20,
      "Cantidad entre 1 y 20",
    );
    ids.add(item.productId);
  }
}
