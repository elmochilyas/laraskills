# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 11-hosting-platforms
**Knowledge Unit:** digitalocean-app-platform
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] App Platform connected to GitHub repository for auto-deploy
- [ ] `app.yaml` configured with build and run commands
- [ ] Buildpack auto-detection verified for Laravel
- [ ] Blue-green deployment strategy configured
- [ ] Managed database (PostgreSQL, MySQL, Redis) provisioned
- [ ] Custom domain and HTTPS configured

---

# Architecture Checklist

- [ ] Buildpack-based deployment architecture understood (no Dockerfile control)
- [ ] Component model designed (web service, worker service, cron service)
- [ ] Blue-green deployment mechanism understood (traffic switching, health check gates)
- [ ] `app.yaml` configuration designed (build/run commands, health checks, instance sizing)
- [ ] DO ecosystem integration designed (Spaces CDN, managed databases, monitoring)

---

# Implementation Checklist

- [ ] GitHub repository connected with auto-deploy on push
- [ ] `app.yaml` created with build command (`composer install --no-dev`, `npm run build`)
- [ ] Web service component defined with HTTP endpoint
- [ ] Worker service component defined for queue processing
- [ ] Cron service component defined for Laravel scheduler
- [ ] Managed database created (PostgreSQL or MySQL)

---

# Performance Checklist

- [ ] Instance sizing selected (basic vs professional, CPU/memory)
- [ ] Autoscaling configured for web service
- [ ] Spaces CDN configured for static assets
- [ ] Redis managed database for cache and sessions
- [ ] Build time optimized (Composer and npm caching)

---

# Security Checklist

- [ ] Environment variables stored in App Platform dashboard (not in repo)
- [ ] Database connection secured (private networking)
- [ ] HTTPS enforced via App Platform auto-SSL
- [ ] `app.yaml` does not contain secrets
- [ ] Worker service runs in isolated component

---

# Reliability Checklist

- [ ] Health check endpoint configured for web service
- [ ] Blue-green deployment tested (zero-downtime verified)
- [ ] Database backup configured (managed DB auto-backup)
- [ ] Worker queue processing tested (SQS or DB queue)
- [ ] Rollback via previous deployment

---

# Testing Checklist

- [ ] App deploys from GitHub and serves HTTP response
- [ ] Health check endpoint passes (200 OK)
- [ ] Worker processes a test job
- [ ] Managed database connection verified
- [ ] Custom domain resolves with HTTPS

---

# Maintainability Checklist

- [ ] `app.yaml` version-controlled with documentation
- [ ] Environment variables documented
- [ ] Deployment workflow documented in README
- [ ] DO resource inventory maintained
- [ ] Cost tracking configured

---

# Anti-Pattern Prevention Checklist

- [ ] No `.env` file committed to repository
- [ ] No secrets in `app.yaml`
- [ ] No single component for combined web + worker (use separate)
- [ ] No health check endpoint that always returns 200
- [ ] No build that runs without cache optimization

---

# Production Readiness Checklist

- [ ] App Platform production environment verified
- [ ] Managed database backups confirmed
- [ ] Custom domain with valid HTTPS
- [ ] Autoscaling configured (min/max instances)
- [ ] Health check integrated with platform
- [ ] Blue-green deployment verified

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: components (web/worker/cron), app.yaml, blue-green
- [ ] Security requirements satisfied: env vars in dashboard, private DB, HTTPS
- [ ] Performance requirements satisfied: instance sizing, autoscaling, CDN
- [ ] Testing requirements satisfied: deploy, health check, worker, domain verified
- [ ] Anti-pattern checks passed: no secrets in app.yaml, no combined components
- [ ] Production readiness verified: backups, HTTPS, autoscaling, blue-green active

---

# Related References

- Railway Laravel Deployment (KU-018) -- comparable managed PaaS
- Platform.sh Laravel (KU-019) -- more advanced PaaS with Git-branch environments
- Laravel Forge Provisioning (KU-001) -- DO Droplets + Forge alternative
- Environment & Secret Management (KU-021)
