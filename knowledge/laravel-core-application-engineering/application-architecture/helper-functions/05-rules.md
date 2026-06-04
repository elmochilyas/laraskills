# Helper Functions — Rules

## Use Helpers in Controllers and Views, Injection in Services

Restrict container-resolving helpers (`app()`, `resolve()`, `cache()`, `session()`) to controllers, views, and closure code. Use constructor injection in services, actions, and domain objects.

---

## Category

Design

---

## Rule

Controllers and views may use global helpers for ergonomic access to framework services. Services, actions, and domain classes must use constructor injection. Business logic classes must not call `app()`, `resolve()`, `cache()`, or similar container-resolving helpers.

---

## Reason

Controllers are HTTP entry points where ergonomic convenience improves readability and development speed. Services and actions contain business logic where explicit, testable dependencies are critical. Hidden helper calls in business logic create untestable, tightly-coupled code.

---

## Bad Example

```php
class InvoiceService
{
    public function generate(int $orderId): Invoice
    {
        $order = app(OrderRepository::class)->find($orderId);
        $pdf = app(PdfGenerator::class)->generate($order);
        return $pdf;
    }
}
```

---

## Good Example

```php
class InvoiceService
{
    public function __construct(
        private OrderRepository $orders,
        private PdfGenerator $pdf,
    ) {}

    public function generate(int $orderId): Invoice
    {
        $order = $this->orders->find($orderId);
        return $this->pdf->generate($order);
    }
}
```

---

## Exceptions

Event listeners and route closures may use helpers as the injection setup is disproportionate to their complexity.

---

## Consequences Of Violation

Hidden dependencies, untestable classes, service locator anti-pattern, refactoring difficulty.

---

## Never Use env() Outside Config Files

Call `env()` exclusively in `config/*.php` files. Use `config()` in all application code.

---

## Category

Framework Usage

---

## Rule

The `env()` helper must never appear in controllers, services, actions, views, Blade templates, commands, jobs, or listeners. Every `env()` call outside `config/` must be replaced with `config()`.

---

## Reason

After `php artisan config:cache`, `env()` returns `null` because environment variables are no longer read at runtime. Only the cached config repository is used. Application code using `env()` silently breaks in production.

---

## Bad Example

```php
// In a controller
if (env('APP_DEBUG')) {
    // Always null after config:cache
}
```

---

## Good Example

```php
// config/app.php
'debug' => env('APP_DEBUG', false),

// In a controller
if (config('app.debug')) {
    // Works in all environments
}
```

---

## Exceptions

No common exceptions. `env()` is restricted to config files.

---

## Consequences Of Violation

Silent behavior changes in production, environment-dependent bugs that cannot be reproduced locally, debugging difficulty.

---

## Wrap Custom Helpers in function_exists() Guard

Every custom helper function definition must be wrapped in `if (! function_exists('name'))`.

---

## Category

Reliability

---

## Rule

All custom helper functions in `app/helpers.php` or similar files must be defined inside a `function_exists()` guard. Never define a global function without checking for prior definition.

---

## Reason

Framework updates and packages may add helpers with the same name. Without the guard, PHP throws a fatal error when a function is redefined. The guard makes custom helpers framework-update-safe.

---

## Bad Example

```php
// app/helpers.php
function str(string $string): Stringable
{
    return str($string)->upper();
}
// Fatal error if Laravel already defines str()
```

---

## Good Example

```php
// app/helpers.php
if (! function_exists('format_currency')) {
    function format_currency(float $amount): string
    {
        return '$'.number_format($amount, 2);
    }
}
```

---

## Exceptions

No common exceptions. The `function_exists()` guard is mandatory for all custom helpers.

---

## Consequences Of Violation

Fatal PHP errors on deployment, framework upgrade failures, package compatibility issues.

---

## Prefix Custom Helpers to Reduce Collision Risk

Use application-specific prefixes for all custom helper function names.

---

## Category

Maintainability

---

## Rule

Custom helper functions must include an application-specific prefix (e.g., `app_format_date`, `acme_currency`) rather than generic names (e.g., `format_date`, `currency`).

---

