# Sesión 1 — Instalación, conceptos, comandos esenciales

## Conceptos núcleo

| Término | Qué es |
|---------|--------|
| **Imagen** | Archivo inerte: filesystem + metadata. Inmutable. |
| **Container** | Instancia en ejecución de una imagen, con capa de escritura propia. |
| **Registry** | Repositorio remoto de imágenes (Docker Hub, GHCR, ECR). |
| **Layer** | Cada instrucción de un Dockerfile crea una capa cacheable. |

## Conexión con Kubernetes

- `image:` de un Deployment → imagen Docker.
- Pod corriendo → container ejecutándose.
- `kubectl logs` ↔ `docker logs`.
- `kubectl exec` ↔ `docker exec`.
- k3s usa `containerd` por debajo, no Docker Engine, pero el formato OCI es el mismo.

## Instalación en Ubuntu

Repo oficial de Docker (no el de Ubuntu):

```bash
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list
sudo apt update && sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER  # re-login para aplicar
```

> **Seguridad**: el grupo `docker` ≈ root. En servidores compartidos, evaluar bien.

## Comandos esenciales

### Ciclo de vida

```bash
docker run -d -p 8080:80 --name web nginx:1.27-alpine
docker ps / docker ps -a
docker logs [-f] web
docker exec -it web sh
docker stop / start / restart web
docker rm web      # borra container y su capa de escritura
docker rmi imagen  # borra imagen
```

### Flags clave de `run`

- `-d` detached
- `-p HOST:CONTAINER` mapeo de puerto
- `--name` nombre legible
- `-e KEY=value` variable de entorno
- `-v HOST:CONTAINER` volumen (sesión 3)
- `--rm` autoborrar al salir
- `-it` interactive + TTY (para shells)
- `--restart unless-stopped` política de restart

### Inspección

```bash
docker inspect NAME -f '{{ .NetworkSettings.IPAddress }}'
docker stats NAME
docker system df    # uso de disco por containers/imágenes/volúmenes
```

### Limpieza

```bash
docker stop $(docker ps -q)
docker rm $(docker ps -aq)
docker image prune -f
docker system prune -a --volumes  # ¡drástico!
```

## Reglas que me llevo

1. **Imagen ≠ container**. Imagen es la receta, container es la instancia.
2. **Stop no borra**, `rm` sí — y al borrar pierdes la capa de escritura.
3. **`--rm`** es tu amigo para experimentos rápidos.
4. Las env vars (`-e`) son la forma estándar de configurar imágenes — patrón heredado en K8s.
5. **`docker exec -it`** y **`docker logs -f`** son los `kubectl exec` y `kubectl logs` antes de Kubernetes.
