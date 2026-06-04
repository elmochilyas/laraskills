# Dockerfile Optimization

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Docker & Containerization
- **Knowledge Unit:** Dockerfile Optimization
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Dockerfile optimization for Laravel focuses on minimizing image size, maximizing layer caching, and ensuring production security. Key techniques include multi-stage builds, dependency caching by copying lock files before source code, and non-root user configuration, resulting in faster deployments, reduced storage costs, and minimized vulnerability risk.

---

## Core Concepts

- **Layer Caching** — Each Dockerfile instruction creates a cacheable layer. Order matters: copy stable files first (composer.json), then volatile files (source code)
- **Multi-Stage Builds** — Separate build dependencies (Composer, Node) from runtime (PHP, Nginx) to minimize final image size
- **Image Size Reduction** — Smaller images deploy faster, have fewer CVEs, and consume less storage
- **Non-Root Security** — Running as non-root user prevents container escape vulnerabilities

---

## Mental Models

- **Cache Invalidation Chain** — Each Dockerfile instruction invalidates the cache if its input changes. Order instructions from least to most frequently changing to maximize cache reuse.
- **Build vs. Runtime Separation** — Build dependencies (Composer, Node, compilers) are not needed at runtime. Multi-stage builds keep them out of the final image.
- **Layer = Delta** — Each layer is a delta from the previous one. Combining related RUN commands into a single layer reduces total image size by discarding intermediate files in the same layer.

---

## Internal Mechanics

Docker builds an image layer by layer, caching each layer based on the instruction and its inputs. When a layer's cache is invalidated (e.g., source code changes), all subsequent layers must be rebuilt. The `COPY` instruction creates a layer containing the copied files. The `RUN` instruction creates a layer with the filesystem changes from executing the command. Each `FROM` instruction in a multi-stage build starts a fresh image. `COPY --from=<stage>` copies files from a previous stage without including its layers in the final image.

---

## Patterns

- **Dependency Lock Files First** — Copy `composer.json` and `composer.lock` before application source. Cache is invalidated only when dependencies change, not when source code changes.
- **Combine RUN Commands** — Each `RUN` creates a layer. Combine related commands with `&&` to reduce layer count and discard intermediate artifacts in the same layer.
- **Remove Build Dependencies** — Uninstall build tools and clear package manager caches in the same `RUN` layer where they're used.
- **Pin Base Image Versions** — Use specific tags (`php:8.3-fpm-alpine`) not floating tags (`php:8.3-fpm`) for reproducible builds.

---

## Architectural Decisions

- **Alpine vs. Debian Base** — Use Alpine for minimal image size (50-80% smaller); use Debian for broader package availability and compatibility
- **Single-Stage vs. Multi-Stage** — Use single-stage for development builds where build speed matters; use multi-stage for production images where size and security matter
- **Composer Install vs. Pre-built Vendor** — Install Composer deps in Dockerfile for reproducibility; pre-build vendor in CI for faster iteration

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Smaller images (200MB vs 1GB+) | Multi-stage build complexity | Debugging multi-stage builds requires understanding layer architecture |
| Faster CI/CD pipeline times | Cache invalidation debugging | Determining why cache missed can be time-consuming |
| Fewer CVEs in production image | Alpine compatibility issues | Some PHP extensions require Alpine-specific packages |
| Reproducible builds | Base image drift if not pinned | Floating tags silently pull in OS updates |

---

## Performance Considerations

Image size directly impacts deployment time. A 200MB image pushes in 10s on a 200Mbps connection; a 1GB image takes 50s. Layer count affects push/pull time. Alpine-based images are 50-80% smaller than Debian-based. OPcache configuration in the Dockerfile improves runtime performance. Multi-stage builds reduce final image size but increase build time slightly.

---

## Production Considerations

Pin base image versions to exact tags for reproducible builds. Never use `latest` tag. Create `.dockerignore` to exclude `.git`, `node_modules`, tests, and other non-production files from build context. Run containers as non-root user. Configure OPcache with production settings in the Dockerfile. Include `HEALTHCHECK` instruction for container orchestration platforms. Set timezone with `TZ` environment variable.

---

## Common Mistakes

- **Wrong COPY Order** — Copying source code before lock files causes cache invalidation on every source change, forcing dependency reinstallation.
- **Not Combining RUN Commands** — Separate `apt-get update` and `apt-get install` commands creates layers with stale package lists, increasing image size.
- **Forgetting .dockerignore** — Including `.git` and `node_modules` in the build context increases build time and can leak secrets.
- **Running as Root** — Default container user is root, creating container escape risk if the application is compromised.

---

## Failure Modes

- **Cache Miss Cascade** — A frequently changing file at the top of the Dockerfile invalidates all downstream caches. Mitigation: order COPY instructions from least to most volatile.
- **Alpine Package Missing** — A required PHP extension is not available in Alpine repositories. Mitigation: use Debian base images when Alpine compatibility is uncertain.
- **Build Context Size Explosion** — Forgetting `.dockerignore` sends large directories (node_modules, .git) to the Docker daemon. Mitigation: create `.dockerignore` early, verify build context size.

---

## Ecosystem Usage

Dockerfile optimization is essential for Laravel deployment on Docker. Laravel Sail uses optimized Dockerfiles for development. Production Dockerfiles for Laravel typically use the `php:8.3-fpm-alpine` base image with multi-stage builds. FrankenPHP provides a pre-optimized Docker image. The `laravel/octane` package includes Dockerfile examples for Octane-based deployments.

---

## Related Knowledge Units

### Prerequisites
- Docker basics

### Related Topics
- Multi-Stage Builds
- Production Dockerfiles
- Laravel Sail

### Advanced Follow-up Topics
- Container Security
- Distroless Images

---

## Research Notes

Layer caching is the most impactful optimization for Docker build times. Order COPY instructions from least to most frequently changing files. Multi-stage builds are essential for production images to separate build toolchain from runtime. Alpine-based images are preferred for minimal size but may have compatibility issues with some PHP extensions. Always pin base image versions and create `.dockerignore`.
