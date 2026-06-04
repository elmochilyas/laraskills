# Multi-Stage Builds

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Docker & Containerization
- **Knowledge Unit:** Multi-Stage Builds
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Multi-stage builds use multiple FROM statements in a single Dockerfile to separate build-time dependencies from runtime dependencies. For Laravel, this means the vendor stage installs Composer dependencies, the node stage compiles assets, and the runtime stage contains only PHP, the application, and compiled artifacts — reducing image size from 1GB+ to under 200MB.

---

## Core Concepts

- **Vendor Stage** — Composer install with dev dependencies excluded, producing optimized autoloading
- **Node Stage** — npm/Yarn install and Vite asset compilation producing compiled CSS/JS
- **Runtime Stage** — PHP base image with only necessary extensions and compiled artifacts
- **Artifact Copy** — `COPY --from=<stage>` copies only needed files between stages, excluding build tools from final image

---

## Mental Models

- **Build Factory vs. Showroom** — Build stages are factories with construction tools (Composer, Node, compilers). The runtime stage is the showroom with only finished products. The factory is discarded once construction is complete.
- **Artifact Pipeline** — Each stage produces artifacts consumed by later stages. The vendor stage produces `vendor/`; the node stage produces `public/build/`; the runtime stage collects both.
- **Alpine for Compact Runtime** — Alpine-based PHP images are 50-80% smaller than Debian-based. Combined with multi-stage, this produces the smallest possible production images.

---

## Internal Mechanics

A multi-stage Dockerfile starts with `FROM php:8.3-alpine AS vendor` for the first stage, installs Composer, copies dependency lock files, and runs `composer install`. The second stage `FROM node:20-alpine AS node` installs npm packages and runs Vite build. The final stage `FROM php:8.3-fpm-alpine` copies only `vendor/` from the vendor stage and `public/build/` from the node stage using `COPY --from=vendor` and `COPY --from=node`. Build tools (Composer binary, Node packages, compilers) never enter the runtime image.

---

## Patterns

- **Order Stages by Volatility** — The vendor stage changes less frequently than source code; copy lock files before source to maximize cache reuse
- **Use Alpine for Runtime** — Alpine-based PHP images reduce final image size by 50-80% compared to Debian-based
- **Pin Alpine Versions** — Use specific Alpine version tags for reproducible builds
- **Remove Cache Files** — Clean apt cache and Composer cache in the same RUN layer where they're created to avoid carrying them into intermediate layers

---

## Architectural Decisions

- **Multi-Stage vs. Single-Stage** — Use multi-stage for all production Dockerfiles; use single-stage for development where build tools are needed interactively
- **External Build Tools** — When Composer or Node are not available in the base PHP image, use separate build stages with appropriate base images
- **Two-Stage vs. Three-Stage** — Two-stage (vendor + runtime) when no frontend build is needed; three-stage (vendor + node + runtime) for full-stack Laravel with Vite

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Smaller production images (200MB vs 1GB+) | Build time increased by multiple stages | Cache optimization critical for acceptable build time |
| Reduced CVE surface (build tools excluded) | Debugging across stages is harder | Must inspect each stage for build failures |
| Clean separation of concerns | More complex Dockerfile | Team must understand stage architecture |
| Faster deployment from smaller images | Longer initial build | CI/CD pipeline must accommodate multi-stage builds |

---

## Performance Considerations

Final image size directly impacts deployment time. A 200MB multi-stage image pushes in ~10s on typical CI bandwidth. Alpine-based runtime images reduce memory consumption at runtime. OPcache configuration in the runtime stage improves performance. The build stage can use a heavier base image with full build toolchain without affecting runtime resource usage.

---

## Production Considerations

Pin Alpine base image versions for reproducible builds. Use `.dockerignore` to exclude non-production files from build context. Configure OPcache and PHP-FPM settings in the runtime stage. Run containers as non-root user. Include `HEALTHCHECK` instruction in the runtime stage. Cache Composer and npm directories in CI to speed up multi-stage builds.

---

## Common Mistakes

- **Not Using Multi-Stage** — Building production images with a single stage that includes Composer, Node, and build tools. Image size includes gigabytes of unnecessary tooling.
- **Copying Build Artifacts, Not Directories** — `COPY --from=vendor /app/vendor /app/vendor` is correct; copying individual files misses directory structure.
- **Using Debian for Runtime** — Debian-based PHP images add 100-200MB over Alpine without significant benefit for most Laravel applications.
- **Forgetting .dockerignore** — Including `.git`, `tests`, `node_modules` (from host) in build context increases build time.

---

## Failure Modes

- **Stage Build Failure** — Vendor or node stage fails due to dependency issue. Detection: Docker build fails at the stage. Mitigation: test build stages independently, use CI to validate Dockerfile changes.
- **Incompatible Alpine Base** — Required PHP extension not available in Alpine repository. Detection: Docker build fails when installing PHP extensions. Mitigation: verify PHP extension availability for target Alpine version, use Debian base as fallback.
- **Lock File Missing** — `composer.lock` or `package-lock.json` not committed to repository. Detection: build stage fails with file not found. Mitigation: ensure lock files are tracked in version control.

---

## Ecosystem Usage

Multi-stage builds are the standard approach for production Laravel Dockerfiles. Laravel's official deployment documentation recommends multi-stage builds. FrankenPHP's Docker image uses multi-stage builds. Deployer PHP and Envoyer both support Docker image deployment workflows that benefit from multi-stage-built images. CI/CD pipelines (GitHub Actions, GitLab CI) commonly build multi-stage images and push them to container registries.

---

## Related Knowledge Units

### Prerequisites
- Dockerfile basics

### Related Topics
- Dockerfile Optimization
- Production Dockerfiles

### Advanced Follow-up Topics
- Distroless Images
- Container Security Scanning

---

## Research Notes

Multi-stage builds are essential for production Laravel Dockerfiles. Three-stage architecture (vendor, node, runtime) is standard. Alpine base images reduce final size by 50-80%. Copy lock files before source code for cache optimization. Build stage failures require stage-specific debugging — test each stage independently.