## Reason

Generic helper names collide with future Laravel core helpers, package helpers, or other application helpers. Prefixes provide a namespace-like safety mechanism for global functions.

---

## Bad Example

```php
if (! function_exists('format_date')) {
    function format_date(string $date): string { ... }
}
// Future Laravel update may define format_date()
```

---

## Good Example

```php
if (! function_exists('acme_format_date')) {
    function acme_format_date(string $date): string { ... }
}
```

---

## Exceptions

Helpers that wrap well-known domain concepts (e.g., `is_vat_valid`) may use shorter names if the collision risk is explicitly evaluated.

---

## Consequences Of Violation

Fatal errors during Laravel version upgrades, mysterious function redefinition errors, package installation failures.

---

## Autoload Custom Helpers via Composer files Directive

Register custom helper files in `composer.json` under `autoload.files` and run `composer dump-autoload`.

---

## Category

Code Organization

---

## Rule

Custom helper files must be registered in the `autoload.files` array in `composer.json`. After adding or modifying the registration, run `composer dump-autoload`.

---

## Reason

The Composer `files` autoload directive ensures helper functions are loaded before any application code executes. Without it, helpers may be called before they are defined, causing fatal errors.

---

## Bad Example

```json
{
    "autoload": {
        "psr-4": {
            "App\\": "app/"
        }
    }
}
// app/helpers.php exists but is not autoloaded
```

---

## Good Example

```json
{
    "autoload": {
        "psr-4": {
            "App\\": "app/"
        },
        "files": [
            "app/helpers.php"
        ]
    }
}
```

---

## Exceptions

Helpers defined in framework core or packages are already autoloaded and do not need a `files` entry.

---

## Consequences Of Violation

"Call to undefined function" errors in production, helpers unavailable in specific request paths, deployment failures.

---

## Keep Custom Helpers Lightweight and Side-Effect-Free

Custom helpers must be simple utility functions. Never include business logic, database queries, or complex operations.

---

## Category

Design

---

## Rule

Helper functions must be pure or near-pure utility operations (string formatting, date formatting, data transformation). Business logic, database access, API calls, and service orchestration must live in dedicated service or action classes.

---

## Reason

Helpers cannot be mocked, substituted, or tested in isolation. They are loaded globally on every request and run in an untestable context. Complex logic in helpers couples behavior to global function calls.

---

## Bad Example

```php
if (! function_exists('charge_customer')) {
    function charge_customer(int $userId): void
    {
        $user = User::findOrFail($userId);
        $gateway = app(PaymentGateway::class);
        $gateway->charge($user);
    }
}
```

---

## Good Example

```php
if (! function_exists('format_currency')) {
    function format_currency(float $amount, string $currency = 'USD'): string
    {
        return number_format($amount, 2).' '.$currency;
    }
}
```

---

## Exceptions

Authentication helpers (e.g., `user()`) that return the current authenticated user are acceptable as they provide a thin wrapper over framework functionality.

---

## Consequences Of Violation

Untestable business logic, hidden side effects, impossible to mock or substitute, global state coupling.

---

## Never Leave dd() or dump() in Production Code

Remove all debug helper calls before committing code. Use pre-commit hooks or CI linting to enforce this.

---

## Category

Reliability

---

## Rule

`dd()` and `dump()` calls must never be present in committed code. Use a pre-commit hook or CI lint rule to catch them. Replace intentional debugging output with proper logging.

---

## Reason

`dd()` terminates request processing immediately. `dump()` outputs content that breaks API responses, disrupts JSON output, and exposes internal data. Both helpers crash production requests if left in committed code.

---

## Bad Example

```php
public function index(): JsonResponse
{
    $users = User::all();
    dd($users); // crashes request in production
}
```

---

## Good Example

```php
public function index(): JsonResponse
{
    $users = User::all();
    Log::debug('Users fetched', ['count' => $users->count()]);
    return response()->json($users);
}
```

---

## Exceptions

No common exceptions. Debug helpers must never appear in production code.

---

## Consequences Of Violation

Production crashes, corrupted API responses, exposed internal data to users, broken page rendering.
