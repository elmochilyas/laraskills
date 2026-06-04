# Knowledge Unit: Docker Compose for Laravel

## Metadata
- **Subdomain:** Development Environments
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** development-environments/docker-compose-for-laravel
- **Maturity:** Mature
- **Related Technologies:** Docker Compose, Laravel, PHP, MySQL, Redis, Nginx, Sail

## Executive Summary

Docker Compose is the foundation of containerized Laravel development environments, defining the multi-service application stack (PHP-FPM, Nginx, MySQL, Redis, Mailpit, etc.) in a `docker-compose.yml` file. Each service runs in its own container with specified image, ports, volumes, environment variables, and dependencies. Laravel Sail generates a standard docker-compose.yml with sensible defaults, but custom configurations can add or modify services for specific project needs. Docker Compose manages: service orchestration (start, stop, rebuild), network configuration (inter-service communication), volume management (persistent data), environment variable passing, and health checks. A well-configured docker-compose.yml ensures consistent development environments across the team and mirrors production architecture.

## Core Concepts

- **Services:** Individual containers (laravel.test for PHP-FPM, mysql for database, redis for cache, mailpit for email) defined with image, ports, volumes, and environment
- **Volumes:** Persistent data storage for databases (mysql-data), shared application code (.:/var/www/html), and configuration files
- **Network:** Internal Docker network for service-to-service communication; services reference each other by service name (mysql, redis, mailpit)
- **Port Mapping:** Container ports mapped to host ports (APP_PORT=80 for Nginx, FORWARD_DB_PORT=3306 for MySQL) for external access
- **Environment Variables:** .env file variables passed to containers; each service gets its relevant variables (DB_HOST=mysql for Laravel, MYSQL_ROOT_PASSWORD for MySQL)
- **Health Checks:** Docker-defined checks (e.g., mysql -h localhost) that ensure services are healthy before dependent services start
- **Service Dependencies:** depends_on configuration ensures services start in order (database starts before Laravel application)

## Mental Models

- **Docker Compose as Application Blueprint:** The compose file defines every component of the application stack and how they connect—like a blueprint for the infrastructure
- **Services as Lego Bricks:** Each service is a pre-built Lego brick (container image); Docker Compose specifies which bricks to use, how to connect them, and what configuration each needs
- **Compose File as Infrastructure-as-Code:** The docker-compose.yml is the executable specification for the development infrastructure—it defines what runs and how components interact

## Internal Mechanics

1. **Service Definition:** Each service is defined with an image (or build context for custom images), container name, port mappings, volume mounts, environment variables, and restart policy
2. **Image Building:** For services with a build context (laravel.test), Docker builds the image using the specified Dockerfile; for services with an image name (mysql:8.0), Docker pulls the image from the registry
3. **Network Creation:** Docker Compose creates a default network (project-name_default); all services join this network and can reach each other by service name
4. **Volume Mounting:** Named volumes (sail-mysql) persist across container restarts; bind mounts (.:/var/www/html) share files between host and container
5. **Dependency Resolution:** Docker Compose starts services in dependency order (depends_on), but waits only for container start, not service readiness. Health checks ensure service readiness.
6. **Teardown:** docker compose down stops and removes containers, networks, and optionally volumes (-v flag for data removal)

## Patterns

- **Sail-Based Pattern:** Use Sail's generated docker-compose.yml as the baseline; customize via Sail environment variables (SAIL_XDEBUG_MODE, APP_PORT) without modifying the file directly
- **Service Extension Pattern:** Add project-specific services (Elasticsearch, Meilisearch, MinIO, Selenium) to the docker-compose.yml alongside Sail's default services
- **Custom PHP Image Pattern:** When Sail's PHP image doesn't meet requirements, customize via sail:publish (publishes Dockerfile to docker/ directory) and modify the Dockerfile for additional PHP extensions or tools
- **Environment-Specific Compose Pattern:** Use docker-compose.yml for development (with volume mounts, debug ports, development tools) and a separate docker-compose.prod.yml for production builds
- **Resource Limiting Pattern:** Set memory and CPU limits for each service to prevent one service from starving others: deploy.resources.limits.memory: 512M
- **Health Check Pattern:** Add health checks to database services so dependent services wait for readiness: test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
- **Profiles-Based Service Pattern:** Use Docker Compose profiles to activate optional services (selenium, mailpit) only when needed: profiles: ["testing"]

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Web server | Nginx vs Apache vs Caddy | Nginx (Sail default, Laravel Forge standard); Caddy for automatic HTTPS |
| PHP runtime | PHP-FPM vs FrankenPHP vs Swoole | PHP-FPM (Sail default, most compatible); FrankenPHP for Laravel Octane |
| Database | MySQL vs PostgreSQL vs MariaDB | MySQL (Sail default); PostgreSQL for advanced features |
| Image source | Sail image vs custom Dockerfile | Sail image for standard needs; custom Dockerfile for special requirements |
| Compose version | v3.8 vs v3.9 vs v2 (new) | v2 format (Docker Compose v2) for modern features (profiles, extended options) |

## Tradeoffs

