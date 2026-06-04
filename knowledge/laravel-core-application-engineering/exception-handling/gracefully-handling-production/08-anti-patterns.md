# Anti-Patterns: Gracefully Handling Production Errors

## 1. The Cascading Error Page

The 500 error page depends on the application layout, which queries the database for navigation menus. When the database is down, the error page itself fails — users see a white screen.

```blade
{{-- This fails when the database is down --}}
@extends('layouts.app')
@section('content')
    <h1>Server Error</h1>
@endsection
```

Create a minimal, self-contained error page with inline CSS and no dependencies. When all else fails, this page must still render.

## 2. The Nuclear Button

Using maintenance mode (`php artisan down`) for every failure, including minor feature-specific issues.

```bash
# Search is slow — take down the entire application
php artisan down
```

Maintenance mode blocks all traffic. Most failures affect only a subset of users or features. Use degraded operation for partial failures — feature-specific error pages, cached fallbacks, read-only mode.

## 3. The Silent Production

No error monitoring, no alerting, no health checks. Production is a black box.

Errors are invisible until users report them via support channels. By the time the team knows about a failure, it may have been affecting users for hours or days. Configure error monitoring and alerting before the first production deployment.

## 4. The Useless Health Check

A health check endpoint that returns 200 regardless of actual application health.

```php
Route::get('/health', fn() => response()->json(['status' => 'ok']));
```

Without database verification, the health check passes even when the database is disconnected. The load balancer keeps routing traffic to a broken node. Implement `/health/db` to verify database connectivity.

## 5. The Maintenance Mode Without Retry

Running `php artisan down` without the `--retry` flag.

Clients, bots, and search engine crawlers receive a 503 with no indication of when to retry. They hammer the server with requests, compounding the load during an outage. Always include `--retry=60` to tell clients to wait 60 seconds before retrying.
