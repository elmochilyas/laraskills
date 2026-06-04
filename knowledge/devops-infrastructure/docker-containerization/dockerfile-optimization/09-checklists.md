# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 04-docker-containerization
**Knowledge Unit:** dockerfile-optimization
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Sail CLI installed and initialized (`php artisan sail:install`)
- [ ] `compose.yaml` configured with required services (PHP, MySQL, Redis, Mailpit)
- [ ] PHP version selected and configured in Sail service definition
- [ ] Development services customized (Meilisearch, Selenium, etc.)
- [ ] Sail alias configured for convenient CLI usage (`./vendor/bin/sail`)
- [ ] Development/production parity verified via shared Dockerfile patterns

---

# Architecture Checklist

- [ ] Sail service definitions designed (PHP, MySQL/PostgreSQL, Redis, Mailpit)
- [ ] Caddy (default in test container) vs Nginx evaluated
- [ ] PHP extension selection justified for project needs
- [ ] Dev/prod parity ensured (same PHP version, same extensions)
- [ ] Additional services added only as needed (Meilisearch, Selenium, etc.)

---

# Implementation Checklist

- [ ] `php artisan sail:install` executed with chosen services
- [ ] `compose.yaml` reviewed and customized for project
- [ ] `.env` configured with Sail service connection details
- [ ] Sail alias added to shell profile (`alias sail='./vendor/bin/sail'`)
- [ ] Build context configured if custom Dockerfile needed
- [ ] Port mappings adjusted for local conflicts (e.g., 3306 for MySQL)

---

# Performance Checklist

- [ ] OPcache enabled in development (revalidate_freq=0 for immediate updates)
- [ ] Sail containers configured with resource limits (memory, CPU)
- [ ] Docker cache volumes for Composer and npm to speed reinstalls
- [ ] Xdebug disabled by default, enabled only on demand
- [ ] Container startup time measured and optimized

---

# Security Checklist

- [ ] Container ports not exposed unnecessarily (only needed services)
- [ ] Database passwords not hardcoded in compose.yaml (use .env)
- [ ] Sail command only available to authorized developers
- [ ] Custom Dockerfiles use non-root user where possible
- [ ] Network isolation between projects (different Docker networks)

---

# Reliability Checklist

- [ ] Container restart policy configured (`unless-stopped`)
- [ ] Health check endpoints configured for critical services
- [ ] Volume mounts persistent for database data
- [ ] Sail `down` tested (containers stop and restart cleanly)
- [ ] Composer install runs successfully on first `sail up`

---

# Testing Checklist

- [ ] Sail environment tested with `sail artisan test` (all tests pass)
- [ ] All configured services start without error (`sail ps`)
- [ ] Database migrations run via Sail (`sail artisan migrate`)
- [ ] Mailpit email capture verified in development
- [ ] Queue worker tested (`sail artisan queue:work`)

---

# Maintainability Checklist

- [ ] `compose.yaml` documented with service descriptions
- [ ] `sail` customization documented in project README
- [ ] PHP extension list maintained in a comment in compose.yaml
- [ ] `.env.sail` example committed as template environment
- [ ] Service port conflicts documented with resolution steps

---

# Anti-Pattern Prevention Checklist

- [ ] No `:latest` base images (pin PHP version)
- [ ] No unnecessary services added to compose.yaml
- [ ] No hardcoded environment variables in compose.yaml
- [ ] No production Dockerfile replaced by Sail's default
- [ ] No `root` user in custom Dockerfiles

---

# Production Readiness Checklist

- [ ] Sail environment documented in onboarding guide
- [ ] Composer and npm cache volumes configured for speed
- [ ] Xdebug configuration available but disabled by default
- [ ] Local HTTPS setup (via Laravel Herd or Valet) if needed
- [ ] Health check endpoints available for local debugging
- [ ] Sail build context ready for CI integration

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: service definitions and PHP version chosen
- [ ] Security requirements satisfied: port exposure limited, .env-based secrets
- [ ] Performance requirements satisfied: resource limits, cache volumes, Xdebug off
- [ ] Testing requirements satisfied: sail artisan test, migrate, queue all working
- [ ] Anti-pattern checks passed: no latest tag, no hardcoded envs, no extra services
- [ ] Production readiness verified: onboarding docs, CI-ready, cache volumes configured

---

# Related References

- Production Dockerfiles & Multi-Stage Builds (KU-010)
- FrankenPHP Standalone Deployments (KU-012)
- Laravel Forge Provisioning (KU-001) -- production counterpart to Sail
- Kubernetes for Laravel (KU-013)
