# Standardized Knowledge: CI/CD Pipeline Cache Invalidation Steps

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Deployment & Cache Invalidation |
| Knowledge Unit | CI/CD Pipeline Cache Invalidation Steps |
| Difficulty | Intermediate |
| Lifecycle | Deploy, Operate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

A CI/CD pipeline for PHP must include explicit cache invalidation steps after code deployment. Typical pipeline: 1) Build (composer install, compile assets), 2) Deploy (copy code to servers), 3) Invalidate OpCache (opcache_reset or PHP-FPM reload), 4) Warm caches (hit critical endpoints), 5) Health check (verify all workers serving), 6) Enable traffic (remove from maintenance). Each step should have a timeout and rollback trigger.

## Core Concepts

- **Step 1 - Build**: Composer install, asset compilation, build artifacts. Ensure atomicity for deployment.
- **Step 2 - Deploy**: Copy code via rsync, git pull, or container image push. Use symlink swap for atomic code replacement.
- **Step 3 - OpCache Reset**: Run cachetool opcache:reset --all or trigger PHP-FPM reload. Verify reset via opcache_get_status() API.
- **Step 4 - Preloading Refresh**: Full PHP-FPM restart if preloading script changed. Coordinate with load balancer to drain connections first.
- **Step 5 - Cache Warm**: HTTP GET requests to critical endpoints. Each request populates OpCache for that endpoint's code path.
- **Step 6 - Health Check**: Verify HTTP 200 from health endpoint, OpCache hit rate > 99%, listen queue = 0. Fail deployment if any check fails.
- **Step 7 - Traffic Enable**: Remove from load balancer maintenance mode. Monitor for increased error rate or latency.

## When To Use

- Automated CI/CD pipelines for PHP applications
- Every production deployment
- Staging environments for deployment pipeline testing
- Rollback automation

## When NOT To Use

- Manual deployments (steps should still be followed but not automated)
- Development deployments where code changes are frequent
- Environments without load balancer integration
- Emergency hotfixes (expedited but still follow the sequence)

## Best Practices

- **Each step has a timeout and retry**: If any step fails (e.g., OpCache reset not confirmed), retry N times before triggering rollback. Timeouts prevent hung deployments.
- **Use symlink swap for atomic deployment**: `ln -snf /app/releases/v2 /app/current`. This prevents partial-read of mixed code versions. Web server root points to symlink.
- **Validate cache state after invalidation**: Don't assume opcache_reset() succeeded. Call opcache_get_status() and verify hit_rate dropped to 0%, then climbs back after warm-up.
- **Rollback on health check failure**: If health check fails after deployment, automatically revert to previous version, reload workers, and verify.
- **Monitor for 10 minutes after traffic enable**: Late-onset errors (memory leaks, slow degradation) may not appear immediately. Keep monitoring window post-deployment.

## Architecture Guidelines

- **Pipeline as Code**: The deployment pipeline should be defined in the repository (GitHub Actions, GitLab CI, Jenkinsfile). Version-controlled pipelines are auditable and repeatable.
- **Stage Gates**: Each stage gates the next. Build failure stops deployment. OpCache reset failure triggers rollback. Health check failure prevents traffic enable.
- **Rollback Script**: The rollback script is tested on every deployment (by not being used) but must be verified monthly. It follows the same steps in reverse: revert code, reload workers, warm, health check.
- **Containerized Pipelines**: For containerized PHP, the pipeline includes image build → push → deploy → warm → health check. Cache invalidation is handled by the new image having fresh OpCache.

## Performance Considerations

- Deployment duration: 2-10 minutes depending on server count and warm-up time
- OpCache warm-up: 5-30s for typical applications
- Health check interval: every 5-10 seconds during deployment verification
- Pipeline timeout: should be 2x expected duration (10-20 minutes)

## Security Considerations

- CI/CD pipeline secrets must be stored securely (GitHub Secrets, GitLab CI variables, vault)
- Deployment scripts should not contain hardcoded credentials
- Rollback scripts require the same security as deployment scripts
- Pipeline access should be restricted to authorized personnel

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Skipping cache warm-up | Simplifying pipeline | Users experience slow first requests | Add warm-up as required pipeline step |
| No rollback trigger | Not planning for failure | Failed deployment without recovery | Automate rollback on health check failure |
| OpCache reset without verification | Assuming success | Unreset workers serve stale code | Verify OpCache state after reset |
| No symlink swap | Direct in-place code replacement | Partial-read of mixed code versions | Use atomic symlink deployment |

## Anti-Patterns

- **Manual deployment steps in a "CI/CD" pipeline**: Every step should be automated. Manual steps are error-prone and not auditable.
- **Deploying during peak traffic**: Schedule deployments during low-traffic windows. Even zero-downtime deployments add overhead.
- **Skipping staging tests**: The pipeline should deploy to staging first. Production-only deployment misses environment-specific issues.
- **Not testing rollback**: The rollback script should be tested monthly. An untested rollback is not a rollback.

## Examples

```yaml
# CI/CD pipeline stages (simplified)
stages:
  - build
  - deploy
  - invalidate
  - warm
  - health
  - enable

deploy:
  stage: deploy
  script: rsync -a --delete /build/ /app/releases/v2/

invalidate:
  stage: invalidate
  script: cachetool opcache:reset --all

warm:
  stage: warm
  script: |
    for url in / /api/health /api/products; do
      curl -s -o /dev/null http://localhost$url
    done

health:
  stage: health
  script: curl -s http://localhost/health | grep '"status":"ok"'
```

## Related Topics

- OpCache Reset Strategies
- Deployment Cache Invalidation
- Zero-Downtime Deployment OpCache
- Multi-Instance Cache Coordination

## AI Agent Notes

- CI/CD pipeline for PHP MUST include cache invalidation steps. Deploying without invalidating OpCache serves stale code.
- The pipeline should verify each step (OpCache reset confirmed, warm-up completed) rather than assuming success.
- Rollback should be automated and tested. Health check failure triggers automatic revert.
- Containerized pipelines handle cache differently — invalidation happens through new image deployment.

## Verification

- [ ] Pipeline includes build, deploy, invalidate, warm, health, enable stages
- [ ] Each stage has timeout and retry configuration
- [ ] OpCache state verified after invalidation (hit_rate check)
- [ ] Warm-up script covers all critical endpoints
- [ ] Health check validates OpCache, workers, and dependencies
- [ ] Automated rollback configured on health check failure
- [ ] Symlink swap used for atomic code deployment
- [ ] Pipeline tested in staging before production use
- [ ] Rollback script tested monthly
