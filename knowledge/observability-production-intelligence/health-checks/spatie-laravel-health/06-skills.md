```yaml
name: spatie-health-configuration
description: >
  Guide an AI agent through setting up Spatie Laravel Health in a Laravel
  application — configuring checks, result store, notifications, and
  scheduled execution.
workflow:
  steps:
    - name: install-and-publish
      description: >
        Run `composer require spatie/laravel-health`.
        Publish config: `php artisan vendor:publish --tag=health-config`.
        Publish view: `php artisan vendor:publish --tag=health-views`.

    - name: register-checks
      description: >
        Create or modify AppServiceProvider or HealthServiceProvider.
        Register built-in checks:
        - DatabaseCheck: default connection
        - RedisCheck: if using Redis
        - QueueCheck: if using queues
        - HorizonCheck: if using Laravel Horizon
        - MeilisearchCheck: if using Meilisearch

    - name: configure-endpoint-vs-schedule
      description: >
        For each check, decide endpoint vs schedule:
        - $check->onEndpoint(): Fast checks for orchestrator probes
        - $check->onSchedule(): Slow/comprehensive checks
        Use default check groups or custom grouping.

    - name: enable-result-store
      description: >
        Set 'result_store' config to EloquentResultStore::class.
        Run `php artisan vendor:publish --tag=health-migrations`.
        Run `php artisan migrate`.
        Add pruning schedule to kernel.

    - name: setup-notifications
      description: >
        Configure notification channels.
        Set failure_mode to 'stopped' for checks that should not
        notify on transient failures.
        Configure notification throttle if needed.

    - name: add-scheduled-checks
      description: >
        Add to routes/console.php:
        Schedule::command(ScheduleCheckChecksCommand::class)
            ->everyMinute();

    - name: create-custom-check
      description: >
        (If needed) Create custom Check class.
        Implement run(): return Result::ok() or Result::failed().
        Add custom metadata and messages.

    - name: verify-health
      description: >
        Run `php artisan health:check` from CLI.
        Access /health endpoint in browser.
        Verify result store has entries.
        Trigger a check failure and verify notification.

  triggers:
    - User asks "How do I set up health checks in Laravel?"
    - User asks "What health checks should I configure?"
    - User reports "Health check endpoint returns 500"
```
