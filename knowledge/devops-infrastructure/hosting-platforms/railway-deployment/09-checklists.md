# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 11-hosting-platforms
**Knowledge Unit:** railway-deployment
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Railway account connected to GitHub repository
- [ ] Laravel auto-detected via Railpack (no manual Dockerfile needed)
- [ ] Service model understood (web always-on, cron scheduled, worker queue)
- [ ] Pre-deploy hooks configured for migrations
- [ ] Managed database (PostgreSQL, MySQL) provisioned
- [ ] Monolith project architecture adopted (App, Cron, Worker, DB in one project)

---

# Architecture Checklist

- [ ] Railpack buildpack architecture understood (auto-detect framework, PHP config, Composer/npm)
- [ ] Service model designed (web service HTTP, cron service scheduled, worker service queue)
- [ ] Git-push workflow designed (repo connection, per-push deploys, deploy logs)
- [ ] Pre-deploy hook design (migration execution, failure handling, health check)
- [ ] Custom configuration strategy (railway.json, Dockerfile override, env vars)

---

# Implementation Checklist

- [ ] GitHub repo connected to Railway with auto-deploy
- [ ] Web service configured (HTTP port, health check path)
- [ ] Cron service configured (`php artisan schedule:run`)
- [ ] Worker service configured for queue processing
- [ ] Managed PostgreSQL or MySQL database provisioned
- [ ] `railway.json` created if custom config needed

---

# Performance Checklist

- [ ] Service sizing selected (CPU/memory per service)
- [ ] Redis configured for cache and sessions
- [ ] Build time measured and optimized (Railpack caching)
- [ ] Pre-deploy hook timing measured (<30s)
- [ ] Worker concurrency tuned

---

# Security Checklist

- [ ] Environment variables in Railway dashboard (not in repo)
- [ ] Database private networking (Railway internal)
- [ ] HTTPS auto-configured
- [ ] `railway.json` does not contain secrets
- [ ] API tokens stored as Railway secrets

---

# Reliability Checklist

- [ ] Health check endpoint configured for web service
- [ ] Pre-deploy hook failure handling
- [ ] Worker auto-restart on failure
- [ ] Database backup configured (Railway managed DB)
- [ ] Rollback via previous deployment

---

# Testing Checklist

- [ ] Railway deploy succeeds and app responds
- [ ] Health check returns 200
- [ ] Pre-deploy hook runs migration
- [ ] Worker processes test job
- [ ] Custom domain resolves with HTTPS

---

# Maintainability Checklist

- [ ] `railway.json` (if used) version-controlled
- [ ] Environment variables documented
- [ ] Deployment workflow in README
- [ ] Railway cost tracking configured
- [ ] Resource inventory maintained

---

# Anti-Pattern Prevention Checklist

- [ ] No `.env` committed to repo
- [ ] No secrets in `railway.json`
- [ ] No combined web + worker in single service (use separate)
- [ ] No health check that always returns 200
- [ ] No build without Railpack or Dockerfile optimization

---

# Production Readiness Checklist

- [ ] Production environment verified in Railway
- [ ] Managed database backups confirmed
- [ ] Custom domain with HTTPS
- [ ] Health check integrated with Railway
- [ ] Pre-deploy hook tested (migration runs on deploy)
- [ ] Rollback via Railway deployment history

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: services (web/cron/worker), Railpack, pre-deploy hooks
- [ ] Security requirements satisfied: env vars in dashboard, private DB, HTTPS
- [ ] Performance requirements satisfied: sizing, Redis, build optimization
- [ ] Testing requirements satisfied: deploy, health check, migration, worker verified
- [ ] Anti-pattern checks passed: no secrets in config, separate services
- [ ] Production readiness verified: backups, HTTPS, health check, rollback ready

---

# Related References

- Fly.io Deployment (KU-017) -- comparable Docker-based platform
- Platform.sh Laravel (KU-019) -- Git-push model alternative
- Laravel Cloud (KU-016) -- fully managed alternative
- Production Dockerfiles (KU-010) -- custom Dockerfile on Railway
