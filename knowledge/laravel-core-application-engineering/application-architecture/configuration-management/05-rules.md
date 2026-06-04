# Configuration Management — Rules

## Use env() Only in Config Files

Call `env()` exclusively inside `config/*.php` files. Use `config()` everywhere else in the application.

---

## Category

Framework Usage

---

## Rule

The `env()` helper must only appear in files under the `config/` directory. All other code — controllers, services, actions, views, commands, event listeners — must use `config()` to read configuration values.

---

## Reason

After `php artisan config:cache`, `env()` calls in config files are resolved and frozen at cache time. `env()` calls in application code read from `$_ENV`, which returns `null` after caching. This creates inconsistency between development and production behavior.

---

## Bad Example

```php
// In a controller
if (env('APP_DEBUG')) {
    // Works in development, always false in production after config:cache
}
```

---

## Good Example

```php
// config/app.php
'debug' => env('APP_DEBUG', false),

// In a controller
if (config('app.debug')) {
    // Works correctly in all environments
}
```

---

## Exceptions

No common exceptions. The `env()` → config files only rule is invariant.

---

## Consequences Of Violation

Production bugs that are impossible to reproduce in development, silent behavior changes after `config:cache`, debugging nightmares.

---

## Always Provide Default Values for env() Calls

Always pass a default value as the second parameter to `env()` in config files.

---

## Category

Reliability

---

## Rule

Every `env()` call in config files must include a default value: `env('KEY', default)`. Never call `env('KEY')` without a fallback.

---

## Reason

Without a default, `env('KEY')` returns `null` when the environment variable is not set. A null value may cause type errors, silent configuration failures, or unexpected behavior (e.g., `null` passed to a `string` parameter, `null` database host causing connection failure).

---

## Bad Example

```php
return [
    'host' => env('DB_HOST'),
    'port' => env('DB_PORT'),
];
```

---

## Good Example

```php
return [
    'host' => env('DB_HOST', '127.0.0.1'),
    'port' => env('DB_PORT', '3306'),
];
```

---

## Exceptions

Config files that explicitly validate required values after the `env()` call and throw on missing values may omit defaults. The `env()` call with validation still runs before the check.

---

## Consequences Of Violation

Null pointer exceptions, silent configuration fallback, database connection failures, type errors in strict mode applications.

---

## Validate Required Config Values in Production

Throw descriptive exceptions in config files when required environment variables are missing in production.

---

## Category

Reliability

---

## Rule

At the end of each config file that requires mandatory environment variables, validate that required values are present in production. Throw a `RuntimeException` with the variable name when validation fails.

---

## Reason

Missing environment variables cause cryptic runtime errors. Validating at config load time catches the failure during deployment (when `config:cache` runs) rather than at request time (when the first API call fails).

---

## Bad Example

```php
// config/services.php
return [
    'stripe' => [
        'secret' => env('STRIPE_SECRET'), // null silently accepted
    ],
];
```

---

## Good Example

```php
$stripeKey = env('STRIPE_KEY');
if (empty($stripeKey) && app()->environment('production')) {
    throw new RuntimeException('STRIPE_KEY is not configured for production.');
}
return [
    'stripe' => [
        'key' => $stripeKey,
    ],
];
```

---

## Exceptions

Optional configuration values (logging levels, cache drivers) that have safe defaults do not require validation.

---

## Consequences Of Violation

Runtime failures at first feature usage, delayed detection of misconfigured deployments, silent failures in payment processing or external service integration.

---

## Never Use Configuration for Runtime Feature Flags

Do not store frequently toggled feature flags in config files. Use database-backed or cache-backed feature flag systems instead.

---

## Category

Architecture

---

## Rule

Feature flags that change more than once per deployment cycle must not be stored in config files or environment variables. Use a dedicated feature flag system (database, cache, or third-party service) for dynamic flags.

---

## Reason

