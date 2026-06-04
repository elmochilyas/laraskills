```yaml
name: nightwatch-laravel-setup
description: >
  Guide an AI agent through installing and configuring Laravel Nightwatch
  for a Laravel application — SDK setup, watcher configuration, alerting,
  and integration with deployment pipeline.
workflow:
  steps:
    - name: install-nightwatch-sdk
      description: >
        Run `composer require laravel/nightwatch`.
        Publish config: `php artisan vendor:publish --tag=nightwatch-config`.
        Set NIGHTWATCH_SERVER and NIGHTWATCH_API_KEY in .env.

    - name: configure-watchers
      description: >
        Review enabled watchers in config/nightwatch.php.
        Enable: HttpRequestWatcher, QueryWatcher, QueueJobWatcher,
        ExceptionWatcher. Disable rarely-needed watchers
        (Mail, Notification, Cache) unless debugging them.

    - name: configure-pii-redaction
      description: >
        Add input redaction patterns to config.
        Example patterns: 'password', 'ssn', 'credit_card',
        'token', 'secret', 'authorization'.
        Test redaction in staging before production.

    - name: set-up-alerts
      description: >
        Configure Nightwatch alert rules:
        - error_rate > 5% over 5m
        - p95_latency > 1000ms over 5m
        - queue_failure_rate > 1%
        - 5xx_spike > 2x normal
        Configure notification channels.

    - name: integrate-deployments
      description: >
        Add deployment notification to CI/CD pipeline.
        Use Nightwatch API: POST /api/deployments
        Payload: { version, commit, environment, timestamp }

    - name: configure-retention
      description: >
        Set retention period based on traffic and storage capacity.
        Default 7 days. Monitor storage usage weekly.

    - name: verify-in-staging
      description: >
        Deploy to staging. Verify watchers send data.
        Check Nightwatch dashboard shows requests, queries,
        and queue jobs. Verify PII redaction.

  triggers:
    - User asks "How do I set up Nightwatch?"
    - User asks "What Nightwatch watchers should I enable?"
    - User reports "Nightwatch is not showing any data"
```
