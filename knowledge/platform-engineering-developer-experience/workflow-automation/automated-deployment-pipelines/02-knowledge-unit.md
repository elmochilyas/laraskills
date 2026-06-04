# Knowledge Unit: Automated Deployment Pipelines

## Metadata
- **Subdomain:** Workflow Automation & CI/CD
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** workflow-automation-cicd/automated-deployment-pipelines
- **Maturity:** Mature
- **Related Technologies:** Laravel Forge, Laravel Vapor, Envoyer, GitHub Actions, Deployer, Docker

## Executive Summary

Automated deployment pipelines for Laravel are CI/CD workflows that automatically deploy application changes to staging and production environments after passing quality gates (tests, static analysis, code style). The Laravel ecosystem offers multiple deployment targets: Laravel Forge (traditional VPS), Laravel Vapor (serverless AWS Lambda), Envoyer (zero-downtime deployments), and custom Docker-based deployments. An automated pipeline typically includes: building the application (composer install with --no-dev), running migrations, caching configuration/route/views, restarting queue workers, and performing health checks. The pipeline is triggered by pushing to specific branches (main for production, develop for staging) or by manual approval for production deployments. Well-designed pipelines enforce consistency (every deployment follows the same steps), reduce human error, and provide audit trails for compliance.

## Core Concepts

