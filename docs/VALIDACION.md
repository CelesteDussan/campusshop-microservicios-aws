# Evidencia de validación

Fecha: **5 de octubre de 2026**. Entorno: Windows, Node.js v24.13.1 y Docker Desktop con contenedores Linux.

## Comprobado en esta revisión

- `npm run check`: sintaxis JavaScript verificada.
- `npm test`: **8 pruebas aprobadas, 0 fallidas**. Incluyen cinco procesos de negocio y gateway, HTTP real, registro/login, aislamiento de historial, precios del servidor, idempotencia, fallos de pago/aviso y checkout sin `crypto.randomUUID`.
- `docker compose config --quiet`: configuración válida.
- `docker compose up --build -d --wait`: construcción correcta y **seis contenedores saludables**.
- Compra por API a través del gateway Docker: dos cafés por **9000 COP**, pedido `paid` y aviso `delivered`.
- Repetición del mismo pedido con la misma clave: mismo `orderId`, sin duplicar la compra.
- Reinicio de los seis contenedores: login válido y un pedido, un pago y un aviso conservados.

La ejecución Docker usó el proyecto aislado `campusshop-revision-20261005`, puerto 18080, cinco volúmenes de prueba y secretos temporales distintos. No modificó los datos de desarrollo. Los contenedores de revisión se detienen al terminar.

## Corrección funcional asociada

El checkout generaba su clave con `crypto.randomUUID()` fuera del bloque de manejo de errores. Esa API exige un contexto seguro y podía bloquear la compra al abrir la demostración HTTP por IP de EC2. Se usa ahora una clave aleatoria de 128 bits mediante `crypto.getRandomValues`, dentro del `try`, conservando la clave durante un reintento. La prueba del frontend ejecuta el controlador sin `randomUUID`, simula un fallo y comprueba que el segundo intento reutilice la clave y el botón se reactive.

Referencias: [randomUUID y contexto seguro](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID), [getRandomValues](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues). La compatibilidad HTTP para la demostración no sustituye HTTPS para credenciales reales.

## Límites de la evidencia

- La prueba del frontend usa un DOM simulado; no equivale a una nueva revisión visual en navegador. La revisión visual registrada el 30/09 comprobó catálogo y carrito.
- AWS: plantilla y procedimiento preparados; **no desplegados ni verificados en una cuenta AWS en esta revisión**.
- GitHub Actions: el workflow está configurado para cada push. Consultar la ejecución del commit entregado; los resultados locales no prueban el estado remoto de CI.
- Invitación: enviada anteriormente al docente; no se volvió a confirmar su aceptación.

Ver [guía de evaluación](EVALUACION.md) y [sustentación](SUSTENTACION.md).
