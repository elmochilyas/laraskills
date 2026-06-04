# Laravel Configuration Management

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Application Architecture & Structure
- **Knowledge Unit:** Laravel Configuration Management
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Laravel's configuration management system provides a layered access pattern: `.env` files supply environment-specific values, `config/*.php` files organize those values into logical groups, and the `Illuminate\Config\Repository` provides application-wide access via the `config()` helper and `Config` facade. The system's critical architectural property is the distinction between **environment variables** (source values, loaded at bootstrap) and **configuration values** (cached, compiled, and optimized at deployment time).

The single most important engineering decision in Laravel configuration management is the env() vs config() distinction. `env()` reads directly from environment variables and is never cached. `config()` reads from the `Config\Repository`, which IS cached when `php artisan config:cache` is executed. Using `env()` outside of config files creates deployment traps where stale or missing environment variables cause production failures that development environments never experience.

Configuration caching transforms the deployment behavior of a Laravel application. Before caching, every config value can be changed by modifying the `.env` file or environment variables. After caching, the entire configuration is frozen as a PHP array in `bootstrap/cache/config.php`. Environment variable changes have no effect until the cache is cleared and regenerated. This is a deliberate performance optimization that introduces a operational workflow requirement: config changes require a cache rebuild as part of the deployment process.

---

## Core Concepts

### Config Repository
`Illuminate\Config\Repository` is the central configuration storage. It wraps a simple associative array (`$items`) and provides dot-notation access. When `config('app.name')` is called, the repository resolves `['app']['name']` from the `$items` array. The repository supports:
- **get()** — retrieve a value by dot key, with optional default
- **set()** — set a value at a dot key path
- **has()** — check if a key exists
- **all()** — return the entire configuration array
- **push()**/ **prepend()** — modify array configuration values

The repository is a registered singleton in the container at `$app['config']`. All config access throughout the framework resolves to this single instance.

### Environment File Loading
The `Dotenv` component (`vlucas/phpdotenv`) loads `.env` files during the `LoadEnvironmentVariables` bootstrap step. The loading order:
1. Load `.env` from the project root
2. If `.env.local` exists, override with its values (used for local machine-specific overrides)
3. If `.env.{APP_ENV}` exists (e.g., `.env.production`, `.env.testing`), override with its values
4. If `.env.{APP_ENV}.local` exists, override with its values (local overrides for a specific environment)

This cascading load allows environment-specific configuration without modifying the base `.env` file. The `.env` file should be committed to version control with safe defaults. Override files should be in `.gitignore`.

### config/app.php Providers Array
The `providers` array in `config/app.php` is read during the `RegisterProviders` bootstrap step. This is a critical config value — it determines which service providers are loaded, which in turn determines which services are available. Modifying this array changes the application's entire service composition.

### Config Caching
`php artisan config:cache` merges all `config/*.php` files into a single PHP array and writes it to `bootstrap/cache/config.php`. The cached file:
- Contains ALL configuration values resolved at cache time
- Is included as a single file during the `LoadConfiguration` bootstrap step
- Bypasses individual file reading for every config file
- Eliminates `env()` calls (they are resolved at cache time and replaced with literal values)

After caching, `env()` calls in config files return the value they had at cache time. In application code, `env()` still reads from the environment directly.

### env() vs config() Distinction

| Aspect | `env()` | `config()` |
|--------|---------|------------|
| Source | `$_ENV`, `$_SERVER`, `getenv()` | Config repository array |
| Cache behavior | Never cached (reads live env) | Reads from cached array when cache exists |
| Scope | Global (any env variable) | Scoped to config namespaces |
| Recommended usage | Only inside config files | Everywhere else |
| Performance | Fast (direct variable read) | Fast (array lookup, potentially cached) |

The rule: use `env()` ONLY in `config/*.php` files. Use `config()` everywhere else. This ensures that config caching captures all environment-dependent values.

---

## Mental Models

### Configuration as Contract
Config files are contracts between the application and its environment. `config/database.php` declares "I need a database connection with host, port, database name, username, and password." The environment fulfills this contract via `.env`. If any required value is missing, the contract is breached and the application fails at the point where the value is accessed.

This contract view explains why validation of required configuration is important: catching a breach at deploy time (via `php artisan config:cache`) is better than catching it at request time (via `env()` returning null).

