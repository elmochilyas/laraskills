# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 01-server-provisioning
**Knowledge Unit:** provisioning-tools
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Forge server provisioning workflow understood (provider integration, LEMP install)
- [ ] Server type decomposition defined (App, Web, Database, Cache, Worker, Load Balancer)
- [ ] PHP-FPM process manager mode selected and pm.max_children calculated
- [ ] OPcache production configuration applied (memory, revalidation, file cache)
- [ ] Zero-downtime deployment script written with symlink-swap directory layout
- [ ] SSL management via Let's Encrypt with auto-renewal configured

---

# Architecture Checklist

- [ ] Single-server vs. multi-server architecture determined based on traffic needs
- [ ] Server type separation justified (app, web, database, cache, worker, load balancer)
- [ ] Nginx-based load balancer upstream configuration and health checks designed
- [ ] OPcache optimization strategy integrated into deployment workflow
- [ ] Scaling pattern defined (single server -> decomposed -> multi-server)

---

# Implementation Checklist

- [ ] Forge server created with correct provider, region, and size
- [ ] LEMP stack installation verified (Nginx, PHP-FPM, MySQL/PostgreSQL, Redis)
- [ ] PHP-FPM pool configuration tuned per server type
- [ ] OPcache recommended ini settings applied to PHP configuration
- [ ] Deployment directory structure created (`releases/`, `current`, `shared/`)

---

# Performance Checklist

- [ ] OPcache memory_consumption sized for application footprint (128MB-512MB typical)
- [ ] OPcache revalidate_freq set to 0 or 2 for production
- [ ] PHP-FPM pm.max_children calculated (available_memory / avg_process_size)
- [ ] PHP-FPM pm.max_requests set to 500-1000 to prevent memory leaks
- [ ] OPcache file_cache enabled for faster restarts

---

# Security Checklist

- [ ] SSL certificates issued via Let's Encrypt for all production domains
- [ ] Auto-renewal scheduled and tested (certbot renewal cron or Forge auto)
- [ ] Nginx TLS configuration reviewed (modern cipher suites, HSTS)
- [ ] PHP-FPM pool access restricted to localhost only
- [ ] OPcache directories not publicly accessible

---

# Reliability Checklist

- [ ] OPcache reset hook added to deployment (`artisan opcache:clear` or script)
- [ ] PHP-FPM health check endpoint configured for load balancer
- [ ] Deployment rollback procedure tested (revert symlink to previous release)
- [ ] php-fpm reload tested after configuration change (graceful, not restart)

---

# Testing Checklist

- [ ] Provisioning tested on staging server before production
- [ ] Server type decomposition verified with workload testing
- [ ] OPcache hit ratio monitored after deployment
- [ ] Deployment script tested end-to-end (clone, install, migrate, symlink)
- [ ] SSL renewal process tested manually once

---

# Maintainability Checklist

- [ ] Forge recipe templates created and version-controlled
- [ ] Deployment script stored in application repo (`deploy/deploy.sh`)
- [ ] PHP-FPM configuration documented with memory calculation notes
- [ ] Server inventory maintained (provider, type, IP, purpose)
- [ ] OPcache configuration documented alongside PHP settings

---

# Anti-Pattern Prevention Checklist

- [ ] No deployment without OPcache reset on PHP-FPM without reload
- [ ] No shared `.env` across different server types in multi-server setup
- [ ] No manual SSH configuration drift from Forge-managed baseline
- [ ] No single server overloaded with all roles in production
- [ ] No deployment script that runs before health check verification

---

# Production Readiness Checklist

- [ ] Monitoring configured for PHP-FPM process count and OPcache metrics
- [ ] SSL certificate expiry monitoring configured (30-day alert)
- [ ] Load balancer health check endpoints verified
- [ ] Backup strategy confirmed for databases on dedicated DB servers
- [ ] Deployment rollback tested from start to finish
- [ ] PHP-FPM status page disabled or restricted

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: server type decomposition validated
- [ ] Security requirements satisfied: SSL, PHP-FPM isolation, ciphers configured
- [ ] Performance requirements satisfied: OPcache and PHP-FPM tuned
- [ ] Testing requirements satisfied: staging provisioning and deployment tested
- [ ] Anti-pattern checks passed: no configuration drift, no overloaded servers
- [ ] Production readiness verified: monitoring, backups, rollback tested

---

# Related References

- Server Hardening (KU-002) -- post-provisioning security
- Ploi Server Management (KU-003) -- competitor, Docker support
- Envoyer (multi-server deploys)
- Nightwatch (monitoring)
