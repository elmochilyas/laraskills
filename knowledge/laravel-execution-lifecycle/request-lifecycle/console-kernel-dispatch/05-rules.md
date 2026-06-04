# Console Kernel Dispatch Rules

## Rule: Return Integer Exit Codes From Commands
---
## Category
Framework Usage
---
## Rule
Always return `Command::SUCCESS` (0) or `Command::FAILURE` (1) from the `handle()` method of every Artisan command.
---
## Reason
The scheduler uses exit codes to determine if a command succeeded or failed. Returning strings or Response objects produces incorrect exit codes, causing scheduler mutexes to never release and deployment scripts to misinterpret results.
---
## Bad Example
```php
public function handle()
{
    $this->info('Done');
}
```
---
## Good Example
```php
public function handle(): int
{
    $this->process();
    return Command::SUCCESS;
}
```
---
## Exceptions
Commands that delegate to a sub-command may `return $this->call(OtherCommand::class)` which propagates the exit code automatically.
---
## Consequences Of Violation
Scheduler mutex never releases, deployment scripts misinterpret command results, CI/CD pipeline failures.

---

## Rule: Use Constructor Injection Over Facades
---
## Category
Maintainability
---
## Rule
Prefer constructor injection for command dependencies instead of facades or `$this->call()` helpers.
---
## Reason
Commands are resolved through the container; all constructor dependencies are auto-injected. Constructor injection makes dependencies explicit, enables unit testing without facades, and prevents subtle per-request resolution issues.
---
## Bad Example
```php
public function handle(): int
{
    Cache::forget('key');
    Log::info('Cache cleared');
    return Command::SUCCESS;
}
```
---
## Good Example
```php
public function __construct(
    private CacheRepository $cache,
    private LoggerInterface $logger
) {
    parent::__construct();
}

public function handle(): int
{
    $this->cache->forget('key');
    $this->logger->info('Cache cleared');
    return Command::SUCCESS;
}
```
---
## Exceptions
Commands that need request-scoped services or dynamically resolved dependencies may use `$this->resolve()` or `app()` in `handle()`.
---
## Consequences Of Violation
Reduced testability, tight coupling to facade aliases, difficulty replacing implementations in tests.

---

## Rule: Set Mutex Expiration For WithoutOverlapping
---
## Category
Reliability
---
## Rule
Always pass an `$expiresIn` parameter (in seconds) when using `->withoutOverlapping()` on scheduled tasks.
---
## Reason
Without an expiration, a crashed or interrupted command permanently holds the mutex lock, preventing the task from ever running again until manual cleanup of `storage/framework/schedule-*` files.
---
## Bad Example
```php
$schedule->command('emails:send')->withoutOverlapping();
```
---
## Good Example
```php
$schedule->command('emails:send')->withoutOverlapping(3600);
```
---
## Exceptions
Tasks that must never overlap regardless of failure state (e.g., monetary reconciliation) may omit expiration if accompanied by a monitoring alert for stuck mutexes.
---
## Consequences Of Violation
Permanent scheduling deadlock, production tasks silently stop running, requires manual incident response to clear stale mutex files.

---

## Rule: Avoid Heavy Logic In Command Constructors
---
## Category
Performance
---
## Rule
Do not place heavy initialization or I/O in command constructors — constructors run during *registration*, not execution.
---
## Reason
Constructors execute when the command is added to the Artisan application instance, which happens on every `artisan` invocation, not just when the specific command runs. Heavy constructors slow down all Artisan commands.
---
## Bad Example
```php
public function __construct(
    private ReportService $reports
) {
    $this->data = $this->reports->loadAllHistoricalData(); // runs on every artisan call
    parent::__construct();
}
```
---
## Good Example
```php
public function __construct(
    private ReportService $reports
) {
    parent::__construct();
}

public function handle(): int
{
    $data = $this->reports->loadAllHistoricalData(); // runs only when this command executes
    return Command::SUCCESS;
}
```
---
## Exceptions
Configuration that is cheap (sub-millisecond property assignment) and invariant across command runs is acceptable in constructors.
---
## Consequences Of Violation
Slows every `artisan` call by seconds, causes timeouts on `artisan list`, frustrates developer experience.

---

## Rule: Use Lazy Resolution In Schedule() Methods
---
## Category
Framework Usage
---
## Rule
Prefer closures with lazy resolution inside `schedule()` methods; do not resolve container services directly in the `schedule()` body.
---
## Reason
The `schedule()` method runs during kernel bootstrap when the container may not be fully ready. Services resolved here may be incomplete or fail entirely. Closures capture the intent and resolve lazily when the scheduler evaluates the task.
---
## Bad Example
```php
protected function schedule(Schedule $schedule): void
{
    $manager = $this->app->make(TaskManager::class);
    $manager->registerTasks($schedule);
}
```
---
## Good Example
```php
protected function schedule(Schedule $schedule): void
{
    $schedule->call(function () {
        app(TaskManager::class)->runPending();
    })->daily();
}
```
---
## Exceptions
Reading configuration values (`config('app.name')`) is safe during `schedule()` because config is loaded before `schedule()` runs.
---
## Consequences Of Violation
Container resolution failures, incomplete service instances, cryptic bootstrap errors that only manifest during `schedule:run`.

---

