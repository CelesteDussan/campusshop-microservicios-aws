# Arquitectura y decisiones

## Contexto y requisitos

CampusShop permite a un estudiante registrarse, explorar seis productos, armar un carrito, registrar un pago simulado y consultar sus pedidos y avisos. RF01 registro/login; RF02 catálogo por categorías; RF03 cantidades 1–20; RF04 compra con precios del servidor; RF05 historial privado; RF06 notificaciones; RF07 persistencia; RF08 ejecución con Docker y despliegue AWS.

Los requisitos no funcionales se evidencian en: aislamiento de datos (cinco archivos y volúmenes), mantenibilidad (casos de uso separados de HTTP/SQL), seguridad (hash de contraseña, token firmado, filtro de rutas, consultas parametrizadas), recuperabilidad (idempotencia) y verificabilidad (pruebas automatizadas). No se promete un SLA ni escalabilidad horizontal en esta versión.

## Flujo de dependencias

Navegador → Gateway → servicios de usuarios, catálogo, pedidos, pagos y notificaciones. Pedidos consulta catálogo, registra pago y crea aviso. Ningún servicio lee la base de otro. Las llamadas internas usan `X-Internal-Key`; el gateway no transmite esa cabecera desde el cliente ni expone rutas internas. El frontend solo utiliza `/api/`.

## Patrones aplicados y evidencia

| Patrón / principio                      | Aplicación concreta                                                        |
| --------------------------------------- | -------------------------------------------------------------------------- |
| Microservicios por capacidad de negocio | Cinco entrypoints y procesos con responsabilidad propia                    |
| API Gateway                             | `gateway/main.mjs`: enrutamiento permitido, límite de cuerpo y solicitudes |
| Database per service                    | Cinco `SqliteRepository`, rutas y volúmenes distintos                      |
| Arquitectura hexagonal simplificada     | Casos de uso reciben repositorios y funciones HTTP por constructor         |
| Repository                              | Adaptador SQLite con `get`, `list`, `put` y consultas preparadas           |
| Inversión de dependencias               | `Orders` no importa SQLite ni fetch; recibe `quote`, `charge`, `notify`    |
| Orquestación                            | Pedidos coordina cotización → pago → aviso                                 |
| Idempotencia                            | Clave por usuario y carrito; pago y aviso únicos por orderId               |
| Fail fast                               | Secretos ausentes o débiles impiden iniciar servicios                      |
| Separación de responsabilidades         | Rutas en `main`, negocio en `application`, UI en frontend                  |

No se etiqueta el flujo como Saga completa: no hay compensaciones ni reservas de inventario. Tampoco hay CQRS, Event Sourcing o event bus; agregarlos sin una necesidad real aumentaría la complejidad.

## Estado y fallos

Un pedido se persiste como `pending-payment`. Tras el pago se guarda `paid`; la notificación tiene estado independiente `pending` o `delivered`. Un fallo de aviso nunca transforma un pago aprobado en fallido. Si se pierde una respuesta de pago, repetir con la misma clave consulta el pago previo sin duplicarlo. Dos solicitudes simultáneas con la misma clave se coordinan dentro de un proceso. La clave reutilizada con otro carrito produce 409.

La recuperación no es automática: el cliente conserva su clave mientras reintenta un carrito sin cambios. Tras recargar el navegador o modificar el carrito, debe recuperarse el pedido pendiente a través de la API reutilizando la clave original, que está en el `id` del historial después de los dos puntos. Los avisos pendientes pueden recuperarse repitiendo el POST original. No usar esta versión para dinero real. Una evolución adecuada es outbox persistente con un worker y claves únicas SQL explícitas para múltiples réplicas.

## ADR-001: Node.js y SQLite

Se adopta Node.js 24 con módulos nativos y SQLite por simplicidad académica, portabilidad y ausencia de dependencias de terceros. El costo es I/O síncrono, búsquedas de historial en memoria y escalabilidad limitada. Cada servicio tiene propiedad exclusiva de sus datos. Para múltiples réplicas migrar el adaptador a PostgreSQL/RDS, incorporar índices por usuario y unicidad transaccional para idempotencia. `node:sqlite` debe revisarse al actualizar Node, pues su API puede evolucionar.

## ADR-002: AWS EC2 con Docker Compose

Una EC2 con EBS cifrado hospeda seis contenedores. Permite demostrar todos los requisitos sin exigir ALB, NAT o RDS. No es alta disponibilidad: si falla la instancia, falla la aplicación. Tomar snapshots de EBS y probar recuperación. El EBS de la plantilla no se elimina al terminar la instancia, para facilitar recuperación; un volumen retenido sigue generando costo hasta eliminarlo deliberadamente.

## ADR-003: seguridad y límites

Contraseñas con scrypt y sal aleatoria; tokens HMAC con expiración. Son tokens propios, no JWT. Sesión solo en memoria para reducir persistencia en navegador. El servidor devuelve errores controlados y un identificador de solicitud; no registra contraseñas ni secretos. La clave compartida interna es una simplificación; en producción usar identidad de servicio y secretos administrados. El límite de 120 solicitudes por IP por minuto es local al gateway, no distribuido; detrás de un proxy varios clientes pueden compartir el límite. Login y registro usan hash síncrono: no están dimensionados para ataques volumétricos.

HTTPS es obligatorio para cuentas reales en Internet. La plantilla limita el puerto web al CIDR indicado y usa HTTP para evaluación con datos ficticios. No abrir 0.0.0.0/0 sin agregar terminación TLS. El catálogo es de solo lectura; no hay rol administrador ni endpoints de edición.

## Clean Code y SOLID

Nombres de dominio explícitos, funciones pequeñas de validación, errores con códigos, dinero en enteros COP, ausencia de HTML inyectado desde datos y secretos externos. SRP se evidencia en cada caso de uso; DIP en los puertos de Orders; ISP en la interfaz mínima del repositorio. OCP se aplica al reemplazar adaptadores sin alterar el caso de uso. No se fuerza herencia para demostrar LSP: un adaptador alternativo debe cumplir el mismo contrato observable, validado por pruebas.

## Fuentes técnicas

- https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html
- https://docs.aws.amazon.com/AmazonECS/latest/developerguide/create-container-image.html
- https://docs.docker.com/compose/
