# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 04-docker-containerization
**Knowledge Unit:** multi-stage-builds
**Difficulty:** Intermediate
**Category:** Containerization
**Last Updated:** 2026-06-03

# Overview

Multi-stage builds use multiple FROM statements in a single Dockerfile to separate build-time dependencies from runtime dependencies. For Laravel, the vendor stage installs Composer dependencies, the node stage compiles assets, and the runtime stage contains only PHP, the application, and compiled assets.

Multi-stage builds exist because PHP and Node build tools are not needed at runtime. The engineering value is smaller, more secure production images — often reducing image size from 1GB+ to under 200MB.

# When To Use

- All production Dockerfiles
- CI/CD pipelines where image push time matters
- Security-conscious deployments

# When NOT To Use

- Development Dockerfiles (build tools are needed interactively)
- Base images already optimized by the framework

# Core Concepts

- **Vendor Stage** — Composer install with dev dependencies excluded
- **Node Stage** — npm/Yarn install and asset compilation
- **Runtime Stage** — PHP with only necessary extensions and compiled artifacts
- **Artifact Copy** — `COPY --from=<stage>` copies only needed files between stages

# Best Practices

**Order Stages by Volatility.** Cache dependency installation before source code copy.

**Use Alpine for Runtime.** Alpine-based PHP images are 50-80% smaller than Debian-based.

**Pin Alpine Versions.** Use specific Alpine version tags for reproducible builds.

**Remove Cache Files.** Clean apt cache and Composer cache in the same RUN layer.

# Related Topics

**Prerequisites:** Dockerfile basics
**Closely Related:** Dockerfile Optimization, Production Dockerfiles
**Advanced Follow-Ups:** Distroless Images, Container Security Scanning
