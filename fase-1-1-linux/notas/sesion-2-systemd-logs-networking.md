# Sesión 2 — systemd, logs, networking

## systemd

- systemd es el **init moderno** de Linux. PID 1. Arranca todo lo demás.
- Gestiona **services, sockets, timers, mounts, targets**.
- Los units son archivos declarativos (similar a YAMLs de K8s, pero a nivel nodo).

### Comandos clave

| Comando | Uso |
|---------|-----|
| `systemctl status X` | Estado + últimas líneas de log |
| `systemctl start/stop X` | Arrancar/detener ahora |
| `systemctl enable/disable X` | Auto-arranque en boot |
| `systemctl restart X` | Stop + start |
| `systemctl reload X` | Recargar config sin bajar (si el servicio lo soporta) |
| `systemctl daemon-reload` | Recargar tras editar un unit |
| `systemctl list-units --failed` | Unidades caídas |
| `systemctl list-timers` | Ver timers activos |
| `systemctl cat X` | Mostrar el unit file |

### Anatomía de un `.service`

```ini
[Unit]
Description=...
After=network.target

[Service]
Type=simple                  # simple, forking, oneshot, notify
ExecStart=/path/al/binario
Restart=on-failure
RestartSec=5
User=nobody
StandardOutput=journal

[Install]
WantedBy=multi-user.target
```

### Timers vs cron

- `OnCalendar=*:*:00` → cada minuto.
- `Persistent=true` → si se perdió la ejecución, recupera al bootear.
- **Ventajas**: logs unificados, dependencias, gestión con systemctl.

### Conexión con K8s

- `Restart=on-failure` es conceptualmente `restartPolicy: OnFailure`.
- Un unit es análogo a un Pod/Deployment (declaras cómo correr algo).
- El kubelet hace con pods lo que systemd hace con services, pero a nivel cluster.

---

## Logs (journalctl + /var/log)

### journalctl

- Log **estructurado** (campos: `_PID`, `_UID`, `_SYSTEMD_UNIT`, `PRIORITY`, etc.).
- Persistente si `/var/log/journal` existe y tiene contenido.

### Flags clave

| Flag | Qué hace |
|------|----------|
| `-u X` | Logs del unit X |
| `-b` | Boot actual |
| `-b -1` | Boot anterior |
| `--list-boots` | Lista de boots |
| `-f` | Follow (como tail -f) |
| `-n 50` | Últimas 50 entradas |
| `--since "10 min ago"` | Por tiempo |
| `--until "2026-04-21 09:00"` | Hasta fecha |
| `-p err` | Severidad mínima (0 emerg … 7 debug) |
| `-k` | Solo kernel (equivale a dmesg) |
| `-o verbose` | Ver todos los campos |

### Mantenimiento

```bash
sudo journalctl --vacuum-time=2d
sudo journalctl --vacuum-size=200M
```

Config: `/etc/systemd/journald.conf` (ej: `SystemMaxUse=500M`).

### Archivos viejos en /var/log

- `/var/log/auth.log` → logins, sudo, ssh.
- `/var/log/syslog` → general.
- `/var/log/kern.log` → kernel (alternativa a `journalctl -k`).
- `/var/log/pods/` → logs de containers de k3s en este nodo.

### logrotate

Rota, comprime y borra archivos antiguos. Config en `/etc/logrotate.d/`. Corre diario via cron/timer.

### Conexión con K8s

- `kubectl logs <pod>` pide al kubelet los logs → los lee de `/var/log/pods/`.
- Para logging cluster-wide: stack **Loki + Promtail** o ELK.

---

## Networking

### Interfaces y rutas

```bash
ip addr          # IPs e interfaces
ip link show     # solo interfaces
ip route         # tabla de rutas
ip route get X.X.X.X   # por dónde saldría el tráfico a X
```

Interfaces comunes en un nodo k8s:
- `lo` (loopback)
- `eth0` (red física/VM)
- `flannel.1`, `cni0` (red de pods)
- `veth*` (virtual ethernet del lado host de cada pod)

### Sockets con `ss`

```bash
sudo ss -tlnp    # TCP listening con proceso
sudo ss -ulnp    # UDP listening
sudo ss -tn state established   # conexiones activas
```

Flags: `-t` TCP, `-u` UDP, `-l` listening, `-n` sin resolver nombres, `-p` proceso.

### DNS

- Resolución: `/etc/hosts` → servidores en `/etc/resolv.conf`.
- systemd-resolved: `resolvectl status`.
- Pruebas: `dig google.com +short`, `nslookup`, `getent hosts`.

### Firewall

- **ufw** (capa fácil sobre iptables): `sudo ufw status`.
- **iptables** bajo: `sudo iptables -L -n -v`.
- En nodos K8s, iptables tiene miles de reglas gestionadas por `kube-proxy` y el CNI. No tocarlas a mano.

### Pruebas de conectividad

```bash
nc -zv host puerto      # TCP zero-I/O, rápido
curl -v https://host    # TCP + TLS + HTTP
ping host               # ICMP
```

### Conexión con K8s

- Cada pod = network namespace propio.
- CNI (flannel/calico/cilium) conecta pod → `cni0` → red del nodo.
- Cada pod tiene su `/etc/resolv.conf` apuntando a **CoreDNS** (10.43.0.10 en k3s).
- Servicios K8s resuelven como `<svc>.<ns>.svc.cluster.local`.

---

## Metodología "peel the onion" para debug

Cuando algo falla en red, ir capa por capa:

1. ¿El DNS resuelve? (`getent hosts`, `dig`)
2. ¿Hay TCP connectivity? (`nc -zv`)
3. ¿El servicio escucha? (`ss -tlnp`)
4. ¿El firewall deja pasar? (`iptables -L`, `ufw status`)
5. ¿La app responde? (`curl -v`)

Cada paso aísla una capa. 95% de incidentes de red se resuelven con esta secuencia.

## Reglas que me llevo

1. **`systemctl status X` antes que nada** — te ahorra 10 minutos de búsqueda en logs.
2. **Journal es estructurado** — usa `-u`, `-p`, `--since` en lugar de `grep`.
3. **`ss -tlnp` reemplaza a `netstat`** y es más rápido.
4. **`ip route get`** revela por dónde sale el tráfico a un destino.
5. **Un `.service` es a un nodo lo que un Pod es al cluster**.
