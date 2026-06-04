# Skill: Configure GitHub Actions for Laravel

## Purpose
Create GitHub Actions workflows for Laravel projects covering testing (Pint, PHPStan, PHPUnit), deployment (Forge/Vapor), and automation with caching, service containers, and parallel jobs.

## When To Use
- Most Laravel applications (GitHub Actions is the default CI recommendation in Laravel docs)
- Teams already using GitHub for source control
- Projects needing CI/CD with native GitHub integration

## When NOT To Use
- Projects on GitLab, Bitbucket, or self-hosted Git (use their native CI)
- When GitHub Actions minutes are insufficient (use self-hosted runners)

## Prerequisites
- GitHub repository
- Laravel application with test suite
- GitHub Actions secrets configured (for deployment)

## Inputs
- `.github/workflows/*.yml` — workflow files
- GitHub Actions secrets

## Workflow

1. **Create Testing Workflow:** Create `.github/workflows/tests.yml` with jobs for Pint (style), PHPStan (analysis), and PHPUnit (tests) running in parallel. Use `shivammathur/setup-php` for PHP setup and `actions/cache` for Composer caching.

2. **Cache Dependencies:** Cache `vendor/` based on `composer.lock` hash and `~/.composer/cache` for global Composer cache. Cache restoration saves 30-60s per run.

3. **Configure Service Containers:** Add MySQL/PostgreSQL service containers with health checks. Use the `options: --health-cmd="mysqladmin ping" --health-interval=10s --health-timeout=5s --health-retries=5` pattern.

4. **Run Parallel Jobs:** Use separate jobs for Pint, PHPStan, and tests running concurrently. This reduces total pipeline time from 15-20min to 5-10min.

5. **Configure Deployment Workflow:** Create a deploy workflow that runs only on push to main (or manual dispatch). Use `needs:` dependency to ensure all test jobs pass before deployment. Use Forge webhook URL or Vapor CLI for deployment.

6. **Store Secrets Securely:** Use GitHub Actions secrets for all sensitive values (deployment keys, API tokens). Never hardcode in workflow files. Rotate secrets quarterly.

7. **Set Branch Protection Rules:** Require test jobs to pass before merging. Use branch protection rules to enforce status checks.

## Validation Checklist

- [ ] Testing workflow runs Pint, PHPStan, and PHPUnit
- [ ] Composer dependencies cached (lock file hash key)
- [ ] MySQL/PostgreSQL service container with health checks
- [ ] Parallel jobs for style, analysis, and tests
- [ ] Deployment workflow gated on test success
- [ ] Secrets stored in GitHub Actions (not in workflow files)
- [ ] Branch protection requires CI checks

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Cache not restoring | Mismatched cache key; invalidate on lock file change |
| Service container not ready | No health check; tests fail with DB connection error |
| Secrets in workflow file | Hardcoded credentials visible in logs |
| Deployment before tests pass | Missing `needs:` dependency; deploy broken code |

## Decision Points

- **Use GitHub Actions for Laravel apps on GitHub** — Native integration, no additional platform
- **Use GitLab CI/Runner native CI** for projects on non-GitHub hosting
- **Matrix builds for packages** — Single-version for apps matching production

## Performance/Security Considerations

- **Parallel jobs:** Reduces pipeline time by 50-60%
- **Dependency caching:** Saves 30-60s per run; essential for fast feedback
- **Secrets:** Use GitHub Actions secrets; rotate quarterly
- **Self-hosted runners:** For projects needing more minutes or custom hardware

## Related Rules

- GHA-RULE-001: Use dependency caching
- GHA-RULE-002: Health-check MySQL service containers
- GHA-RULE-003: Use parallel jobs
- GHA-RULE-004: Store secrets as GitHub Actions secrets
- GHA-RULE-005: Use matrix builds for packages

## Related Skills

- Set Up Automated Testing in CI
- Set Up Automated Deployment Pipelines
- Run PHPStan in CI

## Success Criteria

- CI pipeline completes in under 10 minutes with parallel jobs
- Dependencies cached for fast runs
- Service containers are healthy before tests start
- Deployment only proceeds after all quality gates pass
