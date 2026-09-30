# API HTTP

Base local: `http://localhost:8080/api`. JSON UTF-8. Sesiones en `Authorization: Bearer <token>`. Los listados son exclusivos del usuario autenticado. Un error retorna `{ "error": "mensaje" }`; los servicios agregan `requestId`.

| Método | Ruta                         | Acceso  | Entrada / salida                                                    |
| ------ | ---------------------------- | ------- | ------------------------------------------------------------------- |
| POST   | /users/register              | Público | `{name,email,password}` → `{user,token}` (201)                      |
| POST   | /users/login                 | Público | `{email,password}` → `{user,token}`                                 |
| GET    | /users/me                    | Sesión  | `{id,name}`                                                         |
| GET    | /catalog/products            | Público | Arreglo de `{id,name,category,description,price,icon}`              |
| GET    | /orders/orders               | Sesión  | Pedidos del usuario                                                 |
| POST   | /orders/orders               | Sesión  | `{items:[{productId,quantity}]}` y `Idempotency-Key` → pedido (201) |
| GET    | /payments/payments           | Sesión  | Pagos simulados propios                                             |
| GET    | /notifications/notifications | Sesión  | Avisos propios                                                      |

Ejemplo de cuerpo de pedido: `{"items":[{"productId":"coffee","quantity":2}]}`. Cabecera `Idempotency-Key: compra-unica-123`. El total es 9000 COP, aunque el cliente agregue un precio falso. Repetir la misma clave y cuerpo devuelve el mismo pedido.

Códigos: 400 entrada inválida; 401 sesión o clave interna inválida; 404 ruta/producto inexistente; 409 correo duplicado o idempotencia incompatible; 413 cuerpo >32 KiB; 429 límite de gateway; 502 fallo de gateway; 503 dependencia no disponible.

Solo en red interna: POST `catalog:3000/quote` con `{items}`; POST `payments:3000/charge` con `{orderId,userId,amount}`; POST `notifications:3000/deliver` con `{orderId,userId,total}`. Requieren `X-Internal-Key`. Los cinco servicios tienen GET `/health`, que también comprueba lectura de su base. El gateway tiene GET `/health` de disponibilidad del proceso; no garantiza salud de dependencias.
