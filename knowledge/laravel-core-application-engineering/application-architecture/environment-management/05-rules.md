# Environment Management — Rules

## Use env() Only in Config Files

Never call `env()` in application code. Restrict `env()` usage exclusively to `config/*.php` files.

---

## Category

Framework Usage

---

## Rule

The `env()` helper must appear only in files inside the `config/` directory. All other code — controllers, services, actions, views, commands, jobs, listeners — must read configuration through `config()`.

---

## Reason

After `php artisan config:cache`, `env()` returns `null` because environment variables are no longer read at runtime. Only the cached config array is used. Application code using `env()` silently breaks in production.

---

## Bad Example

```php
// In a controller
if (env('APP_DEBUG')) {
    // Returns null after config:cache — condition never true in production
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

No common exceptions. The `env()` restriction is invariant.

---

## Consequences Of Violation

Silent behavior changes between development and production, debugging difficulty, production-only bugs.

---

## Always Provide Default Values for env() Calls

Every `env()` call must include a sensible default as the second parameter.

---

## Category

Reliability

---

## Rule

Use `env('KEY', default)` format for all environment variable lookups. Never use bare `env('KEY')` without a fallback value.

---

## Reason

Without a default, `env('KEY')` returns `null` when the environment variable is not set. A null value can cause type errors, silent configuration failures (null database host, null API key), or unexpected application behavior.

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
    'port' => env('DB_PORT', 3306),
];
```

---

## Exceptions

Config files that explicitly validate and throw on missing values may omit defaults, but a default is still preferred for the non-production fallback.

---

## Consequences Of Violation

Null type errors, database connection failures, API calls with null credentials, silent fallback to unintended behavior.

---

## Never Commit .env to Version Control

Add `.env` to `.gitignore` before the first commit. Use `.env.example` as the committed template.

---

## Category

Security

---

## Rule

The `.env` file must be listed in `.gitignore` and must never be committed to version control. Use `.env.example` with placeholder values and documentation comments as the committed template.

---

## Reason

`.env` files contain database passwords, API keys, and other secrets. Committing them exposes credentials to everyone with repository access, including CI systems, and makes rotation impossible without changing repository history.

---

## Bad Example

```bash
# .env committed — secrets in repository history
git add .env
git commit -m "add env"
git push
```

---

## Good Example

```bash
# .env in .gitignore (already included by Laravel default)
# .env.example committed with placeholder values
DB_HOST=127.0.0.1
DB_DATABASE=homestead
DB_USERNAME=homestead
DB_PASSWORD=
```

---

## Exceptions

No common exceptions. Never commit `.env` files.

---

## Consequences Of Violation

Credential leakage to all repository viewers, inability to remove secrets from history, compliance violations, security audit failures.

---

## Run php artisan config:cache in Production

Always execute `php artisan config:cache` as part of production deployment scripts.

---

## Category

Performance

---

## Rule

Every production deployment must include `php artisan config:cache`. Production applications must never run without configuration caching.

---

## Reason

Without `config:cache`, environment values are read from the `.env` file on every request, and config files are individually parsed. Caching eliminates the `.env` read, serializes all config to a single file, and provides consistent snapshotted values.

---

## Bad Example

```bash
git pull origin main
composer install --no-dev
php artisan migrate --force
# config:cache not run — .env read on every request
```

---

## Good Example

```bash
git pull origin main
php artisan config:cache
php artisan migrate --force
```

---

## Exceptions

Development and local environments should not cache config, as it prevents changes from taking effect immediately.

---

## Consequences Of Violation

1-2ms additional bootstrap time for `.env` reading, 3-8ms additional for config file parsing, per-request filesystem I/O.

---

## Validate Required Environment Variables at Application Boot

Check that all required environment variables are set early in the boot sequence and throw descriptive exceptions for missing values.

---

## Category

Reliability

---

## Rule

In a service provider's `boot()` method, iterate over required environment variables and throw a `RuntimeException` with the missing key name for any that are not set.

---

## Reason

Missing environment variables cause cryptic runtime errors (database connection failed, API call rejected) at the first point of use. Early validation with clear error messages catches misconfiguration during deployment verification.

---

## Bad Example

```php
// No validation — fails at first database query
public function boot(): void
{
    // Nothing checks DB_HOST, DB_DATABASE, etc.
}
```

---

## Good Example

```php
public function boot(): void
{
    $required = ['STRIPE_KEY', 'STRIPE_SECRET', 'DB_HOST'];
    foreach ($required as $key) {
        if (empty(env($key))) {
            throw new RuntimeException(
                "Required environment variable [{$key}] is not set."
            );
        }
    }
}
```

---

## Exceptions

Optional environment variables with safe defaults should not be in the required list.

---

## Consequences Of Violation

Cryptic runtime errors at first usage, delayed failure detection, difficult debugging in production environments.

---

## Use Server Environment Variables for Production Secrets

Prefer server-level environment variables over `.env` files for production secrets.

---

## Category

Security

---

## Rule

In production environments, set sensitive values (database passwords, API keys, application key) via server-level environment variables (Forge, Vapor, Docker, nginx `fastcgi_param`, systemd `Environment=`). Do not rely on `.env` files in production.

---

## Reason

Server environment variables live in process memory rather than on disk, reducing the attack surface. They are managed through infrastructure tooling rather than file deployments, providing a clear separation between code configuration and secret management.

---

## Bad Example

```bash
# Production uses .env file with secrets
# .env.production deployed alongside code
STRIPE_SECRET=sk_live_abc123
```

---

## Good Example

```bash
# Production secrets set as server environment variables
# Forge: set via UI
# Docker: --env STRIPE_SECRET=sk_live_abc123
# nginx: fastcgi_param STRIPE_SECRET sk_live_abc123;
```

---

## Exceptions

Small-scale or single-server deployments may use `.env` files with strict filesystem permissions as a pragmatic alternative.

---

## Consequences Of Violation

Secrets written to disk and accessible to any process reading the filesystem, increased exposure during deployment, secrets mixed with code configuration.

---

## Keep .env.example Comprehensive and Committed

Maintain a complete `.env.example` file in version control with every environment variable documented.

---

## Category

Maintainability

---

## Rule

The `.env.example` file must list every environment variable the application uses, with placeholder values and comments describing each variable's purpose. It must be updated whenever a new environment variable is added.

---

## Reason

`.env.example` is the primary onboarding documentation for new developers and the contract between the application and its deployment environments. An incomplete example causes setup failures and missing configuration in production.

---

## Bad Example

```
# .env.example — missing variables
APP_KEY=
DB_HOST=127.0.0.1
```

---

## Good Example

```
APP_KEY=base64:xxxxxxxxxxxx
APP_DEBUG=false          # Enable/disable debug mode
DB_HOST=127.0.0.1       # Database host
DB_DATABASE=laravel      # Database name
DB_USERNAME=root         # Database username
DB_PASSWORD=             # Database password
STRIPE_KEY=              # Stripe publishable key
STRIPE_SECRET=           # Stripe secret key
```

---

## Exceptions

No common exceptions. `.env.example` must always be complete.

---

## Consequences Of Violation

New developers cannot set up the application, deployment pipelines fail with missing variables, production misconfiguration when variables are undocumented.
