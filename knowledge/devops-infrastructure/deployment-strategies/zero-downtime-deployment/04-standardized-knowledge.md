# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 02-deployment-strategies
**Knowledge Unit:** zero-downtime-deployment
**Difficulty:** Intermediate
**Category:** Deployment Strategies
**Last Updated:** 2026-06-03

# Overview

Zero-downtime deployment (ZDD) is the practice of updating a production application without interrupting service. Users experience no errors, no connection drops, and no degraded performance during the deployment. ZDD is achieved through strategies that separate deployment preparation from traffic switching: symlink swap (Envoyer, Deployer), blue-green (dual environments), or graceful reload (Octane).

ZDD exists because deployment is when applications are most vulnerable to errors. Traditional deployments that take the application offline briefly cause user-facing errors, lost revenue, and eroded trust. The engineering value is maintaining availability during the highest-risk operation in application management.

# Core Concepts

- **Atomic Cutover** — The moment traffic switches from old to new version happens instantaneously, not progressively
- **Release Preparation** — All deployment work (cloning, dependency installation, building, testing) happens in isolation from live traffic
- **Health Check Gate** — Automated verification that the new release is healthy before it receives traffic
- **Instant Rollback** — The ability to revert to the previous version immediately without re-deployment
- **Release Isolation** — Each release is self-contained in its own directory, with shared data (`shared/`) separate from code

# When To Use

- Every production Laravel deployment where users are actively using the application
- Applications with SLAs or uptime requirements
- Customer-facing applications where deployment errors cause revenue loss
- Multi-server environments requiring synchronized releases

# When NOT To Use

- Development and personal projects where deployment pauses are acceptable
- Scheduled maintenance windows where brief downtime is communicated
- Database-only changes that cannot be applied without table locking
- Applications with stateful sessions on the application server

# Best Practices

**Always Health Check.** Never deploy without an automated health check gate. The health check should validate the full application stack.

**Plan for Rollback.** Every deployment should have a tested rollback procedure. Rollback must be faster than fixing forward.

**Database Changes First.** For migrations that are backward-compatible, apply them before the code deployment. This separates schema risk from deployment risk.

**Test ZDD Mechanism.** The zero-downtime mechanism (symlink swap, blue-green switch, Octane reload) should be tested independently of the application code being deployed.

# Architecture Guidelines

ZDD requires the deployment directory structure to support multiple simultaneous releases. Standard layout: `releases/`, `current` symlink, `shared/`. Each release is a complete application copy.

File storage must be shared across releases. User uploads and persistent files live in `shared/` and are symlinked into each release. S3 or external storage is preferred.

Database must be shared. Schema must be backward-compatible with the previous release to enable rollback.

# Performance Considerations

**Release Preparation Time.** The window between trigger and cutover is the risk window. Minimize this by caching Composer dependencies and npm packages.

**Storage for Releases.** Each release consumes disk space. Configure retention policies (3-5 releases) to manage storage.

**Health Check Warm-up.** After cutover, the new release may need time to warm caches. Allow 10-30s for the health check to stabilize.

# Common Mistakes

**Deploying Without Health Check.** The most common ZDD omission. A bad release goes live immediately with no gate.

**No Rollback Capability.** Deploying database migrations that cannot be rolled back. If the code release fails, the database is stuck in a state incompatible with the old code.

**Test-Environment Mismatch.** The ZDD mechanism works in staging but fails in production due to different directory layout, file permissions, or server configuration.

# Examples

**Symlink Swap Sequence:**
1. Create `/var/www/app/releases/20250601000000/`
2. Clone code, install dependencies, build assets
3. Create storage symlinks (`shared/` → release)
4. Run backward-compatible migrations
5. Atomic: `ln -sfn releases/20250601000000 current`
6. Clear OPcache, restart queue workers
7. Verify health check on `current`

# Related Topics

**Prerequisites:** Basic deployment concepts, server administration
**Closely Related:** Envoyer, Deployer PHP, Blue-Green Deployment, Canary Deployment, Octane Deployment
**Advanced Follow-Ups:** Database Migration Strategies, Deployment Pipeline Design
**Cross-Domain Connections:** Environment Management, Observability
