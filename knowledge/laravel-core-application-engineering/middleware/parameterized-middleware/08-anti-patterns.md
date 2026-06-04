# Anti-Patterns: Parameterized Middleware

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Middleware System |
| Knowledge Unit | Parameterized Middleware |
| Difficulty | Advanced |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|--------------|----------|----------|
| 1 | Missing Default Values for Optional Parameters | Reliability | Critical |
| 2 | Using Environment Variables in Route Definitions | Architecture | High |
| 3 | Comma Delimiter Abuse in Parameter Values | Reliability | High |
| 4 | Numeric Parameters for User-Tier-Based Limits | Architecture | High |
| 5 | Route Parameter Mismatch with `can:` Middleware | Reliability | Medium |

---

## Anti-Pattern 1: Missing Default Values for Optional Parameters

### Category
Reliability

### Description
Declaring a parameterized middleware's `handle()` method with required parameters that have no default values. When the middleware is used without parameters in a route definition (e.g., `auth` instead of `auth:sanctum`), PHP throws a `TypeError: Too few arguments to handle()`.

### Why It Happens
Developers write the `handle()` signature with explicit parameters (`string $guard`) assuming the middleware will always receive parameters. They forget that middleware can be registered without the colon syntax — `auth` is just as valid as `auth:sanctum`. The framework does not enforce parameter presence.

### Warning Signs
- `handle()` signature has parameters without default values: `string $guard` (not `string $guard = null`)
- Middleware is always used with parameters in route definitions but registered globally or in a group without them
- PHP TypeError: "Too few arguments to function handle()" when middleware is used without parameters
- Error appears only on routes that use the middleware without the colon syntax
- The error message points to the Pipeline's call() method, not the middleware itself

### Why Harmful
The middleware becomes unreliable — it works when parameters are present but throws a fatal error when they are not. Any route registration or group middleware configuration that omits the colon syntax causes a 500 error. This is a silent architecture issue because the error only manifests at runtime on specific routes, not during registration.

### Real-World Consequences
- Custom `CheckRoleMiddleware` with signature `handle(Request $request, Closure $next, string $role)`
- Global middleware array registers it as `\App\Http\Middleware\CheckRoleMiddleware::class` (no parameters)
- All routes return 500: "Too few arguments to handle()"
- Developer spends hours debugging the Pipeline before noticing the missing default
- Fix: add `= 'admin'` or `= null` as default parameter → takes 2 seconds

### Preferred Alternative
Always provide default values for optional middleware parameters. Use `null` as the default and handle the no-parameter case explicitly.

```php
// Wrong: no default — TypeError when used without parameters
public function handle(Request $request, Closure $next, string $guard): Response

// Correct: default null — handles both with and without parameters
public function handle(Request $request, Closure $next, string $guard = null): Response
{
    $guard = $guard ?? config('auth.defaults.guard');
    // ...
}

// Correct: default specific value
public function handle(Request $request, Closure $next, string $role = 'user'): Response
{
    // ...
}
```

### Refactoring Strategy
1. Audit all custom parameterized middleware for missing default parameter values
2. Add `= null` defaults to optional parameters
3. Add fallback logic for the no-parameter case (e.g., read from config, use default value)
4. Test middleware both with and without parameters
5. Add static analysis rule to flag middleware handle() parameters without defaults

### Detection Checklist
- [ ] All parameterized middleware has default values for optional parameters
- [ ] Middleware works when registered without the colon syntax
- [ ] Fallback logic exists for the no-parameter case
- [ ] No `TypeError: Too few arguments` from middleware
- [ ] Tests cover both parameterized and non-parameterized usage

### Related Rules/Skills/Trees
- Rule: Always provide default values for optional middleware parameters
- Rule: A middleware used without parameters should not crash
- Related KU: Custom Middleware, Middleware Fundamentals

---

## Anti-Pattern 2: Using Environment Variables in Route Definitions

### Category
Architecture

### Description
Referencing environment variables directly in route middleware parameter strings, such as `throttle:${MAX_ATTEMPTS},1`, expecting Laravel to resolve them at runtime. Route files are static PHP files — environment variable interpolation does not work in middleware parameter strings.

