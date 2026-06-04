# 04-Standardized Knowledge: Docker Compose for Laravel

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | development-environments |
| **Knowledge Unit** | docker-compose-for-laravel |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | laravel-sail, devcontainer-configuration, sail-customization-dockerfiles |
| **Framework/Language** | Docker Compose, Laravel, PHP, MySQL, Redis, Nginx |

## Overview

Docker Compose is the foundation of containerized Laravel development, defining the multi-service stack (PHP-FPM, Nginx, MySQL, Redis, Mailpit) in `docker-compose.yml`. Each service in its own container with image, ports, volumes, env vars, dependencies. Sail generates standard `docker-compose.yml` but custom configs can add/modify services. Manages orchestration, networking, volumes, env vars, health checks.

## Core Concepts

- **Services**: individual containers (laravel.test, mysql, redis, mailpit) with image, ports, volumes, env
- **Volumes**: persistent data storage (mysql-data), shared app code (.:/var/www/html), config files
- **Network**: internal Docker network for service-to-service communication by service name
- **Port Mapping**: container ports mapped to host (APP_PORT=80, FORWARD_DB_PORT=3306)
- **Health Checks**: Docker checks ensuring service readiness before dependent services start
- **depends_on**: ensures service start order (database before Laravel app)

## When to Use

- All team-based Laravel projects needing environment consistency
- Projects requiring multiple services (DB, cache, mail, search)
- Development environments that mirror production architecture

## When NOT to Use

- Production deployments (Docker Compose is for development)
- Simple projects where a single PHP server suffices
- Serverless deployments (Vapor) where local dev doesn't match prod architecture

## Best Practices (WHY)

- **Customize via .env, not docker-compose.yml**: Sail's file is regenerated on update; use env variables
- **Add services via extension**: new services go in docker-compose.yml alongside Sail's defaults
- **Use bind mounts for dev**: code changes sync instantly (vs volumes which require rebuild)
- **Use health checks**: `depends_on` only waits for container start, not readiness
- **Set resource limits**: `deploy.resources.limits.memory` prevents one service starving others
- **Don't modify Sail's file directly**: use `sail:publish` to customize Dockerfile

## Architecture Guidelines

- Sail's Nginx + PHP-FPM + MySQL + Redis for standard setup
- Add optional services via profiles (selenium, mailpit)
- Use Docker Compose v2 (`docker compose`, not `docker-compose`)
- Env variable substitution in compose file for customization

## Performance Considerations

- macOS bind mount: 5-10x slower I/O (use :cached or :delegated)
- Service startup: 15-45s full stack; 2-5s individual restarts
- RAM: 2-4GB full Sail stack
- Image sizes: PHP ~500MB, DB ~200-500MB each

## Security Considerations

- Development only — relaxed security (no read-only root fs, capabilities)
- Port 3306 exposed — don't run on cloud VMs without firewall
- Volume permissions on Linux may cause UID mismatches

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|-----------------|
| Modifying Sail's docker-compose.yml | Overwritten on update | Customizations lost | Use .env or sail:publish |
| Exposing DB port to public | 3306 accessible from internet | Security risk | Firewall or only expose locally |
| Not rebuilding after changes | Dockerfile updated but old image used | Changes don't apply | Run sail build --no-cache |
| Version mismatch dev/prod | MySQL 8.0 dev, 5.7 prod | SQL behavior differences | Match versions |

## Anti-Patterns

- **Production Compose file**: Docker Compose for development only; production uses Forge/Vapor/k8s
- **Single-container everything**: defeats purpose of service isolation

## Examples

```yaml
# docker-compose.yml service with resource limits
services:
  mysql:
    image: 'mysql/mysql-server:8.0'
    ports:
      - '${FORWARD_DB_PORT:-3306}:3306'
    volumes:
      - 'sail-mysql:/var/lib/mysql'
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-p${DB_PASSWORD}"]
```

## Related Topics

- laravel-sail — Sail's Docker Compose integration
- devcontainer-configuration — VS Code dev container setup
- sail-customization-dockerfiles — customizing PHP Dockerfile

## AI Agent Notes

- Use `sail:install` as the canonical way to generate Docker Compose config
- Add comments in compose file explaining port overrides

## Verification

- [ ] docker-compose.yml committed
- [ ] Services defined with health checks
- [ ] Env variable substitution used (${VAR:-default})
- [ ] Port mappings configured
- [ ] Volumes for persistent data
- [ ] Resource limits set
- [ ] Compose v2 used