- **Deployment Targets:** Forge (VPS with Nginx + PHP-FPM), Vapor (serverless AWS Lambda + RDS), Envoyer (zero-downtime via symlink switching), Custom Docker (container orchestration)
- **Quality Gates:** Automated checks that must pass before deployment proceeds: all tests pass, PHPStan analysis clean, Pint style check passes, no security vulnerabilities detected
- **Zero-Downtime Deployment:** A deployment strategy where the old version continues serving traffic until the new version is fully ready; Envoyer uses symlink switching, Vapor uses Lambda version aliases
- **Maintenance Mode:** Laravel's built-in `php artisan down` command that shows a customizable maintenance page; used during deployments to prevent partial-version requests
- **Rollback Plan:** A documented, tested procedure to revert a deployment; ideally one command (envoy deploy:rollback or Forge's "Deploy Again" with previous commit)

## Mental Models

- **Pipeline as Assembly Line:** The deployment pipeline is an assembly line—code enters at one end (merged PR), automated steps transform it (build, test, deploy), and a running application exits at the other end
- **Deployment as Transaction:** A deployment is a transaction: all steps succeed (committed) or the deployment is rolled back (aborted). Partial deployments (some changes live, others not) are a failure mode
- **Quality Gates as Toll Booths:** Code must pass through each quality gate (CI checks, manual approval, staging verification) before reaching production; no skipping toll booths allowed

## Internal Mechanics

1. **Trigger:** Merge to main/develop branch, GitHub release creation, or manual workflow dispatch
2. **Build Phase:** Checkout code, install Composer dependencies (--no-dev --optimize-autoloader), compile assets (npm run production), generate IDE helpers
3. **Test Phase:** Run PHPUnit/Pest tests, Pint check, PHPStan analysis, Dusk browser tests (optional)
4. **Artifact Phase:** Create deployment artifact (zip/tar of built application, excluding dev dependencies and git history)
5. **Deploy Phase:** Transfer artifact to server, extract, run maintenance mode (artisan down), update dependencies, run migrations, cache config/routes/views, restart queue workers, disable maintenance mode (artisan up)
6. **Post-Deploy Phase:** Health check (HTTP status, database connection, queue worker status), monitor for errors, notify team (Slack/Discord)

## Patterns

- **Forge Deployment Pattern:**
  ```yaml
  # .forge/deploy-script
  git pull origin $FORGE_SITE_BRANCH
  $FORGE_COMPOSER install --no-dev --no-interaction --prefer-dist --optimize-autoloader
  php artisan migrate --force
  php artisan config:cache
  php artisan route:cache
  php artisan view:cache
  php artisan queue:restart
  ```
  Forge runs this deploy script on the server; the script is configured in the Forge dashboard.
- **Vapor Deployment Pattern:**
  ```bash
  php artisan vapor deploy production
  ```
  Vapor handles the full deployment: creates a Lambda deployment, updates environment variables, runs migrations, manages database connections.
- **GitHub Actions + Forge Pattern:**
  ```yaml
  - name: Deploy to Forge
    run: |
      curl -X POST ${{ secrets.FORGE_DEPLOY_URL }}
  ```
  After CI passes, trigger a Forge deployment via its webhook URL (stored as a GitHub secret).
- **Envoyer Zero-Downtime Pattern:**
  ```php
  // Envoyer deploy script
  $git pull origin {{ branch }};
  $composer install --no-dev --optimize-autoloader;
  $php artisan migrate --force;
  $php artisan config:cache;
  $php artisan route:cache;
  ```
  Envoyer clones the repository to a new directory, runs the script, then atomically symlinks the new release.
- **CI Graceful Deploy Pattern:**
  ```yaml
  - name: Maintenance mode on
    run: php artisan down --retry=60
  - name: Deploy
    run: deploy-script.sh
  - name: Health check
    run: curl -f --retry 5 --retry-delay 5 http://localhost/health
  - name: Maintenance mode off
    if: success()
    run: php artisan up
  - name: Rollback
    if: failure()
    run: php artisan up && echo "Deploy failed, check logs"
  ```

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Deployment platform | Forge vs Vapor vs Envoyer vs custom | Forge for standard VPS; Vapor for serverless; Envoyer for zero-downtime requirements; custom only if existing infrastructure demands it |
| Trigger | Auto (push-based) vs manual approval | Auto-deploy to staging; manual approval gate for production |
| Database migrations | Before vs after code switch | Before (old code may not be compatible with new schema); test migration compatibility in staging first |
| Rollback strategy | Git revert vs artifact restore vs previous release | Artifact restore (previous release directory) for speed; git revert for persistent fix |

## Tradeoffs

- **Forge vs Vapor:** Forge gives full server control (custom Nginx config, server-side cron, full SSH access) but requires server management. Vapor eliminates server management (auto-scaling, managed RDS, no SSH) but has Lambda constraints (cold starts, 15-min execution limit, file system limitations).
- **Auto-Deploy vs Manual Approval:** Auto-deploy is faster (PR merged → live in 5 minutes) but increases risk of bad deployments. Manual approval adds safety at the cost of latency (waiting for a human to click "approve"). Hybrid: auto-deploy to staging; manual approval for production.
- **Migration Order:** Running migrations before code switchover ensures the database is ready but may break the old code. Running after avoids old-code breakage but risks new code running against old schema. Best practice: test migrations in staging; run them before switchover with backward-compatible migrations.

## Performance Considerations

- **Deployment Duration:** Forge deployment: 30-90 seconds (script execution + cache rebuild). Vapor deployment: 2-5 minutes (Lambda function update, alias swap). Envoyer deployment: 15-30 seconds (symlink atomic switch).
- **CI Pipeline Time:** Full CI + deployment pipeline takes 5-20 minutes. Optimize by: parallelizing test jobs, using dependency caching, running Dusk only on relevant changes.
- **Downtime Window (if any):** Traditional deployment (maintenance mode): 10-30 seconds of downtime. Zero-downtime (Envoyer, Vapor): 0 seconds of downtime. Choose based on application SLA requirements.

## Production Considerations

- **Secrets Management:** Never expose production credentials in CI logs. Use GitHub Secrets, Forge environment variables, or Vapor environment management. Rotate deployment secrets quarterly.
- **Migration Safety:** All migrations must be reversible (down method). Test migrations in staging before production. Document rollback strategy for each deployment that includes migrations.
- **Queue Worker Management:** During deployment, drain queue workers, let them finish current jobs, then restart after the new code is deployed. Forge deploys with queue:restart; Vapor handles this automatically.
- **Monitoring Integration:** Post-deployment, verify application health via Pulse, Telescope, or external monitoring (Laravel Nightwatch, DataDog). Set up deploy annotations in monitoring tools to correlate performance changes with deployments.

## Common Mistakes

- **Missing migration rollback plan:** A deployment that includes a destructive migration (drop column) cannot be rolled back without data loss. Always make migrations reversible; have a data restoration plan for destructive changes.
- **Caching before config is ready:** Running `php artisan config:cache` before the .env file is correctly configured; cached config references wrong values
- **Deploying without testing:** Skipping the test suite because "it's just a small change"; the small change breaks a seemingly unrelated feature
- **Friday deployments:** Deploying on Friday afternoon with no one available to fix issues until Monday
- **No health check:** Pipeline reports success but the application is returning 500 errors; no automated verification step caught the failure

## Failure Modes

- **Failed Migration:** A migration fails midway, leaving the database in an inconsistent state. Mitigate: wrap migrations in transactions (where supported); test in staging first; have a manual rollback plan.
- **Asset Build Failure:** npm run production fails, leaving the application with broken CSS/JS. Mitigate: build assets in CI and include in the artifact; verify asset loading in health check.
- **Queue Worker Stuck:** Queue worker is processing a long-running job and doesn't restart on time; new code is deployed but old workers handle new jobs. Mitigate: drain queue before deploy; set worker timeout to < deployment frequency.
- **Server Disk Full:** composer install or migration fills the server's disk; the deployment fails and the application is in maintenance mode. Mitigate: monitor disk space; deploy in a separate release directory (Envoyer pattern).

## Ecosystem Usage

- **Laravel Forge:** The most common deployment target for Laravel applications; Forge's deploy script and Quick Deploy feature are the primary automation mechanisms
- **Laravel Vapor:** The serverless deployment option for Laravel; Vapor's `deploy` command handles the full CI/CD pipeline through the Vapor CLI
- **Laravel Envoyer:** The zero-downtime deployment option; Envoyer's symlink-based deployment is the gold standard for high-availability Laravel applications
- **GitHub Actions:** The most common CI/CD orchestrator; Laravel teams use GitHub Actions to coordinate testing, building, and triggering deployments

## Related Knowledge Units

- github-actions-for-laravel
- automated-testing-in-ci
- automated-changelog-generation
- development-workflow-documentation
- dusk-browser-tests-ci

## Research Notes

- Laravel Forge powers over 500,000 server deployments; its deploy script template is the most widely used deployment pattern in the Laravel ecosystem
- Laravel Vapor, launched in 2019, has made serverless Laravel deployment accessible; its auto-scaling and pay-per-request model appeal to variable-traffic applications
- Envoyer's zero-downtime deployment uses the same atomic-symlink pattern as Capistrano (Ruby); this pattern was popularized in the PHP world by Deployer before Envoyer
- The "deploy Friday" risk is statistically significant: deployments on Friday are 3x more likely to cause production incidents compared to Tuesday/Wednesday deployments
