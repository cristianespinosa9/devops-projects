# Sesiones 3-4 — Redes, volúmenes, compose, producción

## Redes

- 3 drivers built-in: `bridge` (default), `host`, `none`.
- Bridge default **no tiene DNS interno** — solo IPs.
- **Custom networks** sí tienen DNS por nombre — mejor siempre crear una.
- Containers pueden estar en varias redes (patrón frontend/backend).

```bash
docker network create mi-red
docker run --network mi-red --name x ...
docker exec x ping otro_container_en_mi_red  # funciona
```

## Volúmenes

- **Bind mount** (`-v /host:/container`) — host gestiona, ideal para dev.
- **Named volume** (`-v nombre:/container`) — Docker gestiona, ideal para datos.
- Los volúmenes **sobreviven al `docker rm`**, son eliminados con `docker volume rm` o `docker compose down -v`.

## docker-compose

- YAML declarativo para multi-container.
- Crea red implícita por proyecto.
- Soporta `depends_on` con `condition: service_healthy`.
- Variables vía `.env`.

```yaml
services:
  db:
    image: postgres:16-alpine
    volumes:
      - db-data:/var/lib/postgresql/data
  app:
    build: ./app
    depends_on:
      db: { condition: service_healthy }
volumes:
  db-data:
```

## Producción

### Reglas de oro de Dockerfiles

1. Versión explícita del base, nunca `:latest`.
2. Multi-stage para reducir tamaño y superficie.
3. **`USER` no-root** siempre.
4. `npm ci` (no `install`) en builds reproducibles.
5. Healthcheck declarado.
6. `.dockerignore` riguroso.
7. Nunca secrets en build-time.

### Tagging

- Mal: `latest`, `dev`, `prod`.
- Bien: versión semántica + sha del commit (`1.0.0-a1b2c3d`).

### Escaneo

```bash
trivy image --severity HIGH,CRITICAL imagen:tag
```

### Push a Docker Hub

```bash
docker login
docker tag local:1.0.0 user/repo:1.0.0
docker push user/repo:1.0.0
```

### Integración con K8s

- Ya construida tu imagen y pusheada → la usas en `image:` de un Deployment.
- La conexión es directa: el container que vimos en `docker run` es básicamente un pod sin orquestación.
- K8s agrega: scheduling multi-nodo, replicas, services, probes, secrets, etc., pero el "ladrillo" sigue siendo la imagen Docker.

## Reglas que me llevo

1. **Siempre custom network** para containers que necesitan hablar entre sí (DNS interno).
2. **Volumes nombrados** para datos persistentes; bind mounts solo para dev.
3. **Compose** elimina los `docker run` largos y declara stacks completos.
4. **Multi-stage + USER no-root + healthcheck** es el mínimo de producción.
5. **Trivy + tag con SHA** son condiciones para CI/CD serio.
6. La cadena: **código → Dockerfile → build → registry → manifest K8s → cluster**.