### Frozen Snapshot vs Live Variables
The config cache creates a frozen snapshot of all configuration values at cache time. Environment variables are live — they can change between requests (if the server modifies them). The distinction is analogous to compile-time constants vs runtime variables. Config caching "compiles" environment values into static arrays, sacrificing runtime responsiveness to config changes for deployment-time performance.

### Configuration as Tuplespace
The config repository is a tuple space — a shared, associative memory accessed by dot-notation keys. Any service can read any tuple at any time. This is powerful (no hierarchy needed for access) but creates invisible coupling. A service that reads `config('services.stripe.key')` is coupled to the structure of the `services.php` config file, even if that coupling is not declared in the service's interface.

---

## Internal Mechanics

### Config File Loading (Uncached)

```
LoadConfiguration::bootstrap($app)
  ├── $configPath = $app->configPath()           // default: project-root/config/
  ├── $repository = new Repository()             // fresh repository
  ├── $this->loadConfigurationFiles($app, $repository)
  │     ├── $files = glob($configPath . '/*.php')
  │     ├── sort($files)                         // alphabetical by filename
  │     ├── foreach $file:
  │     │     ├── $key = basename($file, '.php')    // e.g., 'app' from 'app.php'
  │     │     ├── $config = require $file            // returns array from config file
  │     │     └── $repository->set($key, $config)    // stores under dot key
  │     └── // Environment-specific overrides
  │         foreach $app->environment() specific directories:
  │             $repository->set($key, array_merge($repository->get($key), $envConfig))
  └── $app->instance('config', $repository)
```

Each config file returns a PHP array. The filename becomes the top-level key. `config/app.php` → `$config['app']`. `config/database.php` → `$config['database']`. The files are loaded alphabetically by filename.

### Config Cache Loading

```
LoadConfiguration::bootstrap($app) [cached path]
  ├── if file_exists($cachedPath = $app->getCachedConfigPath()):
  │     ├── $config = require $cachedPath     // bootstrap/cache/config.php
  │     ├── $repository = new Repository($config)  // pre-populated
  │     └── $app->instance('config', $repository)
  └── else: fall through to uncached loading
```

The cached config file is a single `<?php return ['app' => [...], 'database' => [...], ...];` statement. Loading it is a single `require` and array assignment — no `glob()`, no file iteration, no `env()` resolution at load time.

### Config Cache Generation

The `Illuminate\Foundation\Console\ConfigCacheCommand`:
1. Creates a fresh Application instance
2. Forces the Application to not use cached config (to avoid double-cache)
3. Loads all config files normally (reads each `config/*.php` file)
4. During file loading, `env()` IS called in each config file — the values are resolved
5. The resulting `Repository::all()` array is serialized to `bootstrap/cache/config.php`:
   - `config.php` content: `<?php return ' . $repository->all() . ';`
6. The serialized array is optimized for fast `require`

The key implication: after config caching, `env()` calls in config files return the values they had at cache generation time, not at request time.

### DotEnv Loading Internals

The `Dotenv` library:
1. Reads the `.env` file line by line
2. Parses key=value pairs, handling quoted strings, multiline values, comments
3. Calls `putenv("KEY=value")` to set the value
4. Sets `$_ENV['KEY'] = 'value'`
5. Sets `$_SERVER['KEY'] = 'value'`
6. Handles variable interpolation (`${VAR_NAME}` syntax)
7. Supports exports (`export KEY=value`)
8. Handles nested variable expansion

The library does NOT affect `$_SERVER` or `getenv()` on some configurations, which is why `env()` in Laravel checks multiple sources in order: `$_ENV`, `$_SERVER`, `getenv()`.

### Config Repository Dot Notation Resolution

`$config->get('database.connections.mysql.host')`:
1. Split key by `.` → `['database', 'connections', 'mysql', 'host']`
2. Walk the `$items` array: `$items['database']['connections']['mysql']['host']`
3. If any key in the path does not exist, return the default value
4. If a non-array value is encountered before the path ends, return the default

This means dot notation cannot distinguish between `config('database')` (top-level) and `config('database.nonexistent')` (returns default, same as `config('database')`). Both return the entire `database` array.

---

## Patterns

### Config File as Normalizer Pattern
Each config file normalizes environment variables into typed, validated configuration values. The config file is the single location where `env()` is called:

```
// config/services.php
return [
    'stripe' => [
        'key' => env('STRIPE_KEY'),
        'secret' => env('STRIPE_SECRET'),
    ],
];
```

