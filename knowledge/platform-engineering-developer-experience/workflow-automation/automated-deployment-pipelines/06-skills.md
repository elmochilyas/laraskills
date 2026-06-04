# Skill: Set Up Automated Deployment Pipelines for Laravel

## Purpose
Create a CI/CD deployment pipeline for Laravel applications with quality gates, zero-downtime deployment, health checks, and rollback plans.

## When To Use
- Any Laravel application in production receiving regular updates
- Teams practicing continuous delivery
- Applications with SLAs requiring zero-downtime deployments

## When NOT To Use
- Prototypes or internal tools where deployment speed isn't critical
- Applications deployed manually for compliance reasons

## Prerequisites
- Laravel application on Forge, Vapor, or custom server
- CI platform (GitHub Actions, GitLab CI)
- Test suite with good coverage

## Inputs
- Deployment platform (Forge, Vapor, Envoyer) configuration
- CI workflow file (`.github/workflows/deploy.yml`)
- Server environment configuration

## Workflow

1. **Choose Deployment Target:** Forge (traditional VPS with Nginx + PHP-FPM), Vapor (serverless AWS Lambda + RDS), Envoyer (zero-downtime via symlink switching), or Custom Docker (container orchestration).

2. **Implement Quality Gates:** All tests must pass, PHPStan analysis clean, Pint style check passes, no security vulnerabilities (composer audit). These must pass before deployment proceeds.

3. **Configure Deployment Pipeline:** Standard Forge pattern: `git pull` → `composer install --no-dev` → `php artisan migrate --force` → `php artisan config:cache` → `php artisan route:cache` → `php artisan view:cache` → `php artisan queue:restart`.

4. **Run Migrations in Staging First:** Before production migration, test in staging. Failed migrations cause extended downtime.

5. **Make All Migrations Reversible:** Implement `down()` methods for all migrations. Plan for destructive changes with documented procedures.

6. **Add Health Check Post-Deployment:** Add a health check step that validates the application responds correctly after deployment. Pipeline can report success even with 500 errors without this check.

7. **Configure Auto-Deploy for Staging:** Auto-deploy to staging on push to develop branch. Use manual approval gate for production.

8. **Document Rollback Plan:** Have a tested, documented rollback plan for each deployment type. Ideally one command to revert.

## Validation Checklist

- [ ] Quality gates run before deployment (tests, analysis, style, security)
- [ ] Migrations tested in staging before production
- [ ] All migrations have reversible `down()` methods
- [ ] Zero-downtime deployment configured (Envoyer/Vapor)
- [ ] Health check validates post-deployment application state
- [ ] Config/route/view cached during deployment
- [ ] Rollback plan documented and tested
- [ ] Staging auto-deploy + production manual approval

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Failed migration in production | Pre-test in staging; make migrations reversible |
| Deployment succeeds but app errors | No health check; add post-deployment validation |
| Friday deployment incident | Deploy Tuesday/Wednesday instead |
| No rollback plan | Recovery time extended during incident |

## Decision Points

- **Use automated deployment** for any Laravel app in production receiving regular updates
- **Deploy early in the week** (Tuesday/Wednesday) — Friday deployments are 3x more likely to cause incidents
- **Never deploy without staging verification** and a tested rollback plan

## Performance/Security Considerations

- **Config caching:** `php artisan config:cache` speeds bootstrap by 50-100ms
- **Zero-downtime:** Essential for apps with SLAs; Envoyer symlink switching or Vapor alias swap
- **Composer --no-dev:** Reduces deployed artifact size and eliminates dev-only packages

## Related Rules

- DEPLOY-RULE-001: Always run quality gates before deployment
- DEPLOY-RULE-002: Test migrations in staging before production
- DEPLOY-RULE-003: Make all migrations reversible
- DEPLOY-RULE-004: Use zero-downtime deployment
- DEPLOY-RULE-005: Include health check post-deployment

## Related Skills

- Generate Automated Changelogs
- Set Up Automated Testing in CI
- Configure Dependency Update Automation

## Success Criteria

- Deployments are automated with one trigger (push or manual approval)
- Quality gates prevent broken code from reaching production
- Zero-downtime deployment serves users without interruption
- Rollback plan is tested and works in under 5 minutes
