# Environment Management

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Application Architecture & Structure
- **Knowledge Unit:** Environment Management
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

Environment management in Laravel controls how configuration values differ across deployment environments (local, staging, production). The `.env` file stores environment-specific values (database credentials, API keys, debug mode), which are loaded by the framework at boot time and made available through `env()` helper and `config()` functions.

The engineering value is separating code from configuration. The same codebase deploys to any environment without modification — only the `.env` file changes. This enables different credentials, feature flags, and behavior (debug mode on in development, off in production) without touching application code.

---

## Core Concepts

### Environment Detection

Laravel detects the current environment via the `APP_ENV` environment variable:

```php
$app->environment();           // 'local', 'production', 'testing', etc.
$app->environment('local');    // true/false
$app->environment(['local', 'staging']); // true if any match
```

The environment name determines which configuration files are loaded and affects behavior like debug mode, error display, and logging verbosity.

### Environment File Loading

At bootstrap, Laravel loads the `.env` file using the `vlucas/phpdotenv` library:

```
# .env (loaded by default)
APP_ENV=local
APP_DEBUG=true
DB_HOST=127.0.0.1

# .env.production (loaded when APP_ENV=production)
DB_HOST=prod-db.example.com
```

The loader reads the file, parses each line as `KEY=VALUE`, and sets them as environment variables via `putenv()`. These are then accessible via `env()`, `$_ENV`, or `getenv()`.

### env() vs config() Helper

```php
// env() — reads directly from environment (use only in config files)
$value = env('APP_DEBUG', false);

// config() — reads from cached config (use everywhere else)
$value = config('app.debug');
```

The critical distinction: `env()` should ONLY be used in config files under `config/`. Application code should use `config()` because:
1. `config()` works after config caching; `env()` returns null after `php artisan config:cache`
2. `config()` provides a consistent access pattern regardless of caching
3. `config()` supports dot-notation navigation

---

## Mental Models

### The Env File as Deployment Configuration

The `.env` file is deployment configuration, not application configuration. It contains values that differ per environment. Values that are the same across all environments should be hardcoded in config files, not duplicated in `.env`.

### The Config Cache Boundary

`php artisan config:cache` serializes all config file values into a single cached file. After caching, `env()` calls return `null` because the environment is no longer read — only the cached config is used. This means `env()` calls MUST only exist in config files, never in application code.

---

## Internal Mechanics

### Loading Order

1. Application instantiation sets base path
2. `LoadEnvironmentVariables` bootstrapper runs
3. Dotenv loads `.env` file based on `APP_ENV`:
   - Default: `.env`
   - If `APP_ENV` is set: `.env.{APP_ENV}` with `.env` as fallback
4. All environment variables are now available via `env()`, `$_ENV`, `getenv()`
5. Config files in `config/` use `env()` to read values
6. Application code uses `config()` to read values

### Override Priority

```
Environment variable (setenv, nginx FPM config)
  ↑ overrides
.env.{APP_ENV} file (e.g., .env.production)
  ↑ overrides
.env file
  ↑ overrides
Default values in config/*.php
```

This priority allows production environments to set credentials via server environment variables, overriding whatever is in `.env` files.

---

## Patterns

### Environment-Specific Config Files

```php
// config/app.php
'debug' => env('APP_DEBUG', false),

// config/database.php
'mysql' => [
    'host' => env('DB_HOST', '127.0.0.1'),
    'database' => env('DB_DATABASE', 'forge'),
    'username' => env('DB_USERNAME', 'forge'),
    'password' => env('DB_PASSWORD', ''),
],
```

### Environment-Specific .env Files

```
.env              # Base config (shared defaults)
.env.local        # Local overrides (not committed)
.env.staging      # Staging overrides
.env.production   # Production overrides
```

Laravel automatically loads `.env.{APP_ENV}` if it exists, falling back to `.env`.

### Required Environment Variables

```php
// In a service provider
public function boot(): void
{
    $required = ['STRIPE_KEY', 'STRIPE_SECRET', 'DB_HOST'];
    foreach ($required as $key) {
        if (empty(env($key))) {
            throw new \RuntimeException("Required environment variable [{$key}] is not set.");
        }
    }
}
```

---

## Architectural Decisions

### .env vs Server Environment Variables

| Concern | .env File | Server Environment Variables |
|---|---|---|
| Accessibility | File on disk | Server/web server config |
| Version control | Should be excluded (.gitignore) | Not in repo |
| Rotation | Edit file, redeploy | Edit server config, restart |
| Secrets | In file system | In process memory |
| CI/CD integration | Generated during deploy | Set in deployment pipeline |

