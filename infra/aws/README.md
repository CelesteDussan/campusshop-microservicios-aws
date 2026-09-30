# Desplegar CampusShop en AWS

La plantilla crea **infraestructura**, no publica automáticamente la aplicación. No se ha ejecutado en una cuenta AWS. Usa EC2 Amazon Linux 2023 x86_64, t3.small, EBS gp3 cifrado de 20 GiB y acceso limitado a tu IP. EC2, IPv4 pública y EBS pueden generar cargos; consultar la calculadora de AWS según región y tiempo de uso. No se presupone elegibilidad para capa gratuita.

## 1. Preparar red y acceso

En la consola AWS selecciona una región, una VPC y una subred pública de esa VPC con ruta hacia un Internet Gateway. Crea o selecciona un par de claves EC2 y conserva el archivo privado fuera del repositorio. Identifica tu IPv4 pública para `AllowedCidr`, por ejemplo `203.0.113.5/32` (solo un ejemplo, reemplazar).

En CloudFormation → Crear pila → Cargar plantilla, usa `infra/aws/ec2.yaml`. Completa VpcId, SubnetId, KeyName y AllowedCidr. Revisa los recursos y crea la pila. Espera CREATE_COMPLETE. En Outputs aparecerán PublicIp, WebUrl e InstanceId. Cambios de IP requieren actualizar AllowedCidr. No se adjunta ningún rol IAM a la instancia porque la aplicación no necesita llamadas a AWS.

## 2. Instalar Compose y copiar proyecto

Conectar con SSH, sustituyendo el archivo y la IP:

```sh
ssh -i /ruta/clave.pem ec2-user@IP_PUBLICA
sudo tail -n 30 /var/log/cloud-init-output.log
docker --version
```

Esperar a que cloud-init termine. Cerrar sesión y reconectar si aún no se aplicó el grupo docker. Instalar Compose desde la distribución oficial de Docker, con versión explícita; verificar el checksum antes de ejecutar:

```sh
COMPOSE_VERSION=v2.39.4
mkdir -p "$HOME/.docker/cli-plugins"
cd /tmp
curl -fLO "https://github.com/docker/compose/releases/download/$COMPOSE_VERSION/docker-compose-linux-x86_64"
curl -fLO "https://github.com/docker/compose/releases/download/$COMPOSE_VERSION/docker-compose-linux-x86_64.sha256"
sha256sum -c docker-compose-linux-x86_64.sha256
install -m 755 docker-compose-linux-x86_64 "$HOME/.docker/cli-plugins/docker-compose"
docker compose version
cd "$HOME"
```

Copiar la carpeta del proyecto a la instancia mediante SCP, o clonar el repositorio usando su URL en `ENTREGA.txt`. Para un repositorio privado, usar autenticación GitHub con acceso limitado; no incrustar tokens en URLs ni archivos. Alternativa desde la computadora local:

```sh
scp -i /ruta/clave.pem -r campusshop ec2-user@IP_PUBLICA:~/campusshop
```

Excluir `.git`, `.env` local y `data` local antes de copiar, o usar un ZIP creado desde `git archive`. No migrar información personal de prueba.

## 3. Configurar secretos e iniciar

Dentro de la instancia:

```sh
cd ~/campusshop
umask 077
printf 'TOKEN_SECRET=%s\nINTERNAL_SECRET=%s\nWEB_PORT=8080\n' "$(openssl rand -hex 32)" "$(openssl rand -hex 32)" > .env
docker compose config --quiet
docker compose up --build -d --wait
docker compose ps
curl --fail http://localhost:8080/api/catalog/products
```

Abrir WebUrl desde la IP permitida. Crear usuario ficticio, comprar dos cafés, revisar pedido y notificación, reiniciar con `docker compose restart` y verificar que el historial persiste. El servicio Docker y las políticas `unless-stopped` permiten reiniciar tras un reboot del host. Cambiar a HTTPS antes de usar credenciales reales: incorporar un dominio, certificado y proxy TLS o un ALB. La configuración actual es una demostración restringida, no una publicación de producción.

## 4. Operación, respaldo y cierre

Diagnóstico: `docker compose logs --tail=100`, `docker compose ps`, `df -h`. Los logs rotan a 3 archivos de 10 MiB por contenedor. Detener la aplicación antes de una copia consistente de los cinco volúmenes o de un snapshot EBS, y volver a iniciarla después. Guardar también `.env` mediante un canal seguro: al perder secretos cambian las sesiones y la autenticación interna.

Al finalizar la evaluación, detener la instancia y luego eliminar la pila cuando corresponda. El volumen EBS raíz tiene `DeleteOnTermination: false`: queda disponible para recuperación y **debe eliminarse por separado cuando ya no se necesite**. Revisar asimismo snapshots y recursos fuera de la pila. Una IPv4 asignada automáticamente puede cambiar después de detener e iniciar EC2; actualizar la URL de entrega.

## Fuentes

- Instalación de Docker en EC2: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/create-container-image.html
- Compose manual: https://docs.docker.com/compose/install/linux/
- Plantillas EC2: https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-ec2-instance.html
- Costos: https://calculator.aws/
