# Entry Point Mechanics Rules

## Rule: Keep Entry Point Files Lean
---
## Category
Architecture
---
## Rule
Never place application logic (business rules, service calls, conditional dispatch) in `public/index.php` or `bootstrap/app.php`.
---
## Reason
The entry point runs on every HTTP request (FPM) or once per worker (Octane). Any logic placed here bypasses the framework's structured lifecycle — middleware, providers, and routing. This is the single highest-leverage performance optimization: keeping entry files lean ensures minimal per-request overhead.
---
## Bad Example
```php
// public/index.php — application logic leaked into entry point
$app = require __DIR__.'/../bootstrap/app.php';
if ($_GET['maintenance'] ?? false) {
    echo json_encode(['status' => 'maintenance']);
    exit;
}
$kernel = $app->make(Kernel::class);
```
---
## Good Example
```php
// public/index.php — only framework initialization
$app = require __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$response = $kernel->handle(Request::capture())->send();
$kernel->terminate($request, $response);
```
---
## Exceptions
Custom server adapters (Octane, RoadRunner, Swoole) may modify the entry point for worker initialization, but the addition must be framework-level, not application-logic-level.
---
## Consequences Of Violation
Unnecessary per-request overhead, debugging difficulty, middleware bypass, security vulnerabilities from unchecked entry-point logic.

---

## Rule: Cache Configuration And Routes In Production
---
## Category
Performance
---
## Rule
Always run `config:cache`, `route:cache`, and `event:cache` as part of every production deployment.
---
## Reason
Without cached configuration, Laravel merges every config file (usually 40-80 files) on every request, adding 15-30ms to bootstrap time. Route caching eliminates file parsing. Event caching flattens listener registration. Combined, these caches reduce bootstrap from 80ms+ to under 5ms.
---
## Bad Example
```bash
# Deployment script without caching
composer install --no-dev
php artisan migrate --force
```
---
## Good Example
```bash
composer install --no-dev --optimize-autoloader
php artisan config:cache
php artisan route:cache
php artisan event:cache
php artisan migrate --force
```
---
## Exceptions
Applications that dynamically modify configuration at runtime (e.g., multi-tenant apps reading config from database) must skip `config:cache` because cached config is immutable.
---
## Consequences Of Violation
Cold request overhead of 30-80ms on every request, unnecessary load on production servers, slower TTFB under traffic spikes.

---

## Rule: Optimize The Composer Autoloader In Deployment
---
## Category
Performance
---
## Rule
Use `composer dump-autoload -o` or `--optimize-autoloader` in CI/CD deployment pipelines.
---
## Reason
The default Composer autoloader relies on filesystem lookups in PSR-4 namespaces, which adds 5-15ms per request in apps with 200+ packages. The optimized classmap generator eliminates filesystem fallback, reducing autoloader overhead to under 2ms.
---
## Bad Example
```bash
composer install --no-dev
```
---
## Good Example
```bash
composer install --no-dev --optimize-autoloader
```
---
## Exceptions
Development environments benefit from the standard autoloader because classes are added frequently and the classmap would require regeneration on every addition.
---
## Consequences Of Violation
10-30ms autoloader overhead per request, wasted CPU cycles under load, unnecessary latency on every page view.

---

## Rule: Never Instantiate Application Outside The Entry Point
---
## Category
Architecture
---
## Rule
Never call `new Application()` or `Application::configure()` outside of `bootstrap/app.php`.
---
## Reason
The Application instance is the central container that holds all service bindings, configuration, and bootstrapped state. Creating additional instances breaks the singleton contract, causes binding duplication, and leads to unrecoverable state corruption.
---
## Bad Example
```php
// In a test or custom script:
$app = new Application(__DIR__.'/../');
$app->singleton(LoggerInterface::class, StdoutLogger::class);
```
---
## Good Example
```php
// Always use the application created in bootstrap/app.php:
$app = require __DIR__.'/../bootstrap/app.php';
```
---
## Exceptions
Testing frameworks may create fresh Application instances per test case, but must fully tear down each instance to prevent state leakage between tests.
---
## Consequences Of Violation
Duplicate singleton bindings, state corruption, mysterious "Target not instantiable" errors, unreachable service instances.

---

## Rule: Audit bootstrap/app.php For Octane State Initialization
---
## Category
Reliability
---
## Rule
Avoid capturing variables or initializing non-singleton state in closures defined within `bootstrap/app.php` when running Octane.
---
## Reason
Under Octane, `bootstrap/app.php` executes once per worker, not once per request. Closures that capture variables from the file scope retain that state across all requests the worker handles. Mutable state captured here causes request-to-request leakage.
---
## Bad Example
```php
// bootstrap/app.php
$counter = 0;
return Application::configure()
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
    )
    ->withMiddleware(function (Middleware $middleware) use (&$counter) {
        $counter++; // leaks state across all requests on this worker
    });
```
---
## Good Example
```php
// bootstrap/app.php — no captured mutable state
return Application::configure()
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // immutable configuration only
    });
```
---
## Exceptions
Read-only configuration values (e.g., `config('app.name')`) captured from the scope are safe because they are immutable after the application boots.
---
## Consequences Of Violation
Request state leakage under Octane, non-deterministic behavior, security data leaking between users on the same worker.

