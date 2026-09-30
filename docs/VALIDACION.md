# Evidencia de validación

Fecha: 30 de septiembre de 2026.

- Node.js local: v24.13.1 en Windows.
- `npm run check`: sintaxis de todos los archivos JavaScript verificada.
- `npm test`: 7 pruebas aprobadas, 0 fallidas. Incluye integración con cinco procesos de negocio y gateway, solicitudes HTTP reales y bases temporales.
- `docker compose config --quiet`: configuración válida con secretos de validación temporales.
- Interfaz abierta en navegador: catálogo de seis productos y carrito comprobado al agregar Café del Huila por $4.500 COP.
- El motor Docker local no estaba activo. La compilación y arranque de contenedores se verifican mediante el workflow de GitHub Actions; revisar el resultado del commit que se vaya a entregar.
- AWS: plantilla preparada, no ejecutada ni validada con una cuenta AWS.

No se presentan como comprobados despliegues o invitaciones que requieren pasos externos pendientes. El estado actualizado de colaboración está en ENTREGA.txt.