This pattern ensures that:
- All environment variable usage is centralized in one location per config file
- Type coercion happens in one place (`env('APP_DEBUG', false)` returns boolean)
- Config caching freezes all values correctly
- Changing a variable name requires editing only one file

### Environment File Cascade Pattern
Multiple `.env` files override in sequence:
1. `.env` — base defaults, committed to version control
2. `.env.local` — local machine overrides, NOT committed
3. `.env.production` — production-specific defaults, committed
4. `.env.production.local` — production machine overrides, NOT committed

This cascade allows team members to have different local overrides without affecting each other's environments, while maintaining a single source of truth in the base `.env` file.

### Config Validation Pattern
At the end of a config file, validate required values:

```
// config/services.php
$stripeKey = env('STRIPE_KEY');
if (empty($stripeKey) && app()->environment('production')) {
    throw new RuntimeException('STRIPE_KEY is not configured');
}
return [
    'stripe' => [
        'key' => $stripeKey,
    ],
];
```

This catches missing required configuration early (during config loading or caching) rather than at runtime when a service is first used.

### Runtime Config Override Pattern
For testing, configuration can be temporarily overridden:
- `Config::set('app.debug', true)` in a service provider's `boot()`
- `$this->app['config']['app.debug'] = true`
- `config(['app.debug' => true])` via the helper

This should be used sparingly and never in production at runtime. Runtime config overrides are not persisted and are lost when the cache is regenerated. Their primary use case is testing environment simulation.

---

## Architectural Decisions

### Why Config is Loaded Before Providers
Configuration must be available before service providers register because:
1. The `providers` array is in `config/app.php` — providers need it to know what to register
2. Many providers read config values to determine their behavior during `register()` and `boot()`
3. The `app.env` value is needed early to conditionally load environment-specific config

The bootstrap ordering (environment → config → providers) reflects this dependency chain.

### Why Config Caching Exists
PHP applications boot from scratch on every request. Without caching, every request reads and parses 20-30 config files. Config caching reduces this to a single file include. The performance gain is 5-15ms per request for typical applications. The cost is operational complexity — developers must remember to re-cache after config changes.

### Why env() is Not Cached in Application Code
`env()` reads directly from PHP environment, which is fast but uncacheable. If `env()` were cached, stale environment values would persist across requests, creating security risks (e.g., a database password change would not be picked up until cache refresh). The decision to freeze vs passthrough is: config files freeze (for performance), application code passes through (for safety).

### Why Config is a Singleton
The config repository is registered as a container singleton (`$app->instance('config', $repository)`) because:
1. All parts of the application must see the same configuration values
2. The repository is read-mostly (written only during initialization and testing)
3. A single array is more memory-efficient than multiple copies

---

## Tradeoffs

### Config Caching vs Deployment Flexibility
Cached config is 5-15ms faster per request but requires a deployment step to change any configuration value. For applications deployed multiple times per day, the cache-rebuild step is routine. For applications with frequently changing configuration (A/B testing, feature flags, dynamic throttling), cached config is a liability — every config change requires a full deployment.

| Aspect | Cached | Uncached |
|--------|--------|----------|
| Performance | Fast (single file include) | Slower (20+ file reads per request) |
| Config change without deploy | Impossible | Possible (edit .env, restart PHP-FPM) |
| Complexity | Need cache clear/rebuild workflow | No cache management |
| Runtime env compatibility | Frozen at cache time | Live environment variables |

### env() in Application Code vs Config Files
Using `env()` directly in application code (in controllers, services, or views) bypasses the config repository. When config is cached, these calls still read from the live environment, creating an inconsistency between cached config values and live env values. The rule "env() only in config files" exists to prevent this inconsistency.

### Single Config File vs Many
Consolidating all configuration into fewer files reduces file count but increases file size and cognitive load per file. Separation by concern (`app.php`, `database.php`, `services.php`, `mail.php`) follows the principle of single responsibility — each config file governs one area of the application. The tradeoff is organization vs simplicity.

### Environment Variable Prefixing
Some teams prefix environment variables by concern (`DB_HOST`, `REDIS_HOST`, `MAIL_HOST` vs `HOST`). Prefixing prevents collisions and makes the source of each value clear but increases variable name length. The convention in Laravel is prefix-free for commonly used variables (`APP_ENV`, `APP_DEBUG`, `APP_KEY`) and prefix-consistent for service-specific variables (`DB_*`, `MAIL_*`, `SESSION_*`).

---

## Performance Considerations

