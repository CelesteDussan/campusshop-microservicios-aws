# Guía de evaluación — entrega del 5 de octubre de 2026

## Descargar y arrancar

```sh
git clone https://github.com/CelesteDussan/campusshop-microservicios-aws.git
cd campusshop-microservicios-aws
node --version
npm run check
npm test
npm run dev
```

Usar Node.js 24.13.1 o posterior dentro de la rama 24. No hay dependencias externas: no se requiere `npm install`. Ejecutar desde la raíz del repositorio. Abrir http://localhost:8080 y mantener la terminal abierta. Ctrl+C detiene los seis procesos. Los puertos 3001–3005 y 8080 deben estar libres; no ejecutar simultáneamente el modo local y Docker en 8080.

## Recorrido del profesor

| Acción | Resultado esperado |
| --- | --- |
| Abrir la página | Seis productos; filtros de categorías y carrito |
| Crear cuenta | Nombre de 2–80 caracteres, correo válido, contraseña de 10–128; sesión iniciada |
| Agregar dos unidades de Café del Huila | Total de $9.000 COP |
| Confirmar pedido con sesión iniciada | Confirmación, carrito vacío, pedido y aviso en «Tu actividad» |
| Cerrar sesión y entrar con otra cuenta | No aparecen los pedidos de la primera cuenta |
| Volver a entrar con la primera cuenta | Se conserva su historial |
| Reiniciar el servidor y entrar otra vez | Los datos siguen almacenados en SQLite |

Usar cuentas ficticias. No hay credenciales predeterminadas. Si el carrito se intentó confirmar antes de entrar, después de registrarse hay que pulsar confirmar nuevamente. Recargar la pestaña borra la sesión y el carrito en memoria; los pedidos guardados permanecen.

## Requisitos y evidencia

| Requisito | Implementación | Comprobación |
| --- | --- | --- |
| Cinco microservicios | users, catalog, orders, payments, notifications | Cinco procesos y cinco servicios de negocio en Compose |
| Frontend y backend | frontend, gateway, services | Página web y compra completa HTTP en `npm test` |
| Bases de datos | SQLite por servicio | Cinco archivos locales o cinco volúmenes Docker |
| Docker | Dockerfile y compose.yaml | Seis contenedores; gateway incluido |
| Patrones y Clean Code | Repository, Gateway, DIP, separación de capas, idempotencia | `docs/ARQUITECTURA.md` y pruebas de dominio |
| AWS | Plantilla EC2 y guía | Preparado; despliegue real pendiente, no hay URL AWS activa confirmada |
| Enlace e integrante | `ENTREGA.txt` | Maria Celeste Dussan y URL GitHub |

Los pagos son simulados. La interfaz muestra pedidos y avisos; el listado independiente de pagos se consulta por API. No incluye edición de catálogo, inventario, envío de correos ni administración.

## Configuración y persistencia

En modo local, `scripts/dev.mjs` carga `.env` si existe. Sin él genera secretos temporales. Para Docker, copiar `.env.example` a `.env` y sustituir ambos secretos por valores aleatorios diferentes, como explica el README. No subir `.env` a Git.

| Variable | Uso |
| --- | --- |
| TOKEN_SECRET | Firma de sesiones; mínimo 32 caracteres |
| INTERNAL_SECRET | Autenticación entre servicios; mínimo 32 caracteres |
| WEB_PORT | Puerto publicado por Compose; predeterminado 8080; no cambia el modo `npm run dev` |
| PORT / DB_PATH | Configuración de cada proceso individual; no asignar un PORT global al lanzador local |
| USERS_URL, CATALOG_URL, ORDERS_URL, PAYMENTS_URL, NOTIFICATIONS_URL | Direcciones de servicios usadas por gateway y/o pedidos |

Local: `data/users.sqlite`, `catalog.sqlite`, `orders.sqlite`, `payments.sqlite`, `notifications.sqlite`. Docker: cada contenedor de negocio guarda `/app/data/service.sqlite` en su propio volumen. No se comparten automáticamente datos entre ambos modos.

## Problemas frecuentes

- `node:sqlite` no encontrado: comprobar la versión de Node; usar la rama 24 indicada.
- `EADDRINUSE`: detener la otra ejecución o liberar el puerto correspondiente.
- Error de secretos al arrancar: sustituir los ejemplos de `.env`, conservar mínimo 32 caracteres y valores diferentes.
- Catálogo no disponible / 502: comprobar la terminal o `docker compose logs --tail=100`; el gateway puede estar activo aunque falle una dependencia.
- Sesión vencida / 401: cerrar sesión y entrar de nuevo. Su duración es una hora.
- Correo ya registrado: iniciar sesión o crear otra cuenta ficticia.
- Pedido pendiente: conservar carrito y reintentar sin modificarlo. Si se recargó la página, seguir la recuperación por API descrita en arquitectura; no existe un worker de recuperación automática.
- El aviso no llega por correo: los avisos aparecen dentro de la aplicación.

Consultar [validación](VALIDACION.md) para distinguir las pruebas ejecutadas de los pasos pendientes, y [AWS](../infra/aws/README.md) para el despliegue.