### Why It Happens
Developers want to centralize configuration values (like rate limits) in `.env` and reference them in route definitions. The `${VARIABLE}` syntax looks like it should work (it works in Blade, config files, etc.), but route middleware parameters are plain strings that are not processed by the config loader or Blade engine.

### Warning Signs
- Route definitions contain `${VARIABLE}` or `env('VARIABLE')` syntax in middleware strings
- Middleware parameter strings use string interpolation like `"throttle:$maxAttempts,1"`
- Rate limit values in route files differ from values in config files (env override not working)
- `route:cache` produces unexpected parameter values
- Developers comment: "the env variable doesn't get interpolated in route middleware"

### Why Harmful
The environment variable is never resolved — the literal string `${MAX_ATTEMPTS}` is passed as the parameter value. The middleware receives a non-numeric string and either throws an error, silently uses a default, or produces unexpected behavior. Route caching makes this worse by serializing the unresolved string permanently, masking the issue until routes are re-cached.

### Real-World Consequences
- `throttle:${RATE_LIMIT_API},1` in `api.php`
- `${RATE_LIMIT_API}` is passed as the max attempts parameter
- `ThrottleRequests` middleware receives non-numeric string → casts to 0 → every request is rate limited
- All API users receive 429 responses immediately
- Debugging: rate limit config is 60 in `.env`, but behavior shows 0
- Root cause: `${RATE_LIMIT_API}` is the literal string, not the env value

### Preferred Alternative
Read environment-dependent values from config in a service provider and reference config keys in route definitions, or use named limiters that are configured in service providers.

```php
// Wrong: env variable in route definition
Route::middleware('throttle:' . env('API_RATE_LIMIT') . ',1')->group(function () {
    // ...
});

// Better: use config
// config/ratelimit.php
return ['api' => env('API_RATE_LIMIT', 60)];
// routes/api.php
Route::middleware('throttle:' . config('ratelimit.api') . ',1')->group(function () {
    // ...
});

// Best: named limiter (Laravel 8+)
// AppServiceProvider::boot()
RateLimiter::for('api', fn (Request $request) =>
    Limit::perMinute(env('API_RATE_LIMIT', 60))->by($request->ip())
);
// routes/api.php
Route::middleware('throttle:api')->group(function () {
    // ...
});
```

### Refactoring Strategy
1. Search route files for `${VARIABLE}`, `env(`, or PHP string interpolation in middleware calls
2. Replace with config-based values (read from config, not env)
3. Convert numeric throttle parameters to named limiters where possible
4. Re-run `route:cache` after fixing
5. Add code review rule: middleware parameters must not reference env variables

### Detection Checklist
- [ ] No `${VARIABLE}` or `env()` in route middleware parameter strings
- [ ] Config values are used instead of env values in route definitions
- [ ] Named limiters are preferred for dynamic rate limits
- [ ] `route:cache` produces correct parameter values
- [ ] Route caching does not mask the issue

### Related Rules/Skills/Trees
- Rule: Do NOT use environment variables in middleware parameter strings
- Rule: Use named limiters for dynamic rate limits
- Related KU: Rate Limiting, Service Provider Configuration

---

## Anti-Pattern 3: Comma Delimiter Abuse in Parameter Values

### Category
Reliability

### Description
Using parameter values that contain commas — the same character the Pipeline uses to split parameters. A middleware parameter like `description:important,urgent,high` splits into three parameters instead of one, causing positional mismatches and corrupted data.

### Why It Happens
The comma-delimited syntax is natural for list-like parameters (`auth:web,api`). Developers extend this pattern to values that include commas (descriptions, compound names, structured data) without realizing the Pipeline splits on every comma. The `explode(',', $parameterString)` does not respect nesting or quoting.

### Warning Signs
- Middleware parameters contain commas within a single logical value
- Middleware receives more parameters than expected (parameter count mismatch)
- Values are split across multiple parameters, causing positional corruption
- Error: "Array to string conversion" when a split parameter is used as a string
- The middleware's internal logging or error messages show truncated values

### Why Harmful
The Pipeline's comma-splitting is unambiguous: every comma creates a new parameter. Values with commas are silently corrupted — the middleware receives fragments of the intended value. No error is raised because the split is a valid operation. The corruption only manifests when the middleware uses the parameter, potentially causing security bypasses, incorrect configuration, or data corruption.

