# Knowledge Unit: GitHub Actions for Laravel

## Metadata
- **Subdomain:** Workflow Automation & CI/CD
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** workflow-automation-cicd/github-actions-for-laravel
- **Maturity:** Mature
- **Related Technologies:** GitHub Actions, CI/CD, Laravel, PHPUnit, Pint, PHPStan, Dusk, Forge, Vapor

## Executive Summary

GitHub Actions is the most widely used CI/CD platform for Laravel applications, providing native integration with GitHub repositories, a marketplace of pre-built actions, and flexible workflow configuration via YAML. For Laravel teams, GitHub Actions workflows typically cover: testing (PHPUnit/Pest, Pint, PHPStan, Dusk), deployment (triggering Forge/Vapor deployments, running Envoyer scripts), dependency management (Dependabot integration), code quality reporting (coverage uploads to Codecov), and automation (changelog generation, release creation). Key Laravel-specific considerations include: caching Composer dependencies and NPM packages, configuring MySQL/PostgreSQL service containers, matching PHP versions to the production environment, and handling environment-specific secrets. Well-designed GitHub Actions workflows provide fast feedback (<15 minutes for full CI), clear failure reporting (annotations on PRs, Slack notifications), and efficient resource usage (parallel jobs, caching, conditional execution).

## Core Concepts

- **Workflow:** A configurable YAML file (in .github/workflows/) that defines a CI/CD process; triggered by events (push, pull_request, schedule, workflow_dispatch)
- **Job:** A unit of work that runs on a GitHub-hosted or self-hosted runner; jobs can run sequentially or in parallel
- **Service Container:** A Docker container that runs alongside a job (e.g., MySQL, Redis, Mailpit) and is available at localhost for the application
- **Action:** A reusable unit of code (marketplace action or local action) that performs a specific task (checkout code, setup PHP, cache dependencies)
- **Runner:** A virtual machine (Ubuntu, Windows, macOS) or self-hosted machine that executes workflow jobs; GitHub-hosted runners include PHP by default but require the setup-php action for specific version/extensions

## Mental Models