### Uncached Config Loading Cost
Without caching, each `config/*.php` file requires:
1. `glob()` scan of the config directory
2. Filesystem stat for each file
3. PHP `require` (file read + parse + execution)
4. Array merge operations

For a typical application with 25 config files, this adds 3-8ms per request. The cost scales linearly with file count.

### Cached Config Loading Cost
With caching, the cost is:
1. Single `require` of `bootstrap/cache/config.php`
2. Array assignment to repository

This adds <0.5ms per request regardless of config file count.

### Config Cache Miss
If `bootstrap/cache/config.php` does not exist (fresh deployment before cache generation, cache cleared for debugging), the application falls back to uncached loading silently. There is no error or warning. This means an accidental cache deletion causes a performance regression without any observable failure. Production monitoring should track bootstrap time to detect silent cache misses.

### env() Performance
`env()` calls in application code resolve through the `Env` helper class, which checks three sources in order: `$_ENV`, `$_SERVER`, `getenv()`. Each call is approximately 0.001ms. Not a performance concern individually, but 50+ `env()` calls per request accumulate to measurable overhead. The `config()` helper is similarly fast (single array lookup). The performance difference between `env()` and `config()` is negligible for most applications.

---

## Production Considerations

### Config Cache Deployment Sequence
Every deployment that changes configuration must include:
1. `php artisan config:clear` — remove old cached config
2. Verify `.env` file exists with correct values
3. `php artisan config:cache` — generate new cached config
4. Verify `bootstrap/cache/config.php` was created
5. Warm application (make a request to compile caches)

If step 3 fails (syntax error in config file, missing env value), the application falls back to uncached loading, causing a performance regression but no functional failure.

### Environment Variable Security
Environment variables are accessible to:
- Any PHP process running on the server
- Any user who can execute `php artisan tinker` on the server
- The `phpinfo()` output if displayed publicly
- Error backtraces that reveal environment values

Production servers should:
- Restrict access to environment variables to only the web server user
- Never display `phpinfo()` publicly
- Never commit `.env` files with production credentials to version control
- Use secret management services (AWS Secrets Manager, Vault) for sensitive values

### Multi-Environment Configuration
For applications deployed to multiple environments (development, staging, production), the recommended setup:
- **Development:** `.env` with local values, no config cache (for rapid iteration)
- **Staging:** `.env.staging` + config cache (for realistic performance testing)
- **Production:** `.env` (server-level env vars preferred) + config cache

Each environment should have its own `.env` file or server-level environment variables. The `APP_ENV` variable determines which environment-specific config overrides apply.

### Config Validation at Deploy Time
Add a deploy-time validation step that verifies all required configuration values are present:
```
php artisan config:cache || { echo "Config validation failed"; exit 1; }
```

If `config:cache` fails due to a missing `env()` value or PHP error, the deploy script should abort before serving traffic with broken configuration.

---

## Common Mistakes

### Using env() Outside Config Files
The most common configuration mistake. Calling `env('APP_DEBUG')` directly in a controller, service, or blade view. This works in development (where config is not cached) but fails unpredictably in production when `config:cache` has been run. After caching, `env()` still reads from the live environment, but config values are frozen. The two sources diverge, and application behavior becomes inconsistent.

**Correct:** Use `config('app.debug')` in application code.

### Calling env() in Config Files After Cache
`env('VARIABLE')` is called at cache generation time and the value is frozen in the cached array. After caching, the cached value is used, not the live environment. If the application has code that modifies `$_ENV` at runtime (e.g., a middleware that changes DB credentials), those changes won't affect the cached config values.

### Not Publishing Package Configs
Third-party packages often require `php artisan vendor:publish --tag=config` to copy their config files into the application's `config/` directory. Without this step, the package's configuration is not available at `config/packagename.php` and the application uses the package's default configuration silently.

### Forgetting to Clear Config Cache After Changes
A developer changes `config/app.php` locally but the config cache still exists from a previous `php artisan config:cache` run. The change has no effect because the old cached version is loaded. Always clear the cache with `php artisan config:clear` and regenerate with `php artisan config:cache` after meaningful config changes.

### Storing Secrets in Config Files
Hardcoding API keys, database passwords, or secret tokens directly in `config/*.php` files and committing them to version control. Config files are application code, not secrets management. Secrets belong in `.env` (which should be in `.gitignore`) or server-level environment variables.

