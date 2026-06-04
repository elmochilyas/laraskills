# Knowledge Unit: Environment File Management

## Metadata
- **Subdomain:** Development Environments
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** development-environments/environment-file-management
- **Maturity:** Mature
- **Related Technologies:** Laravel, .env, PHP, Docker, Dotenv

## Executive Summary

Environment file management in Laravel involves managing configuration values across different environments (local, testing, staging, production) using `.env` files and Laravel's configuration system. Laravel uses the `vlucas/phpdotenv` library to load `.env` variables at application bootstrap, making them available via `env()`, `config()`, and `$_ENV`. Key practices include: `.env` for sensitive/ environment-specific values (never committed), `.env.example` as a template (committed), `config/` files for default values with `env()` fallbacks, environment-specific `.env` files (`.env.testing`, `.env.dusk.local`), and environment detection via `APP_ENV`. In containerized environments (Sail), environment variables are passed from the host `.env` to Docker containers, bridging host configuration with containerized services.

## Core Concepts

- **.env File:** Environment-specific configuration file in the project root; NOT committed to version control; contains sensitive values (APP_KEY, DB_PASSWORD, API keys)
- **.env.example:** Template file committed to version control; documents all required environment variables with placeholder values
- **env() Helper:** Laravel function to read environment variables with default: env('DB_CONNECTION', 'mysql') returns the value or 'mysql' if not set
- **Config Files:** Configuration files in config/ directory; use env() calls to set defaults, making them environment-aware
- **APP_ENV:** Environment variable that determines which environment the application is running in (local, production, testing)
- **config() Helper:** Access configuration values; prefers cached config over env() calls; used in application code instead of env()
- **.env Caching:** php artisan config:cache bakes env() values into cached config files; env() stops working after caching (config() still works)

## Mental Models

- **.env as Environment Keychain:** Like a keychain with keys for each environment (API keys, passwords, service URLs)—only the keys for the current environment are loaded
- **Config Files as Default Registry:** Config files define the default values; .env files override them per environment—like a layered configuration system (env overrides config defaults)
- **.env.example as Setup Checklist:** The example file serves as a checklist of all configuration values a developer must set to run the application

## Internal Mechanics

1. **Bootstrap Loading:** Laravel's bootstrap process loads `vlucas/phpdotenv` to parse the `.env` file (or environment-specific file like `.env.production`) and sets values to `$_ENV` and `putenv()`
2. **env() Resolution:** The `env()` helper checks `$_ENV` first, then `putenv()`, then returns the default value if neither exists
3. **Config File Loading:** Service providers read config files (config/app.php, config/database.php) which call `env()` to get environment-specific values
4. **Config Caching:** `php artisan config:cache` resolves all `env()` calls in config files and writes the resolved values to `bootstrap/cache/config.php`; subsequent requests use cached values
5. **Environment Detection:** The application determines its environment from `APP_ENV` (usually `local`, `production`, `testing`); this affects error reporting, logging, service providers
6. **Docker/Host Bridge:** In Sail, the host's `.env` file is read by the application (in the container) via volume mounting, making host environment variables available inside the container

## Patterns

- **Environment-Specific Files Pattern:** Use `.env.testing` for testing (loaded by phpunit.xml), `.env.dusk.local` for Dusk, and `.env.production` for production deployment
- **env() in Config Files Only Pattern:** Only use `env()` calls in config files. Application code should use `config()` to access resolved configuration values. This ensures config caching works correctly.
- **Layered Config Pattern:** Define base values in config files, override with `.env` values, and optionally override specific values with server environment variables for deployment platforms (Forge, Vapor, Heroku)
- **Validation Pattern:** Validate required environment variables during application bootstrap: `if (! env('STRIPE_KEY')) { throw new \RuntimeException('Missing STRIPE_KEY'); }`
- **.env.example with Descriptions Pattern:** Include comments in `.env.example` explaining each variable's purpose: `STRIPE_KEY= # Your Stripe publishable key (from dashboard.stripe.com)`
- **GitGuard Pattern:** Add `.env` to `.gitignore` immediately on project creation; use a pre-commit hook to prevent accidental commits of `.env` files
- **Docker Environment Bridge Pattern:** In Sail, map host .env variables to container environment variables via the docker-compose.yml env_file directive

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Variable source | .env only vs config only vs both | env() in config files; config() in application code |
| Cache strategy | Always cache vs never cache vs environment-based | Cache in production (performance); never cache in development (immediate changes) |
| Validation timing | Bootstrap vs runtime vs deployment | Bootstrap for required vars; runtime for optional vars; deployment for configuration verification |
| Template format | .env.example vs .env.ci vs .env.docker | .env.example (standard); additional templates for specific environments |
| Cross-environment sharing | Same .env structure vs different per environment | Same structure (same keys), different values per environment |