### Real-World Consequences
- Custom middleware `FeatureFlag:ab_test,experiment_name` — developer intends "ab_test,experiment_name" as the feature flag name
- Pipeline splits into `['FeatureFlag', 'ab_test', 'experiment_name']` — three parameters
- Middleware expects 1 parameter (feature flag), receives 2 → uses first fragment only
- Feature flag "ab_test,experiment_name" is never checked; feature defaults to off
- A/B test fails; team spends a week analyzing why the test variant never shows

### Preferred Alternative
Use semicolons or URL encoding for values that contain commas. The Pipeline only splits on the first colon — everything after the first colon is the parameter string, and commas within that string are delimiters. Use semicolons as internal delimiters or encode commas.

```php
// Wrong: comma in parameter value
'middleware:value with, comma,another'
// Pipeline: ['middleware', 'value with', 'comma', 'another'] — 3 parameters

// Correct: semicolons as internal delimiter
'middleware:public;max_age=3600;etag'
// Pipeline: ['middleware', 'public;max_age=3600;etag'] — 1 parameter

// Correct: URL encoding
'middleware:value%20with%2C%20comma'
// Pipeline: ['middleware', 'value%2C%20comma'] — middleware decodes
```

### Refactoring Strategy
1. Audit all parameterized middleware for values that may contain commas
2. Replace commas with semicolons or URL encoding in parameter values
3. Update route definitions to use the new delimiter convention
4. Add parameter validation that warns about unexpected comma splits
5. Document delimiter conventions for each parameterized middleware

### Detection Checklist
- [ ] No parameter values contain unescaped commas
- [ ] Semicolons are used as internal delimiters for structured values
- [ ] Middleware parameter count matches the `handle()` signature
- [ ] Route definitions are readable and unambiguous
- [ ] Parameter validation catches unexpected splits

### Related Rules/Skills/Trees
- Rule: Commas in parameter values cause unwanted splits — use semicolons
- Rule: The Pipeline splits on commas — values with commas are corrupted
- Related KU: Middleware Pipeline, Cache Headers Middleware

---

## Anti-Pattern 4: Numeric Parameters for User-Tier-Based Limits

### Category
Architecture

### Description
Using static numeric parameters in `throttle:10,1` to set rate limits when the limit should vary by user tier (free users: 10/hr, premium users: 100/hr, enterprise: unlimited). Numeric parameters are fixed at route definition time and cannot express dynamic per-user limits.

### Why It Happens
Numeric throttle parameters are the simplest form of rate limiting in Laravel. Developers use them for all routes because they are easy: `throttle:60,1`. When user-tiers are introduced, the natural instinct is to add conditional logic in the controller rather than upgrading to named limiters.

### Warning Signs
- Route definitions use `throttle:N,M` with numeric limits
- Rate limit logic is duplicated in controllers: "if user is premium, allow more requests"
- Rate limit config is spread across multiple route files (inconsistent values)
- User tier changes require route file edits and `route:cache` rebuilds
- Monitoring shows certain user groups hitting limits disproportionately

### Why Harmful
Numeric parameters apply the same limit to every user. Premium users are rate-limited the same as free users, degrading their experience. Enterprise customers hit the same limits as trial accounts. Changing limits requires editing route files and re-running `route:cache`. The limits are scattered across the codebase rather than centralized.

### Real-World Consequences
- API routes use `throttle:30,1` — 30 requests per minute for all users
- Premium users (who pay for higher limits) are limited to 30/min
- Enterprise customer complains: "we are rate-limited like trial users"
- Engineering team edits 12 route files to change limits, re-runs `route:cache`
- Next month: new tier introduced → same editing process
- Named limiters would centralize this in one `RateLimiter::for()` call

### Preferred Alternative
Use named limiters registered in a service provider. Named limiters compute the limit at runtime based on the authenticated user's tier, role, or subscription.

```php
// Wrong: static numeric parameter — same limit for all users
Route::middleware('throttle:30,1')->group(function () {
    Route::get('/api/posts', [PostController::class, 'index']);
});

// Correct: named limiter — dynamic per-user limits
// AppServiceProvider::boot()
RateLimiter::for('api', function (Request $request) {
    $user = $request->user();
    return match (true) {
        $user?->isEnterprise() => Limit::none(),
        $user?->isPremium() => Limit::perMinute(100),
        default => Limit::perMinute(30),
    };
});
// routes/api.php
Route::middleware('throttle:api')->group(function () {
    Route::get('/api/posts', [PostController::class, 'index']);
});
```

