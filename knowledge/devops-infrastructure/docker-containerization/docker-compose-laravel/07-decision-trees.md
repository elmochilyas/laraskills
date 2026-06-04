# Decision Trees: Docker Compose Laravel

## Use Case

**Purpose of environment:**
- Local development → Docker Compose with bind mounts for hot reload
- CI/CD testing → Docker Compose with service containers
- Small production → Docker Compose with restart policies, no Kubernetes

## Service Separation

**Need separate Nginx container?**
- Yes (want to use different Nginx image) → Nginx + PHP-FPM containers
- No (simpler deployment) → Use FrankenPHP (Caddy embedded) or PHP artisan serve
