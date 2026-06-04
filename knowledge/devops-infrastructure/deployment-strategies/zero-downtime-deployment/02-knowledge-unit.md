# Zero-Downtime Deployment

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Deployment Strategies
- **Knowledge Unit:** Zero-Downtime Deployment
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Zero-downtime deployment (ZDD) updates a production application without interrupting service, ensuring users experience no errors, connection drops, or degraded performance. It is achieved through strategies that separate deployment preparation from traffic switching: symlink swap, blue-green dual environments, or graceful reload (Octane).

---

## Core Concepts

- **Atomic Cutover** — Traffic switches from old to new version instantaneously, not progressively
- **Release Preparation** — All deployment work (cloning, dependency installation, building, testing) happens in isolation from live traffic
- **Health Check Gate** — Automated verification that the new release is healthy before it receives traffic
- **Instant Rollback** — Revert to the previous version immediately without re-deployment
- **Release Isolation** — Each release is self-contained in its own directory, with shared data (`shared/`) separate from code

---

## Mental Models

- **Surgical Precision** — Deployment is the highest-risk operation in application management. ZDD is like operating on a patient without stopping their heart — every action must be reversible and non-disruptive.
- **Preparation vs. Activation** — Everything before the cutover is preparation that can be safely aborted; the cutover itself is the only point of risk. Maximize the preparation phase, minimize the risk window.
- **Rollback Must Be Faster Than Fix Forward** — If a deployment goes wrong, rolling back to the previous known-good state must be faster and safer than trying to fix the new release in place.

---

## Internal Mechanics

A zero-downtime deployment begins when the deployment tool connects to the server and creates a new release directory. Code is cloned, dependencies are installed, and assets are built in isolation. Shared resources (`.env`, `storage`, uploads) are symlinked from a `shared/` directory. Database migrations are applied. A health check verifies the new release. The atomic cutover updates the `current` symlink to the new release. Post-deployment tasks (OPcache clear, queue restart) run. The previous release remains available for rollback.

---

## Patterns

- **Symlink Swap Pattern** — Standard ZDD for PHP-FPM: `current` symlink atomically switches to the new release directory
- **Blue-Green Pattern** — Full environment duplication for instant switch and rollback at the infrastructure level
- **Graceful Reload Pattern** — Octane's `octane:reload` gracefully replaces workers without dropping connections
- **Release Retention** — Keep 3-5 releases for rollback capability; prune older releases to manage disk usage

---

## Architectural Decisions

- **Symlink Swap vs. Blue-Green** — Choose symlink swap for single-server or moderate multi-server deployments; choose blue-green when infrastructure-level isolation and instant environment rollback are required
- **ZDD vs. Maintenance Mode** — Choose ZDD for user-facing production applications with SLAs; use maintenance mode for database-only changes that require exclusive access
- **Database Compatibility** — ZDD forces backward-compatible migrations. If destructive schema changes are required, use expand-migrate-contract to maintain compatibility across the cutover.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| No user-facing deployment downtime | Deployment directory structure complexity | Requires specific directory layout (releases/, shared/, current) |
| Instant rollback capability | Disk space for release retention | Each release consumes significant storage; configure retention policies |
| Health check gate prevents bad releases | Health check warm-up time | PHP applications may take 10-30s to stabilize after cache clearing |
| Repeatable, auditable deployment process | Forces backward-compatible database changes | Schema changes require expand-migrate-contract pattern |

---

## Performance Considerations

Minimize release preparation time (clone, install, build) to reduce the window between trigger and cutover. Cache Composer dependencies and npm packages across releases. Each release consumes disk space — configure retention policies for 3-5 releases. After cutover, the new release may need time to warm caches; allow 10-30 seconds for the health check to stabilize. Parallelize dependency installation where possible.

---

## Production Considerations

Always implement a health check gate — never deploy without automated verification. Plan for rollback with every deployment; rollback must be faster than fixing forward. Apply database changes before code deployment for backward-compatible migrations. Test the ZDD mechanism independently of the application code being deployed. File storage must be shared across releases via the `shared/` directory or external storage (S3). Database must be shared and schema must be backward-compatible with the previous release.

---

## Common Mistakes

- **Deploying Without Health Check** — The most common ZDD omission. A bad release goes live immediately with no gate.
- **No Rollback Capability** — Deploying database migrations that cannot be rolled back. If the code release fails, the database is stuck in a state incompatible with the old code.
- **Test-Environment Mismatch** — The ZDD mechanism works in staging but fails in production due to different directory layout, file permissions, or server configuration.
- **Stateful Sessions on Application Server** — Storing sessions locally prevents safe cutover and rollback. Use Redis or database-backed sessions.

---

## Failure Modes

- **Health Check Failure** — New release fails health check after cutover. Detection: health check returns non-200 status. Mitigation: automatically rollback to previous release when health check fails.
- **Rollback Failure** — Previous release is corrupted or incompatible with current database schema. Detection: rollback returns errors or application serves errors after rollback. Mitigation: test rollback in staging, verify backward compatibility.
- **Concurrent Deployment Race** — Two deployments run simultaneously, corrupting release structure. Detection: deployment tool reports structure conflicts. Mitigation: implement deployment locks.
- **Storage Exhaustion** — Release directories consume all available disk space. Detection: deployment fails with no space left on device. Mitigation: configure release retention and disk space monitoring.

---

## Ecosystem Usage

ZDD is the standard deployment practice in the Laravel ecosystem. Envoyer provides managed ZDD with symlink swap. Deployer PHP offers open-source ZDD. Forge (2025+) includes built-in ZDD for new sites. Octane provides ZDD through graceful reload. All deployment strategies (blue-green, canary, rolling) aim to achieve ZDD. Database migration strategies (expand-migrate-contract, online schema change) support ZDD by enabling backward-compatible schema changes.

---

## Related Knowledge Units

### Prerequisites
- Basic deployment concepts, server administration

### Related Topics
- Envoyer Zero-Downtime Deployments
- Deployer PHP
- Blue-Green Deployment
- Canary Deployment
- Laravel Octane Deployment

### Advanced Follow-up Topics
- Database Migration Strategies
- Deployment Pipeline Design
- Environment & Secret Management

---

## Research Notes

ZDD is the baseline expectation for production Laravel applications, not a luxury. Every deployment pipeline should implement ZDD from the start. The specific mechanism (symlink swap, blue-green, Octane reload) depends on the hosting infrastructure and application architecture. The common thread across all ZDD approaches is the separation of release preparation from traffic cutover.
