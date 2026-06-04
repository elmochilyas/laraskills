# Console vs HTTP Boot Differences Rules

## Rule 1: Guard Console-Specific Provider Registration
---
## Category
Code Organization
---
## Rule
Use `$this->app->runningInConsole()` to register CLI-only service providers conditionally.
---
## Reason
The Console kernel does not use middleware, session, or auth. Services that depend on middleware-provided state should not be registered in console context. Conditional registration avoids unnecessary bootstrap overhead and prevents runtime errors in CLI commands.
---
## Bad Example
```php
public function register()
{
    // Always registers — fails in console if SessionServiceProvider not deferred
    $this->app->register(SessionServiceProvider::class);
}
```
---
## Good Example
```php
public function register()
{
    if ($this->app->runningInConsole()) {
        $this->app->register(ConsoleServiceProvider::class);
    }
}
```
---
## Exceptions
Providers that register Artisan commands — these must always be registered regardless of context.
---
## Consequences Of Violation
Runtime errors in console commands when they resolve services that depend on middleware. Unnecessary memory and CPU usage loading HTTP-specific services in CLI.
---

## Rule 2: Never Depend on Middleware State in Console Commands
---
## Category
Reliability
---
## Rule
Never access session, auth, CSRF token, or any middleware-provided state inside an Artisan command's `handle()` method.
---
## Reason
The Console kernel has no middleware pipeline. Session, auth guard, CSRF protection, and other request-scoped services are not available. Console commands must use command arguments, options, and direct container resolution for input.
---
## Bad Example
```php
public function handle()
{
    $user = auth()->user(); // Null — no auth middleware in console
    $this->info("Hello, {$user->name}");
}
```
---
## Good Example
```php
public function handle()
{
    $userId = $this->argument('user_id');
    $user = User::findOrFail($userId);
    $this->info("Hello, {$user->name}");
}
```
---
## Exceptions
Commands that explicitly bootstrap HTTP context via `$this->call()` or internal HTTP requests.
---
## Consequences Of Violation
Null reference errors when accessing auth or session. Silent failures when middleware-dependent code returns unexpected values.
---

## Rule 3: Test Console Commands in CI Separately from HTTP Tests
---
## Category
Testing
---
## Rule
Run Artisan command tests as a separate test suite or test run in CI, distinct from HTTP feature tests.
---
## Reason
Code that works in HTTP context may fail in CLI due to missing middleware, different bootstrapper order, or missing `RegisterFacades` bootstrapper. CI must catch console-specific failures before deployment.
---
## Bad Example
```php
// Only HTTP feature tests in CI
// php artisan test --testsuite=Feature
// No dedicated console command tests
```
---
## Good Example
```php
// CI pipeline runs both
// php artisan test --testsuite=Feature
// php artisan test --testsuite=Command
```
---
## Exceptions
Small applications where every command is also tested via `$this->artisan()` in feature tests.
---
## Consequences Of Violation
Console commands that work locally (where facades may be available) fail in production CLI deployments. Scheduler commands silently fail.
---

## Rule 4: Use withoutOverlapping() for Scheduled Commands
---
## Category
Reliability
---
## Rule
Apply `->withoutOverlapping()` to scheduled commands that run more frequently than their execution time.
---
## Reason
Each scheduled command boots the full application. Without `withoutOverlapping()`, a long-running command that starts again before finishing will spawn parallel processes, all booting the application simultaneously. This wastes server resources and can cause data races.
---
## Bad Example
```php
$schedule->command('reports:generate')->everyMinute();
// If reports:generate takes 90 seconds, overlapping instances pile up
```
---
## Good Example
```php
$schedule->command('reports:generate')->everyMinute()->withoutOverlapping();
// Blocks new instances while previous is still running
```
---
## Exceptions
Commands designed to run in parallel (e.g., queue workers, independent data imports).
---
## Consequences Of Violation
Multiple overlapping command instances exhaust server memory. Database deadlocks or duplicated processing when commands write to the same tables.
---

## Rule 5: Handle Maintenance Mode in Console Commands
---
## Category
Security
---
## Rule
Check `app()->isDownForMaintenance()` explicitly in console commands that should not run when the application is in maintenance mode.
---
## Reason
Console commands ignore maintenance mode by default. Commands that send user notifications, process payments, or modify production data may run during maintenance when they should be paused.
---
## Bad Example
```php
public function handle()
{
    // Processes billing during maintenance — sends invoices on a downed site
    BillingService::processInvoices();
}
```
---
## Good Example
```php
public function handle()
{
    if (app()->isDownForMaintenance()) {
        $this->warn('Application is in maintenance mode. Skipping.');
        return Command::SUCCESS;
    }
    BillingService::processInvoices();
}
```
---
## Exceptions
Maintenance commands specifically designed to run during downed state (e.g., `up`, `down`, cache clear).
---
## Consequences Of Violation
Billing or notification emails sent during maintenance, confusing users. State changes when the application is in an inconsistent state.
---

## Rule 6: Use runningInConsole() for Context-Aware Logic, Not Business Decisions
---
## Category
Architecture
---
## Rule
Limit `app()->runningInConsole()` usage to service provider registration and bootstrap concerns. Never use it for business logic decisions.
---
## Reason
Using kernel context for business decisions couples domain logic to execution environment. The same business operation should behave identically whether triggered via HTTP or CLI. Use dependency injection with different implementations instead.
---
## Bad Example
```php
class OrderProcessor
{
    public function process(Order $order)
    {
        if (app()->runningInConsole()) {
            // Different business logic in CLI
            $this->processWithoutNotifications($order);
        } else {
            $this->processWithNotifications($order);
        }
    }
}
```
---
## Good Example
```php
class OrderProcessor
{
    public function __construct(
        private NotificationService $notifier
    ) {}

    public function process(Order $order): void
    {
        // Same logic regardless of context
        $this->validate($order);
        $this->charge($order);
        $this->notifier->send($order);
    }
}
```
---
## Exceptions
Provider registration decisions where HTTP-only vs CLI-only services must be conditionally registered.
---
## Consequences Of Violation
Inconsistent business behavior between HTTP and CLI. Untestable code paths. Logic that is hard to change because context checks are scattered throughout the codebase.
