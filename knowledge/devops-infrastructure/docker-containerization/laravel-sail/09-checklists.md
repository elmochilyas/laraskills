# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 04-docker-containerization
**Knowledge Unit:** laravel-sail
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Sail installed via `php artisan sail:install` with chosen services
- [ ] `compose.yaml` defined with PHP, MySQL/PostgreSQL, Redis, Mailpit, Meilisearch
- [ ] Sail CLI configured for daily development (`./vendor/bin/sail`)
- [ ] PHP version selected and extensions configured (gd, pcntl, pdo_mysql, etc.)
- [ ] Dev/prod parity verified (same PHP version, same extensions as production)
- [ ] Caddy (default) or Nginx evaluated for local web serving

---

# Architecture Checklist

- [ ] Sail service definitions designed (PHP app, database, cache, mail, search)
- [ ] PHP extension selection justified for project requirements
- [ ] Dev/prod parity ensured through shared Dockerfile base patterns
- [ ] Additional services evaluated (Meilisearch for search, Selenium for browser tests)
- [ ] Caddy (default test container) vs Nginx decision documented

---

# Implementation Checklist

- [ ] `php artisan sail:install` executed with selected services (mysql, redis, mailpit, meilisearch)
- [ ] `compose.yaml` reviewed and customized (port mapping, volume mounts)
- [ ] `.env` configured with Sail service names (DB_HOST=mysql, REDIS_HOST=redis)
- [ ] Shell alias added (`alias sail='[ -f sail ] && bash sail || bash vendor/bin/sail'`)
- [ ] PHP extensions confirmed in Sail Dockerfile or compose.yaml
- [ ] `./vendor/bin/sail build` executed to build images

---

# Performance Checklist

- [ ] OPcache enabled in development for faster response
- [ ] Xdebug disabled by default (enabled only when debugging)
- [ ] Docker resource limits configured (CPU, memory in Docker Desktop)
- [ ] Composer and npm cached in Docker volumes for faster reinstalls
- [ ] Container startup time measured and optimized

---

# Security Checklist

- [ ] Container ports not exposed unnecessarily
- [ ] Database passwords in .env (not in compose.yaml)
- [ ] Sail CLI only available for authorized devs
- [ ] Custom service Dockerfiles use non-root user where possible
- [ ] Network isolation between different project Sail stacks

---

# Reliability Checklist

- [ ] Container restart policy `unless-stopped`
- [ ] Volume mounts for database persistence
- [ ] `sail down` and `sail up -d` tested (clean restart)
- [ ] Health check endpoints for critical services
- [ ] Database connection retry configured in Laravel config

---

# Testing Checklist

- [ ] `sail artisan test` passes all tests
- [ ] `sail ps` shows all services running
- [ ] `sail artisan migrate` runs successfully
- [ ] Mailpit captures test emails
- [ ] Queue worker processes jobs (`sail artisan queue:work`)

---

# Maintainability Checklist

- [ ] `compose.yaml` documented with service descriptions
- [ ] PHP extension list maintained with rationale
- [ ] `.env.sail` example committed for new developers
- [ ] Custom Dockerfiles version-controlled
- [ ] Port conflict resolution documented

---

# Anti-Pattern Prevention Checklist

- [ ] No `:latest` base images (pin PHP version tag)
- [ ] No unnecessary services added (keeps resource usage low)
- [ ] No hardcoded env vars in compose.yaml (use .env)
- [ ] No Xdebug enabled by default (performance impact)
- [ ] No `root` user in custom service Dockerfiles

---

# Production Readiness Checklist

- [ ] Sail environment documented in onboarding guide
- [ ] Docker Desktop resource limits configured (4GB RAM, 2 CPUs min)
- [ ] Composer and npm cache volumes configured
- [ ] Local HTTPS evaluated (via Herd, Valet, or Traefik)
- [ ] Health check endpoints available for debugging
- [ ] Build context ready for CI integration (Sail CI action)

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: service definitions, PHP version, extensions chosen
- [ ] Security requirements satisfied: port exposure limited, .env-based secrets
- [ ] Performance requirements satisfied: resource limits, cache volumes, Xdebug off
- [ ] Testing requirements satisfied: sail artisan test, migrate, queue, mail verified
- [ ] Anti-pattern checks passed: no latest tag, no hardcoded envs, no extra services
- [ ] Production readiness verified: onboarding docs, resource limits, CI-ready

---

# Related References

- Production Dockerfiles & Multi-Stage Builds (KU-010)
- FrankenPHP Standalone Deployments (KU-012)
- Laravel Forge Provisioning (KU-001) -- production counterpart to Sail
- Kubernetes for Laravel (KU-013)
