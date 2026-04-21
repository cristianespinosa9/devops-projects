# devops-projects

Portfolio de proyectos DevOps, ordenados por fases de aprendizaje.

## Estado

| Fase | Proyecto | Estado |
|------|----------|--------|
| 1.1 | Linux a fondo | 🔲 pendiente |
| 1.2 | Docker desde cero | 🔲 pendiente |
| 2.1 | CI/CD con GitHub Actions | 🔲 pendiente |
| 2.2 | Jenkins | 🔲 pendiente |
| 3.1 | Terraform + k8s | 🔲 pendiente |
| 3.2 | Terraform + cloud | 🔲 pendiente |
| 4 | Proyectos AWS | 🔲 pendiente |
| 5 | Capstone end-to-end | 🔲 pendiente |

## Stack del lab base

- Ubuntu VM en Hyper-V (192.168.1.193)
- k3s con Traefik, metrics-server, kube-prometheus-stack, ArgoCD
- Admin desde MacBook
- Repo de k8s base: [k8s-lab](https://github.com/cristianespinosa9/k8s-lab)

## Estructura

Cada proyecto en su propia carpeta (`fase-X-Y-nombre/`) con:
- `README.md` — qué hace, qué aprendí, qué adapté
- `POSTMORTEM.md` — reflexión al terminar
- Subcarpetas según tecnología (terraform/, k8s/, docker/, etc.)

## Repositorio de referencia

Los proyectos se inspiran en [NotHarshhaa/DevOps-Projects](https://github.com/NotHarshhaa/DevOps-Projects), adaptados para correr local y con el orden Linux-first.
