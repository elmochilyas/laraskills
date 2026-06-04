# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 04-docker-containerization
**Knowledge Unit:** dockerfile-optimization
**Difficulty:** Intermediate
**Category:** Containerization
**Last Updated:** 2026-06-03

# Overview

Dockerfile optimization for Laravel focuses on minimizing image size, maximizing layer caching, and ensuring production security. Key techniques include multi-stage builds (separating build toolchain from runtime), dependency caching (copying lock files before source code), and non-root user configuration.

Dockerfile optimization exists because large container images increase deployment time, storage costs, and attack surface. The engineering value is fast deployments, reduced storage costs, and minimized container vulnerability risk.

# Core Concepts

- **Layer Caching** — Each Dockerfile instruction creates a cacheable layer. Order matters: copy stable files first (composer.json), then volatile files (source code)
- **Multi-Stage Builds** — Separate build dependencies (Composer, Node) from runtime (PHP, Nginx)
- **Image Size Reduction** — Smaller images deploy faster and have fewer CVEs
- **Non-Root Security** — Running as non-root user prevents container escape

# When To Use

- All production Docker images
- CI/CD pipelines where image build and push time matters
- Security-conscious deployments

# When NOT To Use

- Development Dockerfiles where build speed matters more than image size
- Base images that are pre-optimized by the framework (FrankenPHP Docker image)

# Best Practices

**Order for Cache Optimization.** Copy `composer.json` and `composer.lock` before application source. Cache is invalidated only when dependencies change.

**Pin Base Image Versions.** Use specific tags (`php:8.3-fpm-alpine`) not floating tags (`php:8.3-fpm`).

**Combine RUN Commands.** Each `RUN` creates a layer. Combine related commands with `&&` to reduce layer count.

**Remove Build Dependencies.** Uninstall build tools in the same `RUN` layer where they're used.

# Examples

**Optimized Layer Order:**
```dockerfile
FROM php:8.3-fpm-alpine AS vendor
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader
COPY . .
# This rebuilds only when source code changes, not dependencies
```

# Related Topics

**Prerequisites:** Docker basics
**Closely Related:** Multi-Stage Builds, Production Dockerfiles, Laravel Sail
**Advanced Follow-Ups:** Container Security, Distroless Images
