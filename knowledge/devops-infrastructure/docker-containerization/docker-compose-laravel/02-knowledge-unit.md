# Docker Compose for Laravel

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Docker & Containerization
- **Knowledge Unit:** Docker Compose for Laravel
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Docker Compose orchestrates multi-container Laravel environments by defining services (PHP-FPM, Nginx, MySQL, Redis) in a `compose.yaml` file. It's used primarily for development and small-scale production deployments where Kubernetes is unnecessary, providing environment parity across development machines.

---

## Core Concepts

- **Service** — A container definition (PHP-FPM, Nginx, MySQL, Redis)
- **Volume** — Persistent data storage that survives container restarts
- **Network** — Isolated communication channel between services
- **Health Check** — Service dependency ordering via health status verification
- **Override File** — `compose.override.yaml` for local development customizations

---

## Mental Models

- **Environment as Code** — Your entire development environment is defined in a YAML file. Any developer can run `docker compose up` and have an identical environment.
- **Service Topology** — Each service in `compose.yaml` represents a production-like service. The topology mirrors your production architecture even in development.
- **Ephemeral by Design** — Containers are disposable. Data persistence requires explicit volumes (database, storage) while application code changes require rebuild or bind mounts.

---

## Internal Mechanics

When `docker compose up` is executed, Docker Compose reads the `compose.yaml` file, creates the defined networks, pulls or builds the service images, creates volumes, and starts containers in dependency order. Health checks verify that each service is ready before dependent services start. Named volumes persist data across container restarts. Bind mounts map local development directories into containers for live code reloading. Compose V2 (`docker compose`) is the current standard, replacing the deprecated V1 (`docker-compose`).

---

## Patterns

- **Health Check Dependency** — Add `healthcheck` directives to each service for proper startup ordering; use `depends_on` with condition to wait for healthy status
- **Named Volumes** — Use named volumes for persistent data and bind mounts for development code to enable live reloading
- **Network Isolation** — Use dedicated networks for different service groups (web-facing vs. internal) to control service communication
- **Environment-Specific Overrides** — Use `compose.override.yaml` for local overrides without modifying the base configuration committed to the repository

---

## Architectural Decisions

- **Docker Compose vs. Laravel Sail** — Use Sail for new Laravel projects (it wraps Compose); use custom Compose when you need specific service configurations not supported by Sail
- **Compose vs. Kubernetes** — Use Compose for local development and small production deployments (< 3 servers); use Kubernetes when orchestration, scaling, and self-healing are required
- **Docker vs. Native Development** — Use Docker Compose when team environment consistency is critical; use native PHP when Docker is not available or adds unacceptable overhead

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Consistent development environments | Docker performance overhead on macOS/Windows | File system performance is slower than native |
| Production-like service topology | Configuration complexity for multi-service setups | Debugging network issues between containers is time-consuming |
| Easy onboarding for new developers | All developers need Docker installed | Docker Desktop licensing may affect commercial teams |
| Version-controlled environment definition | Not suitable for large-scale production | Lacks orchestration, scaling, and self-healing capabilities |

---

## Performance Considerations

Bind mounts on macOS/Windows have significantly slower file system performance than native. Use dedicated volumes for vendor and node_modules directories. Configure memory and CPU limits per service in `compose.yaml` to prevent resource contention. Health check polling adds overhead — set appropriate intervals (10-30s) and timeouts. Network driver selection (`bridge` vs. `host`) affects throughput.

---

## Production Considerations

Never use Docker Compose for production without health checks and restart policies. Configure `restart: unless-stopped` on all services. Use `.env` files for environment-specific variables. Set resource limits to prevent one service from starving others. Implement logging drivers for centralized log collection. Rotate container logs to prevent disk exhaustion. Use non-root users inside containers for security.

---

## Common Mistakes

- **No Health Check Dependency** — Services start without waiting for dependencies. Application crashes because the database isn't ready yet.
- **Root Container Processes** — Running PHP-FPM as root inside the container creates container escape risk. Use non-root user configuration.
- **Ignoring Compose V2** — Using `docker-compose` (V1) instead of `docker compose` (V2). V1 is deprecated and lacks features.
- **Excessive Port Exposure** — Publishing all service ports to the host instead of using internal networking. Only expose Nginx/application ports externally.

---

## Failure Modes

- **Startup Order Race** — Application starts before database is ready despite `depends_on`. Detection: application returns database connection errors on first request. Mitigation: implement health check conditions or application-level retry logic.
- **Volume Permission Mismatch** — Container user IDs don't match host file permissions. Detection: permission denied errors when writing to mounted volumes. Mitigation: use named volumes for persistent data, configure user ID mapping.
- **Resource Exhaustion** — Containers consume all available host resources. Detection: host becomes unresponsive, containers killed by OOM. Mitigation: configure resource limits per service.
- **Compose Version Drift** — Developers run different Docker Compose versions. Detection: some developers can't start the environment. Mitigation: document minimum Docker Compose version, lock Compose V2.

---

## Ecosystem Usage

Laravel Sail is the official Docker Compose-based development environment, providing a pre-configured `compose.yaml` for PHP, MySQL, Redis, and other services. Sail wraps Docker Compose with a convenient CLI (`sail up`, `sail artisan`, `sail test`). Custom Docker Compose setups are used when Sail doesn't meet specific needs (additional services, custom PHP extensions). The `compose.yaml` structure in Sail is a good reference for custom configurations.

---

## Related Knowledge Units

### Prerequisites
- Docker fundamentals

### Related Topics
- Production Dockerfiles
- Laravel Sail
- Multi-Stage Builds

### Advanced Follow-up Topics
- Docker Swarm
- Kubernetes
- Container Orchestration

---

## Research Notes

Docker Compose is the standard for local Laravel development with Docker. Use named volumes for data persistence and bind mounts for development code. Health check dependencies prevent startup race conditions. Compose V2 (`docker compose`) is the current standard. Environment-specific override files allow local customization without modifying shared configuration.