### Config File Environment Overengineering
Creating complex conditional logic in config files based on `app()->environment()`, resulting in different config behavior in development vs production. This makes production behavior impossible to reproduce locally and introduces environment-specific bugs. Config values should be determined by environment variables, not by the application detecting its environment.

---

## Failure Modes

### Config Cache Generation Failure
If a config file has a PHP syntax error or throws an exception during `require`, `php artisan config:cache` fails with a PHP error message. The application continues to run with uncached config (performance impact) but does not crash. The specific error message identifies the problematic config file.

### Missing Required Environment Variable
`env('DATABASE_URL')` returns `null` if `DATABASE_URL` is not set. If the config file doesn't provide a default or validate the value, the application accesses `null` where it expects a string, causing a type error or failed connection. This is most dangerous for database credentials — a missing password causes a PDO connection failure with a sometimes-unhelpful error message.

### Stale Config Cache After Composer Update
A Composer update adds or updates a package with new configuration keys. The cached config file doesn't include these new keys because it was generated before the update. The package may fail because its config values are missing from the frozen cache. Solution: always regenerate config cache after `composer install` or `composer update`.

### Config Cache Permission Error
The web server cannot write to `bootstrap/cache/` during `php artisan config:cache` (typically run via CLI). The CLI user and web server user may differ. The solution is to ensure `bootstrap/cache/` is writable by both users, or to run cache commands as the web server user.

### Multiple Processes Writing Cache Simultaneously
In a deployment with multiple application servers, two servers may attempt to write `bootstrap/cache/config.php` simultaneously. PHP's file write is not atomic for large arrays. The result is a corrupted cache file. Mitigation: use a deployment orchestration tool that sequences cache generation on a single server and synchronizes the result across servers.

---

## Ecosystem Usage

### First-Party Package Configuration
Laravel first-party packages follow a consistent config pattern:
- Each package has a `config/packagename.php` file in the package source
- `php artisan vendor:publish --provider="PackageProvider" --tag="config"` copies it to `config/packagename.php`
- The published config file is documented and uses `env()` for environment-specific values
- The base config file in the package provides sensible defaults

### Debugbar Configuration
Laravel Debugbar's `config/debugbar.php` demonstrates advanced configuration patterns: conditional enabling based on environment, collectors that can be individually enabled/disabled, and JavaScript renderer configuration. It uses `env()` for all environment-sensitive values and provides granular defaults.

### Horizon Configuration
Laravel Horizon's `config/horizon.php` includes environment-based worker configuration. It uses `env('REDIS_HOST')` patterns and demonstrates how to configure multiple queue worker environments within a single config file.

### Spatie Packages
Spatie packages follow a consistent config pattern:
- One config file per package, published via `vendor:publish`
- All config values have sensible defaults via `env()` fallbacks
- Config files are extensively documented with inline comments
- Example: `spatie/laravel-medialibrary` has `config/media-library.php` with 30+ configuration options for disk, path generation, image optimization, and responsive images

---

## Related Knowledge Units

- **Bootstrapping Lifecycle** — The `LoadConfiguration` bootstrap step is the entry point for configuration loading
- **Service Provider Strategies** — How providers interact with the config repository during registration
- **Directory Conventions** — The purpose and organization of the `config/` directory
- **Service Container Basics** — How `$app['config']` is registered as a container singleton
- **Application Localization** — How locale configuration interacts with environment detection

---

## Research Notes

### Source Analysis
- `Illuminate\Config\Repository` — the `$items` array, dot notation resolution
- `Illuminate\Foundation\Bootstrap\LoadConfiguration` — cached vs uncached loading paths
- `Illuminate\Foundation\Console\ConfigCacheCommand` — cache generation implementation
- `vlucas/phpdotenv` — environment file parsing and loading
- Default `config/app.php`, `config/database.php`, `config/cache.php` files — structural patterns

### Key Insight
The most frequently reported production configuration issue in Laravel applications is the `env()`-after-cache problem. Developers use `env()` in service providers or application code, the call works in development (no config cache), and fails silently in production (returns `null` because the env variable is no longer read after cache). This is rarely caught by testing because testing environments typically don't run with `config:cache`.

### Version-Specific Notes
- Laravel 11+ loads environment-specific config overrides from `config/{env}/` directories if they exist
- The config caching behavior is unchanged across Laravel 10-13
- `env()` behavior is consistent across all versions — the only variable is whether config:cache has been run
- `app()->environment()` detection logic is unchanged and reads from the bootstrapped config or `$_ENV` fallback
