# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 04-docker-containerization
**Knowledge Unit:** docker-compose-laravel
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Multi-stage Dockerfile created (vendor stage, node stage, runtime stage)
- [ ] Composer install in build stage with `--no-dev --optimize-autoloader`
- [ ] npm/Yarn build in separate intermediate stage (not final image)
- [ ] Nginx + PHP-FPM split pattern implemented (separate containers)
- [ ] Non-root user configured in runtime image for security
- [ ] OPcache configuration baked into Docker image

---

# Architecture Checklist

- [ ] Multi-stage build architecture designed (vendor, node, runtime stages)
- [ ] Nginx + PHP-FPM split pattern vs Supervisor single-container evaluated
- [ ] Queue worker as separate container (sharing same image, different command)
- [ ] Health check endpoints designed per container type
- [ ] Development vs production Dockerfile strategy defined

---

# Implementation Checklist

- [ ] Stage 1 (vendor): `composer install --no-dev --optimize-autoloader --no-interaction`
- [ ] Stage 2 (node): `npm ci && npm run build`
- [ ] Stage 3 (runtime): `COPY --from=composer /app/vendor /var/www/vendor`
- [ ] Stage 3 (runtime): `COPY --from=node /app/public/build /var/www/public/build`
- [ ] Nginx config created with PHP-FPM upstream, static file serving
- [ ] PHP-FPM Dockerfile with required extensions installed

---

# Performance Checklist

- [ ] Image size minimized (multi-stage, alpine base, no dev dependencies)
- [ ] OPcache configured with production settings in Dockerfile
- [ ] Nginx fastcgi buffers tuned for response size
- [ ] Static files served by Nginx directly (not via PHP-FPM)
- [ ] Docker layer order optimized (least-changing layers first)

---

# Security Checklist

- [ ] Non-root user `www-data` used in runtime container
- [ ] Composer auth tokens not baked into final image
- [ ] `.env` not included in image (injected at runtime)
- [ ] PHP extensions minimal set (only required ones installed)
- [ ] Container runs with read-only root filesystem if possible

---

# Reliability Checklist

- [ ] Health check endpoint configured (HTTP GET /health returning 200)
- [ ] PHP-FPM process manager configured for graceful restart
- [ ] Docker restart policy set (`unless-stopped` or `always`)
- [ ] Resource limits configured (CPU, memory per container)
- [ ] Graceful shutdown handling (SIGTERM forwarded to PHP-FPM)

---

# Testing Checklist

- [ ] Docker build tested locally before CI integration
- [ ] Image size verified (target under 300MB)
- [ ] Nginx + PHP-FPM connectivity tested
- [ ] Health check endpoint returns 200 in container
- [ ] Queue worker container starts and processes jobs

---

# Maintainability Checklist

- [ ] Dockerfile organized with clear stage labels
- [ ] `.dockerignore` created to exclude unnecessary files
- [ ] Nginx config version-controlled alongside Dockerfile
- [ ] Build arguments documented (e.g., PHP_VERSION, COMPOSER_AUTH)
- [ ] Docker Compose override for development vs production

---

# Anti-Pattern Prevention Checklist

- [ ] No `root` user in production container (always use `www-data`)
- [ ] No dev dependencies in final image
- [ ] No `.env` files baked into image layers
- [ ] No `latest` tag for production images (use commit SHA or semver)
- [ ] No hardcoded secrets in Dockerfile or config

---

# Production Readiness Checklist

- [ ] Docker image pushed to registry (ECR, Docker Hub, GitLab Registry)
- [ ] Image tagging strategy defined (git SHA, environment)
- [ ] Health check endpoint integrated with orchestrator
- [ ] Resource limits set in Docker Compose or orchestrator
- [ ] Image scanned for vulnerabilities (Trivy, Snyk)
- [ ] Rollback by redeploying previous image tag

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: multi-stage build and container split validated
- [ ] Security requirements satisfied: non-root user, no secrets in image, min extensions
- [ ] Performance requirements satisfied: layer ordering, OPcache, image size optimized
- [ ] Testing requirements satisfied: local build, connectivity, health check verified
- [ ] Anti-pattern checks passed: no root, no dev deps, no .env in image
- [ ] Production readiness verified: registry push, tagging, vulnerability scan done

---

# Related References

- Laravel Sail (KU-009) -- development Docker with shared base image patterns
- FrankenPHP Standalone Deployments (KU-012) -- alternative combined PHP+server image
- Kubernetes for Laravel (KU-013) -- container orchestration using these images
- Laravel Octane Deployment (KU-006) -- Dockerfile considerations for Octane
