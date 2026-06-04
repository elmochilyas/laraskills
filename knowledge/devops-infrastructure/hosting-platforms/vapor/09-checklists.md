# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 11-hosting-platforms
**Knowledge Unit:** vapor
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Railway account connected to GitHub repository
- [ ] Laravel auto-detected via Railpack (zero-config deployment)
- [ ] Service model configured (web, cron, worker services)
- [ ] Pre-deploy hooks configured for migration execution
- [ ] Managed database (PostgreSQL, MySQL) provisioned
- [ ] Monolith architecture adopted (App, Cron, Worker, DB in single project)

---

# Architecture Checklist

- [ ] Railpack auto-detection designed (buildpack analysis, PHP config, Composer/npm)
- [ ] Service model designed (web HTTP always-on, worker queue, cron scheduled)
- [ ] Git-push workflow designed (repo connection, per-push deploys, deploy logs)
- [ ] Pre-deploy hooks designed (migration, failure handling, health checking)
- [ ] Custom configuration strategy (railway.json, Dockerfile override, env vars)

---

# Implementation Checklist

- [ ] GitHub repo connected, auto-deploy on push
- [ ] Web service configured (HTTP port: 8080, health check path)
- [ ] Worker service configured for queue processing
- [ ] Cron service configured (`php artisan schedule:run`)
- [ ] Managed PostgreSQL/MySQL database created
- [ ] Pre-deploy hook configured to run `php artisan migrate --force`

---

# Performance Checklist

- [ ] Service sizing selected per component (CPU/memory)
- [ ] Redis for cache and sessions
- [ ] Build time optimized via Railpack caching
- [ ] Pre-deploy hook execution timed (<30s)
- [ ] Worker concurrency tuned per service

---

# Security Checklist

- [ ] Environment variables in Railway dashboard
- [ ] Database private networking
- [ ] HTTPS auto-configured
- [ ] No secrets in `railway.json`
- [ ] API tokens as Railway secrets

---

# Reliability Checklist

- [ ] Health check endpoint configured
- [ ] Pre-deploy hook failure handling defined
- [ ] Worker auto-restart enabled
- [ ] Managed database backups confirmed
- [ ] Rollback via Railway deployment history

---

# Testing Checklist

- [ ] Railway deploy succeeds and app responds
- [ ] Health check returns 200
- [ ] Pre-deploy hook runs migration
- [ ] Worker processes test job
- [ ] Custom domain resolves with HTTPS

---

# Maintainability Checklist

- [ ] Configuration (if custom) version-controlled
- [ ] Environment variables documented
- [ ] Deployment workflow in README
- [ ] Cost tracking configured
- [ ] Resource inventory maintained

---

# Anti-Pattern Prevention Checklist

- [ ] No `.env` in repository
- [ ] No secrets in `railway.json`
- [ ] No combined web + worker in single service
- [ ] No health check always returning 200
- [ ] No build without cache optimization

---

# Production Readiness Checklist

- [ ] Production environment verified
- [ ] Database backups confirmed
- [ ] Custom domain with HTTPS active
- [ ] Health check integrated with platform
- [ ] Pre-deploy hook tested
- [ ] Rollback via deployment history

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: Railpack, services (web/cron/worker), hooks
- [ ] Security requirements satisfied: env vars in dashboard, private DB, HTTPS
- [ ] Performance requirements satisfied: sizing, Redis, build optimization
- [ ] Testing requirements satisfied: deploy, health, migration, worker verified
- [ ] Anti-pattern checks passed: no secrets in config, separate components
- [ ] Production readiness verified: backups, HTTPS, health check, rollback ready

---

# Related References

- Fly.io (Docker alternative)
- Platform.sh (advanced PaaS)
- Forge (VPS)