### Refactoring Strategy
1. Identify all numeric `throttle:N,M` usages in route files
2. Extract rate limit configuration into named limiters in `AppServiceProvider`
3. Replace `throttle:N,M` with `throttle:limiter-name` in route files
4. Implement per-user tier resolution in the named limiter callback
5. Test rate limits for each user tier

### Detection Checklist
- [ ] No numeric throttle parameters for user-dependent limits
- [ ] Named limiters are used for tier-based rate limiting
- [ ] Rate limit configuration is centralized in service providers
- [ ] Tier changes do not require route file edits
- [ ] Route cache rebuild is not needed for limit changes

### Related Rules/Skills/Trees
- Rule: Use named limiters for user-tier-based rate limits
- Rule: Numeric throttle parameters apply the same limit to all users
- Related KU: Rate Limiting, Named Limiters

---

## Anti-Pattern 5: Route Parameter Mismatch with `can:` Middleware

### Category
Reliability

### Description
Using an incorrect second parameter in the `can:ability,model` middleware that does not match the route parameter name. The second parameter must be the route binding key (e.g., `post` for `{post}`), not the model class name or any arbitrary variable name.

### Why It Happens
The `can:update,post` middleware resolves the model by looking up the route parameter named `post`. Developers expect the parameter to be a model class name (`App\Models\Post`) or the database field name. The middleware's parameter-to-route-binding resolution is not obvious from the middleware signature alone.

### Warning Signs
- `can:ability,ModelName` uses the fully qualified class name instead of the route parameter name
- Authorization always fails or always passes regardless of user permissions
- The error "Unable to resolve route parameter" or "Call to undefined method" appears
- The route binding key is renamed in the route definition but not updated in the middleware parameter
- Tests show authorization works inconsistently across routes

### Why Harmful
The `can:` middleware cannot resolve the model if the parameter name does not match the route binding key. Authorization always fails (no model to check policy against) or throws an error. The bug is subtle because the middleware does not fail loudly — it silently cannot find the model, and authorization defaults to "deny" for model-dependent policies.

### Real-World Consequences
- Route: `Route::put('/articles/{article}', ...)->middleware('can:update,article')`
- Middleware parameter: `can:update,article` — matches route parameter `{article}` → works
- Developer changes route to `{post}` but forgets to update middleware: `can:update,article`
- Middleware cannot resolve `{article}` (no longer a route parameter)
- All update requests are denied (403) for all users, even authors
- Debugging: policy never fires; middleware cannot find the model

### Preferred Alternative
Ensure the second parameter of `can:` middleware exactly matches the route parameter name (the name in curly braces in the route definition).

```php
// Route parameter name: {post}
// Wrong: uses model class name instead of route parameter
Route::put('/posts/{post}', ...)->middleware('can:update,App\Models\Post');

// Correct: matches the route parameter name
Route::put('/posts/{post}', ...)->middleware('can:update,post');

// With explicit route key
Route::put('/posts/{article}', ...)->middleware('can:update,article');
// The middleware parameter 'article' matches the route parameter '{article}'
```

### Refactoring Strategy
1. Audit all `can:ability,model` middleware usages in route files
2. Verify the second parameter matches the route binding key (the `{param}` name)
3. Rename route parameters or middleware parameters to match
4. Test authorization with the actual model binding
5. Add code review rule: `can:` middleware parameter must match route parameter name

### Detection Checklist
- [ ] All `can:` middleware second parameters match route parameter names
- [ ] No `can:` middleware uses model class names as parameters
- [ ] Renaming a route parameter also updates the `can:` middleware parameter
- [ ] Authorization works consistently (model is resolved correctly)
- [ ] Tests verify authorization with the model bound to the route

### Related Rules/Skills/Trees
- Rule: The `can:` middleware parameter must match the route parameter name
- Rule: `can:update,post` uses the route binding key, not the model class
- Related KU: Authorization, Route Model Binding, Implicit Binding
