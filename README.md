# CampusShop

Tienda universitaria web para la materia **Arquitectura de software**. Incluye frontend adaptable, API Gateway y cinco microservicios ejecutables por separado, cada uno con una base SQLite persistente propia. Pagos de demostración; no utiliza tarjetas ni realiza cobros.

## Inicio rápido

Requisito local: Node.js 24.13.1 o superior de la rama 24. No requiere instalar paquetes.

```sh
npm run dev
```

Abrir http://localhost:8080. Crear una cuenta (contraseña de 10 caracteres mínimo), agregar productos y confirmar el pedido. El historial y la notificación aparecen en «Tu actividad». Las sesiones duran una hora y se guardan solo en memoria del navegador. Al reiniciar el modo local sin `.env`, las sesiones anteriores se invalidan, pero las bases persisten en `data/`.

## Docker

1. Iniciar Docker Desktop o Docker Engine con Compose v2.
2. Copiar `.env.example` a `.env`.
3. Generar **dos** valores diferentes con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` y reemplazar los secretos de ejemplo.
4. Ejecutar:

```sh
docker compose up --build -d --wait
docker compose ps
docker compose logs --tail=50
```

Abrir http://localhost:8080. `docker compose down` detiene los servicios conservando sus datos. No usar `down -v` si se desean conservar usuarios y pedidos. Solo el gateway publica un puerto; las bases no son accesibles desde la red.

## Componentes

| Componente         | Responsabilidad                            | Puerto local | Persistencia         |
| ------------------ | ------------------------------------------ | -----------: | -------------------- |
| users              | Registro, credenciales y sesiones firmadas |         3001 | users.sqlite         |
| catalog            | Productos y cotización confiable           |         3002 | catalog.sqlite       |
| orders             | Pedidos y coordinación del flujo           |         3003 | orders.sqlite        |
| payments           | Registro de pagos simulados idempotentes   |         3004 | payments.sqlite      |
| notifications      | Bandeja de avisos por usuario              |         3005 | notifications.sqlite |
| gateway + frontend | Entrada web, rutas permitidas y UI         |         8080 | Sin base             |

El frontend está separado en `frontend/` y se sirve junto con el gateway para conservar el mismo origen. Hay **cinco microservicios de negocio y seis contenedores**. SQLite es una base SQL real embebida: no necesita un contenedor de servidor adicional. Cada servicio posee un volumen exclusivo.

## Organización y evaluación

- `services/*/application.mjs`: casos de uso, dependencias inyectadas.
- `services/*/main.mjs`: composición de adaptadores y rutas.
- `shared/`: errores, seguridad, adaptadores HTTP y persistencia.
- `frontend/`: HTML semántico, CSS adaptable y JavaScript sin frameworks.
- `gateway/`: lista explícita de endpoints públicos.
- `tests/`: pruebas de negocio y de integración con seis procesos reales.
- `infra/aws/`: CloudFormation y guía para desplegar en EC2.
- `docs/`: arquitectura, decisiones, API, requisitos y guía de sustentación.
- `ENTREGA.txt`: enlace del repositorio, docente e integrantes.

```sh
npm run check
npm test
```

GitHub Actions ejecuta estas verificaciones y además construye y arranca los contenedores. Consultar [arquitectura](docs/ARQUITECTURA.md), [API](docs/API.md), [sustentación](docs/SUSTENTACION.md) y [despliegue AWS](infra/aws/README.md).

## Alcance

Versión académica funcional de una sola instancia. No implementa inventario, pasarela bancaria, correo real, administración de productos ni alta disponibilidad. La bandeja de notificaciones está dentro de la aplicación. El flujo recupera fallos mediante reintentos idempotentes; no implementa una transacción distribuida ni un broker. Para producción se requieren HTTPS, gestión centralizada de secretos, limitación distribuida de solicitudes, base administrada y automatización de recuperación, según las decisiones documentadas.
