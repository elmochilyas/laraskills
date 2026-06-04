# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | CI/CD Pipeline Integration |
| Knowledge Unit | Zero-Downtime Deployment |
| Difficulty | Advanced |
| Maturity | Mature |
| Priority | P2 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | Linux server administration, Nginx/Apache configuration, Database migration patterns |
| Related KUs | Post-deployment health checks, CI/CD pipeline design, Queue management with Horizon |
| Source | domain-analysis.md K043 |

# Overview

Zero-downtime deployment for Laravel applications updates production code without interrupting service to users. The primary tools are Deployer (PHP deployment tool) and Laravel Forge hooks, with strategies including blue/green deployment, rolling updates, and pre-warmed cache deployments. The critical challenges are database migration compatibility (old code running alongside new schema), queue job compatibility during deployment, and session/cache invalidation. Zero-downtime deployment requires architectural decisions about schema changes (expand-contract pattern), environment configuration, and deployment atomicity.

# Core Concepts

- **Deployer**: PHP-based deployment tool with Laravel recipe. Manages release folders, symlinks, shared files, and rollback.
- **Release folder**: Each deployment creates a timestamped directory. The `current` symlink points to active release.
- **Symlink swap**: Atomic switch of `current` symlink from old release to new release.
- **Blue/green deployment**: Two identical environments. Deploy to inactive, then switch traffic.
- **Rolling update**: Behind a load balancer, instances are updated one at a time.
- **Expand-contract migrations**: Database changes deployed in two phases (expand + contract) for backward compatibility.

# When To Use

- For any production Laravel application serving real users
- When deploying during business hours without maintenance windows
- For applications with uptime SLAs or compliance requirements
- When deploying to load-balanced or containerized environments
- For teams practicing continuous deployment

# When NOT To Use

- For internal tools or staging environments where brief downtime is acceptable
- Without proper rollback testing (untested rollback is dangerous)
- When database schema changes cannot be made backward-compatible
- For single-server deployments without shared filesystem or Redis

# Best Practices (WHY)

- **Use expand-contract pattern for database migrations**: Never run destructive migrations (DROP, ALTER that removes columns) in the same deploy as the code that depends on the change. Add new columns/tables in deploy 1, backfill in deploy 1, remove old columns in deploy 2.
- **Pre-warm caches before symlink swap**: Build config cache, route cache, view cache before the atomic swap. After swap, curl critical pages to warm opcache and application caches. First users should not experience cold-start slowness.
- **Test rollback procedure quarterly**: Rollback must be tested and verified. A failed rollback is worse than a failed forward deploy. Test rollback in staging before every production deploy.
- **Handle queue jobs during deployment**: Use `php artisan queue:restart` (or `horizon:terminate`) to gracefully restart workers. Ensure job serialization is backward-compatible for in-flight jobs.
- **Keep last 3-5 releases**: Configure Deployer to retain only recent releases. Disk space exhaustion from accumulated releases is a common deployment failure.

# Architecture Guidelines

- **Deployer vs Forge**: Deployer for complex multi-server deployments with custom hooks. Forge for single-server or simple deployments.
- **Migration timing**: Run migrations before symlink swap (new code reads new schema) — requires backward-compatible schema changes.
- **Shared filesystem vs artifacts**: Deployer's shared folder approach works for single server or NFS. For multi-server, consider Docker images with code baked in.
- **Session storage**: Use Redis for session storage. File-based sessions fail with multi-server deployments. Avoid shared filesystem dependency.

# Performance Considerations

- Symlink swap: <1ms. Instantaneous.
- Cache warm-up: 10-30 seconds (config cache, route cache, view cache). Pre-warm before swap.
- Migration time: 1 second to 30 minutes depending on data volume. Large migrations should use chunked processing.
- Queue restart: Workers finish current job (up to job timeout duration). Queue drain may take minutes.

# Security Considerations