## Tradeoffs

- **env() vs config():** env() reads from environment directly (works before config caching), while config() reads from resolved config storage. Always use config() in application code to ensure config caching works. env() is only safe in config files.
- **Cached vs Uncached Config:** Cached config is faster (single file load vs multiple config file resolution) but requires re-caching after any env/config change. Uncached config reads from disk on every request (slower) but reflects changes immediately.
- **.env in Version Control vs Not:** Committing .env makes setup easier (no configuration step) but exposes sensitive values to all repository accessors. Never commit .env for production or shared projects.

## Performance Considerations

- **Config Caching Impact:** Cached config reduces bootstrap time by 10-30ms on every request. In production, always cache config. In development, avoid caching to allow immediate env variable changes.
- **env() Call Overhead:** Each env() call checks $_ENV and putenv(). In config files (loaded once), this overhead is negligible. In application code (called repeatedly), the overhead accumulates.
- **config() Call Caching:** config() results are cached in memory after first access. Repeated config('app.name') calls don't re-read from disk.
- **File System Load:** Reading .env on every request (uncached) adds 1-3ms of file I/O. This is acceptable for development but not for production.

## Production Considerations

- **.env Security:** Never commit .env to version control. Use deployment platforms' environment variable management (Forge UI, Vapor CLI, server env vars) for production.
- **Config Cache on Deployment:** Run php artisan config:cache during deployment. This resolves all env() calls and bakes them into cached files. After caching, changing .env has no effect until re-cached.
- **APP_KEY Rotation:** The APP_KEY (used for encryption) is stored in .env. Rotate keys carefully—old encrypted data (sessions, cookies, encrypted values) becomes unreadable. Document rotation procedures.
- **Sensitive Value Management:** Use deployment platform's encrypted environment variable storage for production secrets. Never log environment variable values, even in error messages.
- **Environment Detection Accuracy:** Ensure APP_ENV is set correctly on each environment. Misconfiguration (e.g., 'production' not set on production) causes wrong error reporting, logging, and service provider registration.

## Common Mistakes

- **Using env() in application code instead of config():** Calling env() in controllers, services, or views; config caching breaks these calls because env() returns null after caching
- **Committing .env to version control:** Accidentally committing the .env file with database passwords, API keys, and APP_KEY exposed in the repository
- **Not updating .env.example after adding new variables:** Adding a required environment variable to config files but forgetting to add it to .env.example; new developers don't know the variable is needed
- **Config caching in development:** Running php artisan config:cache in development; env changes don't take effect until cache is cleared with php artisan config:clear
- **Overwriting production .env via deployment:** Deployment scripts that overwrite the production .env file, losing environment-specific configuration values
- **Skipping APP_KEY generation:** Copying another project's .env or using a placeholder APP_KEY; encrypted values (sessions, cookies) become insecure or incompatible

## Failure Modes

- **Missing Environment Variable Error:** A required env() call returns null because the variable isn't set in .env or server environment. Mitigate: validate required variables during bootstrap; provide clear error messages.
- **Stale Config Cache After .env Change:** Running php artisan config:cache, then modifying .env, but not re-caching; new env values are ignored. Mitigate: clear and re-cache config after any .env change.
- **APP_KEY Mismatch:** Different environments have different APP_KEY values; encrypted data from one environment can't be read in another. Mitigate: share APP_KEY across environments where cross-environment data sharing is needed.
- **Environment Variable Injection:** Server environment variables override .env values unintentionally (e.g., a shared hosting environment injects DB_HOST). Mitigate: use specific .env or config values that aren't overridden by server environment.

## Ecosystem Usage

- **Laravel Sail:** The host .env file is passed to the Docker container via env_file or environment variables in docker-compose.yml
- **Laravel Forge:** Forge's environment variable management UI sets server-level env vars that override .env values
- **Laravel Vapor:** Vapor's CLI and dashboard manage environment variables per project and per environment, stored in AWS Parameter Store
- **Laravel Shift:** Shift recommends .env.example as the single source of truth for required configuration variables
- **Laravel Envoyer:** Envoyer's deployment workflow updates .env files during zero-downtime deployments from project-specific configuration

## Related Knowledge Units

- laravel-sail
- docker-compose-for-laravel
- automated-environment-setup-scripts
- local-environment-setup-documentation

## Research Notes

- Laravel uses vlucas/phpdotenv v5+ which supports type-casting variables (true, false, null) and multiline values
- The env() helper in Laravel has special handling for boolean-like strings: 'true', '(true)', 'false', '(false)', 'null', '(null)' are cast appropriately
- Config caching was optimized in Laravel 11 with reduced file I/O and improved cache key generation
- Docker Compose's env_file directive (referenced in Sail's compose file) reads .env and passes variables to containers, bridging host environment and container context
