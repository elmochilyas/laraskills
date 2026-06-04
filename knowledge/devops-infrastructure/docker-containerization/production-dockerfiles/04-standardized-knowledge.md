# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 04-docker-containerization
**Knowledge Unit:** production-dockerfiles
**Difficulty:** Advanced
**Category:** Containerization
**Last Updated:** 2026-06-03

# Overview

Production Dockerfiles for Laravel use multi-stage builds to minimize final image size, configure production-specific PHP settings, and implement security best practices. Typical architecture separates Nginx (static files, reverse proxy) from PHP-FPM (application code) or uses FrankenPHP for a single-container approach.

Production Dockerfiles exist because development Docker configurations prioritize convenience over security and efficiency. The engineering value is a hardened, minimal, production-ready container image.

# Core Concepts

- **Multi-Stage Build** — Vendor, node, and runtime stages
- **OPcache Configuration** — Production OPcache settings in Dockerfile
- **Non-Root User** — Container runs as www-data or custom user
- **Nginx + PHP-FPM Split** — Two-container architecture or FrankenPHP single-container
- **Health Check** — Dockerfile HEALTHCHECK instruction for orchestration

# Best Practices

**Use Specific Base Image Tags.** Pin to `php:8.3.12-fpm-alpine` not `php:8.3-fpm` for reproducible builds.

**Configure OPcache in Dockerfile.** Set `opcache.memory_consumption`, `opcache.revalidate_freq=0`, and `opcache.file_cache` in the image.

**Set Timezone.** Configure `TZ` environment variable for consistent logging timestamps.

**Include Health Check.** Add `HEALTHCHECK` instruction for container orchestration platforms.

**Use Docker Ignore File.** Create `.dockerignore` to exclude node_modules, .git, tests, and other non-production files from the build context.

# Related Topics

**Prerequisites:** Dockerfile basics, multi-stage builds
**Closely Related:** Multi-Stage Builds, FrankenPHP, Dockerfile Optimization
**Advanced Follow-Ups:** Kubernetes Deployment, Container Registry Management, Image Scanning
