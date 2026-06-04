# 04-Standardized Knowledge: Laravel Sail

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | development-environments |
| **Knowledge Unit** | laravel-sail |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | docker-compose-for-laravel, sail-customization-dockerfiles, devcontainer-configuration |
| **Framework/Language** | Laravel Sail, Docker, Docker Compose, PHP |

## Overview

Laravel Sail is a lightweight CLI for interacting with Laravel's default Docker Compose dev environment. Pre-configured `docker-compose.yml` with: PHP 8.x (PHP-FPM), MySQL/PostgreSQL, Redis, Meilisearch, Mailpit, Selenium, MinIO, Node.js. Wraps Docker Compose commands in `./vendor/bin/sail` script. Supports PHP version switching, service selection, and Dockerfile customization via publishing.

## Core Concepts

- **sail Command**: `./vendor/bin/sail` wraps Docker Compose; `sail up` starts env, `sail artisan` runs Artisan in container
- **sailrc**: shell alias (`alias sail='[ -f sail ] && bash sail || bash vendor/bin/sail'`) for convenient usage
- **Service Containers**: laravel.test (PHP-FPM), mysql, pgsql, redis, meilisearch, mailpit, selenium, minio
- **PHP Version Selection**: controlled by `PHP_VERSION` in `.env` (8.0-8.4)
- **Environment Configuration**: `.env` variables: APP_PORT, FORWARD_DB_PORT, SAIL_XDEBUG_MODE
- **Sail Publish**: `php artisan sail:publish` copies Docker config to project for customization
- **Devcontainer Generation**: `sail:install --devcontainer` creates VS Code Devcontainer config

## When to Use

- All new Laravel projects for team environment consistency
- Cross-platform teams (Windows, macOS, Linux) needing identical setups
- Projects wanting production-like local environment (Nginx + PHP-FPM + MySQL + Redis)

## When NOT to Use

- Simple projects better served by native PHP
- Windows without WSL2 (Sail requires Docker with Linux containers)
- Production (development only)
- Teams where Docker overhead outweighs consistency benefits

## Best Practices (WHY)

- **Use sail alias**: `alias sail='bash vendor/bin/sail'` for convenient command execution
- **Don't modify docker-compose.yml directly**: Sail regenerates it; customize via .env or sail:publish
- **Match PHP version to production**: avoids version-dependent bugs
- **Rebuild after Dockerfile changes**: `sail build --no-cache` — old image persists without rebuild
- **Run migrations after start**: `sail artisan migrate` — database starts empty
- **Use selective services**: install only needed services via `--with=mysql,redis`

## Architecture Guidelines

- Default: Nginx (via laravel.test) + MySQL + Redis
- Add optional services as needed (meilisearch, selenium, minio)
- File synchronization via bind mount (.:/var/www/html)
- Service communication via Docker network using service hostnames

## Performance Considerations

- Startup: 1-5min initial, 15-45s subsequent
- macOS filesystem: bind mounts have slower I/O (Sail uses :cached)
- RAM: 3-5GB full stack
- PHP-FPM in Docker: ~5% overhead vs native

## Security Considerations

- Development only — exposes ports, debug tools, no security hardening
- Forge compatibility: Sail setup mirrors Forge's production architecture
- Don't expose Sail ports to public internet

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|-----------------|
| Modifying docker-compose.yml | Overwritten on Sail update | Lost customizations | Use .env or sail:publish |
| No sail alias | Typing full path each time | Inconvenient | Set up alias |
| Not rebuilding after changes | Extension changes don't apply | Features missing | Run sail build --no-cache |
| Forgetting migrations | Empty database | No data | Run migrate after up |
| PHP version mismatch | Dev vs prod different versions | Feature incompatibility | Match production version |

## Anti-Patterns

- **Sail in production**: development tool; use Forge/Vapor for production
- **Full Sail for simple projects**: overhead exceeds benefit for solo/simple projects

## Examples

```bash
# Start Sail in background
./vendor/bin/sail up -d

# Run Artisan command
sail artisan migrate

# Switch PHP version (in .env)
PHP_VERSION=8.3

# Customize PHP image
php artisan sail:publish
# Edit docker/8.3/Dockerfile
sail build --no-cache
```

## Related Topics

- docker-compose-for-laravel — underlying Docker Compose
- sail-customization-dockerfiles — publishing/customizing Dockerfiles
- devcontainer-configuration — VS Code devcontainer setup

## AI Agent Notes

- Scaffold new Laravel projects with Sail by default
- Set `sail` alias in project setup documentation

## Verification

- [ ] Sail installed and running
- [ ] sail alias configured
- [ ] PHP version matches production
- [ ] Required services selected
- [ ] Migrations run after startup
- [ ] docker-compose.yml unmodified (customized via .env)