- Never store secrets in release folders. Use shared `.env` or environment variables.
- Old releases may contain sensitive data. Ensure rollback cleanup includes secure deletion.
- Deployment scripts should run with minimal necessary permissions (principle of least privilege).
- SSH keys used for deployment should be restricted to deployment-only access.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Running destructive migrations during deploy | Schema::drop('old_table') in a migration | Old code still running references old table; 500 errors | Use expand-contract; drop in separate deploy after old code drains |
| Not testing rollback | "We'll fix forward instead" | When forward fix is impossible, rollback fails and downtime extends | Test rollback in staging before every production deploy |
| Cache not pre-warmed | Config/route/view cache built but page cache not warmed | First 100 users experience 2-5s page loads | Curl critical pages after symlink swap to warm caches |
| Ignoring queue job compatibility | New code dispatches jobs with new serialization format | Old workers cannot deserialize new format; jobs fail | Ensure backward-compatible job serialization or drain old workers |
| Not keeping releases for rollback | Deleting old releases to save disk space | Cannot rollback to working version | Keep last 3-5 releases |

# Anti-Patterns

- **Single-command destructive migrations**: Running `DROP TABLE` or `ALTER COLUMN` that breaks old code still running alongside new deployment. Instead, always use expand-contract.
- **Deploying without health checks**: Deploying code without post-deployment verification. Instead, integrate health checks into the deployment pipeline with automated rollback.
- **Cold cache deployment**: Deploying without pre-warming Laravel caches. Instead, build config/route/view cache before symlink swap and curl key pages after.
- **Unlimited release retention**: Keeping every release indefinitely. Instead, retain only the last 3-5 releases and use external backups for long-term retention.

# Examples

```php
// deploy.php - Deployer configuration
namespace Deployer;

require 'recipe/laravel.php';

host('production')
    ->setHostname('192.168.1.100')
    ->setRemoteUser('forge')
    ->setDeployPath('/home/forge/myapp');

set('repository', 'git@github.com:org/myapp.git');
set('keep_releases', 5);

after('deploy:symlink', 'deploy:unlock');

// Warm caches after deployment
task('deploy:warmup', function () {
    run('{{bin/php}} {{release_path}}/artisan view:cache');
    run('curl -s -o /dev/null {{deploy_url}}/');
    run('curl -s -o /dev/null {{deploy_url}}/api/health');
});

after('deploy:symlink', 'deploy:warmup');
after('deploy:symlink', 'artisan:queue:restart');
```

# Related Topics

- **Prerequisites**: Linux server administration, Nginx/Apache configuration, Database migration patterns
- **Related**: Post-deployment health checks, CI/CD pipeline design, Queue management with Horizon
- **Advanced**: Docker-based Laravel deployment, Kubernetes deployment for Laravel, Blue/green infrastructure automation

# AI Agent Notes

- When implementing zero-downtime deployment, first determine if the application uses Deployer or Forge. Deployer is more common for custom deployments; Forge for simpler setups.
- The most common zero-downtime mistake is running destructive migrations in the same deploy as code changes. Always use expand-contract: add in deploy 1, remove in deploy 2.
- Check if the application uses Laravel Horizon for queue management. If so, use `horizon:terminate` instead of `queue:restart` for graceful worker restarts.
- Ensure the deployment script tests rollback in staging before production. A deployment without a tested rollback plan is not zero-downtime — it's hope-based deployment.

# Verification

- [ ] Deployer or Forge zero-downtime strategy is configured
- [ ] Database migrations use expand-contract pattern (no destructive changes in same deploy)
- [ ] Config/route/view caches are pre-warmed before symlink swap
- [ ] Queue workers are gracefully restarted after deployment
- [ ] Rollback procedure is tested in staging before production
- [ ] Last 3-5 releases are retained for rollback
- [ ] Health check is integrated as post-deploy gate with automated rollback
- [ ] Session storage uses Redis (not filesystem) for multi-server compatibility
- [ ] Deployment secrets are managed via environment variables or secrets manager, not in release
