# Guía de entrega y sustentación

1. Mostrar carpetas y explicar las cinco capacidades de negocio.
2. Ejecutar `npm test`: incluye registro, aislamiento, precios confiables, duplicados y fallos parciales.
3. Iniciar `docker compose up --build -d --wait` y mostrar seis contenedores con `docker compose ps`.
4. Abrir la web, crear un usuario ficticio, filtrar productos y comprar dos cafés. Total: $9.000 COP.
5. Mostrar el pedido y la notificación. Explicar que pagos y avisos se persistieron en servicios diferentes.
6. Iniciar sesión con otro usuario y demostrar que no ve el historial anterior.
7. Mostrar `services/orders/application.mjs`: inyección de puertos, estados e idempotencia.
8. Mostrar volúmenes con `docker volume ls` y reiniciar los contenedores para demostrar persistencia.
9. Mostrar CloudFormation, controles de red y los pasos de despliegue; diferenciar infraestructura preparada de despliegue realmente ejecutado.
10. Explicar las limitaciones: instancia única, pagos simulados, avisos dentro de la app, sin inventario y recuperación por replay.

## Checklist académico

- [x] Cinco microservicios de negocio independientes.
- [x] Frontend web y backend funcionales.
- [x] Cinco bases SQL persistentes y aisladas.
- [x] Dockerfile, Compose, healthchecks, usuario no root.
- [x] Código por capas, patrones documentados, pruebas y CI.
- [x] Plantilla y procedimiento AWS.
- [x] Integrante registrada en ENTREGA.txt: Maria Celeste Dussan.
- [ ] Confirmar aceptación de la invitación del docente en GitHub.
- [ ] Ejecutar y verificar despliegue en la cuenta AWS de la clase.

El enunciado no adjunta rúbrica ni lista exacta de temas de la materia. La documentación cubre los patrones presentes en el código; contrastar esta matriz con la rúbrica antes de entregar.
