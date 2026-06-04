# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 02-deployment-strategies
**Knowledge Unit:** deployer-php
**Difficulty:** Intermediate
**Category:** Deployment Strategies
**Last Updated:** 2026-06-03

# Overview

Deployer PHP is an open-source PHP deployment tool that automates zero-downtime deployments via symlink swap, similar to Envoyer but self-hosted and free. It uses a `deploy.php` recipe file with tasks for Laravel-specific operations (`artisan:cache`, `migrate`, `npm:build`).

Deployer exists because Envoyer is a paid service with per-project pricing. The engineering value is zero-downtime deployments and atomic rollbacks without subscription costs, combined with deep PHP ecosystem integration that generic deployment tools cannot match.

# Core Concepts

- **Recipe-Based Deployment** — `deploy.php` defines hosts, tasks, and hooks in PHP
- **Symlink Swap Atomic Cutover** — `current` symlink points to the active release; new releases are prepared in parallel directories
- **Multi-Server Parallel Deployment** — deploy to multiple servers simultaneously
- **Task Hooks** — `before`, `after`, `success`, `fail` hooks for customizing deployment flow
- **Rollback** — `dep rollback` reverts the symlink to the previous release

# When To Use

- Teams wanting zero-downtime deployments without paying for Envoyer
- Multi-server deployments where Envoyer's per-project pricing adds up
- CI/CD pipelines where Deployer can be triggered as a Composer dependency
- Teams comfortable with PHP-based configuration (vs. Envoyer's UI)
- Self-hosted infrastructure where SaaS deployment tools are not permitted

# When NOT To Use

- Single-server deployments where simpler approaches suffice
- Teams preferring managed services with UI-based deployment (Envoyer, Forge)
- Environments where Composer is not available or not permitted
- Octane-based deployments where `octane:reload` replaces symlink-swap patterns
- Teams without SSH key management for automated server access

# Best Practices

**Use Laravel Recipe.** Include Deployer's Laravel recipe (`recipe/laravel.php`) as a starting point. It handles Laravel-specific tasks (OPcache reset, queue restart, storage permissions) that the base recipe does not.

**Pin Deployer Version.** Lock `deployer/deployer` version in `composer.json`. Breaking changes in minor versions have caused deployment failures.

**Keep deploy.php in Version Control.** The recipe file is the deployment source of truth. Store it in the repository root with deployment documentation.

**Test on Staging.** Use the same `deploy.php` recipe for staging and production, varying only host configuration. This ensures deployment process differences don't cause production failures.

# Architecture Guidelines

Deployer requires SSH access to target servers. The user running Deployer (CI/CD agent, developer workstation) must have SSH keys configured on all target servers.

Multi-server deployments require shared state. Database, Redis, and file storage must be accessible from all servers. Deployer handles the release directory structure on each server independently.

The `shared/` directory pattern separates persistent data (`.env`, `storage/`, uploaded files) from release-specific code. This allows atomic symlink swaps without copying data.

# Performance Considerations

**Composer Install Optimization.** Use `--no-dev --optimize-autoloader --prefer-dist` in the deploy recipe. Composer dependency installation is the longest step in most Laravel deployments.

**Asset Build Caching.** Skip `npm build` if `node_modules` is unchanged. Deployer tasks can check for changes before running the build step.

**Release Retention.** Keep 3-5 releases to limit disk usage. More releases provide deeper rollback history but consume storage.

**Deployment Time Budget.** Target under 3 minutes for standard deployments. Longer deployment times increase the window for deployment conflicts and reduce deployment frequency.

# Security Considerations

**SSH Key Management.** Deployer requires SSH keys with access to production servers. These keys must be stored securely in CI/CD secrets, not in the repository or unencrypted environment variables.

**.env File Protection.** The `.env` file lives in the `shared/` directory, outside the release directories. Ensure permissions are 600 and the file is not accessible through the web server.

**CI/CD Secret Scope.** CI/CD secrets used for Deployer authentication should be scoped to deployment-only permissions. Avoid using SSH keys that have sudo access or can modify server configuration.

# Common Mistakes

**Missing Migration Ordering.** Running migrations after symlink swap means new code is live before the schema is ready. The brief window between symlink swap and migration completion serves errors to users.

**Shared .env Across Environments.** Using the same `.env` for staging and production. A configuration mistake in deployment affects both environments.

**No Deployment Lock.** Allowing concurrent deployments to the same server. Two deployments running simultaneously corrupt the release directory structure.

**Skipping OPcache Reset.** Deployer does not automatically reset OPcache. Add `artisan:opcache:reset` or configure OPcache file cache invalidation.

# Examples

**Basic deploy.php:**
```php
host('production')
    ->setHostname('203.0.113.10')
    ->set('deploy_path', '/var/www/app')
    ->set('remote_user', 'deployer');
after('deploy:success', 'laravel:horizon:terminate');
after('deploy:failed', 'deploy:unlock');
```

# Related Topics

**Prerequisites:** PHP, Composer, SSH access, Linux server administration
**Closely Related:** Envoyer Zero-Downtime Deployments (paid alternative), GitHub Actions CI/CD (CI integration)
**Advanced Follow-Ups:** Zero-Downtime Migration Strategies, Blue-Green Deployment, Octane Deployment
**Cross-Domain Connections:** Environment & Secret Management, Database Deployment

# AI Agent Notes

- Deployer is preferred when budget constraints prevent Envoyer. AI agents should default to Deployer for cost-conscious recommendations.
- Deployer's PHP-based configuration is accessible to Laravel developers but opaque to non-PHP DevOps. Agents should recommend documenting `deploy.php` for cross-team maintainability.
- Version pinning is critical. AI agents should generate `composer.json` entries that lock the major version.
