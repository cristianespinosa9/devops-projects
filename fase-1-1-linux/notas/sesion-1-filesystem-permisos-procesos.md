# Sesión 1 — Filesystem, permisos, users, procesos

## Filesystem

- Linux sigue el estándar **FHS**. Cada carpeta tiene un rol claro.
- `/etc` = configuración, `/var/log` = logs, `/proc` = info del kernel/procesos en vivo, `/home` = usuarios humanos.
- "Todo es un archivo": la CPU, RAM y dispositivos aparecen como archivos en `/proc`, `/sys`, `/dev`.
- Comandos de exploración: `df -h`, `du -sh *`, `free -h`, `uname -a`, `nproc`.

### Tips útiles

- `sudo du -sh /var/log/* | sort -h | tail -10` — encuentra los logs más grandes.
- Linux usa RAM libre como caché. La métrica útil es `available`, no `free`.
- Swap desactivado en nodos de K8s (requisito del kubelet por defecto).

## Permisos

- Formato: `rwxrwxrwx` → dueño, grupo, otros.
- Octal: `r=4, w=2, x=1`. Se suman.
- Valores típicos: `644` (archivo normal), `600` (secreto, ej: llaves SSH), `755` (binario/carpeta), `700` (carpeta privada), `777` (peligro).
- `x` en carpeta = poder "entrar" (cd). Sin `x`, no puedes ni listar aunque tengas `r`.

### Permisos especiales

- **SUID / SGID** (`s`): el binario corre con el UID/GID del dueño/grupo. Ej: `passwd` es SUID root.
- **Sticky bit** (`t`): en carpetas como `/tmp`, solo el dueño del archivo puede borrarlo, aunque todos puedan escribir.

### Comandos

- `chmod 640 archivo` — setear permisos absolutos.
- `chmod g+rw archivo` — agregar permisos al grupo (no quita nada).
- `chmod o-r archivo` — quitar lectura a "otros".
- `chown usuario:grupo archivo` — cambiar dueño y grupo.

### Lección de la práctica

`chmod g+rw` suma, no resta. Si el archivo venía con `r--` en "otros", ahí se queda. Para restringir, usar octal (`640`) es más seguro.

## Users y groups

- Linux identifica por **UID**, no por nombre. `cristian` es alias de `1000`.
- Archivos: `/etc/passwd` (usuarios), `/etc/group` (grupos), `/etc/shadow` (hashes de contraseñas, `640 root:shadow`).
- Convenciones de UIDs: 0=root, 1-999=sistema/servicios, 1000+=humanos.
- Grupo primario en `/etc/passwd`, grupos secundarios en `/etc/group`.

### Comandos

- `useradd -m -s /bin/bash usuario` — crear usuario con home y shell.
- `passwd usuario` — ponerle contraseña.
- `usermod -aG grupo usuario` — agregar a grupo secundario (**nunca olvidar el `-a`**).
- `id usuario`, `groups usuario` — ver pertenencia.
- `sudo su - usuario` — cambiar al usuario con su environment.

## Conexión con Kubernetes

- Los pods corren con un UID específico. Por defecto, muchas imágenes corren como root (UID 0) — inseguro.
- Buena práctica: `securityContext.runAsUser: 1000` + `runAsNonRoot: true`.
- **Problema clásico**: volumen montado con `root:root 700` en un pod con UID 1000 → no puede leer/escribir.
- **Soluciones**: `fsGroup`, `initContainer` con chown, o arreglar permisos en host.

## Procesos y señales

- Cada proceso tiene PID, PPID, UID/GID, cwd, environment, fd abiertos.
- **PID 1** es especial (systemd en host, la app en un container). Si muere, cae todo.
- `/proc/<PID>/` tiene info viva del proceso: `status`, `environ`, `fd/`, `cwd`.

### Señales importantes

| Señal | Número | Uso |
|-------|--------|-----|
| SIGTERM | 15 | "Termina ordenadamente". Default de `kill`. |
| SIGINT | 2 | Ctrl+C. |
| SIGHUP | 1 | Recargar config en daemons. |
| SIGKILL | 9 | Muerte inmediata, no manejable. |
| SIGSTOP/SIGCONT | 19/18 | Pausar/reanudar. |

### Conexión con K8s

Al borrar un pod, Kubernetes manda **SIGTERM** al proceso principal y espera `terminationGracePeriodSeconds` (30s default). Si no muere, manda **SIGKILL**. Por eso las apps deben capturar SIGTERM y hacer cleanup.

### Comandos

- `ps -ef`, `ps auxf`, `top`, `htop`.
- `pgrep -a sleep`, `pkill sleep`.
- `kill -9 <PID>`, `kill %1`.
- `sleep 100 &` — al background. `fg %1` — al foreground. `bg %1` — reanudar en bg.

## Reglas que me llevo

1. **Archivos con secretos siempre a 600** (kubeconfig, id_ed25519, tokens).
2. **Un proceso solo puede recibir señales de su dueño o de root** — base del aislamiento Linux que hereda Kubernetes.
3. **`/var/log/journal` domina el disco en nodos con systemd** — limitable con `/etc/systemd/journald.conf`.
4. **UIDs numéricos son lo que realmente cuenta**, no los nombres. Un UID 1000 en el host y en el pod son el mismo "usuario" para el kernel.
