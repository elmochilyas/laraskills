## Use config() Instead of env() in Application Code
---
## Framework Usage
---
## Prefer `config('app.debug')` over `env('APP_DEBUG')` in all application code outside config/*.php files.
---
## After `config:cache`, all `env()` calls are resolved at build time. Calling `env()` in runtime code returns `null` silently, causing bugs that are difficult to trace.
---
```php
$debug = env('APP_DEBUG');
```
---
```php
$debug = config('app.debug');
```
---
## Service providers that must read environment variables during boot before configuration is fully loaded. Document these explicitly.
---
## Silent null values from env() in production lead to data leaks, wrong database connections, or disabled security features without error logs.
---
## Wrap All env() Calls Inside Config Files Only
---
## Architecture
---
## Always restrict `env()` calls to within `config/*.php` files; never use `env()` in controllers, middleware, jobs, or views.
---
## Config caching freezes the resolved value of every `env()` call at build time. Code outside config files that calls `env()` bypasses the cache contract and receives `null` when the cache is active.
---
## Database configuration is loaded from `config/database.php` using env() calls.
```php
// app/Http/Controllers/OrderController.php
$apiKey = env('STRIPE_API_KEY');
```
---
```php
// config/services.php
'stripe' => [
    'key' => env('STRIPE_API_KEY'),
],

// app/Http/Controllers/OrderController.php
$apiKey = config('services.stripe.key');
```
---
## No common exceptions.
---
## Violation introduces silent regressions where production behaves differently from development; debugging env() null values consumes developer hours.
---
## Keep Config Files Pure and Serializable
---
## Maintainability
---
## Never use Closures, anonymous functions, resources, objects, or dynamic logic inside config/*.php files.
---
## `config:cache` uses `var_export()` to serialize the merged config array. `var_export()` cannot serialize Closures, resources, or non-serializable objects — it throws a fatal error.
---
```php
// config/services.php
return [
    'client' => function () {
        return new HttpClient();
    },
];
```
---
```php
// config/services.php
return [
    'client' => HttpClient::class,
];

// AppServiceProvider.php
$this->app->bind(HttpClient::class, function () {
    return new HttpClient();
});
```
---
## Config entries that must compute values at runtime (request-dependent configuration). In those cases, compute the value in a service provider and bind it to the container.
---
## Fatal error during `config:cache` breaks deployment pipelines; emergency fixes require rolling back to an uncached state.
---
## Run config:cache in Every Production Deployment
---
## Performance
---
## Always include `php artisan config:cache` as a step in every production deployment script.
---
## Uncached config loading parses 20-50 files and resolves all `env()` calls on every request, adding 30-80ms of bootstrap overhead. Cached config is a single `require` (<1ms).
---
Deploying without running `config:cache`.
---
```bash
# Deployment script
composer install --no-dev
php artisan config:cache
php artisan route:cache
```
---
## Ephemeral environments or single-request containers where config loading time is irrelevant.
---
## 30-80ms unnecessary overhead on every production request; measurable performance regression under load.
---
## Cache Config Before Routes and Events
---
## Framework Usage
---
## Always run `config:cache` before `route:cache` and `event:cache` in deployment scripts.
---
## Route caching depends on resolved configuration values (URL defaults, middleware parameters). Event service providers may read config to conditionally register listeners. Building routes/events without cached config produces incorrect cached artifacts.
---
```bash
php artisan route:cache
php artisan config:cache
```
---
```bash
php artisan config:cache
php artisan route:cache
php artisan event:cache
```
---
## Deployments that only change views or static assets and do not regenerate route/event caches.
---
## Cached routes reference wrong URL defaults; event listeners are registered based on un-resolved configuration.
---
## Protect bootstrap/cache/config.php with Strict Permissions
---
## Security
---
## Set filesystem permissions on `bootstrap/cache/config.php` to 640 or tighter; ensure the web server user can read but not write the file after deployment.
---
## The cached config file contains all resolved secrets — database passwords, API keys, encryption keys — written in plaintext PHP. Unprotected permissions expose secrets to any process or user on the server.
---
```bash
chmod 777 bootstrap/cache/config.php
```
---
```bash
chmod 640 bootstrap/cache/config.php
chown deploy:www-data bootstrap/cache/config.php
```
---
## During cache generation, the file must be writable by the deployment user. Tighten permissions after generation.
---
## Plaintext secrets exposed to unauthorized processes; compliance violations for PCI-DSS, SOC2, or HIPAA.
---
## Rebuild Cache After Environment Variable Rotation
---
## Reliability
---
## Always re-run `config:cache` after rotating any environment variable that a config file consumes via `env()`.
---
## The config cache is a snapshot. Rotating `DB_PASSWORD` or `APP_KEY` without rebuilding the cache leaves the old values active until the next deploy, causing connection failures or cryptographic errors.
---
Rotating a database password but not re-running `config:cache`.
---
```bash
# After rotating environment variables
php artisan config:cache
# Verify the new values
php artisan tinker --execute="config('database.connections.mysql.password')"
```
---
## No common exceptions.
---
## Production outages caused by stale secrets; scheduled password rotation workflows silently fail.
---
## Never Commit bootstrap/cache/config.php to Version Control
---
## Code Organization
---
## Never commit `bootstrap/cache/config.php` to version control; verify it remains in `.gitignore`.
---
## The cache file is environment-specific — it contains secrets resolved from the build environment's `.env`. Committing it leaks secrets into the repository and causes conflicts when deploying to different environments.
---
```bash
git add bootstrap/cache/config.php
```
---
```bash
# Verify .gitignore contains:
echo "bootstrap/cache/*" >> .gitignore
```
---
## No common exceptions.
---
## Secrets committed to git history are permanently exposed; environment-specific cache values cause deployment failures.
