# Experience Curation: Automated Deployment Pipelines

## Metadata
- **Subdomain:** Workflow Automation & CI/CD
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** workflow-automation-cicd/automated-deployment-pipelines
- **Maturity:** Mature
- **Related Technologies:** Laravel Forge, Laravel Vapor, Envoyer, GitHub Actions, Deployer, Docker
- **Difficulty:** Foundation
- **Decomposition:** Atomic

## Overview
Automated deployment pipelines for Laravel are CI/CD workflows that automatically deploy application changes to staging and production environments after passing quality gates (tests, static analysis, code style). The Laravel ecosystem offers multiple deployment targets: Laravel Forge (traditional VPS), Laravel Vapor (serverless AWS Lambda), Envoyer (zero-downtime deployments), and custom Docker-based deployments. An automated pipeline typically includes: building the application (composer install with --no-dev), running migrations, caching configuration/route/views, restarting queue workers, and performing health checks. The pipeline is triggered by pushing to specific branches (main for production, develop for staging) or by manual approval for production deployments.

## Core Concepts
- **Deployment Targets:** Forge (VPS with Nginx + PHP-FPM), Vapor (serverless AWS Lambda + RDS), Envoyer (zero-downtime via symlink switching), Custom Docker (container orchestration)
- **Quality Gates:** Automated checks that must pass before deployment proceeds: all tests pass, PHPStan analysis clean, Pint style check passes, no security vulnerabilities detected
- **Zero-Downtime Deployment:** Old version continues serving traffic until new version is fully ready; Envoyer uses symlink switching, Vapor uses Lambda version aliases
- **Maintenance Mode:** Laravel's built-in `php artisan down` command that shows a customizable maintenance page; used during deployments to prevent partial-version requests
- **Rollback Plan:** A documented, tested procedure to revert a deployment; ideally one command
- **Pipeline as Assembly Line:** Code enters at one end (merged PR), automated steps transform it (build, test, deploy), and a running application exits at the other end

## When To Use
- Any Laravel application in production that receives regular updates
- Teams practicing continuous delivery (merging to main should automatically reach production)
- Applications with multiple environments (staging, production) that need consistent deployment processes
- Teams that need audit trails for compliance (each deployment is recorded with a timestamp and author)
- Projects where reducing human error in the deployment process is critical

## When NOT To Use
- Prototype or early-stage projects where manual deployment (git pull on server) is sufficient
- Applications with infrequent deployments (quarterly or less) where automation setup cost exceeds benefit
- Projects with strict manual change approval processes that can't be automated
- Teams without dedicated CI/CD infrastructure or budget for Forge/Vapor

## Best Practices
- **WHY:** Always run quality gates (tests, static analysis, code style) before deployment; skipping gates is the #1 cause of deployment failures
- **WHY:** Test migrations in staging before production; a failed migration in production can cause extended downtime and data loss
- **WHY:** Make all migrations reversible (implement down() methods); have a data restoration plan for destructive changes (drop column, drop table)
- **WHY:** Use zero-downtime deployment strategies (Envoyer symlink switching, Vapor alias swap) for applications with SLAs that can't tolerate downtime
- **WHY:** Include a health check step after deployment; the pipeline can report success even when the application is returning 500 errors
- **WHY:** Run `php artisan config:cache`, `php artisan route:cache`, and `php artisan view:cache` in deployment scripts to maximize production performance

## Architecture Guidelines
- **Forge Deployment Pattern:** git pull → composer install --no-dev → artisan migrate --force → artisan config:cache → artisan route:cache → artisan view:cache → artisan queue:restart
- **Vapor Deployment Pattern:** `php artisan vapor deploy production` handles the full deployment: Lambda deployment, env updates, migrations, database management
- **GitHub Actions + Forge Pattern:** CI passes → curl Forge deploy webhook URL → Forge runs deploy script on server
- **Envoyer Zero-Downtime Pattern:** Clone to new directory → composer install → migrate → cache → atomically symlink new release → activate
- **CI Graceful Deploy Pattern:** artisan down → deploy → health check → artisan up (on success) or rollback (on failure)
- **Deployment Trigger:** Auto-deploy to staging (push to develop); manual approval gate for production
- **Migration Order:** Run migrations before code switchover; test migration backward compatibility in staging first

