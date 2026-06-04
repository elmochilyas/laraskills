# Skill: Set Up Docker Compose for Laravel

## Purpose
Create and manage a Docker Compose configuration for Laravel development with PHP-FPM, Nginx, MySQL, Redis, and Mailpit services with proper networking, volumes, and health checks.

## When To Use
- All team-based Laravel projects needing environment consistency
- Setting up a custom Docker environment (without Sail)
- Adding custom services beyond Sail's defaults

## When NOT To Use
- Single-developer projects where local PHP suffices
- Production deployments (use Forge/Vapor/k8s)

## Prerequisites
- Docker and Docker Compose installed
- Basic understanding of Docker concepts

## Inputs
- `docker-compose.yml` — service definitions
- Dockerfile (custom PHP image, if needed)
- `.env` — environment-specific variables

## Workflow

1. **Define Base Stack:** Create `docker-compose.yml` with PHP-FPM (`laravel.test`), Nginx (`laravel.nginx`), MySQL (`mysql`), Redis (`redis`), and Mailpit (`mailpit`) services. Use appropriate Docker images with version tags.

2. **Configure Service Networking:** Use an internal Docker network for service-to-service communication by service name. `APP_URL` should point to Nginx's forwarded port.

3. **Set Up Persistent Volumes:** Use named volumes for database data (`mysql-data`), Redis data (`redis-data`), and shared application code via bind mount (`.:/var/www/html`).

4. **Map Ports:** Map container ports to host with configurable environment variables: `APP_PORT=80` (Nginx), `FORWARD_DB_PORT=3306` (MySQL), `FORWARD_REDIS_PORT=6379` (Redis).

5. **Add Health Checks:** Add `healthcheck` directives to database and Redis services. Use `depends_on` with `condition: service_healthy` to ensure dependent services wait for readiness.

6. **Set Resource Limits:** Configure `deploy.resources.limits.memory` on each service to prevent one service from starving others of memory.

7. **Use .env for Customization:** Customize via `.env` variables, not `docker-compose.yml` directly. Sail's file is regenerated on update; use env variables for port mapping, service versions, etc.

8. **Publish Sail Customization (Optional):** For Sail users needing to customize the Dockerfile, run `php artisan sail:publish` to copy Dockerfiles to `docker/` directory.

## Validation Checklist

- [ ] All services start with `docker-compose up -d`
- [ ] PHP-FPM container responds on port 9000
- [ ] Nginx serves the Laravel application
- [ ] Database accessible via service name and forwarded port
- [ ] Redis responds to ping
- [ ] Mailpit web UI accessible
- [ ] Health checks pass for all services

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Service dependency race | `depends_on` without health check; container starts but isn't ready |
| Port conflicts | Host port already in use; change `FORWARD_DB_PORT` |
| Bind mount errors | File permission issues in mounted code directory |
| Container out of memory | No resource limits; set `deploy.resources.limits.memory` |

## Decision Points

- **Use for all team-based Laravel projects** needing environment consistency
- **Docker Compose is for development only** — Production uses Forge/Vapor/k8s
- **Sail vs custom Compose:** Use Sail for standard setup; custom Compose for advanced needs

## Performance/Security Considerations

- **Bind mounts for dev:** Code changes sync instantly (vs volumes requiring rebuild)
- **Resource limits:** Set per-service memory limits to prevent one service starving others
- **Health checks:** Essential for proper startup ordering

## Related Rules

- DC-RULE-001: Customize via .env, not docker-compose.yml
- DC-RULE-002: Add services via extension
- DC-RULE-003: Use bind mounts for dev
- DC-RULE-004: Use health checks
- DC-RULE-005: Set resource limits

## Related Skills

- Configure Laravel Sail
- Configure Devcontainer for Laravel
- Customize Sail with Dockerfiles

## Success Criteria

- All services start and are healthy
- Laravel application accessible from browser
- Database data persists across restarts
- Team members have identical environments
