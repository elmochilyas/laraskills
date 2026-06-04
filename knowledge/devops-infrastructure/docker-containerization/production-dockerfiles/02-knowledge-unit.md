# Production Dockerfiles

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Docker & Containerization
- **Knowledge Unit:** Production Dockerfiles
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

Production Dockerfiles for Laravel use multi-stage builds to minimize final image size, configure production-specific PHP settings, and implement security best practices. Typical architecture separates Nginx (static files, reverse proxy) from PHP-FPM (application code) or uses FrankenPHP for a single-container approach.

---

## Core Concepts

- **Multi-Stage Build** — Vendor, node, and runtime stages to separate build tools from production artifacts
- **OPcache Configuration** — Production OPcache settings embedded in the Dockerfile
- **Non-Root User** — Container runs as www-data or custom user for security
- **Nginx + PHP-FPM Split** — Two-container architecture or FrankenPHP single-container approach
- **Health Check** — Dockerfile HEALTHCHECK instruction for container orchestration platforms

---

## Mental Models

- **Production-First Build** — Development Dockerfiles prioritize convenience (root user, all tools, loose permissions). Production Dockerfiles prioritize security and efficiency (non-root user, only runtime packages, locked-down permissions).
- **Image as Artifact** — The production Docker image is the deployment artifact. It should be built once in CI and promoted through environments without modification.
- **Minimal Attack Surface** — Every package in the production image is a potential vulnerability. Only include what is absolutely required at runtime.

---

## Internal Mechanics

A production Dockerfile starts with build stages for vendor (Composer) and assets (npm/Vite), then copies artifacts into a minimal runtime stage. The runtime stage configures production PHP settings (OPcache memory, realpath cache, max execution time), sets up non-root user, copies application code, and configures the web server. The image is tagged with a unique identifier (commit SHA + build timestamp) and pushed to a container registry. When deployed, the orchestrator pulls the image and starts containers with the specified configuration.

---

## Patterns

- **Specific Base Image Tags** — Pin to `php:8.3.12-fpm-alpine` not `php:8.3-fpm` for reproducible builds
- **OPcache in Dockerfile** — Set `opcache.memory_consumption`, `opcache.revalidate_freq=0`, and `opcache.file_cache` in the image
- **Timezone Configuration** — Set `TZ` environment variable for consistent logging timestamps
- **HEALTHCHECK Instruction** — Add `HEALTHCHECK` for automatic container health verification by orchestration platforms
- **Docker Ignore File** — Create `.dockerignore` to exclude node_modules, .git, tests, and other non-production files from the build context

---

## Architectural Decisions

- **Nginx + PHP-FPM vs. FrankenPHP** — Choose Nginx + PHP-FPM for traditional deployments with complex routing; choose FrankenPHP for simplified single-binary deployments with Octane
- **Two Images vs. One Image** — Use two images (Nginx + PHP-FPM) for traditional architecture; use one image for FrankenPHP-based deployments
- **Alpine vs. Debian Base** — Use Alpine for minimal image size; use Debian for broader PHP extension compatibility

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Minimal production image size | Requires multi-stage build understanding | Learning curve for team members new to Docker |
| Production-optimized PHP settings | Dockerfile not suitable for development | Separate Dockerfiles for dev and production |
| Security best practices (non-root, minimal packages) | Compatibility issues with some packages | Alpine may lack some required PHP extensions |
| Reproducible builds via pinned tags | Base image vulnerability updates require rebuild | Must regularly update base image tags for security patches |

---

## Performance Considerations

OPcache configuration in the Dockerfile ensures optimal PHP performance from container start. Alpine-based images reduce memory footprint. Non-root user has minimal security overhead. Health check polling adds negligible performance impact. Realpath cache and max execution time should be tuned for the specific application workload. File cache for OPcache improves performance across container restarts.

---

## Production Considerations

Pin base image versions to exact tags for reproducible builds. Never use `latest` tag in production. `.dockerignore` is critical to prevent sensitive files from entering the build context. Run containers as non-root user (www-data or custom) to limit container escape risk. Include `HEALTHCHECK` for orchestration platforms to detect unhealthy containers. Configure OPcache with file cache for persistence across container restarts. Set timezone for consistent log timestamps.

---

## Common Mistakes

- **Using Development Dockerfiles in Production** — Development images may have root user, development PHP extensions, and loose file permissions that create security vulnerabilities in production.
- **Floating Base Image Tags** — Using `php:8.3-fpm` instead of `php:8.3.12-fpm-alpine` means different image content on each rebuild, causing unpredictable behavior.
- **Missing OPcache Configuration** — Default OPcache settings are too conservative for production. Configure explicitly in the Dockerfile.
- **No HEALTHCHECK Instruction** — Orchestration platforms cannot detect unhealthy containers without a configured health check.

---

## Failure Modes

- **Base Image Vulnerability** — Pinned base image has a known CVE. Detection: vulnerability scanner reports findings. Mitigation: regularly rebuild images with updated base tags, automate rebuild in CI.
- **Non-Root Permission Issue** — Application cannot write to cache or storage directories. Detection: application returns errors on cache operations. Mitigation: ensure storage directory permissions allow non-root user access.
- **OPcache Memory Exhaustion** — `opcache.memory_consumption` is too low for the application. Detection: OPcache hit ratio drops below 90%. Mitigation: monitor hit ratio and increase memory allocation.
- **Build Context Size Explosion** — Large `.dockerignore` is missing entries. Detection: Docker build takes long time. Mitigation: review `.dockerignore` entries, verify build context size.

---

## Ecosystem Usage

Production Dockerfiles are used with Laravel deployments on Kubernetes, AWS ECS, Fly.io, and other container platforms. FrankenPHP provides an official production Docker image. Laravel Octane's documentation includes production Dockerfile examples. Dockerfile optimization techniques (multi-stage, layer caching, Alpine base) are standard practice across the Laravel ecosystem. CI/CD pipelines build and push production Docker images to container registries for deployment.

---

## Related Knowledge Units

### Prerequisites
- Dockerfile basics, multi-stage builds

### Related Topics
- Multi-Stage Builds
- FrankenPHP Standalone
- Dockerfile Optimization

### Advanced Follow-up Topics
- Kubernetes Deployment
- Container Registry Management
- Image Scanning

---

## Research Notes

Production Dockerfiles must be fundamentally different from development Dockerfiles. Use multi-stage builds, Alpine base images, pinned versions, non-root users, and explicit OPcache configuration. Never use floating tags in production. Include `HEALTHCHECK` for orchestration platforms. Create thorough `.dockerignore` to keep build contexts small and secure.