## Performance
- Forge deployment: 30-90 seconds (script execution + cache rebuild). Vapor deployment: 2-5 minutes (Lambda update, alias swap). Envoyer deployment: 15-30 seconds (symlink atomic switch)
- Full CI + deployment pipeline takes 5-20 minutes. Optimize by parallelizing test jobs, using dependency caching, running Dusk only on relevant changes
- Traditional deployment (maintenance mode): 10-30 seconds of downtime. Zero-downtime (Envoyer, Vapor): 0 seconds of downtime
- Cache rebuild (config, route, view) adds 5-15 seconds to deployment time but significantly improves application performance

## Security
- Never expose production credentials in CI logs. Use GitHub Secrets, Forge environment variables, or Vapor environment management
- Rotate deployment secrets quarterly; use separate tokens for CI and development workflows
- For production deployments, add required reviewers to the deployment environment; require manual approval even after CI passes
- Use maintenance mode during deployments to prevent partial-version requests from exposing inconsistent state
- Audit all deployment triggers; who can deploy, from which branches, and with what approval

## Common Mistakes

### Missing migration rollback plan
- **Description:** Deploying a destructive migration (drop column) without a rollback plan
- **Consequence:** If the deployment needs rollback, the data is lost; cannot revert without data restoration
- **Better Approach:** Always make migrations reversible; test rollback in staging; have a data restoration plan for destructive changes

### Caching before config is ready
- **Description:** Running `php artisan config:cache` before .env is correctly configured
- **Consequence:** Cached config references wrong values; application behaves incorrectly after deploy
- **Better Approach:** Run config:cache after confirming .env is up to date; use environment-specific .env files

### Deploying without testing
- **Description:** Skipping the test suite because "it's just a small change"
- **Consequence:** The small change breaks a seemingly unrelated feature in production
- **Better Approach:** Never skip quality gates; small changes can have large consequences

### Friday deployments
- **Description:** Deploying on Friday afternoon with no one available to fix issues until Monday
- **Consequence:** Production incident goes unaddressed for 72+ hours
- **Better Approach:** Deploy early in the week (Tuesday/Wednesday) with team availability for post-deployment monitoring

### No health check
- **Description:** Pipeline reports success but the application is returning 500 errors
- **Consequence:** Broken deployment is considered "successful"; users experience errors until someone manually checks
- **Better Approach:** Include automated health check (HTTP status, database connection, queue worker status) as a post-deploy step

## Anti-Patterns
- **Friday deployments:** Deploying before weekends or holidays; statistically 3x more likely to cause incidents
- **Automatic production deployment without staging verification:** Merging directly to production without staging testing
- **No rollback procedure:** Assuming every deployment will succeed; no plan for when it doesn't
- **Manual deployment steps:** A deployment checklist that requires manual SSH and artisan commands; error-prone and non-repeatable
- **One-click deploy that skips CI:** A deployment button that bypasses quality gates; defeats the purpose of CI

## Examples
- **Laravel Forge:** Most common deployment target; deploy script and Quick Deploy feature are the primary automation mechanisms
- **Laravel Vapor:** Serverless deployment option; `vapor deploy` command handles the full CI/CD pipeline
- **Laravel Envoyer:** Zero-downtime deployment; symlink-based deployment is the gold standard for high-availability applications
- **GitHub Actions:** Most common CI/CD orchestrator; coordinates testing, building, and triggering deployments

## Related Topics
- github-actions-for-laravel (CI platform that triggers deployments)
- automated-testing-in-ci (quality gates before deployment)
- automated-changelog-generation (changelogs generated during deployment pipeline)
- development-workflow-documentation (documenting deployment procedures)
- dusk-browser-tests-ci (browser testing as a pre-deployment gate)

## AI Agent Notes
- Laravel Forge powers over 500,000 server deployments; its deploy script template is the most widely used pattern
- The "deploy Friday" risk is statistically significant: Friday deployments are 3x more likely to cause production incidents
- For most teams, Forge + GitHub Actions is the recommended stack; Vapor for serverless; Envoyer for zero-downtime SLA
- Always recommend reversible migrations and health checks in deployment pipelines
- For organizational compliance, deployment audit trails are essential; GitHub Actions deployment logs serve this purpose

## Verification
- [ ] Deployment pipeline runs quality gates before deployment (tests, static analysis, code style)
- [ ] Deployment script includes composer install --no-dev with optimized autoloader
- [ ] Migrations are run with `--force` flag in production
- [ ] Config, route, and view caching are included in deployment script
- [ ] Queue workers are restarted after deployment
- [ ] Health check step verifies application is running correctly post-deploy
- [ ] Rollback procedure is documented and tested
- [ ] Production deployment requires manual approval
- [ ] Secrets are managed via CI secrets (not hardcoded)
- [ ] Deployment is logged with timestamp and author for audit trail
