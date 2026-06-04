# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 06-serverless-laravel
**Knowledge Unit:** laravel-cloud
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Laravel Cloud account created and Git repository connected
- [ ] Application pushes via Git automatically trigger deployments
- [ ] Server, database, caching, scaling handled by Cloud platform
- [ ] Hibernation (scale-to-zero) configured for cost savings during idle
- [ ] Auto-scaling verified based on real traffic patterns
- [ ] WebSockets configured if real-time features are needed

---

# Architecture Checklist

- [ ] Fully managed architecture understood (no server-level access, all via Cloud dashboard)
- [ ] K8s-based platform under the hood (Go operator, EKS)
- [ ] Cloudflare tunnels for networking (no public IPs to manage)
- [ ] Vapor predecessor vs Cloud differences understood (Lambda vs K8s)
- [ ] Hibernation vs always-on cost tradeoff evaluated

---

# Implementation Checklist

- [ ] Laravel Cloud project created via dashboard or CLI
- [ ] Git repository connected with deploy key
- [ ] Environment variables configured in Cloud dashboard
- [ ] Database provisioned (managed MySQL/PostgreSQL via Cloud)
- [ ] Queue worker configured for Horizon or default queue
- [ ] SSL configured via Cloud platform (auto Let's Encrypt)

---

# Performance Checklist

- [ ] Hibernation timeout configured (idle minutes before scale-to-zero)
- [ ] Auto-scaling min/max instance count set
- [ ] Redis cache and session driver configured
- [ ] OPcache configured for containerized environment
- [ ] Asset serving via CDN evaluated (Cloudflare integration)

---

# Security Checklist

- [ ] Environment variables stored in Cloud dashboard (not in repo)
- [ ] Cloudflare tunnel encryption verified
- [ ] Database access restricted to Cloud platform only
- [ ] Laravel APP_KEY generated and stored securely
- [ ] SSL auto-provisioning via Let's Encrypt verified

---

# Reliability Checklist

- [ ] Hibernation wake-up tested (cold start from zero instances)
- [ ] Auto-scaling triggers verified under load
- [ ] Database backup configured in Cloud dashboard
- [ ] Rollback via Git revert tested
- [ ] Health check endpoint monitored by Cloud platform

---

# Testing Checklist

- [ ] Application deploys and serves request via Cloud URL
- [ ] Database migration runs successfully on deploy
- [ ] Queue worker processes test job
- [ ] Hibernation triggers after idle period
- [ ] Auto-scaling responds to traffic increase

---

# Maintainability Checklist

- [ ] Cloud project configuration documented
- [ ] Git-based deployment workflow documented in runbook
- [ ] Environment variable changes tracked
- [ ] Cloud cost monitoring configured
- [ ] Platform updates documented (Cloud release notes tracked)

---

# Anti-Pattern Prevention Checklist

- [ ] No server-level customizations (cannot SSH into Cloud servers)
- [ ] No hardcoded environment-specific values in code
- [ ] No deployment without migration strategy (Cloud handles deploy hooks)
- [ ] No local file storage (use S3/Cloud CDN for uploads)
- [ ] No unoptimized assets without CDN cache

---

# Production Readiness Checklist

- [ ] Auto-scaling min instances configured for baseline traffic
- [ ] Database backup schedule verified
- [ ] SSL certificate active and auto-renewing
- [ ] Monitoring dashboard reviewed (Cloud metrics)
- [ ] Rollback tested via Git revert or Cloud dashboard
- [ ] Cost budget alerts configured

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: fully managed K8s-based hosting understood
- [ ] Security requirements satisfied: env vars in dashboard, SSL, DB access restricted
- [ ] Performance requirements satisfied: hibernation, auto-scaling, caching configured
- [ ] Testing requirements satisfied: deploy, migration, queue, hibernation verified
- [ ] Anti-pattern checks passed: no server-level customizations, no local storage
- [ ] Production readiness verified: backups, SSL, monitoring, rollback, cost alerts

---

# Related References

- Laravel Vapor (KU-015) -- predecessor, Lambda-based
- Kubernetes for Laravel (KU-013) -- Cloud is built on K8s
- Fly.io Deployment (KU-017) -- comparable Docker-based platform
- Environment & Secret Management (KU-021)
- Observability & Monitoring (KU-022)