Config caching freezes configuration values at cache generation time. Changing a feature flag requires regenerating the config cache, which is a deployment operation. Dynamic feature flags need instant toggling without deployment.

---

## Bad Example

```php
// config/features.php
return [
    'new-checkout' => env('FEATURE_NEW_CHECKOUT', false),
];
// Toggling requires: env change + config:cache + deploy
```

---

## Good Example

```php
// Feature flag service backed by database or cache
if (FeatureFlag::isEnabled('new-checkout')) {
    // Toggling requires: database update only
}
```

---

## Exceptions

Deployment-gated flags that are only enabled during a release cycle (never toggled between deployments) are acceptable in config files.

---

## Consequences Of Violation

Feature flag changes require deployment, delayed rollback capability, coupling between code releases and feature availability.

---

## Never Hardcode Secrets in Config Files

Always reference secrets through `env()` calls. Never write literal secret values in `config/*.php` files.

---

## Category

Security

---

## Rule

Config files must use `env('SECRET_NAME')` for all API keys, passwords, tokens, and credentials. Literal secret values must never appear in config files.

---

## Reason

Config files are committed to version control. Secrets hardcoded in config files become accessible to everyone with repository access, exposed in CI logs, and impossible to rotate without code changes.

---

## Bad Example

```php
// config/services.php
return [
    'stripe' => [
        'secret' => 'sk_live_abc123def456',
    ],
];
```

---

## Good Example

```php
// config/services.php
return [
    'stripe' => [
        'secret' => env('STRIPE_SECRET'),
    ],
];

// .env (not committed)
STRIPE_SECRET=sk_live_abc123def456
```

---

## Exceptions

No common exceptions. Secrets must never be hardcoded in config files.

---

## Consequences Of Violation

Secrets exposed in version control, credential leaks to unauthorized parties, inability to rotate secrets without code changes, compliance violations.

---

## Always Clear and Rebuild Config Cache on Deployment

Every deployment must include `php artisan config:clear && php artisan config:cache`.

---

## Category

Reliability

---

## Rule

Deployment scripts must execute `php artisan config:clear` before `php artisan config:cache` to ensure stale configuration is removed before the new cache is generated.

---

## Reason

If config cache is not rebuilt, the application uses old configuration values. If cache is built without clearing first, old cached configuration that was removed may persist. The clear-and-rebuild sequence is the only reliable approach.

---

## Bad Example

```bash
git pull origin main
php artisan migrate --force
# config cache not rebuilt — stale config active
```

---

## Good Example

```bash
git pull origin main
php artisan config:clear
php artisan config:cache
php artisan migrate --force
```

---

## Exceptions

No common exceptions. Clear-and-rebuild is mandatory for every deployment that changes configuration.

---

## Consequences Of Violation

Old configuration values serve requests (including old API keys, old database credentials), new config values are ignored, security risk from stale secrets.

---

## Avoid Runtime Config Mutability

Never use `Config::set()` or `config(['key' => 'value'])` in production application code to change configuration at runtime.

---

## Category

Maintainability

---

## Rule

Do not modify configuration values at runtime using `Config::set()` or the `config()` helper with array input. Configuration must be read-only during request execution.

---

## Reason

Runtime config mutations are not persisted, are lost on cache regeneration, create debugging nightmares (the value at request start differs from the value at request end), and make the application's behavior non-deterministic.

---

## Bad Example

```php
class SomeService
{
    public function process(): void
    {
        config(['app.debug' => true]); // runtime mutation
    }
}
```

---

## Good Example

```php
class SomeService
{
    public function __construct(
        private bool $debug,
    ) {}

    public function process(): void
    {
        // Use injected value; config stays immutable
    }
}
```

---

## Exceptions

Runtime config mutation is acceptable in test setup/teardown where config is restored after each test. Never in production code paths.

---

## Consequences Of Violation

Non-deterministic application behavior, debugging difficulty, values that change during request execution, stale state that contradicts actual configuration.
