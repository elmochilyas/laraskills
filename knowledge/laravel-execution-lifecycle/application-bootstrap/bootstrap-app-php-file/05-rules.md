# Bootstrap App PHP File — Rules

## Rule Name
Always `return` the Application from `bootstrap/app.php`; never assign to a global variable.
---
## Category
Architecture
---
## Rule
Use `return Application::configure(...)->create();` as the sole output of `bootstrap/app.php`. Never assign the instance to `$GLOBALS`, `$_ENV`, or any superglobal.
---
## Reason
The return-value contract allows each entry point (`index.php`, `artisan`, Octane) to receive its own Application instance. Global variable assignment defeats encapsulation, creates testability problems, and risks cross-request state pollution in Octane.
---
## Bad Example
```php
$app = Application::configure(basePath: dirname(__DIR__))->create();
$GLOBALS['laravel_app'] = $app;
return $app;
```
---
## Good Example
```php
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(web: __DIR__.'/../routes/web.php')
    ->create();
```
---
## Exceptions
No common exceptions. The file must preserve its return-value contract for all three entry points.
---
## Consequences Of Violation
Global state pollution complicates testing (each test must reset globals) and introduces cross-request data contamination in Octane.

---

## Rule Name
Never use `dd()`, `var_dump()`, `echo`, or any output-producing statement in `bootstrap/app.php`.
---
## Category
Reliability
---
## Rule
Keep `bootstrap/app.php` free of debug output, logging output, or any statement that produces output before the application starts.
---
## Reason
The file executes before any kernel handles the request. Output produced here is sent to `stdout` before the HTTP response headers, corrupting the response. In console commands, it interferes with structured output. A single stray `dd()` crashes all entry points.
---
## Bad Example
```php
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(web: __DIR__.'/../routes/web.php')
    ->withMiddleware(function ($middleware) {
        dd($middleware); // Output before response — corrupts headers
    })
    ->create();
```
---
## Good Example
```php
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(web: __DIR__.'/../routes/web.php')
    ->withMiddleware(function ($middleware) {
        // Use logging instead of dump:
        Log::debug('Middleware configured', ['aliases' => $middleware->getAliases()]);
    })
    ->create();
```
---
## Exceptions
During initial project scaffolding, temporary debug statements are acceptable but must be removed before the first commit.
---
## Consequences Of Violation
HTTP responses with `Cannot modify header information` errors, corrupted JSON responses in API contexts, `artisan` command output with binary garbage prefix.

---

## Rule Name
Keep the builder chain minimal — only call `with*()` methods for subsystems the application actually uses.
---
## Category
Maintainability
---
## Rule
Include only the `with*()` method calls that correspond to subsystems your application configures. Omit unused methods instead of calling them with empty defaults.
---
## Reason
Every `with*()` call registers deferred callbacks and configurator objects in the container. Unused calls add unnecessary memory overhead, increase cognitive load when reading the bootstrap file, and create a maintenance burden when the framework changes default parameters.
---
## Bad Example
```php
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(web: __DIR__.'/../routes/web.php')
    ->withMiddleware()
    ->withExceptions()
    ->withBroadcasting()
    ->withEvents()
    ->withCommands()
    ->withProviders()
    ->withSingletons()
    ->withBindings()
    ->booting(function () {})
    ->booted(function () {})
    ->create();
```
---
## Good Example
```php
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(web: __DIR__.'/../routes/web.php')
    ->withMiddleware()
    ->withExceptions()
    ->create();
```
---
## Exceptions
If your application may enable a subsystem in the future, including an empty `with*()` call as documentation is acceptable but should be accompanied by a comment.
---
## Consequences Of Violation
Unnecessary bootstrap overhead (~0.3ms per extra method), increased closure memory consumption in Octane, and confusing bootstrap files that imply configuration of subsystems that do not exist.

---

## Rule Name
Never hardcode secrets (API keys, passwords, tokens) in `bootstrap/app.php`.
---
## Category
Security
---
## Rule
Keep all secrets out of `bootstrap/app.php`. Reference secrets exclusively through environment variables loaded by the `LoadEnvironmentVariables` bootstrapper.
---
## Reason
The file is tracked in version control, readable by the web server user, and stored in OPcache dumps. Secrets hardcoded here are exposed in source code repositories, server file systems, and OPcache memory dumps.
---
## Bad Example
```php
return Application::configure(basePath: dirname(__DIR__))
    ->withSingletons([
        PaymentGateway::class => new StripeGateway('sk_live_abc123...'),
    ])
    ->create();
```
---
## Good Example
```php
return Application::configure(basePath: dirname(__DIR__))
    ->withSingletons([
        PaymentGateway::class => StripeGateway::class,
    ])
    ->create();

// In config/services.php:
return [
    'stripe' => [
        'key' => env('STRIPE_KEY'),
    ],
];
```
---
## Exceptions
No common exceptions. Secrets must never appear in bootstrap files.
---
## Consequences Of Violation
Secrets exposed in git history, OPcache dumps, server file listings, and CI/CD logs. PCI-DSS, SOC2, and GDPR compliance violations.

---

## Rule Name
Never call `$app->make()` or `resolve()` before the bootstrapper sequence completes.
---
## Category
Reliability
---
## Rule
Avoid resolving anything from the container inside `bootstrap/app.php` except through the builder's `with*()` methods.
---
## Reason
At the point `bootstrap/app.php` executes, the container holds only base bindings and aliases. No configuration, no environment variables, no service providers, no facades are available. Resolving anything other than the base bindings (`'app'`, `Container`, `Psr\Container\ContainerInterface`) throws or returns null.
---
## Bad Example
```php
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(web: __DIR__.'/../routes/web.php')
    ->booting(function ($app) {
        $config = $app->make('config'); // BindingResolutionException — config not yet loaded
    })
    ->create();
```
---
## Good Example
```php
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(web: __DIR__.'/../routes/web.php')
    // Config-dependent logic belongs in service providers, not bootstrap
    ->create();
```
---
## Exceptions
Accessing `$app->basePath()`, `$app->runningInConsole()`, or `$app->environment()` (which reads `$_ENV['APP_ENV']` directly) is safe because these are base bindings or constructor-set properties.
---
## Consequences Of Violation
`BindingResolutionException` on every request. Early termination of the entry point with no application-level error handling active.
