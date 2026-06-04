# ECC Anti-Patterns — Configuration Management

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Application Architecture & Structure |
| **Knowledge Unit** | Configuration Management |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. `env()` Outside Config Files (Production-Only Bugs)
2. Hardcoded Secrets in Config Files
3. Config as Feature Flag Store (Freezing Runtime Toggles)
4. Runtime Config Mutability (`Config::set()` Production)

---

## Repository-Wide Anti-Patterns

- Config File Environment Overengineering (complex conditionals based on `app()->environment()`)
- Missing `env()` Default Values (null without fallback)

---

## Anti-Pattern 1: `env()` Outside Config Files

### Category
Framework Usage | Reliability

### Description
Calling `env('APP_DEBUG')` directly in controllers, services, or Blade views instead of `config('app.debug')`.

### Why It Happens
The helper is globally available and convenient. The developer tested in development (no config cache) where it always works.

### Warning Signs
- `env(` found outside `config/` directory
- Application works in development but certain features misbehave in production
- After `config:cache`, checks like `env('APP_DEBUG')` always return `null`
- PHPStan/Psalm rule for `env()` enforcement is absent

### Why It Is Harmful
After `php artisan config:cache`, `env()` calls in config files are resolved and frozen. `env()` in application code reads from `$_ENV`, which returns `null` because the environment file is no longer loaded. This creates silent production-only bugs that are impossible to reproduce locally.

### Real-World Consequences
- `env('STRIPE_KEY')` returns `null` in production → payment failures
- `env('APP_DEBUG')` returns `null` → error pages always disabled
- `env('DB_HOST')` returns `null` → mysterious connection errors
- Bug is untestable in development because `config:cache` is not run

### Detection Checklist
- [ ] Search entire codebase for `env(` excluding `config/` directory
- [ ] Check Blade templates (`resources/views/`)
- [ ] Check routes files (`routes/`)
- [ ] Add PHPStan/Psalm rule banning `env()` outside config

### Refactoring Strategy
1. Search codebase for `env(` in non-config files
2. For each occurrence, identify the correct config key
3. If the config file doesn't define the key, add it
4. Replace `env('KEY', default)` with `config('file.key', default)`
5. Run `config:cache` to verify

### Code Example (Bad)
```php
// In a controller
if (env('APP_DEBUG')) { /* works in dev, broken in prod */ }
```

### Code Example (Good)
```php
// config/app.php
'debug' => env('APP_DEBUG', false),

// In a controller
if (config('app.debug')) { /* works everywhere */ }
```

### Related Rules
- Rule: Use env() Only in Config Files
- Rule: Always Provide Default Values for env() Calls

---

## Anti-Pattern 2: Hardcoded Secrets in Config Files

### Category
Security

### Description
Writing literal API keys, passwords, or tokens in `config/*.php` files and committing them to version control.

### Why It Happens
It's easier during development. The developer plans to "fix it later."

### Warning Signs
- Config files contain `'secret' => 'sk_live_abc'` instead of `'secret' => env('SECRET')`
- Secrets visible in git history
- Secrets exposed in CI logs, pull request diffs, or repository forks

### Why It Is Harmful
Config files are committed to version control. Secrets become accessible to everyone with repository access, exposed in CI logs, and impossible to rotate without code changes.

### Refactoring Strategy
1. Rotate the compromised secrets immediately
2. Replace hardcoded values with `env('SECRET_NAME')`
3. Add the secrets to `.env` and server environment configuration
4. Verify `.env` is in `.gitignore`
5. Run `config:cache` to confirm

### Related Rules
- Rule: Never Hardcode Secrets in Config Files
- Rule: Always Provide Default Values for env() Calls

---

## Anti-Pattern 3: Config as Feature Flag Store

### Category
Architecture

### Description
Storing frequently toggled feature flags in config files or environment variables, requiring a full deployment to change them.

### Why It Happens
Config files are the easiest place to store flags. Developers don't consider the toggle lifecycle.

### Warning Signs
- Feature flags defined exclusively in `config/` files
- Every feature toggle requires a deployment
- Emergency rollback of a feature requires a new deploy
- `env('FEATURE_NEW_CHECKOUT')` used with plans to toggle mid-cycle

### Why It Is Harmful
Config caching freezes values at cache generation time. Changing a config-backed flag requires code change + deploy + cache rebuild. Runtime toggleable flags need a dedicated system.

### Refactoring Strategy
1. Identify flags that are toggled mid-cycle or used for emergency rollback
2. Migrate to a database-backed or cache-backed feature flag system
3. Keep deployment-gated flags (enabled/disabled per release) in config files

### Related Rules
- Rule: Never Use Configuration for Runtime Feature Flags

---

## Anti-Pattern 4: Runtime Config Mutability

### Category
Maintainability

### Description
Using `Config::set()` or `config(['key' => 'value'])` to modify configuration during request execution in production code.

### Why It Happens
Developers use config mutation as a quick way to pass state between components, treating config as a global variable.

### Warning Signs
- `Config::set()` or `config([...])` with array input in controllers, services, or middleware
- Same config key read at different points in the request returns different values
- Debugging sessions where config values don't match file contents

### Why It Is Harmful
Runtime config mutations are not persisted, create non-deterministic behavior (value at request start differs from value at request end), and make the application's behavior impossible to reason about.

### Refactoring Strategy
Replace `Config::set()` with explicit dependency injection or context objects passed through the call chain.

### Related Rules
- Rule: Avoid Runtime Config Mutability
