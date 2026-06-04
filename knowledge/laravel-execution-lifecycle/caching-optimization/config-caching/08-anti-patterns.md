# ECC Anti-Patterns — Config Caching

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Caching & Optimization |
| **Knowledge Unit** | Config Caching |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. `env()` in Application Code
2. Dynamic Config Keys
3. Config Cache in Development
4. Closures in Config Files
5. Stale Cache After .env Changes

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — config values used to construct database connections at bootstrap
- Premature Caching — caching config before all env values are finalized

---

## Anti-Pattern 1: `env()` in Application Code

### Category
Reliability

### Description
Calling `env('APP_DEBUG')` or similar `env()` calls in controllers, services, middleware, or any code outside of `config/*.php` files.

### Why It Happens
Developers use `env()` as a convenience without understanding that after `config:cache`, `env()` returns `null` for all keys.

### Warning Signs
- `env()` called in controllers or services
- `env()` used in Blade templates
- `env()` used in middleware or event listeners
- Application code that breaks after `config:cache` is run

### Why It Is Harmful
After `config:cache`, the `env()` helper reads from `$_ENV` at runtime, but all config files were already resolved and their `env()` calls replaced with cached values. Any `env()` call outside config files returns `null` because the cached config bypasses `.env` file loading.

### Real-World Consequences
A controller calls `env('STRIPE_KEY')` directly. The developer runs `config:cache` for performance. The next request hits the controller — `env('STRIPE_KEY')` returns `null`. The Stripe API call fails with authentication error. Production payments are broken until `config:clear` is run.

### Preferred Alternative
Always use `config('services.stripe.key')` in application code. Reserve `env()` exclusively for `config/*.php` files.

### Refactoring Strategy
1. Search all non-config PHP files for `env()` calls
2. Replace each with `config('filename.key')`
3. Ensure the corresponding config file exposes the value: `'key' => env('ORIGINAL_KEY')`
4. Run `config:cache` and verify no null values in cached config

### Detection Checklist
- [ ] `env()` called outside `config/*.php` files
- [ ] Null values returned after `config:cache`
- [ ] Secrets unavailable after caching

### Related Rules
Config Caching (04-standardized-knowledge.md): Always use `config()` instead of `env()` in application code.

### Related Skills
N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 2: Dynamic Config Keys

### Category
Architecture

### Description
Using `config($dynamicKey)` with keys that should be frozen at cache-build time, relying on runtime computation that the cache bypasses.

### Why It Happens
Developers compute config keys at runtime based on request context, not understanding that cached config is an immutable snapshot.

### Warning Signs
- `config('app.' . $dynamicSuffix)` patterns
- Config values computed based on request parameters
- Config values that should vary by runtime conditions

### Why It Is Harmful
Config caching freezes all config values at build time. Dynamic config keys that depend on runtime context are not refreshed per request. If the key is computed from a frozen value, it works. But if the computation expects up-to-date values, it receives stale cache.

### Real-World Consequences
A multi-tenant application uses `config('tenant.' . $tenantId . '.database')` to resolve the database for each tenant. Config caching freezes the tenant list at build time. When a new tenant is added, the cached config doesn't include it. New tenants get database connection errors until the cache is rebuilt.

### Preferred Alternative
Use static config keys for configuration that is stable per deployment. Use runtime services (database, Redis) for values that change between requests.

### Refactoring Strategy
1. Identify config keys that are computed dynamically
2. Move dynamic values to database, Redis, or runtime service configuration
3. Keep only static, deployment-scoped values in config files

### Detection Checklist
- [ ] `config()` called with computed key
- [ ] Dynamic values used after `config:cache`
- [ ] Runtime changes not reflected in cached config

### Related Rules
Config Caching (04-standardized-knowledge.md): Config cache freezes values at build time.

### Related Skills
N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 3: Config Cache in Development

### Category
Workflow

### Description
Running `php artisan config:cache` in local development and then wondering why config changes don't take effect.

### Why It Happens
Developers follow production deployment steps locally without understanding the impact of caching.

### Warning Signs
- Config changes don't appear in local environment
- Developer runs `config:clear` as a frequent development step
- Running `config:cache` as part of local setup scripts