## Rule: Constrain Scheduled Tasks By Environment
---
## Category
Security
---
## Rule
Use `->environments()` to restrict destructive scheduled tasks (database reset, test data purge, cache flush) to non-production environments.
---
## Reason
Scheduled commands run with the same permissions as the web server. A staging cleanup task accidentally running in production can cause irreversible data loss. Environment gates provide a defense-in-depth layer beyond deployment configuration.
---
## Bad Example
```php
$schedule->command('db:reset --force')->daily();
```
---
## Good Example
```php
$schedule->command('db:reset --force')
    ->daily()
    ->environments(['staging', 'testing']);
```
---
## Exceptions
Emergency maintenance tasks intentionally designed for production use may omit the environment constraint but should include confirmation prompts or additional authorization checks.
---
## Consequences Of Violation
Accidental production data loss, production database reset, irreversible data destruction requiring restore from backup.

---

## Rule: Prefer Cached Command Registration Over Directory Scanning
---
## Category
Performance
---
## Rule
Use explicit command registration or cached command listings in production; avoid relying on `load()` directory scanning for every `artisan` invocation.
---
## Reason
Directory scanning via `load()` performs filesystem enumeration and class resolution on every `artisan` call, adding 5-10ms overhead for 50+ command files. Cached registration eliminates this cost.
---
## Bad Example
```php
// bootstrap/app.php
->withCommands(function () {
    $this->load(__DIR__.'/../app/Console/Commands');
})
```
---
## Good Example
```php
// bootstrap/app.php
->withCommands(function () {
    if ($this->environment('local')) {
        $this->load(__DIR__.'/../app/Console/Commands');
    }
})
```

Or for production:
```php
// bootstrap/app.php
->withCommands([
    ProcessEmails::class,
    GenerateReport::class,
    // explicit list
])
```
---
## Exceptions
Development environments where new commands are frequently added benefit from auto-discovery without requiring registration updates.
---
## Consequences Of Violation
Unnecessary filesystem I/O on every artisan call, increased cold-start latency in CI/CD pipelines.

---

## Rule: Audit Command Registration Order For Intentional Overrides
---
## Category
Architecture
---
## Rule
Be explicit when overriding framework commands by registering replacement commands after framework defaults, using visible naming conventions.
---
## Reason
Command registration follows last-wins ordering — the last registered command with the same `$signature` wins. Implicit overrides cause confusion when the wrong implementation runs. Explicit intent prevents debugging hours.
---
## Bad Example
```php
// Some service provider loads first:
public function register(): void
{
    Commands\MakeModel::class => ['alias' => 'make:model'],
}

// Another loads second, unexpectedly overriding the first:
public function register(): void
{
    CustomMakeModel::class => ['alias' => 'make:model'],
}
```
---
## Good Example
```php
// bootstrap/app.php — explicit override in configuration
->withCommands([
    CustomMakeModel::class, // registered after framework defaults, overrides make:model
])
```
---
## Exceptions
Third-party packages that extend framework commands may register after application commands if the package is loaded last, but this should be documented and understood.
---
## Consequences Of Violation
Unexpected command behavior, incorrect implementation runs in production, confusion during debugging.

---

## Rule: Isolate Sensitive Command Logic From Web Permissions
---
## Category
Security
---
## Rule
Add authorization checks in destructive or sensitive console commands; do not rely solely on CLI-only access for security.
---
## Reason
Commands run with the same system permissions as the web server process. Anyone who gains access to the server shell or a compromised CI/CD pipeline can execute destructive commands. Authorization gates (environment checks, confirmation prompts, app tokens) add defense layers.
---
## Bad Example
```php
public function handle(): int
{
    User::query()->forceDelete();
    return Command::SUCCESS;
}
```
---
## Good Example
```php
public function handle(): int
{
    if (! $this->confirm('Are you sure you want to delete ALL users?')) {
        return Command::FAILURE;
    }
    if (! $this->option('force') && app()->environment('production')) {
        $this->error('Use --force only in non-production');
        return Command::FAILURE;
    }
    User::query()->forceDelete();
    return Command::SUCCESS;
}
```
---
## Exceptions
Read-only or informational commands (help, list, status) require no authorization.
---
## Consequences Of Violation
Unauthorized data destruction from compromised shell access, supply-chain attacks through CI/CD, accidental production damage.

---

## Rule: Use Subprocess Isolation For Scheduler Stateful Tasks
---
## Category
Reliability
---
## Rule
Prefer `->command()` or `->exec()` over `->call()` for scheduled tasks that modify application state or depend on fresh bootstrap.
---
## Reason
The scheduler uses `->call()` to execute closures in the current process, inheriting all current memory state (singletons, facades, connection instances). `->command()` and `->exec()` spawn subprocesses via Symfony Process, ensuring a clean bootstrap and preventing state leakage between tasks.
---
## Bad Example
```php
$schedule->call(function () {
    Cache::forget('expired-key');
})->everyMinute();
```
---
## Good Example
```php
$schedule->command('cache:clear-expired')->everyMinute();
// or
$schedule->exec('php artisan cache:clear-expired')->everyMinute();
```
---
## Exceptions
Trivial stateless operations (writing to a log file, incrementing a counter) that are idempotent and fast may safely use `->call()`.
---
## Consequences Of Violation
State corruption from shared singletons, stale in-memory connections reused across tasks, non-deterministic behavior in long-running processes.
