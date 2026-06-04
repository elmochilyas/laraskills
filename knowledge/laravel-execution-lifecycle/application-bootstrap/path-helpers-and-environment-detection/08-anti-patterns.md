# ECC Anti-Patterns — Path Helpers and Environment Detection

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Application Bootstrap |
| **Knowledge Unit** | Path Helpers and Environment Detection |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Hardcoded Absolute Filesystem Paths
2. Global Environment Override at Runtime
3. Path-Dependent Logic in Config Files
4. Namespace Hardcoding
5. Confusing `runningInConsole()` with `runningUnitTests()`

---

## Repository-Wide Anti-Patterns

- Premature Caching — using `storage_path()` in config files caches the path at build time, not runtime.

---

## Anti-Pattern 1: Hardcoded Absolute Filesystem Paths

### Category
Maintainability

### Description
Using absolute filesystem paths like `/var/www/app/storage` instead of path helpers like `storage_path()`, `base_path()`, or `config_path()`.

### Why It Happens
Developers use quick `pwd` or `echo __DIR__` output to get a path and hardcode it. This works on their machine and is never revisited.

### Warning Signs
- String literals with `/var/`, `/home/`, `/opt/` in application code
- Paths that don't use `base_path()`, `storage_path()`, or `app_path()`
- Deployment scripts that modify paths in PHP files

### Why It Is Harmful
Absolute paths break when deploying to different environments. Code that works in local development fails in CI, staging, or production. Each deployment requires manual path changes.

### Real-World Consequences
An application hardcodes `/home/developer/app/storage/logs` for log file paths. When deployed to a Docker container with a different filesystem layout, logging silently fails because the directory doesn't exist. Critical error logs are lost.

### Preferred Alternative
Always use path helpers: `storage_path()`, `base_path()`, `config_path()`, `app_path()`, `resource_path()`, `public_path()`. These resolve correctly regardless of deployment layout.

### Refactoring Strategy
1. Find all absolute path strings in application code
2. Replace with the appropriate path helper
3. Test in different deployment environments

### Detection Checklist
- [ ] Absolute filesystem paths in application code
- [ ] Path helpers (`storage_path()`, `base_path()`) not used where available
- [ ] Paths break when moving between environments

### Related Rules
Rule 1 (05-rules.md): Never use absolute filesystem paths — always use path helpers.

### Related Skills
Customize Application Paths (06-skills.md).

### Related Decision Trees
Path Resolution Strategy decision (07-decision-trees.md).

---

## Anti-Pattern 2: Global Environment Override at Runtime

### Category
Reliability

### Description
Modifying `$_ENV['APP_ENV']` at runtime to change the behavior of `environment()`, `runningInConsole()`, or `runningUnitTests()`. Environment detection should be set once and remain immutable.

### Why It Happens
Developers temporarily change `APP_ENV` in tests or middleware to trigger environment-specific code paths. They don't realize this creates inconsistent state because other parts of the framework cache the environment value.

### Warning Signs
- `$_ENV['APP_ENV']` modified after bootstrappers run
- `putenv('APP_ENV=...')` called in application code
- `environment('testing')` returns different values at different points in the request

### Why It Is Harmful
The environment is detected early in the lifecycle and cached. Changing it at runtime creates inconsistency — some code reads the original value, some reads the overridden value. Conditional logic behaves unpredictably.

### Real-World Consequences
A middleware sets `$_ENV['APP_ENV'] = 'production'` for a specific route. The config repository, loaded before the middleware runs, still reflects the original environment. Config files that branch on `APP_ENV` use the original value, while other parts of the application use the overridden value. The inconsistency causes a payment gateway to use sandbox keys on a "production" route.

### Preferred Alternative
Use configuration values or dedicated flags for runtime branching instead of mutating the environment. Environment detection is for deployment-level context, not runtime behavior.

### Refactoring Strategy
1. Remove runtime `$_ENV` modifications
2. Replace environment-based branching in runtime code with config values
3. Use dedicated feature flags or database-driven configuration for runtime behavior changes

### Detection Checklist
- [ ] `$_ENV['APP_ENV']` or `putenv('APP_ENV')` modified at runtime
- [ ] `environment()` returns inconsistent values during a single request

### Related Rules
Rule 2 (05-rules.md): Never override environment detection at runtime.

### Related Skills
Detect Environment and Execution Context (06-skills.md).

### Related Decision Trees
Environment Detection Strategy decision (07-decision-trees.md).

---

## Anti-Pattern 3: Path-Dependent Logic in Config Files

### Category
Reliability

### Description
Using `base_path()` or `storage_path()` inside `config/*.php` files. When config caching is enabled, these paths are resolved at cache-build time, not at runtime.

### Why It Happens
Developers need to reference a path in configuration and use path helpers for correctness. They don't realize that `php artisan config:cache` serializes the resolved value, not the expression.

### Warning Signs
- `base_path()`, `storage_path()`, `app_path()` used in `config/*.php`
- After `config:cache`, path values reflect the cache-build environment, not runtime
- Path values break when deploying between environments with caches

### Why It Is Harmful
Cached config serializes path helper calls at build time. If the build server and production server have different directory structures, the cached paths point to the wrong locations.

