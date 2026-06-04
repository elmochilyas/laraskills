# Rules for Gracefully Handling Production Errors

---

## Rule: Create a Minimal, Dependency-Free 500 Error Page

---

## Category

Reliability

---

## Rule

Always create a minimal, self-contained `resources/views/errors/500.blade.php` with inline CSS, no layout inheritance, no database queries, and no complex Blade directives.

---

## Reason

The 500 error page itself can fail if it depends on the same services that caused the original error (database, cache, layout). A minimal failsafe uses no dependencies — pure HTML/CSS inline, no layout inheritance, no DB queries.

---

## Bad Example

```blade
{{-- Depends on app layout which queries the database for navigation --}}
@extends('layouts.app')
@section('content')
    <h1>Server Error</h1>
@endsection
```

---

## Good Example

```blade
{{-- Self-contained, no dependencies --}}
<!DOCTYPE html>
<html>
<head><title>Server Error</title>
<style>body{font-family:sans-serif;text-align:center;padding:80px 20px}</style>
</head>
<body><h1>500</h1><p>Something went wrong.</p></body>
</html>
```

---

## Exceptions

API-only applications don't need an HTML failsafe — ensure the handler returns JSON even in fallback.

---

## Consequences Of Violation

Error page fails when it's needed most — users see a white screen instead of a branded error page.

---

## Rule: Use Maintenance Mode Only as a Last Resort

---

## Category

Reliability

---

## Rule

Reserve `php artisan down` for planned deployments with expected downtime, data-corrupting failures, and complete outages. For partial or feature-specific failures, use degraded operation (stale cache, read-only mode, feature-specific error page).

---

## Reason

Maintenance mode blocks all traffic — every user, every feature. Most failures affect only a subset of features or users. Blocking all traffic for a partial failure punishes all users for a problem affecting some.

---

## Bad Example

```bash
# Search feature is broken — taking down the entire application
php artisan down
```

---

## Good Example

```php
// Show search-specific error page instead of taking down everything
Route::fallback(function () {
    if (request()->is('search*')) {
        return response()->view('errors.search-down', [], 503);
    }
});
```

---

## Exceptions

Complete outages (database server down, infrastructure failure) and data-corrupting failures warrant full maintenance mode.

---

## Consequences Of Violation

Users lose trust in availability. Competitors gain advantage. Alert fatigue from unnecessary maintenance windows.

---

## Rule: Implement Health Check Endpoints

---

## Category

Reliability

---

## Rule

Always implement `/health` (application responds) and `/health/db` (database connected) endpoints for production applications behind load balancers or auto-scaling infrastructure.

---

## Reason

Health checks enable load balancers to route traffic away from failing nodes. Without them, traffic is routed to broken instances and users see errors.

---

## Bad Example

```php
// Health endpoint that always returns 200 — useless
Route::get('/health', fn() => response()->json(['status' => 'ok']));
```

---

## Good Example

```php
Route::get('/health/db', function () {
    try {
        DB::select('SELECT 1');
        return response()->json(['status' => 'ok']);
    } catch (Throwable $e) {
        return response()->json(['status' => 'error'], 500);
    }
});
```

---

## Exceptions

Applications not behind load balancers or auto-scaling groups may not need health checks.

---

## Consequences Of Violation

Traffic routed to failing nodes. Users see errors while healthy nodes sit idle.

---

## Rule: Configure Production Error Monitoring from Day One

---

## Category

Reliability

---

## Rule

Always integrate an external error tracker (Sentry, Flare, Bugsnag) and configure alerting for CRITICAL exception types before deploying to production.

---

## Reason

Without error monitoring, production errors are invisible until users report them. Early integration captures errors from the first deployment, providing a baseline for what normal operation looks like.

---

## Bad Example

```php
// No error tracker — production is a black box
```

---

## Good Example

```php
// Sentry integrated from day one
$exceptions->reportable(function (Throwable $e) {
    if (app()->environment('production')) {
        \Sentry\captureException($e);
    }
});
```

---

## Exceptions

Side projects and prototypes that don't have production users.

---

## Consequences Of Violation

Errors are invisible until users report them. No baseline for normal operation. Incident response is reactive instead of proactive.
