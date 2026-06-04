# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 01-server-provisioning
**Knowledge Unit:** laravel-forge-provisioning
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Forge account connected to DigitalOcean, Linode, AWS, Vultr, or Hetzner
- [ ] LEMP/LEMP stack (Nginx, PHP-FPM, MySQL/PostgreSQL, Redis, Supervisor) provisioned
- [ ] Deployment script configured with zero-downtime symlink-swap pattern
- [ ] Queue workers and cron jobs configured via Forge dashboard
- [ ] SSL certificates issued via Let's Encrypt with auto-renewal
- [ ] Firewall rules applied (SSH, HTTP, HTTPS only)

---

# Architecture Checklist

- [ ] Server type decomposition determined (app, web, database, cache, worker, load balancer)
- [ ] Multi-server architecture planned with Forge + Envoyer integration
- [ ] OPcache configuration validated for production (opcache.revalidate_freq=0)
- [ ] PHP-FPM pm.max_children calculated based on available memory
- [ ] Nightwatch or other monitoring integrated for production observability

---

# Implementation Checklist

- [ ] Forge API token generated and stored securely in CI/CD secrets
- [ ] Deployment script written with `artisan migrate --force`, `artisan queue:restart`
- [ ] Supervisor configuration for queue workers reviewed (process count, memory limit)
- [ ] Nginx site configuration tuned (client_max_body_size, gzip, fastcgi buffers)
- [ ] SSL certificate provisioning verified for all custom domains

---

# Performance Checklist

- [ ] OPcache memory size configured (`opcache.memory_consumption`) based on app footprint
- [ ] PHP-FPM pm mode set to `dynamic` or `ondemand` based on traffic pattern
- [ ] MySQL query cache and connection limits tuned for workload
- [ ] Redis used for cache and sessions, connection pooling reviewed

---

# Security Checklist

- [ ] SSH key-based authentication enforced, password auth disabled
- [ ] Firewall configured to allow only 22, 80, 443 from trusted sources
- [ ] Fail2ban installed and configured for SSH brute-force protection
- [ ] Unattended-upgrades enabled with automatic security patches
- [ ] `.env` file permissions set to 600, never committed to Git

---

# Reliability Checklist

- [ ] Queue worker retry strategy configured (failed job table, retry delay)
- [ ] Supervisor auto-restart configured for crashed queue workers
- [ ] Database backups automated (Forge backup feature or custom cron)
- [ ] Health check endpoint implemented and monitored
- [ ] Deployment rollback tested (symlink revert to previous release)

---

# Testing Checklist

- [ ] Provisioning tested on a staging server before production
- [ ] Deployment script smoke-tested (artisan commands, queue restart, cache clear)
- [ ] SSL certificate renewal verified to work automatically
- [ ] Firewall rule changes tested against known IPs
- [ ] Worker processes tested after Supervisor restart

---

# Maintainability Checklist

- [ ] Forge recipe templates version-controlled for reproducible provisioning
- [ ] Deployment scripts stored in `deploy/` directory in application repository
- [ ] Nginx config templates documented with annotations for tuning
- [ ] PHP-FPM pool settings documented per server type
- [ ] Server access audit logged (who has sudo, SSH key rotations)

---

# Anti-Pattern Prevention Checklist

- [ ] No hardcoded environment variables in deployment scripts
- [ ] No `composer install` with `--no-dev` skipped in deployment script
- [ ] No direct SSH access used for routine management (use Forge dashboard)
- [ ] No manual server modifications outside Forge-managed configuration
- [ ] No exposed Queue dashboards or Horizon without authentication

---

# Production Readiness Checklist

- [ ] Nightwatch or alternative monitoring installed and alerting configured
- [ ] Deployment rollback tested from the Forge dashboard
- [ ] PHP-FPM status page disabled or firewalled in production
- [ ] OPcache reset hook added to deployment (`artisan opcache:clear`)
- [ ] Load testing completed with expected traffic volume
- [ ] Database (RDS/DO Managed DB) configured for automated backup

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: server decomposition and LEMP stack validated
- [ ] Security requirements satisfied: firewall, SSH hardening, SSL, patches configured
- [ ] Performance requirements satisfied: OPcache, PHP-FPM, Redis tuned for workload
- [ ] Testing requirements satisfied: staging provisioning and deployment verified
- [ ] Anti-pattern checks passed: no manual overrides, no hardcoded secrets
- [ ] Production readiness verified: monitoring, backups, rollback tested

---

# Related References

- Ploi Server Management (KU-002) -- direct competitor, Docker server support
- Envoyer Zero-Downtime Deployments (KU-003) -- pairs with Forge for multi-server deploys
- Environment & Secret Management (KU-021) -- env management in Forge
- Observability & Monitoring (KU-022) -- Nightwatch integration
- Deployer PHP (KU-008) -- open-source alternative to Envoyer
