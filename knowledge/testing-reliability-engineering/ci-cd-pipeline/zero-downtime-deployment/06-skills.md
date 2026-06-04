# Skill: Implement Zero-Downtime Deployment

## Purpose
Configure zero-downtime deployments for Laravel applications using Deployer, symlink swaps, expand-contract database migrations, and pre-warmed caches to update production without service interruption.

## When To Use
- For any production Laravel application serving real users
- When deploying during business hours without maintenance windows
- For applications with uptime SLAs or compliance requirements
- When deploying to load-balanced or containerized environments
- For teams practicing continuous deployment

## When NOT To Use
- For internal tools or staging environments where brief downtime is acceptable
- Without proper rollback testing (untested rollback is dangerous)
- When database schema changes cannot be made backward-compatible
- For single-server deployments without shared filesystem or Redis

## Prerequisites
- Linux server administration knowledge
- Nginx/Apache configuration
- Database migration patterns (expand-contract)
- Deployer or Forge configured for the project
- Redis for session storage (multi-server deployments)

## Inputs
- Server hostnames and SSH access
- Repository URL and deployment branch
- Database migration plan (expand-contract)
- Cache warm-up URLs
- Queue restart strategy
- Rollback procedure and testing schedule

## Workflow
1. Install and configure Deployer with the Laravel recipe
2. Configure `keep_releases` to retain last 3-5 releases
3. Implement expand-contract pattern for database migrations
   - Deploy 1: add new columns/tables (backward-compatible)
   - Deploy 2: remove old columns (after old code is drained)
4. Pre-warm caches before symlink swap: config cache, route cache, view cache
5. Run migrations before symlink swap (new code reads new schema)
6. Perform atomic symlink swap from old to new release
7. Post-swap: curl critical pages to warm opcache and application caches
8. Gracefully restart queue workers: `php artisan queue:restart` or `horizon:terminate`
9. Run post-deployment health check (see Post-Deployment Health Checks skill)
10. Verify rollback procedure in staging before every production deploy

## Validation Checklist
- [ ] Deployer or Forge zero-downtime strategy is configured
- [ ] Database migrations use expand-contract pattern (no destructive changes in same deploy)
- [ ] Config/route/view caches are pre-warmed before symlink swap
- [ ] Queue workers are gracefully restarted after deployment
- [ ] Rollback procedure is tested in staging before production
- [ ] Last 3-5 releases are retained for rollback
- [ ] Health check is integrated as post-deploy gate with automated rollback
- [ ] Session storage uses Redis (not filesystem) for multi-server compatibility
- [ ] Deployment secrets are managed via environment variables or secrets manager

## Common Failures
- Running destructive migrations during deploy — old code still running crashes
- Not testing rollback — deployment fails and can't recover
- Cache not pre-warmed — first users experience 2-5s cold-start
- Not handling queue job compatibility — old workers can't deserialize new jobs
- Not keeping enough releases — can't rollback to working version
- File-based sessions — users lose sessions after symlink swap
- Cold cache deployment — no page cache warming after swap

## Decision Points
- Deployer vs Forge — Deployer for complex multi-server with custom hooks, Forge for simple single-server
- Expand-contract vs single migration — expand-contract for zero-downtime, single for maintenance window deploys
- Migration timing: before vs after symlink — before for backward-compatible, after for non-backward-compatible

## Performance Considerations
- Symlink swap: <1ms — instantaneous
- Cache warm-up: 10-30 seconds (config, route, view cache)
- Migration time: 1s to 30 minutes depending on data volume
- Queue restart: workers finish current job (up to job timeout)
- Pre-warming caches avoids cold-start slowness for first users

## Security Considerations
- Never store secrets in release folders — use shared `.env` or environment variables
- Old releases may contain sensitive data — secure deletion during clean-up
- Deployment scripts should run with minimal necessary permissions
- SSH keys used for deployment should be restricted to deployment-only access
- Rollback must not revert security patches or configuration changes

## Related Rules
- [Rule: Use Expand-Contract Pattern for Migrations](./05-rules.md)
- [Rule: Pre-Warm Caches Before Symlink Swap](./05-rules.md)
- [Rule: Test Rollback Procedure Quarterly](./05-rules.md)

## Related Skills
- Post-Deployment Health Checks
- CI/CD Pipeline Design
- Queue Management with Horizon

## Success Criteria
- [ ] Zero-downtime deployment process is configured and tested
- [ ] Expand-contract migrations are used for all schema changes
- [ ] Caches are pre-warmed before serving traffic
- [ ] Rollback procedure is tested and verified
- [ ] Queue workers restart gracefully after deployment
- [ ] Users experience no downtime during deployment