---

## Rule: Configure Trusted Proxies For Accurate Request Data
---
## Category
Security
---
## Rule
Always configure trusted proxies when running behind a load balancer, reverse proxy, or CDN.
---
## Reason
`Request::capture()` reads from `$_SERVER` superglobals. Behind a proxy, `$_SERVER['REMOTE_ADDR']` contains the proxy IP, not the client IP. Without trusted proxy configuration, all security mechanisms relying on request data (rate limiting, IP-based access control, geolocation) operate on incorrect values.
---
## Bad Example
```php
// bootstrap/app.php — no proxy configuration
return Application::configure()
    ->withRouting(web: __DIR__.'/../routes/web.php');
```
---
## Good Example
```php
// bootstrap/app.php
return Application::configure()
    ->withRouting(web: __DIR__.'/../routes/web.php')
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->trustProxies(at: '*');
        // Or specify exact proxies:
        // $middleware->trustProxies(at: ['192.168.1.0/24']);
    });
```
---
## Exceptions
Applications running directly on a publicly routable interface with no proxy layer may omit trusted proxy configuration, but this is rare in production.
---
## Consequences Of Violation
IP spoofing vulnerabilities, incorrect rate limiting, wrong geolocation data, broken IP-allowlist security, incorrect request logging.

---

## Rule: Restrict Maintenance Mode Bypass IPs
---
## Category
Security
---
## Rule
Restrict maintenance mode bypass IP addresses to internal networks or specific admin IPs only.
---
## Reason
The `down` file check at the entry point allows bypass IPs to access the application during maintenance. If bypass IPs are unrestricted (e.g., using `*` or public ranges), anyone can circumvent maintenance mode, defeating its security purpose.
---
## Bad Example
```php
// bootstrap/app.php
->withMiddleware(function (Middleware $middleware) {
    $middleware->maintenanceModeBypassIp('*');
});
```
---
## Good Example
```php
// bootstrap/app.php
->withMiddleware(function (Middleware $middleware) {
    $middleware->maintenanceModeBypassIp('10.0.0.0/8'); // internal network
});
```
---
## Exceptions
Development and staging environments may use broader bypass ranges, but production must use specific allowed IPs.
---
## Consequences Of Violation
Unauthorized access during maintenance windows, exposure of migration/update process to external traffic, data integrity risks.

---

## Rule: Validate bootstrap/app.php Syntax In Deployment Pipeline
---
## Category
Reliability
---
## Rule
Add `php -l bootstrap/app.php` to the deployment pipeline to catch syntax errors before workers restart.
---
## Reason
A syntax error in `bootstrap/app.php` causes the PHP parser to fail on the `require` statement in `public/index.php`. This renders the application completely unreachable (HTTP 500 or blank page) until manually corrected. Syntax validation catches typos, missing commas, and parse errors before they reach production.
---
## Bad Example
```bash
# Deployment that does not validate syntax
php artisan down
git pull origin main
php artisan up
```
---
## Good Example
```bash
php artisan down
git pull origin main
php -l bootstrap/app.php || exit 1 # fail deployment on syntax error
php artisan config:cache
php artisan route:cache
php artisan migrate --force
php artisan up
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Complete application downtime after deployment, workers fail to start, rollback required, incident response overhead.

---

## Rule: Separate Configuration From Initialization In Entry Files
---
## Category
Code Organization
---
## Rule
Configure the application structure in `bootstrap/app.php`; initialize state in service providers, not the other way around.
---
## Reason
`bootstrap/app.php` establishes the application skeleton (routing, middleware, exception handling). Service providers handle initialization (binding services, registering listeners). Mixing initialization logic into configuration files creates circular dependencies, makes providers untestable, and couples configuration to runtime state.
---
## Bad Example
```php
// bootstrap/app.php — mixing initialization into configuration
return Application::configure()
    ->withRouting(web: __DIR__.'/../routes/web.php')
    ->withProviders([
        AppServiceProvider::class,
        \App\Services\Initializer::class, // initialization belongs in providers
    ]);
```
---
## Good Example
```php
// bootstrap/app.php — configuration only
return Application::configure()
    ->withRouting(web: __DIR__.'/../routes/web.php');
```
```php
// AppServiceProvider.php — initialization
public function register(): void
{
    $this->app->singleton(Initializer::class);
}
```
---
## Exceptions
Laravel 11+ middleware and exception configuration in `bootstrap/app.php` is appropriate because it maps configuration to named methods, not initialization logic.
---
## Consequences Of Violation
Circular dependency chains, provider code coupled to app configuration, difficulty testing providers in isolation.
