## Use Optimized Autoloader in Every Production Deployment
---
## Performance
---
## Always run `composer install --optimize-autoloader` (or `-o`) in production deployment scripts.
---
## The standard PSR-4 autoloader resolves class files by iterating namespace prefixes and checking filesystem existence — 2-5ms total overhead per request. The optimized classmap replaces this with an O(1) `isset()` array lookup.
---
```bash
composer install --no-dev
# PSR-4 fallback on every class resolution
```
---
```bash
composer install --no-dev --optimize-autoloader
# or equivalently
composer install --no-dev -o
```
---
## Development environments where classes are added frequently and the classmap would require constant regeneration.
---
## 2-5ms avoidable overhead per request; reduced throughput under load.
---
## Regenerate Autoloader After Every Composer Change
---
## Maintainability
---
## Always regenerate the optimized autoloader after any `composer require`, `composer update`, or manual addition of classes to a registered namespace.
---
## The classmap is a snapshot of all classes found at generation time. New packages, updated package versions, or newly added classes are not included in the existing classmap and will not be found by the autoloader.
---
```bash
composer require spatie/laravel-medialibrary
# New package classes not in classmap
```
---
```bash
composer require spatie/laravel-medialibrary
composer dump-autoload -o
```
---
## No common exceptions.
---
## ClassNotFoundException for newly added packages or classes; emergency composer dump-autoload required in production.
---
## Use Authoritative Mode (-a) Only When Classmap Is Complete
---
## Framework Usage
---
## Use `composer dump-autoload -a` (authoritative mode) only when every class in the application is known at build time and no dynamic class generation occurs.
---
## Authoritative mode skips all PSR-4 filesystem fallback checks. If a class is not in the classmap, it fails immediately — no fallback. Dynamic classes (Eloquent factories, IDE helper stubs, generated proxies) will not be found.
---
```bash
composer dump-autoload -a
# Dynamic factory classes cause ClassNotFoundException
```
---
```bash
# Audit for dynamic class generation first
composer dump-autoload -o  # Safe fallback
# Only use -a after confirming no dynamic classes
composer dump-autoload -a
```
---
## Octane deployments where the worker process has a stable class set per lifecycle and dynamic class generation is absent.
---
## ClassNotFoundException errors for dynamically generated classes; entire application or specific features become unavailable.
---
## Combine Optimized Autoloader with OpCache
---
## Performance
---
## Ensure OpCache is enabled in production alongside the optimized Composer autoloader for maximum bootstrap performance.
---
## The autoloader itself (`vendor/autoload.php` and `vendor/composer/autoload_classmap.php`) are PHP files that must be parsed. OpCache caches their compiled opcodes, eliminating re-parsing cost on every request.
---
```bash
composer install -o
# OpCache not configured — autoloader parsed on every request
```
---
```ini
; php.ini
opcache.enable=1
opcache.memory_consumption=256
opcache.validate_timestamps=0
```
```bash
composer install -o
```
---
## No common exceptions.
---
## Autoloader PHP files re-parsed on every request; optimized classmap lookup still pays file compilation cost.
---
## Do Not Use Authoritative Mode in Development
---
## Maintainability
---
## Never use `composer dump-autoload -a` in local development environments.
---
## In development, new classes are added frequently (migrations, factories, tests, livewire components). Authoritative mode requires regenerating the classmap after every new file, creating friction and causing ClassNotFoundException for classes that exist but are not yet in the classmap.
---
```bash
# Running authoritative mode in development
composer dump-autoload -a
```
---
```bash
# In development, use standard PSR-4 or optimized mode
composer dump-autoload -o
```
---
## No common exceptions.
---
## Frequent ClassNotFoundException errors; developer frustration; time wasted running dump-autoload after every file addition.
---
## Consider APCu Autoloader for High-Throughput Applications
---
## Performance
---
## Use Composer's APCu autoloader (`"apcu-autoloader": true` in `composer.json`) for applications requiring maximum autoloader performance.
---
## The APCu autoloader stores the classmap in APCu shared memory, avoiding the need to read and parse `autoload_classmap.php` on every request. This saves ~0.5ms of file I/O per request and is most beneficial for high-throughput or Octane deployments.
---
```json
{
    "config": {
        "optimize-autoloader": true
    }
}
```
---
```json
{
    "config": {
        "optimize-autoloader": true,
        "apcu-autoloader": true
    }
}
```
---
## Environments where the APCu PHP extension is not installed or has memory constraints.
---
## Marginal performance loss (0.5ms per request); acceptable for most applications.