- **Bind Mount vs Volume:** Bind mounts share host files directly (real-time code changes, accessible from host) but have performance overhead on macOS/Windows. Volumes are faster (managed by Docker) but require rebuilding for code changes. Use bind mounts for development (code changes sync instantly).
- **Single Compose File vs Multiple Files:** Single docker-compose.yml is simpler but can become large. Multiple files (docker-compose.override.yml for local overrides) separate concerns but add complexity. Sail uses the single-file approach with .env-based customization.
- **Service Isolation vs Resource Sharing:** Each service in its own container provides isolation (independent lifecycle, versioning) but consumes more resources. Combining services (PHP-FPM + Nginx in one container) is less common in Docker Compose but saves resources.

## Performance Considerations

- **macOS Filesystem Performance:** Bind-mounted volumes on macOS (via osxfs) have 5-10x slower I/O than native. Use Docker's :cached or :delegated mount options to improve performance. Sail uses :cached by default.
- **Service Startup Time:** Docker Compose starts services sequentially (respecting depends_on). Full stack startup (PHP, Nginx, MySQL, Redis, Mailpit) takes 15-45 seconds. Individual service restarts take 2-5 seconds.
- **Memory Usage:** Full Sail stack uses 2-4GB RAM. MySQL and PHP-FPM are the largest consumers (512MB-1GB each). Monitor and limit per-service memory.
- **Image Size:** Pre-built images reduce startup time. Sail's PHP image is ~500MB (includes PHP extensions, Node, Composer). Database images are ~200-500MB each.

## Production Considerations

- **Development Only:** Docker Compose as configured with Sail is for development only. Production deployments use different configuration (Forge, Vapor, custom Docker with security hardening, no development tools).
- **Port Conflicts:** Default ports (80, 3306, 6379, 1025, 8025) may conflict with local services. Use Sail's environment variables (APP_PORT, FORWARD_DB_PORT) to change ports.
- **Volume Permissions:** On Linux, bind-mounted files may have permission mismatches between host user and container user. Sail handles this with the laravel.test user mapping.
- **Security Context:** Development Compose files run with relaxed security (no read-only root filesystem, no drop capabilities). Never use this configuration in production.
- **Docker Compose Version:** Use Docker Compose v2 (docker compose, not docker-compose) for all new projects. Docker Compose v1 is deprecated.

## Common Mistakes

- **Modifying Sail's docker-compose.yml directly:** Updating Sail replaces the file; customize via .env variables or publish and modify the Dockerfile instead
- **Not excluding docker-compose.yml from IP ranges:** Exposing database ports (3306) to the public interface when running Docker on a cloud VM; database credentials are accessible from the internet
- **Forgetting to rebuild after PHP extension changes:** Adding a PHP extension to the Dockerfile but running docker compose up instead of docker compose build --no-cache; the extension isn't installed
- **Inconsistent service versions between environments:** MySQL 8.0 in development, MySQL 5.7 in production; query behavior differences cause production bugs
- **Not using .env for compose variables:** Hard-coding port numbers, passwords, and paths in docker-compose.yml instead of using ${VARIABLE:-default} syntax

## Failure Modes

- **Port Conflict on Startup:** A port configured in docker-compose.yml is already in use on the host; the service fails to start. Mitigate: use Sail's FORWARD_* environment variables to change ports; check for port conflicts before starting.
- **Volume Permission Error:** The container user can't write to a bind-mounted volume (Linux permissions). Mitigate: configure user ID mapping; use named volumes.
- **OOM Killer Stops Services:** Running multiple containers exceeds available host memory. Mitigate: set per-service memory limits; allocate sufficient Docker memory.
- **Network Timeout Between Services:** Services can't reach each other (network issue, wrong hostname). Mitigate: use service names (mysql, redis) in configuration; verify network connectivity.
- **Image Pull Failure:** Docker can't pull an image (network issue, registry down, image deleted). Mitigate: cache images locally; use specific image tags (not latest).

## Ecosystem Usage

- **Laravel Sail:** Docker Compose is the foundation of Sail; every Sail project is essentially a Docker Compose setup with Laravel-optimized defaults
- **Laravel Forge:** Forge provisions production servers that mirror the Compose-defined service architecture (Nginx, PHP-FPM, MySQL, Redis)
- **Laravel Vapor:** Vapor uses serverless infrastructure (Lambada, RDS, ElastiCache) instead of Docker Compose; Compose is used for local development only
- **Laravel Package Testing:** Package developers use Docker Compose to spin up test environments with specific PHP and database versions for matrix testing
- **Laravel Devcontainers:** Devcontainer configurations reference docker-compose.yml for the service stack, adding VS Code-specific configuration on top

## Related Knowledge Units

- laravel-sail
- devcontainer-configuration
- sail-customization-dockerfiles
- database-services
- cache-queue-services

## Research Notes

- Docker Compose v2 (docker compose, not docker-compose) is now the standard and is built into Docker Desktop and Docker Engine
- Sail uses Docker Compose profiles to selectively activate services (e.g., mysql, pgsql, redis, meilisearch)
- Compose file format v3.8+ supports GPU access, extended resource limits, and improved health check capabilities
- The Sail generated docker-compose.yml uses environment variable substitution extensively, allowing customization without editing the file
