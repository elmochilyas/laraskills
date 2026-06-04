# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 04-docker-containerization
**Knowledge Unit:** production-dockerfiles
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Multi-stage Dockerfile created with vendor, node, and runtime stages
- [ ] Composer install stage: `composer install --no-dev --optimize-autoloader`
- [ ] Node build stage: `npm ci && npm run build`
- [ ] Runtime stage copies only built artifacts from prior stages
- [ ] Non-root user (`www-data`) used in runtime container
- [ ] Nginx + PHP-FPM split pattern or Supervisor single-container decided

---

# Architecture Checklist

- [ ] Multi-stage build stages designed (vendor, node, runtime)
- [ ] Nginx + PHP-FPM separate containers vs Supervisor combined evaluated
- [ ] OPcache configuration baked into Dockerfile
- [ ] Queue worker as separate container with same image, different command
- [ ] Health check endpoint designed per container

---

# Implementation Checklist

- [ ] `COPY composer.json composer.lock` for dependency layer caching
- [ ] `RUN composer install --no-dev --optimize-autoloader --no-interaction`
- [ ] `RUN npm ci && npm run build` in node stage
- [ ] `COPY --from=composer /app/vendor /var/www/vendor`
- [ ] `COPY --from=node /app/public/build /var/www/public/build`
- [ ] Nginx site config written with PHP upstream and static file routes

---

# Performance Checklist

- [ ] Final image size minimized (aim under 300MB)
- [ ] Layer order optimized (least-changing layers first)
- [ ] OPcache configured (`opcache.memory_consumption`, `opcache.max_accelerated_files`)
- [ ] Nginx serving static files directly (bypass PHP-FPM)
- [ ] Build cache used in CI for faster Docker builds

---

# Security Checklist

- [ ] Non-root `www-data` user in runtime container
- [ ] Composer auth tokens not present in final image
- [ ] `.env` injected at runtime (not baked in image)
- [ ] Minimal PHP extensions installed in image
- [ ] Read-only root filesystem if possible

---

# Reliability Checklist

- [ ] Health check endpoint returns 200 in healthy state
- [ ] PHP-FPM pm.max_children calculated for container memory
- [ ] Docker restart policy `unless-stopped` or `always`
- [ ] Resource limits set (CPU, memory per container)
- [ ] Graceful shutdown (SIGTERM forwarded correctly)

---

# Testing Checklist

- [ ] Docker build tested locally (`docker build -t app .`)
- [ ] Image size verified (target under 300MB)
- [ ] Container starts and responds to HTTP requests
- [ ] PHP-FPM status check works
- [ ] Queue worker container processes jobs

---

# Maintainability Checklist

- [ ] Dockerfile organized with clear stage labels
- [ ] `.dockerignore` created to exclude unnecessary files
- [ ] Build arguments documented (PHP_VERSION, NODE_VERSION)
- [ ] Nginx config version-controlled
- [ ] Image tagging strategy documented (git SHA, semver)

---

# Anti-Pattern Prevention Checklist

- [ ] No `root` user in production image
- [ ] No dev dependencies in final image
- [ ] No `.env` baked into image layers
- [ ] No `latest` tag for production (use specific tags)
- [ ] No hardcoded secrets

---

# Production Readiness Checklist

- [ ] Image pushed to registry with SHA tag
- [ ] Health check integrated with orchestrator
- [ ] Resource limits configured (CPU, memory)
- [ ] Image vulnerability scan run (Trivy, Snyk)
- [ ] Rollback via previous image tag
- [ ] `.dockerignore` verified (excludes .env, node_modules)

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: multi-stage build, container pattern chosen
- [ ] Security requirements satisfied: non-root, no secrets, minimal extensions
- [ ] Performance requirements satisfied: OPcache, layer order, image size optimized
- [ ] Testing requirements satisfied: image size verified, container responds
- [ ] Anti-pattern checks passed: no root, no dev deps, no .env in layers
- [ ] Production readiness verified: registry, scan, resource limits set

---

# Related References

- Laravel Sail (KU-009) -- development Docker with shared base image patterns
- FrankenPHP Standalone Deployments (KU-012) -- alternative combined PHP+server image
- Kubernetes for Laravel (KU-013) -- container orchestration using these images
- Laravel Octane Deployment (KU-006) -- Dockerfile considerations for Octane
