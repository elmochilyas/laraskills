# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 01-server-provisioning
**Knowledge Unit:** ploi-server-management
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Ploi account connected to DigitalOcean, Linode, AWS, Vultr, or Hetzner
- [ ] Ploi agent installed on provisioned servers for dashboard management
- [ ] LEMP stack installed and configured (Nginx, PHP-FPM, MySQL/PostgreSQL, Redis)
- [ ] Docker server support evaluated for containerized workloads
- [ ] SSL certificates configured with Let's Encrypt auto-renewal
- [ ] Staging sites set up with isolated environments and automatic SSL

---

# Architecture Checklist

- [ ] Agent-based architecture understood (Ploi agent vs. Forge SSH-based)
- [ ] Load balancer configured for multi-server deployments
- [ ] Server type decomposition considered (app, web, database, cache, worker)
- [ ] Docker server option evaluated against traditional LEMP setup
- [ ] Status page configured for public service health transparency

---

# Implementation Checklist

- [ ] Ploi API token generated for CI/CD pipeline integration
- [ ] Deployment script created with migration, cache clear, queue restart steps
- [ ] Queue workers configured via Supervisor with Ploi dashboard
- [ ] Cron jobs defined in Ploi for Laravel scheduler (`schedule:run`)
- [ ] Firewall rules configured through Ploi interface (SSH, HTTP, HTTPS)

---

# Performance Checklist

- [ ] PHP-FPM pm settings tuned (pm.max_children per memory allocation)
- [ ] OPcache configured with production settings (memory, revalidation)
- [ ] Redis cache session driver validated for performance
- [ ] Node.js asset build pipeline reviewed for production optimization

---

# Security Checklist

- [ ] SSH key-based authentication enforced
- [ ] Ploi agent communication verified as encrypted
- [ ] Firewall rules minimized (ports 22, 80, 443 only)
- [ ] Fail2ban installed for brute-force protection
- [ ] Automatic security patches configured (unattended-upgrades)

---

# Reliability Checklist

- [ ] Ploi backup feature enabled for database and files
- [ ] Supervisor auto-restart configured for queue workers
- [ ] Deployment health checks verified (site responds 200 after deploy)
- [ ] Staging environment isolated from production data
- [ ] Rollback procedure documented and tested

---

# Testing Checklist

- [ ] Ploi agent connectivity verified on all provisioned servers
- [ ] Deployment script tested on staging environment first
- [ ] SSL auto-renewal confirmed working post-deployment
- [ ] Load balancer health check endpoints validated
- [ ] Docker service integration tested (if Docker server enabled)

---

# Maintainability Checklist

- [ ] Server provisioning documented in runbook (provider, region, size, stack)
- [ ] Deployment scripts version-controlled in application repository
- [ ] Ploi recipe templates created for standardized server setup
- [ ] Firewall rule changes tracked and auditable
- [ ] Agent version and update strategy documented

---

# Anti-Pattern Prevention Checklist

- [ ] No manual SSH modifications outside Ploi-managed configuration
- [ ] No hardcoded environment variables in deployment scripts
- [ ] No sensitive data exposed in Ploi deployment logs
- [ ] No production environment used for staging/testing
- [ ] No over-provisioned servers without monitoring

---

# Production Readiness Checklist

- [ ] Monitoring configured (Ploi status page or external like Nightwatch)
- [ ] Database backup strategy verified (automated, tested restore)
- [ ] SSL certificate status verified (no expired or misconfigured certs)
- [ ] Load testing completed for expected traffic
- [ ] Rollback tested by reverting to previous deployment release
- [ ] PHP-FPM status endpoint disabled or restricted in production

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: agent-based server management validated
- [ ] Security requirements satisfied: SSH, firewall, SSL, patching configured
- [ ] Performance requirements satisfied: PHP-FPM, OPcache, Redis tuned
- [ ] Testing requirements satisfied: staging deployment verified
- [ ] Anti-pattern checks passed: no manual overrides, no exposed secrets
- [ ] Production readiness verified: monitoring, backups, rollback tested

---

# Related References

- Laravel Forge Provisioning (KU-001) -- primary alternative
- Deployer PHP (KU-008) -- can be used with Ploi-managed servers
- Environment & Secret Management (KU-021) -- env management in Ploi
