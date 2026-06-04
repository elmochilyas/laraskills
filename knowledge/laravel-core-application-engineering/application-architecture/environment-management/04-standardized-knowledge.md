# Environment Management

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Application Architecture & Structure
- **Knowledge Unit:** Environment Management
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02
- **ECC Phase:** 4

---

## Overview

Environment management in Laravel controls how configuration values differ across deployment environments (local, staging, production). The `.env` file stores environment-specific values (database credentials, API keys, debug mode), which are loaded by the framework at bootstrap using `vlucas/phpdotenv` and made available through `env()` and `config()` functions. The core principle is separating code from configuration — the same codebase deploys to any environment without modification; only the `.env` file or server environment variables change.

---

## Core Concepts

1. **Environment Detection** — Laravel detects the current environment via `APP_ENV` (set in `.env` or as a server environment variable). The `app()->environment()` method checks the current environment, supporting both string and array matching: `app()->environment('local')`, `app()->environment(['local', 'staging'])`.

2. **Environment File Loading** — At bootstrap, the `LoadEnvironmentVariables` bootstrapper loads `.env` using `vlucas/phpdotenv`. If `APP_ENV` is set, it attempts to load `.env.{APP_ENV}` first, falling back to `.env`. This enables environment-specific overrides.

3. **env() vs config() Helper** — `env()` reads directly from environment variables and should ONLY be used in config files under `config/`. After `php artisan config:cache`, `env()` returns `null` because the environment is no longer read — only cached config is used. `config()` works in both cached and uncached states, uses dot-notation navigation, and should be used everywhere else.

4. **Override Priority** — Server environment variables (set via `setenv`, nginx FPM config, Docker) take highest priority, overriding `.env.{APP_ENV}` which overrides `.env` which overrides default values in `config/*.php`.

5. **Environment-Specific .env Files** — Laravel supports `.env.local`, `.env.staging`, `.env.production` for environment-specific overrides. The primary `.env` file serves as the base with shared defaults.

---

## When To Use

- **Separating config from code** — Always use `.env` for values that differ across environments (database credentials, API keys, debug mode, app URL)
- **Per-environment behavior** — Use `APP_ENV` to control debug mode, error display, logging verbosity, and service configurations
- **Secret management** — Use `.env` (local) or server environment variables (production) for secrets that must not be in version control
- **Feature toggles per environment** — Use environment variables to enable/disable features in specific environments (e.g., maintenance mode, beta features)
- **CI/CD pipelines** — Generate `.env` or set environment variables as part of the deployment process

---

## When NOT To Use

- **Hardcoded defaults for all environments** — If a value is the same in every environment, hardcode it in the config file rather than adding it to `.env`
- **Application logic decisions** — Do NOT use environment variables to control business logic; use feature flags, configuration, or database settings
- **env() in application code** — Never use `env()` in controllers, services, actions, views, or any code outside of `config/` files — it breaks after `config:cache`
- **Complex data structures** — `.env` files are flat key-value pairs; do not store arrays, nested config, or serialized data in environment variables

---

## Best Practices (WHY)

1. **Only use env() in config files** — `env()` reads from `$_ENV` superglobal, which is `null` after `php artisan config:cache`. `config()` reads from the cached config array, which persists regardless of caching. This distinction is the most common source of production bugs in Laravel environment management.

2. **Always provide default values** — `env('APP_DEBUG', false)` provides a fallback when the environment variable is not set. Without a default, `env()` returns `null`, which may cause type errors or unexpected behavior in config files.

3. **Never commit .env to version control** — Add `.env` to `.gitignore` immediately after project creation. Use `.env.example` (committed) as a template for required environment variables. `.env` files contain secrets that must never be in the repository.

4. **Run config:cache in production** — `php artisan config:cache` eliminates `.env` file reading at runtime, serializes all config values into a single cached file, and improves performance. Make it part of every deployment script.

5. **Validate required environment variables at boot** — In a service provider's `boot()` method, check that all required environment variables are set. Throw a descriptive exception if any are missing to catch misconfiguration early, before the application attempts to use them.

6. **Use server environment variables for production secrets** — Forge, Vapor, Docker, and server configuration tools can set environment variables directly. This is more secure than `.env` files because secrets stay in process memory and are not written to disk.

7. **Keep .env.example comprehensive** — The `.env.example` file documents every environment variable the application needs, with placeholder values and comments describing each variable's purpose. This is the primary onboarding documentation for new developers.

---

## Architecture Guidelines

### .env vs Server Environment Variables

| Concern | .env File | Server Environment Variables |
|---|---|---|
| Accessibility | File on disk | Server/web server config |
| Version control | Must be excluded (`.gitignore`) | Not in repo |
| Rotation | Edit file, redeploy | Edit server config, restart |
| Secrets | In filesystem (disk) | In process memory (RAM) |
| CI/CD integration | Generated during deploy | Set in deployment pipeline |

### Single vs Multiple .env Files

| Approach | When |
|---|---|
| Single `.env` | Simple projects, single environment variant |
| `.env` + `.env.{APP_ENV}` | Multiple environments with different configurations |
| No `.env` in production | Production uses server environment variables exclusively |

