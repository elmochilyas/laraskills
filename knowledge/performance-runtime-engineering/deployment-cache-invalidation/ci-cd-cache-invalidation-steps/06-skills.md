# Skill: Build CI/CD Pipeline with Cache Invalidation, Warm-Up, and Automated Rollback

## Purpose
Design a CI/CD deployment pipeline for PHP with explicit stages: build, symlink-swap deploy, OpCache reset with verification using `opcache_get_status()`, comprehensive warm-up of all critical endpoints, health check with OpCache hit rate validation (>99%), automated rollback on failure, and a 10-minute post-deployment monitoring window — ensuring zero stale-code serving and minimal cold-start latency.

## When To Use
- Automated CI/CD pipelines for PHP applications
- Every production deployment
- Staging environments for deployment pipeline testing
- Rollback automation

## When NOT To Use
- Manual deployments (steps should still be followed manually)
- Development environments where code changes are frequent
- Environments without load balancer integration

## Prerequisites
- CI/CD platform (GitHub Actions, GitLab CI, Jenkins)
- cachetool installed and configured on target servers
- Load balancer integration for traffic orchestration
- Health check endpoint with OpCache status

## Inputs
- Target server list
- Critical endpoint URL list for warm-up
- Health check endpoint URL
- OpCache hit rate threshold (>99%)

## Workflow

### 1. Build Stage
- Composer install with `--no-dev --optimize-autoloader`
- Compile assets (npm run production)
- Run tests
- Build artifacts in release directory

### 2. Deploy Stage with Symlink Swap
- RSYNC or copy build to new release directory (`/app/releases/v2`)
- Atomically switch symlink: `ln -snf /app/releases/v2 /app/current`
- Never copy files directly over the application directory (prevents mixed version reads)

### 3. OpCache Reset Stage with Verification
- Run: `cachetool opcache:reset --all`
- Verify: query `opcache_get_status()` and confirm `hit_rate == 0`
- If reset failed (hit rate unchanged), trigger rollback
- Each stage has timeout and retry configuration

### 4. Warm-Up Stage
- HTTP GET all critical endpoints: `/`, `/api/health`, `/api/products`, `/api/users`, `/api/orders`
- Each request populates OpCache for that endpoint's code path
- Without comprehensive warm-up, first users experience 3-5s latency

### 5. Health Check Stage
- Verify: PHP-FPM responding, OpCache hit rate >99%, DB connectivity, listen queue = 0
- Fail deployment if any check fails → trigger automated rollback
- Rollback reverts code, reloads workers, warms cache, and re-verifies health

### 6. Post-Deployment Monitoring
- Monitor error rates, latency, OpCache hit rate for 10 minutes after enable
- Late-onset issues (memory leaks, slow degradation) may not appear immediately
- Alert on anomaly during monitoring window

## Validation Checklist
- [ ] Pipeline includes build, deploy, invalidate, warm, health, enable stages
- [ ] Symlink swap used for atomic deployment
- [ ] OpCache state verified after reset (hit_rate == 0 confirmed)
- [ ] Warm-up covers all critical endpoints
- [ ] Health check validates OpCache hit rate >99%
- [ ] Automated rollback configured on health check failure
- [ ] 10-minute post-deployment monitoring window configured
- [ ] Pipeline tested in staging before production use

## Related Rules
- Explicit cache invalidation as required stage (`05-rules.md:5`)
- Verify OpCache state after reset (`05-rules.md:38`)
- Atomic symlink swap (`05-rules.md:68`)
- Automated rollback on health check failure (`05-rules.md:98`)
- Warm all critical endpoints (`05-rules.md:131`)
- Post-deployment monitoring window (`05-rules.md:163`)
- Environment-specific php.ini (`05-rules.md:203`)

## Related Skills
- OpCache Reset Strategies
- Zero-Downtime Deployment OpCache
- Multi-Instance Cache Coordination
- Rollback Planning and Version Mismatch

## Success Criteria
- Pipeline deploys code with zero stale-code serving
- OpCache reset verified, not just assumed
- Warm-up eliminates first-user cold-start latency
- Automated rollback executes within 60 seconds on health check failure
- Post-deployment monitoring catches late-onset issues
- Pipeline fully automated with no manual steps
