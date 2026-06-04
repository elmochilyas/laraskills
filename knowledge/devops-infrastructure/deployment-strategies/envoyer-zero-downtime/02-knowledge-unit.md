# Envoyer Zero-Downtime Deployments

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Deployment Strategies
- **Knowledge Unit:** Envoyer Zero-Downtime Deployments
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Envoyer is a first-party zero-downtime deployment service for Laravel that uses symlink-swap strategy with health check verification, multi-server orchestration, and instant rollback. It eliminates deployment downtime and provides a centralized dashboard for managing releases across multiple servers with no SSH access required.

---

## Core Concepts

- **Symlink Swap** — Atomic switch by updating `current` symlink to the new release directory
- **Health Check Gate** — HTTP endpoint verification before the symlink swap is confirmed
- **Deployment Hooks** — Custom scripts executed at each stage (clone, install, activate, deactivate)
- **Multi-Server Orchestration** — Coordinated deployment across multiple servers with consistent release state
- **Instant Rollback** — Revert to previous release by pointing the symlink back to the prior directory

---

## Mental Models

- **Deployment Risk Insurance** — Envoyer is insurance against deployment failures. The health check gate ensures bad releases never go live; instant rollback ensures quick recovery if they do.
- **Forge Complements Envoyer** — Forge manages servers (provisioning, configuration); Envoyer manages deployments (application releases). Together they form the "official" Laravel deployment stack.
- **Atomicity First** — The symlink swap is the atomic operation that makes deployment safe. Everything before the swap is preparation that can be safely aborted; everything after is the live release.

---

## Internal Mechanics

When a deployment is triggered, Envoyer connects to each target server via SSH, clones the repository into a new timestamped directory under `releases/`, installs Composer dependencies and builds assets, creates symlinks for shared resources (`.env`, `storage`), runs custom deployment hooks (including database migrations), and then atomically updates the `current` symlink. After the swap, post-deployment hooks run (OPcache clear, queue restart). The health check endpoint is polled to verify the new release is healthy. The previous release remains in `releases/` for instant rollback.

---

## Patterns

- **Migration Before Swap** — Run database migrations before the symlink swap so the schema is ready when new code receives traffic
- **Cache Clear After Swap** — Clear OPcache and restart queue workers after the swap to avoid race conditions
- **Health Check Warm-Up** — Allow 10-30 seconds for the new release to warm caches before the health check passes
- **Environment-Specific Projects** — Create separate Envoyer projects for staging and production to prevent accidental cross-deployment

---

## Architectural Decisions

- **Envoyer vs. Deployer PHP** — Choose Envoyer when managed service, UI dashboard, and Forge integration justify the cost; choose Deployer for budget-conscious or self-hosted deployments
- **Envoyer vs. Forge Built-in ZDD** — For new Forge sites (2025+), Forge-native zero-downtime deployments reduce the need for Envoyer. Use Envoyer for existing Forge sites or complex multi-server orchestration.
- **Envoyer vs. Octane** — Octane's `octane:reload` provides built-in zero-downtime, eliminating the need for Envoyer. Not applicable to PHP-FPM deployments.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Managed zero-downtime deployments with health checks | Per-project pricing | Budget-constrained teams may prefer Deployer PHP |
| Multi-server synchronized deployments | SSH keys stored on Envoyer servers | Keys become critical assets requiring rotation and audit |
| Instant rollback capability | Previous release must be retained | Disk space consumed by retained releases |
| UI dashboard with team access and notifications | Environments with no SSH access cannot use Envoyer | Air-gapped or self-hosted environments need alternatives |

---

## Performance Considerations

Release preparation time (clone, install, build) is the window when deployment cannot be rolled back without completing. Optimize Composer install and asset build steps to minimize this window. Envoyer does not enforce a deployment lock by default — implement locks at the application or CI level. Configure generous health check timeouts (10-30 seconds) because PHP applications after cache clearing may take time to reach a healthy state. Retain 3-5 releases for rollback capability while managing disk usage.

---

## Production Considerations

Envoyer manages deployment but not server configuration — provision servers separately with Forge. Multi-server deployments require shared services (database, Redis, file storage) accessible from all servers. The deployment directory layout must follow Envoyer's expectations: `current` symlink, `releases/`, `shared/`. Health check endpoints should verify the full application stack, not just HTTP 200. SSH keys used by Envoyer should be rotated periodically and monitored for usage.

---

## Common Mistakes

- **Running Migrations After Symlink Swap** — New code receives traffic immediately after the swap. If migrations run after, the new code encounters a mismatched schema. Run migrations before the swap.
- **Skipping Health Check Configuration** — Deploying without health check means bad releases go live. Always configure at least a basic HTTP health check.
- **Not Testing Rollback** — Assuming rollback works without testing. Previous releases may have been cleaned up or rollback migration may fail. Test rollback in staging.
- **Manual Symlink Changes** — Operators manually changing symlinks outside Envoyer break Envoyer's release tracking. Always use Envoyer for deployments.

---

## Failure Modes

- **Health Check Timeout** — Application takes too long to warm caches, causing deployment failure. Detection: Envoyer reports health check failure. Mitigation: increase health check timeout, optimize cache warming.
- **SSH Key Rotation Failure** — Server SSH keys are rotated without updating Envoyer. Detection: deployment fails with authentication error. Mitigation: document key rotation procedure, test deployment after rotation.
- **Concurrent Deployment Race** — Two deployments triggered simultaneously without a lock. Detection: release structure corrupted. Mitigation: implement deployment lock mechanism.
- **Rollback Schema Incompatibility** — Previous release's code is incompatible with the current database schema. Detection: rollback succeeds but application returns 500 errors. Mitigation: always use backward-compatible migrations.

---

## Ecosystem Usage

Envoyer is a core component of the Laravel deployment ecosystem, tightly integrated with Laravel Forge (same authentication, complementary services). It can deploy to any Linux server with SSH access, not just Forge-managed servers. Envoyer integrates with GitHub, GitLab, and Bitbucket for repository access. The Envoyer API allows triggering deployments from CI/CD pipelines. The 2025 Forge relaunch with built-in zero-downtime deployments reduces Envoyer's necessity for new Forge sites.

---

## Related Knowledge Units

### Prerequisites
- Laravel Forge Provisioning, SSH key management

### Related Topics
- Deployer PHP (open-source alternative)
- Zero-Downtime Deployment (conceptual)
- Laravel Octane Deployment

### Advanced Follow-up Topics
- Blue-Green Deployment
- Canary Deployment
- Database Migration in CI

---

## Research Notes

Envoyer's integration with Forge makes Forge+Envoyer the "official" Laravel deployment stack. Recommend this combination for teams without existing infrastructure preferences. Envoyer replaces the need for custom deployment scripts — do not recommend writing shell-based deployments when Envoyer is available. The 2025 Forge relaunch includes built-in zero-downtime deployments, reducing Envoyer's necessity for new Forge sites.
