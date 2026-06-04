## Ban Closure Routes in Production

Every route must use a controller reference. Do not use Closure-based route handlers in any production code.

---

## Category

Performance

---

## Rule

Use `[Controller::class, 'method']` or invokable controllers for all route handlers. Never use Closure/fn() route handlers.

---

## Reason

A single Closure route blocks `php artisan route:cache` for the entire application. All routes lose the 5x matching performance benefit because the framework cannot serialize Closures. This is a framework enforcement, not a recommendation — the serializer throws `LogicException` on Closure routes.

---

## Bad Example

```php
Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});
// One Closure — blocks caching for ALL routes
```

---

## Good Example

```php
// Invokable controller
class HealthController
{
    public function __invoke()
    {
        return response()->json(['status' => 'ok']);
    }
}

Route::get('/health', HealthController::class);
```

---

## Exceptions

Development-only routes may use Closures since route cache is not used in development. Never deploy Closure routes to production.

---

## Consequences Of Violation

All route matching is uncached (5-15ms per request instead of 1-2ms); increased server costs at scale; cascading performance degradation as route count grows.

---

## Run route:cache on Every Deployment

Always run `php artisan route:cache` as part of the deployment script.

---

## Category

Performance

---

## Rule

Include `php artisan route:cache` in the deployment pipeline, executed after all route files and dependencies are deployed but before the application serves traffic.

---

## Reason

Without route caching, every request iterates all registered routes and compiles regex patterns (5-15ms for 100 routes). Caching reduces matching to ~1-2ms regardless of route count. A deployment script that omits caching silently loses this optimization.

---

## Bad Example

```yaml
deploy:
  script:
    - php artisan migrate
    # Missing: php artisan route:cache
```

---

## Good Example

```yaml
deploy:
  script:
    - php artisan migrate
    - php artisan route:cache
    - php artisan route:list  # Verify all routes present
```

---

## Exceptions

Applications with zero routes or purely Closure-based routes (not recommended) cannot use route caching. For all other applications, it is mandatory.

---

## Consequences Of Violation

5-10x slower route matching on every request; higher server CPU usage; lower throughput under load.

---

## Verify After Caching

Run `php artisan route:list` immediately after `route:cache` to confirm all routes are present.

---

## Category

Reliability

---

## Rule

After generating the route cache, validate it by running `php artisan route:list`. If routes are missing, diagnose and fix before completing the deployment.

---

## Reason

A failed cache generation (due to an uncaught Closure route or serialization error) silently falls back to uncached matching. `route:cache` may succeed but produce a partial cache if conditional route registration skips some routes. `route:list` after caching reveals both issues.

---

## Bad Example

```bash
php artisan route:cache
# No verification — silent failure not detected
```

---

## Good Example

```bash
php artisan route:cache && php artisan route:list
# Verify expected routes before proceeding
```

---

## Exceptions

No common exceptions. Verification takes milliseconds and catches silent failures.

---

## Consequences Of Violation

Silent fallback to uncached matching; missing routes in production (404 errors for legitimate URIs); deployments that degrade performance without alerting.

---

## Clear Cache Before Route Modifications in Development

Run `php artisan route:clear` before adding or modifying routes during development.

---

## Category

Reliability

---

## Rule

Always clear the route cache before modifying route files in local development. Never run `route:cache` in development.

---

## Reason

A stale route cache prevents new or modified routes from being recognized. Developers adding routes will see 404 errors and waste time debugging non-existent problems. The cache must be cleared before route file changes take effect.

---

## Bad Example

```bash
# Developer adds a new route to web.php
# Requests to the new route return 404
# Developer spends 30 minutes debugging before remembering cache
```

---

## Good Example

```bash
php artisan route:clear
# Then modify routes — changes take effect immediately
```

---

## Exceptions

If `APP_ENV` is set to `local`, Laravel does not load the route cache. Developers working in local environments should never manually run `route:cache`. CI/CD pipelines should clear cache as the first deployment step.

---

## Consequences Of Violation

Wasted development time debugging phantom 404s; accidental deployment of un-cached routes; confusion between developers running cached vs uncached environments.

---

## Do Not Use Conditional Route Registration

Do not register routes conditionally based on runtime values.

---

## Category

Reliability

---

## Rule

All route definitions must be unconditional. Do not use `if (config('feature.x'))` or other runtime conditionals around route registration.

---

## Reason

`route:cache` captures the route state at cache generation time. Conditional routes that depend on runtime values may be cached incorrectly — either included when they should not be, or excluded when they should be. The cached state is frozen and does not reflect runtime conditions.

---

## Bad Example

```php
if (config('app.feature_x_enabled')) {
    Route::get('/feature-x', [FeatureController::class, 'index']);
}
// At cache time: feature_x_enabled=true → cached
// At request time: feature_x_enabled=false → route still matches
```

---

## Good Example

```php
Route::get('/feature-x', [FeatureController::class, 'index']);
// Feature toggling handled in middleware or controller, not route registration
```

---

## Exceptions

Development-only conditional routes (wrapped in `if (app()->environment('local'))`) are acceptable since caching is not used in development.

---

## Consequences Of Violation

Routes that should not be accessible still match after cache generation; routes that should be accessible are missing; incorrect behavior after configuration changes without cache regeneration.
