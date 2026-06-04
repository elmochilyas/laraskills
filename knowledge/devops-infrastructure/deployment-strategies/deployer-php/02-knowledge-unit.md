# Deployer PHP

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Deployment Strategies
- **Knowledge Unit:** Deployer PHP
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Deployer PHP is an open-source PHP deployment tool that automates zero-downtime deployments via symlink swap, providing Envoyer-like functionality without subscription costs. It offers atomic rollbacks, multi-server parallel deployment, and deep PHP ecosystem integration through PHP-based recipe files.

---

## Core Concepts

- **Recipe-Based Deployment** — `deploy.php` defines hosts, tasks, and hooks in native PHP
- **Symlink Swap Atomic Cutover** — `current` symlink points to the active release; new releases are prepared in parallel directories
- **Multi-Server Parallel Deployment** — Deploy to multiple servers simultaneously with a single command
- **Task Hooks** — `before`, `after`, `success`, `fail` hooks for customizing deployment flow
- **Rollback** — `dep rollback` reverts the symlink to the previous release instantly

---

## Mental Models

- **Free Envoyer Alternative** — Deployer provides the same zero-downtime symlink-swap pattern as Envoyer but without per-project pricing. Choose based on budget and preference for UI vs. code-based configuration.
- **PHP-First Configuration** — Deployer recipes are written in PHP, making them accessible to Laravel developers but potentially opaque to non-PHP DevOps team members.
- **Shared State Architecture** — Multi-server Deployer deployments require shared database, Redis, and file storage accessible from all servers.

---

## Internal Mechanics

Deployer connects to target servers via SSH and follows the configured recipe. The typical flow: clone repository to a new release directory, install Composer dependencies with `--no-dev --optimize-autoloader`, run npm build, create storage symlinks to the `shared/` directory, run database migrations, and atomically update the `current` symlink. The `shared/` directory pattern separates persistent data (`.env`, `storage/`, uploads) from release-specific code. Deployer uses a lock file to prevent concurrent deployments. Rollback updates the `current` symlink to the previous release directory.

---

## Patterns

- **Laravel Recipe Inclusion** — Use Deployer's built-in Laravel recipe (`recipe/laravel.php`) which handles OPcache reset, queue restart, and storage permissions
- **Version Pinning** — Lock `deployer/deployer` version in `composer.json`; breaking changes in minor versions have caused deployment failures
- **Staging-Production Recipe Parity** — Use the same `deploy.php` for staging and production, varying only host configuration

---

## Architectural Decisions

- **Deployer vs. Envoyer** — Choose Deployer when budget constraints prevent Envoyer or when self-hosted deployment is required; choose Envoyer when managed UI, notifications, and Forge integration are valuable
- **Deployer vs. Forge Built-in ZDD** — For new Forge sites with built-in ZDD (2025+), Forge-native deployment is simpler. Use Deployer for non-Forge servers or when custom deployment logic is needed.
- **Migration Timing** — Run migrations before symlink swap so schema is ready when new code receives traffic. The common mistake is running migrations after the swap.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Free, open-source deployment tool | Requires SSH key management | SSH keys with production access must be stored securely in CI/CD |
| PHP recipe files accessible to Laravel developers | PHP-based configuration opaque to non-PHP team members | Document deploy.php for cross-team maintainability |
| Multi-server parallel deployment | Shared state architecture required | Database, Redis, file storage must be accessible from all servers |
| Atomic rollback via `dep rollback` | No health check gate by default | Must implement health check verification separately |

---

## Performance Considerations

Composer dependency installation is the longest step in most Laravel deployments — use `--no-dev --optimize-autoloader --prefer-dist`. Skip `npm build` if `node_modules` is unchanged by checking for changes before running the build step. Keep 3-5 releases to limit disk usage. Target deployment time under 3 minutes; longer deployments increase the window for deployment conflicts and reduce deployment frequency. Deployer does not automatically reset OPcache — add `artisan:opcache:reset` to the recipe.

---

## Production Considerations

SSH keys used by Deployer must be stored securely in CI/CD secrets, never in the repository. The `.env` file lives in the `shared/` directory outside release directories — ensure permissions are 600. CI/CD secrets should be scoped to deployment-only permissions without sudo access. Use a deployment lock to prevent concurrent deployments that corrupt the release directory structure. Test rollback in staging.

---

## Common Mistakes

- **Missing Migration Ordering** — Running migrations after symlink swap means new code is live before schema is ready. Run migrations before the swap.
- **Shared .env Across Environments** — Using the same `.env` for staging and production. A configuration mistake affects both environments.
- **No Deployment Lock** — Allowing concurrent deployments to the same server. Two deployments running simultaneously corrupt the release directory structure.
- **Skipping OPcache Reset** — Deployer does not automatically reset OPcache. Add `artisan:opcache:reset` to the recipe.

---

## Failure Modes

- **Deployment Lock Contention** — Two deployments attempt to run simultaneously. Detection: Deployer fails with lock acquisition error. Mitigation: configure lock timeout, implement CI/CD queue to serialize deployments.
- **SSH Key Rotation Breakage** — SSH keys on target servers are rotated without updating Deployer configuration. Detection: deployment fails with authentication error. Mitigation: document SSH key rotation procedure, test a deployment after each rotation.
- **Shared Storage Outage** — Database or Redis becomes unreachable from the new release during preparation. Detection: dependency installation fails or health check fails. Mitigation: implement retry logic, verify service health before starting deployment.

---

## Ecosystem Usage

Deployer PHP is commonly used in Laravel CI/CD pipelines triggered by GitHub Actions or GitLab CI. It is installed as a Composer dependency (`deployer/deployer`) and the recipe file lives in the repository root. Deployer replaces shell-based deployment scripts and provides structured, testable deployment workflows. It is the most popular open-source alternative to Envoyer in the Laravel ecosystem.

---

## Related Knowledge Units

### Prerequisites
- PHP, Composer, SSH access, Linux server administration

### Related Topics
- Envoyer Zero-Downtime Deployments (paid alternative)
- GitHub Actions CI/CD (CI integration)
- Zero-Downtime Deployment

### Advanced Follow-up Topics
- Zero-Downtime Migration Strategies
- Blue-Green Deployment
- Laravel Octane Deployment

---

## Research Notes

Deployer is preferred when budget constraints prevent Envoyer. Default to Deployer for cost-conscious recommendations. Deployer's PHP-based configuration is accessible to Laravel developers but opaque to non-PHP DevOps — document `deploy.php` for cross-team maintainability. Version pinning is critical — generate `composer.json` entries that lock the major version.