Use `.env` for local development. Use server environment variables for production (especially secrets).

### Single vs Multiple .env Files

| Approach | When |
|---|---|
| Single `.env` | Simple projects, single environment variant |
| `.env` + `.env.{APP_ENV}` | Multiple environments with different configurations |
| No `.env` in production | Production uses server environment variables exclusively |

---

## Tradeoffs

| Concern | env() in Config Files | Hardcoded Config Values |
|---|---|---|
| Flexibility | Per-environment values | Same value everywhere |
| Discoverability | All .env values documented in config | Values hidden in code |
| Caching | Works with config:cache | No caching needed |
| Failure mode | Missing .env produces null | Always has a value |

---

## Performance Considerations

Environment loading is a one-time bootstrap cost (~1-2ms for reading and parsing the `.env` file). After `php artisan config:cache`, environment values are serialized into the cached config, and `.env` is never read at runtime. This is the recommended production configuration for optimal performance.

---

## Production Considerations

- Run `php artisan config:cache` on every production deploy — this eliminates `.env` file reading at runtime
- Never store `.env` in version control — add it to `.gitignore`
- Generate `.env` as part of the deployment pipeline, not manually
- Use server environment variables for secrets in production (Forge, Vapor, Docker)
- Set `APP_ENV=production` in production — this controls error display, debugging tools, and logging
- Validate required environment variables at boot in production to catch misconfiguration early
- Use a `.env.example` file committed to the repository as a template for required values
- Monitor for missing environment variables in production error logs

---

## Common Mistakes

### Using env() in Application Code

```php
// Bad — breaks after config:cache
if (env('APP_DEBUG')) { ... }

// Good — reads from cached config
if (config('app.debug')) { ... }
```

### Committing .env to Version Control

`.env` files contain secrets (database passwords, API keys) and should never be committed. Add `.env` to `.gitignore`. Use `.env.example` as a template instead.

### Hardcoding Environment-Specific Values

```php
// Bad — same in all environments
'host' => 'localhost',

// Good — per-environment
'host' => env('DB_HOST', 'localhost'),
```

### Missing .env in Production

Deploying without a `.env` file or equivalent environment variables. The application uses default values from config files, which are development defaults. Production credentials are missing, and the application fails.

---

## Failure Modes

### Stale .env After Config Cache

`.env` is updated but `php artisan config:cache` is not re-run. The cached config still has old values. Always run `config:cache` as part of the deploy script after updating the `.env` file.

### Missing .env on Fresh Clone

A developer clones the repository and runs the application without creating a `.env` file. `phpdotenv` throws a `RuntimeException: Unable to load environment file`. Mitigate: include `.env.example` and add a check in the application that provides a helpful error message if `.env` is missing.

### Environment Detection Failure

`APP_ENV` is misspelled (`productoin` instead of `production`). The framework loads `.env.productoin` (which doesn't exist) and falls back to `.env`. Debug mode may be on in production. Validate `APP_ENV` in a service provider boot method.

---

## Ecosystem Usage

Laravel's own bootstrap process in `bootstrap/app.php` triggers environment loading before any configuration file is read. Forge provides a web interface for managing environment variables per site, writing them to `.env` on deploy. Vapor uses environment variables exclusively (no `.env` files in serverless environment).

The `spatie/environmental-values` package provides type-safe environment variable access with validation. `vlucas/phpdotenv` is the underlying library Laravel uses for `.env` file parsing. Laravel Horizon reads environment-specific configuration from `config/horizon.php` which uses `env()` for Redis connection settings.

---

## Related Knowledge Units

- **Configuration Management** (this workspace) — how env values flow into config files
- **Bootstrapping Lifecycle** (this workspace) — where environment loading occurs in the boot sequence
- **Service Provider Strategies** (this workspace) — validating environment variables in providers
- **Application Class** (this workspace) — how the Application coordinates environment detection

---

## Research Notes

- Environment loading is one of the first bootstrap operations — it runs in `LoadEnvironmentVariables` bootstrapper
- `APP_ENV` can be set via server environment variable, `.env` file, or `detectEnvironment()` callback
- `php artisan config:cache` makes `env()` calls unsafe outside of config files
- Multiple `.env.{env}` files allow environment-specific overrides with `.env` as base
- Server environment variables take priority over `.env` file values
- The `env()` helper accepts a default value as second parameter — always provide one for safety
- `$_ENV` superglobal is populated by phpdotenv; some server configurations may block it
- Docker environments typically pass environment variables at container runtime, not via `.env`
- CI/CD pipelines should validate all required environment variables before deployment