### Real-World Consequences
A CI server builds the application at `/build/app` and runs `config:cache`. The cached config has `base_path()` resolved to `/build/app`. When deployed to production at `/var/www/app`, the cached paths still point to `/build/app`. All file operations fail.

### Preferred Alternative
Avoid path helpers in config files. If paths must be configurable, use environment variables combined with `env()` in the config file, and ensure the config is regenerated per environment.

### Refactoring Strategy
1. Find path helper calls in config files
2. Replace with environment variables: `'path' => env('LOG_PATH', storage_path('logs'))`
3. Ensure `config:cache` runs per-environment in CI/CD

### Detection Checklist
- [ ] `base_path()` or `storage_path()` used in `config/*.php`
- [ ] Cached config contains wrong paths after deployment

### Related Rules
Rule 3 (05-rules.md): Avoid path helpers in config files — they are resolved at cache-build time.

### Related Skills
Customize Application Paths (06-skills.md).

### Related Decision Trees
Config Cache Build vs Runtime Path Resolution decision (07-decision-trees.md).

---

## Anti-Pattern 4: Namespace Hardcoding

### Category
Maintainability

### Description
Using a hardcoded `App\` namespace instead of `$this->getNamespace()` or `app()->getNamespace()` in code that needs to reference application classes dynamically.

### Why It Happens
Most Laravel applications use `App\` as the root namespace. Developers hardcode it everywhere because it works. When a project changes the namespace, every hardcoded reference breaks.

### Warning Signs
- `App\` prefix hardcoded in Artisan command registration, model factories, or policy resolution
- `getNamespace()` not used where namespace detection is needed
- Renaming the application namespace requires changes in dozens of files

### Why It Is Harmful
Hardcoded namespaces prevent customizing the root namespace via `composer.json` PSR-4 autoload. Changing the application namespace (e.g., to `AcmeCorp\`) becomes a massive refactoring effort.

### Real-World Consequences
A company rebrands and changes the application namespace from `App\` to `CompanyName\`. Every Artisan command, policy registration, and factory that hardcodes `App\` must be updated. The team misses one, and the application silently fails to register a critical command.

### Preferred Alternative
Use `$this->getNamespace()` in service providers and `app()->getNamespace()` in other contexts. This dynamically detects the namespace from `composer.json` PSR-4 mapping.

### Refactoring Strategy
1. Find hardcoded `App\` namespace prefixes
2. Replace with `$this->getNamespace()` in providers, `app()->getNamespace()` elsewhere
3. Test namespace detection with a different PSR-4 prefix

### Detection Checklist
- [ ] `App\` hardcoded in service provider code
- [ ] Artisan commands registered with hardcoded namespace
- [ ] Policy resolution uses hardcoded namespace
- [ ] `getNamespace()` not used where available

### Related Rules
Rule 4 (05-rules.md): Use `getNamespace()` for dynamic namespace detection — never hardcode `App\`.

### Related Skills
Detect Environment and Execution Context (06-skills.md).

### Related Decision Trees
Namespace Detection Strategy decision (07-decision-trees.md).

---

## Anti-Pattern 5: Confusing `runningInConsole()` with `runningUnitTests()`

### Category
Reliability

### Description
Using `runningInConsole()` when `runningUnitTests()` is the correct check, or vice versa. The two methods detect different contexts and are not interchangeable.

### Why It Happens
Developers see both methods as "not HTTP" and use `runningInConsole()` as a catch-all. They don't realize Artisan commands and PHPUnit runs are both "console" contexts.

### Warning Signs
- `runningInConsole()` used to guard test-specific behavior
- `runningUnitTests()` used to guard command-specific registration
- Code breaks when running tests via `php artisan test` vs `./vendor/bin/phpunit`

### Why It Is Harmful
`runningInConsole()` returns true for both Artisan commands and PHPUnit tests. Using it where `runningUnitTests()` is needed causes test-specific setup to run during Artisan command execution, potentially corrupting command state.

### Real-World Consequences
A developer uses `if ($this->app->runningInConsole())` to register test-specific routes. These routes are available during Artisan command execution, allowing unintended access to test endpoints. A malicious command input could trigger test-specific actions in production.

### Preferred Alternative
Use `runningUnitTests()` for test-specific behavior and `runningInConsole()` for command/CLI-specific behavior. They serve different purposes and are not interchangeable.

### Refactoring Strategy
1. Find all `runningInConsole()` usage
2. Separate into `runningInConsole()` for CLI-specific and `runningUnitTests()` for test-specific
3. Update guard logic accordingly

### Detection Checklist
- [ ] `runningInConsole()` used where test-specific behavior is needed
- [ ] `runningUnitTests()` used where CLI-specific behavior is needed
- [ ] Code behaves differently under `php artisan test` vs `./vendor/bin/phpunit`

### Related Rules
Rule 5 (05-rules.md): Use `runningUnitTests()` for test-specific logic and `runningInConsole()` for CLI-specific logic — they are not interchangeable.

### Related Skills
Detect Environment and Execution Context (06-skills.md).

### Related Decision Trees
Environment Detection Method Selection decision (07-decision-trees.md).