- **Workflow as Pipeline Blueprint:** Each .github/workflows/*.yml file is a blueprint for a specific pipeline (test, deploy, lint); GitHub Actions reads the blueprint and provisions the resources to execute it
- **Job as Stage:** Each job is a stage in the pipeline (lint → test → deploy); stages run in dependency order, and if a stage fails, downstream stages are skipped
- **Action as Function Call:** Each action (uses: actions/checkout@v4, uses: shivammathur/setup-php@v2) is a function call that performs a specific operation, accepting parameters via the with: block

## Internal Mechanics

1. **Trigger:** On push, pull_request, or other configured event, GitHub creates a workflow run and provisions a runner
2. **Checkout:** actions/checkout clones the repository at the triggering commit
3. **PHP Setup:** shivammathur/setup-php installs the specified PHP version, extensions (mbstring, pdo_mysql, bcmath, xml), and tools (composer, phpunit)
4. **Service Startup:** MySQL/Redis service containers start (health-checked before jobs proceed)
5. **Dependency Installation:** composer install with caching; npm ci if frontend tests are included
6. **Quality Gates:** Pint --test, PHPStan analyse, php artisan test run sequentially or in parallel jobs
7. **Reporting:** Test results are annotated on the PR, coverage is uploaded to Codecov, Slack/Discord notifications are sent
8. **Deployment (optional):** If all tests pass and the branch is main, the deployment step triggers Forge/Vapor/Envoyer

## Patterns

- **Standard Laravel CI Pattern:**
  ```yaml
  name: Laravel CI

  on:
    push:
      branches: [main, develop]
    pull_request:
      branches: [main]

  jobs:
    laravel-tests:
      runs-on: ubuntu-latest
      services:
        mysql:
          image: mysql:8.0
          env:
            MYSQL_ALLOW_EMPTY_PASSWORD: true
            MYSQL_DATABASE: testing
          ports:
            - 3306:3306
          options: --health-cmd="mysqladmin ping" --health-interval=10s

      steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with:
          php-version: 8.3
          extensions: mbstring, pdo_mysql, bcmath
      - uses: actions/cache@v3
        with:
          path: vendor
          key: ${{ runner.os }}-php-${{ hashFiles('composer.lock') }}
      - run: composer install --no-interaction --prefer-dist
      - run: cp .env.example .env
      - run: php artisan key:generate
      - run: php artisan migrate
      - run: php artisan test --parallel
  ```
- **Matrix Testing Pattern:**
  ```yaml
  strategy:
    matrix:
      php: [8.1, 8.2, 8.3]
      laravel: [10, 11]
      exclude:
        - php: 8.1
          laravel: 11
  ```
  Tests against multiple PHP and Laravel version combinations; ensures compatibility across supported versions.
- **Parallel Job Pattern:**
  ```yaml
  jobs:
    pint:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: shivammathur/setup-php@v2
        - run: composer install
        - run: ./vendor/bin/pint --test

    phpstan:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: shivammathur/setup-php@v2
        - run: composer install
        - run: ./vendor/bin/phpstan analyse

    tests:
      runs-on: ubuntu-latest
      services:
        mysql:
          image: mysql:8.0
          env:
            MYSQL_ALLOW_EMPTY_PASSWORD: true
            MYSQL_DATABASE: testing
          ports:
            - 3306:3306
          options: --health-cmd="mysqladmin ping" --health-interval=10s
      steps:
        - uses: actions/checkout@v4
        - uses: shivammathur/setup-php@v2
        - run: composer install
        - run: cp .env.example .env
        - run: php artisan key:generate
        - run: php artisan migrate
        - run: php artisan test --parallel
  ```
  Pint, PHPStan, and tests run in parallel (different jobs); each has its own runner, reducing total pipeline time.
- **Deployment Trigger Pattern:**
  ```yaml
  deploy:
    needs: [pint, phpstan, tests]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - name: Trigger Forge deployment
        run: |
          curl -X POST ${{ secrets.FORGE_DEPLOY_URL }}
      - name: Notify Slack
        run: |
          curl -X POST -H 'Content-type: application/json' \
            --data '{"text":"Deployed to production!"}' \
            ${{ secrets.SLACK_WEBHOOK_URL }}
  ```
  Deploys only after all test jobs pass; deployment targets only the main branch on push events (not PRs).
- **Scheduled Maintenance Pattern:**
  ```yaml
  on:
    schedule:
      - cron: '0 6 * * 1'  # Every Monday at 6 AM
  jobs:
    health-check:
      runs-on: ubuntu-latest
      steps:
        - run: curl -f https://production.example.com/health
        - run: php artisan passport:purge
        - run: php artisan model:prune
  ```
  Scheduled workflows for maintenance tasks (health checks, data pruning, cache warming) that don't require a code change.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Runner | GitHub-hosted (ubuntu-latest) vs self-hosted | GitHub-hosted for standard projects; self-hosted for projects needing custom hardware or persistent caches |
| PHP version management | shivammathur/setup-php vs Docker container | setup-php action (simpler, faster, GitHub-native); Docker for environment parity with Sail |
| Database for tests | SQLite in-memory vs MySQL service container | MySQL service container (mirrors production); SQLite in-memory as speed optimization for unit-only test suites |
| Caching | actions/cache with hash-based keys vs restore keys | Hash-based keys (exact match); restore keys (partial match fallback) for best cache hit rate |

## Tradeoffs

- **Single Job vs Parallel Jobs:** A single job (all steps in sequential order) is simpler to configure but slower (15-20 minutes). Parallel jobs (lint + static analysis + tests running concurrently) are faster (5-10 minutes total) but more complex to configure and troubleshoot. Start with parallel jobs; simplify if debugging becomes difficult.
- **GitHub-Hosted vs Self-Hosted Runners:** GitHub-hosted runners require zero maintenance (auto-updated, always available) but have limited resources (2-7 GB RAM, 70 GB SSD) and cost per minute. Self-hosted runners offer more resources and cost control but require maintenance. Use GitHub-hosted for most teams; self-hosted for projects with large test suites or custom hardware needs.
- **Matrix Testing vs Single Version:** Matrix testing against multiple PHP/Laravel versions catches compatibility issues but multiplies CI time and cost. Single version (match production) is faster and cheaper but may miss compatibility regressions. Use matrix for packages/libraries; single version for applications.

## Performance Considerations

- **CI Pipeline Time:** Well-optimized Laravel CI: 5-10 minutes total. Without caching and parallelization: 15-30 minutes. Optimize by: caching vendor/ and node_modules/, parallel jobs, running Dusk separately (slower), and using PHPStan's result cache.
- **GitHub Actions Minutes Usage:** Standard plan: 2000-3000 free minutes/month. A 10-minute CI run on 40 PRs/week = ~400 minutes/week = 1600 minutes/month. Optimize to stay within free tier or pay for additional minutes.
- **Cache Hit Rate:** composer.lock changes infrequently (weekly/monthly), so vendor/ cache hit rate is high (90%+). NPM (package-lock.json) also caches well. Use hash-based keys for exact cache matches.

## Production Considerations

- **Secrets Management:** Store deployment tokens, API keys, and environment variables as GitHub Actions secrets (Settings > Secrets and variables). Never hardcode secrets in workflow files. Rotate secrets quarterly.
- **Environment-Specific Secrets:** Use GitHub environments (Settings > Environments) for production-specific secrets; different environments (production, staging) have different secret scopes.
- **Workflow Approval:** For production deployments, add required reviewers to the production GitHub Environment; deployments require manual approval even after CI passes.

## Common Mistakes

- **No dependency caching:** Running composer install on every push without caching vendor/; each run spends 30-60 seconds downloading packages that haven't changed
- **MySQL service not health-checked:** Starting the MySQL service container without a health check; the test step runs before MySQL is ready, causing connection errors
- **Wrong event trigger:** Running the full test suite on both push and pull_request; duplicate CI runs waste minutes. Use push:main + pull_request:main for efficient coverage.
- **Hardcoded secrets:** Putting database passwords or API keys directly in the workflow YAML; they're visible in the repository and exposed to anyone with repository access
- **No PHP extension installation:** Trying to run Laravel without the required PHP extensions (pdo_mysql, mbstring, bcmath, xml); tests fail with "class not found" errors

## Failure Modes

- **Runner Disk Full:** composer install + npm install + debugging artifacts fill the runner's disk (70 GB limit). Mitigate: clean up after jobs; avoid storing large artifacts; use self-hosted runners for large projects.
- **Cache Miss:** A new branch has a different composer.lock than main; cache doesn't match and a full install runs. Mitigate: use restore-keys to fall back to the nearest matching cache.
- **Service Container Startup Timeout:** MySQL service container takes too long to start; the job times out. Mitigate: increase health check retries; use pre-pulled Docker images.
- **Concurrent Workflow Limit Exceeded:** Too many concurrent PRs run CI simultaneously; GitHub throttles or queues workflow runs. Mitigate: reduce matrix dimensions; merge PRs faster; upgrade to paid plan.

## Ecosystem Usage

- **Laravel Documentation:** The official Laravel docs include a GitHub Actions CI template for Laravel applications; it's the recommended starting point for new projects
- **Laravel Forge:** Forge provides deployment webhook URLs that GitHub Actions calls to trigger production deployments after successful CI
- **Laravel Vapor:** The Vapor CLI can be called from GitHub Actions to deploy serverless applications; Vapor's `deploy` command integrates directly into CI workflows
- **Laravel Nova:** Nova CI workflows often include asset compilation and cache clearing steps specific to Nova's admin panel deployment

## Related Knowledge Units

- automated-testing-in-ci
- automated-deployment-pipelines
- phpstan-in-ci
- pint-in-ci
- dusk-browser-tests-ci

## Research Notes

- shivammathur/setup-php is the most widely used PHP setup action on the GitHub Marketplace, supporting PHP 5.6 through 8.4 with configurable extensions and tools
- GitHub Actions announced free macOS runners in 2024, enabling Laravel teams to add macOS-specific CI jobs if needed
- The `actions/cache` action v4 uses a new cache backend with faster restore times and higher reliability compared to v3
- GitHub Actions usage has grown 3x year-over-year for Laravel projects since 2022, making it the dominant CI platform for the Laravel ecosystem
