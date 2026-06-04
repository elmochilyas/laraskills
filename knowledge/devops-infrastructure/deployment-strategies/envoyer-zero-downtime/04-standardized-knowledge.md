# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 02-deployment-strategies
**Knowledge Unit:** envoyer-zero-downtime
**Difficulty:** Intermediate
**Category:** Deployment Strategies
**Last Updated:** 2026-06-03

# Overview

Envoyer is a first-party zero-downtime deployment service for Laravel and PHP applications. It uses a symlink-swap strategy: new code is cloned into an isolated directory, dependencies are installed, and only after successful preparation does an atomic symlink update make the new release live. Envoyer supports multi-server deployments, health check verification, instant rollbacks, and integrates with GitHub/GitLab/Bitbucket.

Envoyer exists because deployment is the riskiest operation in application management. The engineering value is eliminating deployment downtime, providing instant rollback capability, and orchestrating multi-server releases from a centralized dashboard with no SSH access required.

# Core Concepts

- **Symlink Swap** — Atomic switch by updating `current` symlink to the new release directory
- **Health Check Gate** — HTTP endpoint verification before the symlink swap is confirmed
- **Deployment Hooks** — Custom scripts executed at each stage (clone, install, activate, deactivate)
- **Multi-Server Orchestration** — Coordinated deployment across multiple servers with consistent release state
- **Instant Rollback** — Revert to previous release by pointing the symlink back to the prior directory

# When To Use

- Teams already using Laravel Forge (tight integration, same authentication)
- Multi-server environments requiring synchronized deployments
- Non-technical stakeholders needing deployment visibility (dashboard, notifications)
- Teams wanting managed deployment without maintaining deployment infrastructure
- Applications where instant rollback is critical

# When NOT To Use

- Octane-based deployments where `octane:reload` provides built-in zero-downtime
- Budget-constrained teams (Envoyer has per-project pricing)
- Teams preferring open-source tooling (Deployer PHP)
- Air-gapped or self-hosted environments where SaaS access is restricted
- Single-server deployments where Envoyer's multi-server features are unnecessary

# Best Practices

**Health Check Must Be Application-Level.** Health checks should verify the full application stack, not just HTTP 200. Include database connectivity, queue worker health, and external API dependencies.

**Use Environment-Specific Envoyer Projects.** Create separate Envoyer projects for staging and production. This prevents accidental deployment to production and allows different health check URLs and notification settings.

**Order Hooks Correctly.** Run database migrations before the symlink swap (so schema is ready when new code receives traffic), but run cache clearing and queue restart after the swap (to avoid race conditions).

**Monitor Rollback Preparedness.** Envoyer retains the previous release directory. Verify that rollback can succeed: previous migrations must be reversible, and the previous `.env` must still be compatible with the database state.

# Architecture Guidelines

Envoyer manages deployment but not server configuration. Servers must be provisioned and configured separately (Forge recommended). Envoyer's scope is the application release lifecycle, not infrastructure management.

Multi-server deployments require shared services. Database, Redis, and file storage must be accessible from all servers. Envoyer handles the release directory on each server independently.

The deployment directory layout must follow Envoyer's expectations: `current` symlink, `releases/` directory, `shared/` directory. Custom layouts require configuration.

# Performance Considerations

**Release Preparation Time.** The time between "deploy started" and "symlink swapped" is the period when deployment cannot be rolled back without completing. Optimize Composer install and asset build steps.

**Concurrent Deployment Prevention.** Envoyer does not enforce a deployment lock by default. Implement lock mechanisms at the application or CI level to prevent concurrent deployments.

**Health Check Timeout.** Configure generous health check timeouts. PHP applications, especially after cache clearing, may take 10-30 seconds to reach a healthy state.

# Security Considerations

**SSH Key Storage.** Envoyer stores SSH private keys for server access. These are critical assets. Monitor their usage and rotate periodically.

**API Token Scope.** Envoyer API tokens used in CI/CD pipelines should have deployment-only permissions. Avoid tokens with project management or administrative scopes.

**Health Check Data Exposure.** Health check endpoints should not expose configuration details, environment variables, or internal application state.

# Common Mistakes

**Running Migrations After Symlink Swap.** New code receives traffic immediately after the swap. If migrations run after the swap, the new code encounters a mismatched schema.

**Skipping Health Check Configuration.** Deploying without health check verification means bad releases go live. Always configure at least a basic HTTP health check.

**Not Testing Rollback.** Assuming rollback works without testing. Previous releases may have been cleaned up, or the rollback migration may fail. Test rollback in staging.

**Manual Symlink Changes.** Operators manually changing symlinks outside Envoyer break Envoyer's release tracking and make future deployments inconsistent.

# Examples

**Envoyer Directory Layout:**
```
/var/www/app/
├── current -> releases/20250101000000/
├── releases/
│   ├── 20250101000000/
│   └── 20250101020000/
└── shared/
    ├── .env
    └── storage/
```

**Deployment Hook Order:**
1. Clone repository
2. Install Composer dependencies
3. Run npm build
4. Create storage symlinks
5. **Run migrations** (before swap)
6. **Atomic symlink swap**
7. Clear OPcache
8. Restart queue workers
9. Verify health check

# Related Topics

**Prerequisites:** Laravel Forge Provisioning, SSH key management
**Closely Related:** Deployer PHP (open-source alternative), Zero-Downtime Deployment (conceptual), Laravel Octane Deployment
**Advanced Follow-Ups:** Blue-Green Deployment, Canary Deployment, Database Migration in CI
**Cross-Domain Connections:** Environment & Secret Management, Observability & Monitoring

# AI Agent Notes

- Envoyer's integration with Forge makes Forge+Envoyer the "official" Laravel deployment stack. AI agents should recommend this combination for teams without existing infrastructure preferences.
- Envoyer replaces the need for custom deployment scripts. Agents should not recommend writing shell-based deployments when Envoyer is available.
- The 2025 Forge relaunch includes built-in zero-downtime deployments, reducing Envoyer's necessity for new Forge sites.