### Override Priority Chain
```
Server env variable (nginx FPM config, Docker, setenv)
  ↑ overrides
.env.{APP_ENV} file (e.g., .env.production)
  ↑ overrides
.env file
  ↑ overrides
Default values in config/*.php
```

---

## Performance

- Environment loading is a one-time bootstrap cost (~1-2ms for reading and parsing `.env`)
- After `php artisan config:cache`, environment values are serialized into cached config and `.env` is never read at runtime
- In production with config caching, environment management has zero per-request overhead

---

## Security

- Never store `.env` in version control — it contains database passwords, API keys, and secrets
- Use `.env.example` with placeholder values as the committed template
- In production, prefer server environment variables (Forge, Vapor, Docker) over `.env` files for secrets
- Validate `APP_ENV` at boot — a misspelled value (e.g., `productoin`) causes fallback to `.env` and may enable debug mode in production
- Restrict access to `.env` files in non-local environments — they should not be web-accessible
- Monitor for missing environment variables in production error logs

---

## Common Mistakes

### Using env() in Application Code
- **Description:** Calling `env('APP_DEBUG')` in controllers, services, or views
- **Cause:** Unaware that `env()` returns `null` after `php artisan config:cache`
- **Consequence:** After production config caching, the value becomes `null`, changing behavior silently
- **Better:** Use `config('app.debug')` instead of `env('APP_DEBUG')` in all application code

### Committing .env to Version Control
- **Description:** `.env` is accidentally committed to the repository
- **Cause:** Missing `.gitignore` entry or using `git add .` without checking
- **Consequence:** Database credentials and API keys exposed in the repository history
- **Better:** Add `.env` to `.gitignore` before the first commit; use `.env.example` for documentation

### Hardcoding Environment-Specific Values
- **Description:** Writing `'host' => 'localhost'` instead of `'host' => env('DB_HOST', 'localhost')`
- **Cause:** Convenience or not anticipating multiple environments
- **Consequence:** Production cannot override the value without modifying the config file
- **Better:** Use `env()` with a sensible default for any value that could differ per environment

### Missing .env on Fresh Clone
- **Description:** Running the application after cloning without creating `.env`
- **Cause:** No automated check for missing `.env` at bootstrap
- **Consequence:** `phpdotenv` throws `RuntimeException: Unable to load environment file`
- **Better:** Include a `.env.example` and add a pre-bootstrap check that provides a helpful error message

---

## Anti-Patterns

- **env() as Application Configuration** — Using `env()` directly in application code as if it were a config system. `env()` is a bootstrap-time mechanism that becomes unavailable after caching. Application code must go through `config()`.
- **Hardcoded Production Values** — Not using environment variables at all, hardcoding production credentials in config files. Makes the codebase unsafe to share and impossible to deploy to different environments.
- **Missing Defaults** — `env('SOME_KEY')` without a second parameter. If the environment variable is missing, the config value is `null`, which can cause type errors, SQL connection failures, or silent fallback to unintended behavior.
- **Duplicate .env Values** — Repeating the same environment variable across multiple config files. If the value changes, it must be updated in `env()` calls scattered across config files. Document each env variable in one place and reference via config.

---

## Examples

### Environment-Specific Config File Usage
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

### Required Environment Variable Validation
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

### Environment-Specific .env Files
```
.env              # Base config (shared defaults, committed as .env.example)
.env.local        # Local overrides (not committed)
.env.staging      # Staging overrides
.env.production   # Production overrides
```

### Deploy Script with Caching
```bash
php artisan config:cache
# After this, env() calls return null in app code
# config() calls work correctly
```

---

## Related Topics

- **Configuration Management** — how env values flow into config files and caching mechanics
- **Bootstrapping Lifecycle** — where environment loading occurs in the boot sequence
- **Service Provider Strategies** — validating environment variables in providers
- **Application Class** — how the Application coordinates environment detection

---

## AI Agent Notes

- Environment loading runs in the `LoadEnvironmentVariables` bootstrapper, one of the first bootstrap operations
- `APP_ENV` can be set via server env var, `.env` file, or `detectEnvironment()` callback — in priority order
- The critical rule: `env()` in config files only; `config()` everywhere else
- `php artisan config:cache` makes all `env()` calls outside config files return `null`
- Server environment variables (setenv, Forge, Docker) take priority over `.env` file values
- Always suggest a default value second parameter for `env()` calls
- Docker environments typically pass env vars at container runtime, not via `.env`
- CI/CD pipelines should validate required environment variables before deployment

---

## Verification

- [ ] Understands the difference between `env()` and `config()` and why it matters
- [ ] Knows the override priority chain (server env > `.env.{APP_ENV}` > `.env` > defaults)
- [ ] Can configure environment-specific `.env` files
- [ ] Understands why `config:cache` makes `env()` unsafe outside config files
- [ ] Can validate required environment variables at application boot
- [ ] Knows when to use `.env` vs server environment variables
- [ ] Can identify and fix env() usage in application code
- [ ] Understands `APP_ENV` detection and the consequences of misspelling
