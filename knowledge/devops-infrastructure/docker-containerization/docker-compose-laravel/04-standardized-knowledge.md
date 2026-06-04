# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 04-docker-containerization
**Knowledge Unit:** docker-compose-laravel
**Difficulty:** Intermediate
**Category:** Containerization
**Last Updated:** 2026-06-03

# Overview

Docker Compose orchestrates multi-container Laravel environments by defining services (PHP-FPM, Nginx, MySQL, Redis) in a `compose.yaml` file. It's used primarily for development and small-scale production deployments where Kubernetes is unnecessary.

Docker Compose exists because running each service in isolated containers with a single `docker compose up` command simplifies environment setup. The engineering value is environment parity across development machines and production-like service topology in a single command.

# When To Use

- Local development environment with multiple services
- CI/CD integration testing with service containers
- Small production deployments (< 3 servers)
- Teams wanting containerized workflows without Kubernetes complexity

# When NOT To Use

- Large-scale production requiring orchestration, scaling, and self-healing
- Single-container applications (use standalone Docker)
- Environments where Docker is not permitted

# Best Practices

**Use Named Volumes.** Named volumes persist data across container restarts. Bind mounts for code during development.

**Health Checks.** Add `healthcheck` directives to each service for dependency ordering.

**Environment-Specific Compose Files.** Use `compose.override.yaml` for local overrides without modifying the base configuration.

**Isolate Networks.** Use dedicated networks for different service groups (web-facing vs internal).

# Common Mistakes

**No Health Check Dependency.** Services start without waiting for dependencies. Application crashes because the database isn't ready.

**Root Container Processes.** Running PHP-FPM as root inside the container. Use non-root user for security.

**Ignoring Compose V2.** Using `docker-compose` (V1) instead of `docker compose` (V2). V1 is deprecated and lacks features.

# Related Topics

**Prerequisites:** Docker fundamentals
**Closely Related:** Production Dockerfiles, Laravel Sail, Multi-Stage Builds
**Advanced Follow-Ups:** Docker Swarm, Kubernetes, Container Orchestration
