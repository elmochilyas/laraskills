# Skill: Create And Register Feature Routes

## Purpose

Define and register a per-feature route file with consistent prefixing, naming, and controller references, loaded through the feature's service provider.

## When To Use

- Creating a new feature that exposes HTTP endpoints
- Adding routes to an existing feature
- Refactoring global routes into feature-specific route files

## When NOT To Use

- Features with zero HTTP endpoints (console-only features)
- Routes that span multiple features (global middleware routes, API version prefixes)
- Small applications with <20 routes where a single route file is simpler

## Prerequisites

- Feature directory exists
- Feature service provider exists with `boot()` method
- Controllers are created in the feature's `Controllers/` directory

## Inputs

- Feature name (e.g., `Billing`)
- Route definitions (HTTP methods, URIs, controller actions)
- Middleware requirements
- Route naming convention

## Workflow

1. Create `app/Features/{Feature}/routes.php`
2. Define a route group with `Route::middleware([...])->prefix('/feature-name')->name('feature-name.')`
3. Use fully qualified class names for controller references: `[App\Features\Billing\Controllers\InvoiceController::class, 'index']`
4. Use named routes for all URLs: `->name('invoices.index')`
5. Never use route closures — always use controller classes
6. Open the feature's service provider and add `$this->loadRoutesFrom(__DIR__.'/../routes.php')` in `boot()`
7. Verify registration: `php artisan route:list | grep feature-name`
8. Run `php artisan route:cache` in production deployment

## Validation Checklist

- [ ] Route file exists at `app/Features/{Feature}/routes.php`
- [ ] `loadRoutesFrom()` called in `boot()` of service provider
- [ ] Routes use fully qualified class names for controllers (no route closures)
- [ ] Route prefix is unique: `prefix('/billing')`
- [ ] Route name prefix is unique: `name('billing.')`
- [ ] All URLs use `route('name')` helper — no hardcoded URLs
- [ ] `php artisan route:list` shows feature routes with correct URIs
- [ ] `php artisan route:cache` works without errors

## Common Failures

| Failure | Cause | Prevention |
|---------|-------|-------------|
| Route closures | Convenience, speed | Always use controller classes |
| Hardcoded URLs | Bypassing route helper | Use `route('name')` everywhere |
| Route name collision | No feature prefix | Use `billing.invoices.*` naming |
| Missing `loadRoutesFrom()` | Provider not updated | Verify with `route:list` |
| Stale cached routes | Forgetting `route:clear` | Clear cache after route changes |

## Decision Points

- **Single file vs Multiple files**: Use one `routes.php` per feature. Split into `web.php`, `api.php`, `admin.php` only when the feature has routes with distinct middleware groups.
- **Resource vs explicit**: Use `Route::resource()` for standard CRUD. Use explicit routes for non-standard actions.
- **Prefix naming**: Lowercase, hyphenated feature name: `/billing`, `/user-management`.

## Performance Considerations

Route caching eliminates any performance difference. On cached requests, all routes are read from a single compiled file. Without caching, `loadRoutesFrom()` uses PHP's `require` — negligible overhead per feature.

## Security Considerations

Feature routes are subject to the same middleware, authentication, and CSRF protection as global routes. Apply middleware in the route group. Route model binding works identically.

## Related Rules

- Never Use Route Closures In Feature Files (05-rules.md)
- Use Consistent Prefix And Name Conventions (05-rules.md)
- Always Use Named Routes For URLs (05-rules.md)
- Verify Feature Routes With `php artisan route:list` (05-rules.md)
- Run `php artisan route:cache` In Every Deployment (05-rules.md)
- Organize Multiple Route Files Per Feature Group (05-rules.md)

## Related Skills

- Create A New Feature Scaffold
- Create Feature Service Provider
- Implement Route Model Binding For Feature Models

## Success Criteria

- Feature routes respond at their expected URIs
- `php artisan route:list` shows all feature routes
- Named routes resolve correctly: `route('billing.invoices.index')`
- Route caching works without errors

---

# Skill: Implement Route Model Binding For Feature Models

## Purpose

Register explicit route model bindings for feature-namespaced Eloquent models so that controller methods receive resolved model instances automatically.

## When To Use

- Controllers in a feature need to type-hint feature-namespaced models
- Adding route model binding to an existing feature's routes
- Replacing manual `findOrFail()` calls with automatic model resolution

## When NOT To Use

- Models in the global `App\Models\` namespace (use Laravel's default implicit binding)
- Route parameters that are not Eloquent models (use custom binding or explicit resolution)
- API resources where you want more control over resolution logic

## Prerequisites

- Feature model exists in `App\Features\{Feature}\Models\`
- Feature service provider exists with `boot()` method
- Feature route file exists with route parameters

## Inputs

- Feature model fully qualified class name
- Route parameter name
- Explicit or implicit binding strategy

## Workflow

1. Open the feature's service provider
2. In `boot()`, add `Route::model('param_name', App\Features\{Feature}\Models\{Model}::class)`
3. In the controller method, type-hint the feature model: `public function show(Invoice $invoice)`
4. Ensure the route parameter name matches: `Route::get('/invoices/{invoice}', ...)`
5. For custom resolution, use `Route::bind('param_name', fn ($value) => ...)` instead

## Validation Checklist

- [ ] `Route::model()` or `Route::bind()` registered in service provider `boot()`
- [ ] Route parameter name matches the binding registration
- [ ] Controller type-hint uses fully qualified class name
- [ ] `php artisan route:list` shows the route with correct binding
- [ ] Model is resolved correctly when route is accessed
- [ ] 404 returned when model is not found

## Common Failures

| Failure | Cause | Prevention |
|---------|-------|-------------|
| Missing binding registration | Assuming implicit binding works for feature models | Always register explicitly |
| Route parameter mismatch | `{invoice}` in route, `Route::model('billing_invoice', ...)` | Names must match exactly |
| Wrong model class | Incorrect FQCN in binding | Double-check namespace and class name |
| Resolution inconsistency | Some routes use binding, others use `findOrFail` | Use consistently across all routes |

## Decision Points

- **Explicit vs Implicit binding**: Use `Route::model()` for explicit registration. Implicit binding (`public function show(Invoice $invoice)`) works if Laravel can resolve the FQCN from the type-hint — test to confirm.
- **Custom resolution**: Use `Route::bind()` for non-standard resolution (e.g., soft-deleted models, caching). Use `Route::model()` for standard ID-based resolution.

## Performance Considerations

Route model binding executes a database query on every matching request. For high-traffic routes, consider caching resolved models or using eager loading. The cost is identical for feature models and global models.

## Security Considerations

Route model binding automatically returns 404 when the model is not found. This is secure behavior. Ensure authorization policies are applied in the controller or middleware, not in the binding itself.

## Related Rules

- Use Route Model Binding For Feature Models (05-rules.md)
- Use Consistent Prefix And Name Conventions (05-rules.md)
- Verify Feature Routes With `php artisan route:list` (05-rules.md)

## Related Skills

- Create And Register Feature Routes
- Add A Feature-Specific Model
- Create Feature Service Provider

## Success Criteria

- Controller method receives resolved model instance
- Missing model returns 404 automatically
- No manual `findOrFail()` calls in controllers for bound models
- Route caching works with explicit bindings
