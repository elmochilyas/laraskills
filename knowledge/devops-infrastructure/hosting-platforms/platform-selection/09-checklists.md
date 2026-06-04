# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 11-hosting-platforms
**Knowledge Unit:** platform-selection
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] DigitalOcean App Platform connected to GitHub repository
- [ ] `app.yaml` configured with build commands and run configuration
- [ ] Buildpack auto-detection verified for Laravel
- [ ] Component model defined (web service, worker service, cron service)
- [ ] Blue-green deployment verified (traffic switching, health check gates)
- [ ] Managed database (PostgreSQL/MySQL) and Redis provisioned

---

# Architecture Checklist

- [ ] Buildpack deployment architecture understood (auto-detect, PHP config, Composer/npm)
- [ ] `app.yaml` configuration designed (build/run commands, health checks, instance sizing, env vars)
- [ ] Blue-green mechanism understood (traffic switching, health gate, rollback, deploy hooks)
- [ ] Component model designed (web web server, worker queue, cron scheduler, managed database)
- [ ] DO ecosystem integration (Spaces CDN, managed databases, monitoring, networking)

---

# Implementation Checklist

- [ ] GitHub repo connected, auto-deploy on push enabled
- [ ] `app.yaml` created with web command, build command, cron command
- [ ] Web service configured with HTTP endpoint and health check
- [ ] Worker service configured for queue jobs
- [ ] Cron service configured for scheduler
- [ ] Managed PostgreSQL/MySQL and Redis provisioned

---

# Performance Checklist

- [ ] Instance size selected (CPU/memory per component)
- [ ] Autoscaling configured for web service
- [ ] Spaces CDN for static asset delivery
- [ ] Redis for cache and session optimization
- [ ] Build time optimized (skip unnecessary steps)

---

# Security Checklist

- [ ] Environment variables in App Platform dashboard
- [ ] Database private networking
- [ ] HTTPS enforced via App Platform
- [ ] `app.yaml` does not contain secrets
- [ ] Worker component isolated from web

---

# Reliability Checklist

- [ ] Health check endpoint configured and tested
- [ ] Blue-green deploys verified (zero-downtime)
- [ ] Managed DB auto-backups confirmed
- [ ] Queue processing tested
- [ ] Rollback via previous deployment

---

# Testing Checklist

- [ ] App deploys and serves HTTP response
- [ ] Health check endpoint returns 200
- [ ] Worker processes test job
- [ ] Managed database accessible
- [ ] Custom domain resolves with HTTPS

---

# Maintainability Checklist

- [ ] `app.yaml` version-controlled
- [ ] Environment variables documented
- [ ] Deployment workflow documented in README
- [ ] Resource inventory maintained
- [ ] Cost tracking configured

---

# Anti-Pattern Prevention Checklist

- [ ] No `.env` in repository
- [ ] No secrets in `app.yaml`
- [ ] No combined web + worker in single component
- [ ] No health check always returning 200
- [ ] No build without cache optimization

---

# Production Readiness Checklist

- [ ] Production environment verified
- [ ] Database backups confirmed
- [ ] Custom domain with HTTPS active
- [ ] Autoscaling min/max set
- [ ] Health check integrated
- [ ] Blue-green deploys active

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: components (web/worker/cron), app.yaml, blue-green
- [ ] Security requirements satisfied: env vars in dashboard, private DB, HTTPS
- [ ] Performance requirements satisfied: sizing, autoscaling, CDN
- [ ] Testing requirements satisfied: deploy, health check, worker, domain verified
- [ ] Anti-pattern checks passed: no secrets in yaml, separate components
- [ ] Production readiness verified: backups, HTTPS, autoscaling, blue-green active

---

# Related References

- Railway (similar PaaS)
- Platform.sh (advanced)
- Forge (VPS management)
