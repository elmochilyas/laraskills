# Path Helpers and Environment Detection — Rules

## Rule Name
Always use path helpers instead of hardcoded absolute filesystem paths.
---
## Category
Maintainability
---
## Rule
Use `basePath()`, `storagePath()`, `configPath()`, `appPath()`, and other path helpers rather than hardcoded absolute paths like `/var/www/app/storage`.
---
## Reason
Hardcoded paths break when the application is deployed to a different environment, moved to a different server directory, or packaged in a serverless artifact. Path helpers resolve dynamically from container bindings, supporting runtime override and environment-specific customization.
---
## Bad Example
```php
$logFile = '/var/www/app/storage/logs/laravel.log';
```
---
## Good Example
```php
$logFile = storage_path('logs/laravel.log');
```
---
## Exceptions
Third-party configuration files (e.g., Nginx, Supervisor, cron) that cannot run PHP must use absolute paths.
---
## Consequences Of Violation
Deployment to non-default directories fails silently — logs write to wrong locations, file operations throw, and one-off fixes proliferate across the codebase as each deployment requires path adjustments.

---

## Rule Name
Prefer `runningUnitTests()` over `APP_ENV === 'testing'` for test context detection.
---
## Category
Reliability
---
## Rule
Use `$app->runningUnitTests()` to detect whether code is executing in a PHPUnit/Pest test suite, rather than checking `$app->environment('testing')` directly.
---
## Reason
`runningUnitTests()` checks for PHPUnit-specific environment variables (`PHPUNIT_COMPOSER_INSTALL`, `__PHPUNIT_PHAR__`) in addition to `APP_ENV`. The environment check alone can produce false positives if `APP_ENV` is set to `'testing'` at the system level during normal web requests, or false negatives if `APP_ENV` is not set but PHPUnit is running.
---
## Bad Example
```php
if ($this->app->environment('testing')) {
    // May run during normal web requests if APP_ENV is misconfigured
}
```
---
## Good Example
```php
if ($this->app->runningUnitTests()) {
    // Reliable — checks PHPUnit-specific indicators
}
```
---
## Exceptions
When you need environment-specific behavior that should also apply in non-PHPUnit testing scenarios (e.g., Dusk browser tests without PHPUnit), `environment('testing')` is the appropriate check.
---
## Consequences Of Violation
Test-specific code (mock registrations, disabled mailers) accidentally executes in production if `APP_ENV` is ever set to `'testing'`. Or conversely, test-only bindings are not registered because `environment('testing')` returned `false` despite PHPUnit running.

---

## Rule Name
Never use `app_path()` or other application path helpers in package code.
---
## Category
Architecture
---
## Rule
Use `__DIR__` or package-specific paths in Composer packages, never `app_path()`, `base_path()`, or any application-scoped path helper.
---
## Reason
Path helpers resolve to the host application's directories. A package calling `app_path()` receives the host's `app/` directory, not the package's own directory. This causes incorrect file lookups, class loading failures, and path injection vulnerabilities.
---
## Bad Example
```php
// In vendor/acme/package/src/ServiceProvider.php:
public function boot(): void
{
    $this->loadViewsFrom(app_path('views'), 'acme');
    // Loads from host's app/views, not package's views
}
```
---
## Good Example
```php
public function boot(): void
{
    $this->loadViewsFrom(__DIR__.'/../../resources/views', 'acme');
}
```
---
## Exceptions
Configuration files published by packages may reference `app_path()` because they are intended to be copied into the host application and run in the host's context.
---
## Consequences Of Violation
Package views, translations, or config files not found. Package installs appear to succeed but fail at runtime with missing file errors that are hard to attribute to the package.

---

## Rule Name
Customize application paths early — in a service provider's `register()` method before configuration loads.
---
## Category
Framework Usage
---
## Rule
Call `$app->useStoragePath()`, `$app->useAppPath()`, or other path mutators inside a service provider's `register()` method, before the `LoadConfiguration` bootstrapper runs.
---
## Reason
Config files may reference `storage_path()`, `config_path()`, and other path helpers during the `LoadConfiguration` phase. If you change paths after config files have been read, the cached path values in the config repository diverge from the actual paths, causing I/O operations to target wrong directories.
---
## Bad Example
```php
public function boot(): void
{
    $this->app->useStoragePath('/custom/storage');
    // Too late — config files already read storage_path() during LoadConfiguration
}
```
---
## Good Example
```php
public function register(): void
{
    $this->app->useStoragePath('/custom/storage');
    // In time — LoadConfiguration has not executed yet
}
```
---
## Exceptions
Paths that are not referenced by any config file can be safely customized in `boot()` or any later phase.
---
## Consequences Of Violation
`config('filesystems.disks.local.root')` returns the original path, while `storage_path()` returns the customized path. Logs, cache, and uploaded files target different directories, causing confusion and data loss.

---

## Rule Name
Never use path helpers inside `config/*.php` files when `config:cache` is in use.
---
## Category
Reliability
---
## Rule
Avoid calling `base_path()`, `storage_path()`, `app_path()`, or other dynamic path helpers within configuration files.
---
## Reason
When `php artisan config:cache` runs, configuration files are executed once and the results are serialized. Path helpers resolve at cache-build time, capturing the build environment's absolute paths. When the cached config is loaded in production (or another environment), the captured paths are stale or incorrect.
---
## Bad Example
```php
// config/filesystems.php:
'disks' => [
    'local' => [
        'root' => storage_path('app'), // Captured at cache-build time
    ],
],
```
---
## Good Example
```php
// config/filesystems.php:
'disks' => [
    'local' => [
        'root' => env('LOCAL_STORAGE_PATH', '/tmp/storage'),
    ],
],

// Or use runtime resolution in the service provider:
public function boot(): void
{
    config(['filesystems.disks.local.root' => storage_path('app')]);
}
```
---
## Exceptions
Applications that never run `config:cache` (e.g., local development only) can safely use path helpers in config files.
---
## Consequences Of Violation
Config caching on CI produces paths from the CI environment. Production loads these cached paths, causing file operations to target non-existent or wrong directories. Often missed in local development where `config:cache` is not run.

---

## Rule Name
Always verify `storage_path()` writability before performing filesystem operations.
---
## Category
Reliability
---
## Rule
Call `is_writable(storage_path(...))` before writing files to any path derived from `storage_path()`.
---
## Reason
In serverless deployments (Vapor), containerized environments, or read-only filesystem setups, the storage directory may not be writable. The path helper returns a valid path string, but the directory may be mounted read-only or may not exist at all. Operations fail with unhelpful or confusing errors.
---
## Bad Example
```php
$logFile = storage_path('logs/request.log');
file_put_contents($logFile, $data);
// In Vapor: file_put_contents fails — /tmp/storage/logs/ does not exist
```
---
## Good Example
```php
$logPath = storage_path('logs');
if (! is_dir($logPath) && ! mkdir($logPath, 0755, true) && ! is_dir($logPath)) {
    throw new \RuntimeException("Storage path not writable: {$logPath}");
}
if (! is_writable($logPath)) {
    throw new \RuntimeException("Storage path not writable: {$logPath}");
}
file_put_contents($logPath.'/request.log', $data);
```
---
## Exceptions
Framework-managed operations (Laravel's own log writer, cache store) handle writability checks internally and provide their own error handling.
---
## Consequences Of Violation
Unexpected I/O errors in production. Silent write failures where data is lost without notification. In serverless environments, the application appears to work locally but fails in production with cryptic permissions errors.