### Why It Is Harmful
Config caching defeats the purpose of development — rapid iteration on configuration changes. Each config change requires `config:clear` to see the effect, breaking the edit-refresh cycle.

### Real-World Consequences
A developer adds `'debug' => env('APP_DEBUG', false)` to a config file. Nothing changes in the browser. They add `Log::info('debug is ' . config('app.debug'))` — it shows the old value. They spend 15 minutes debugging before realizing `config:cache` is active from a previous command.

### Preferred Alternative
Never run `config:cache` in development. Use `config:clear` if it was accidentally run.

### Refactoring Strategy
1. Check if `bootstrap/cache/config.php` exists locally
2. Run `php artisan config:clear` to remove it
3. Never include `config:cache` in local setup scripts

### Detection Checklist
- [ ] `bootstrap/cache/config.php` exists in development
- [ ] Config changes not reflected immediately
- [ ] Developer running `config:clear` frequently

### Related Rules
Config Caching (04-standardized-knowledge.md): Never cache config in local development.

### Related Skills
N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: Closures in Config Files

### Category
Reliability

### Description
Returning Closures or unserializable values from `config/*.php` files.

### Why It Happens
Developers use factory patterns or lazy initialization in config files for convenience.

### Warning Signs
- Config file contains `return [ 'callback' => fn() => ... ]`
- Config file uses `new` keyword to instantiate objects
- `php artisan config:cache` throws `ErrorException`
- Config file contains resources, streams, or other non-serializable types

### Why It Is Harmful
`config:cache` uses `var_export()` to serialize the config array. Closures, objects, resources, and other non-serializable types cannot be exported. `config:cache` throws a fatal error.

### Real-World Consequences
A developer adds a service factory as a Closure in `config/services.php`: `'factory' => fn($app) => new Service()`. They run `config:cache`. The command fails with "var_export does not handle closures." The entire `optimize` command fails because config cache is the first step. No caches are generated.

### Preferred Alternative
Move Closures and factory logic to service providers. Config files should contain only scalar values, arrays, and `env()` calls.

### Refactoring Strategy
1. Find all Closures, objects, or resources in config files
2. Move factory logic to service provider `register()` methods
3. Replace object config values with class name strings
4. Run `config:cache` to verify

### Detection Checklist
- [ ] Closure in config file
- [ ] `var_export()` error when running `config:cache`
- [ ] Object instance in config file

### Related Rules
Config Caching (04-standardized-knowledge.md): Config files should be pure PHP returning arrays — no Closures.

### Related Skills
N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Stale Cache After .env Changes

### Category
Reliability

### Description
Changing `.env` file values without regenerating the config cache, so production continues using old values.

### Why It Happens
Developers update `.env` and expect changes to take effect immediately, not realizing the config cache is a snapshot.

### Warning Signs
- `.env` changed but `config:cache` not re-run
- Old values persist after `.env` change
- Developer restarts PHP-FPM expecting `.env` changes to apply

### Why It Is Harmful
The config cache freezes `env()` calls at build time. Changing `.env` after `config:cache` has no effect — the cached values are used instead. This is especially dangerous for security-sensitive values like `APP_KEY`, database passwords, or API keys.

### Real-World Consequences
A developer rotates the database password in `.env`. They restart PHP-FPM (thinking it reloads config). But `config:cache` is active — the old password is still in the cached config. The application continues connecting with the old password. Two hours later, the old password is revoked for security. The application goes down hard.

### Preferred Alternative
Always run `php artisan config:cache` after any `.env` change. For production secrets, use a deployment pipeline that regenerates the cache.

### Refactoring Strategy
1. After any `.env` change, run `php artisan config:cache`
2. Verify the new values are in `bootstrap/cache/config.php`
3. Add `.env` change detection to deployment pipeline

### Detection Checklist
- [ ] `.env` changed without `config:cache`
- [ ] Old config values served after `.env` update
- [ ] Secret rotation without cache regeneration

### Related Rules
Config Caching (04-standardized-knowledge.md): Cache after every `.env` change.

### Related Skills
N/A

### Related Decision Trees
N/A
