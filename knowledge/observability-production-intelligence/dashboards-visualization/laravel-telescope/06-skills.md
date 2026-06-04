```yaml
name: telescope-debugging-setup
description: >
  Guide an AI agent through installing and using Laravel Telescope for
  local development and debugging — watcher configuration, entry filtering,
  dump usage, and troubleshooting common development issues.
workflow:
  steps:
    - name: install-telescope
      description: >
        Run `composer require laravel/telescope --dev`.
        Run `php artisan telescope:install`.
        Run `php artisan migrate`.
        Telescope is auto-enabled in local environment.

    - name: configure-watchers
      description: >
        Edit config/telescope.php to customize watchers.
        Enable: RequestWatcher, QueryWatcher, ExceptionWatcher,
        JobWatcher, MailWatcher, DumpWatcher.
        Disable: CacheWatcher, NotificationWatcher, EventWatcher
        (unless actively debugging these).

    - name: use-dump-for-debugging
      description: >
        Replace dd() calls with Telescope::dump():
        Telescope::dump($user, $order, $paymentResult);
        Dump appears in Telescope dashboard under Dumps tab.
        Request continues executing normally.

    - name: search-and-filter-entries
      description: >
        Use Telescope dashboard filters: by type (request, query,
        exception), by tag (custom feature tags), by status code,
        by time range. Use search for specific content.

    - name: inspect-queries
      description: >
        Open a request entry in Telescope. Navigate to Queries tab.
        View all database queries for that request with timing,
        bindings, and stack trace. Identify N+1 queries.

    - name: configure-tags
      description: >
        Add tags in application code:
        Telescope::tag(['feature:checkout', 'user:'.$user->id]);
        Tags appear in Telescope dashboard for filtering.

    - name: troubleshoot-common-issues
      description: >
        If Telescope dashboard is empty: check TELESCOPE_ENABLED,
        check watchers config, check migration ran.
        If slow: reduce watchers or increase pruning interval.

  triggers:
    - User asks "How do I set up Telescope?"
    - User asks "How do I debug a query in Laravel?"
    - User reports "Telescope dashboard is empty"
    - User asks "What's the difference between dd() and Telescope::dump()"
```
