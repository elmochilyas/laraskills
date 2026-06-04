# Console Kernel Internals — Rules

## Rule Name
Prefer explicit command registration over auto-discovery in production.
---
## Category
Performance
---
## Rule
Use the `$commands` property array (or `->withCommands()` in Laravel 11+) to explicitly register Artisan commands in production. Avoid relying solely on `load()` auto-discovery.
---
## Reason
Auto-discovery via `load()` triggers the Composer autoloader for every file in the commands directory, causing autoloading overhead and potential errors from non-command classes. Explicit registration loads only the classes you intend to register.
---
## Bad Example
```php
protected function commands(): void
{
    $this->load(__DIR__.'/Commands');
}
```
---
## Good Example
```php
protected $commands = [
    ProcessReports::class,
    GenerateInvoice::class,
];

// Laravel 11+
// ->withCommands([
//     ProcessReports::class,
//     GenerateInvoice::class,
// ])
```
---
## Exceptions
During local development with a rapidly growing command set, `load()` is acceptable for convenience. Switch to explicit registration before deploying to production.
---
## Consequences Of Violation
Unnecessary autoloader invocations on every `artisan` invocation, slower CLI bootstrap, risk of autoload errors from non-command files in the commands directory.

---

## Rule Name
Always bound long-running commands with `--max-jobs` and `--max-time`.
---
## Category
Reliability
---
## Rule
When running queue workers or any long-running Artisan command, always set `--max-jobs` and `--max-time` limits. Never run unbounded worker processes.
---
## Reason
Singleton state leaks, static property accumulation, and unresolved references cause unbounded memory growth in long-running processes. Without limits, workers eventually crash with out-of-memory errors.
---
## Bad Example
```bash
php artisan queue:work
```
---
## Good Example
```bash
php artisan queue:work --max-jobs=500 --max-time=3600
```
---
## Exceptions
Short-lived commands (e.g., `php artisan cache:clear`) that complete within a single execution do not require these limits. Background daemon processes managed by a process supervisor (Supervisor) may use higher limits when combined with restart policies.
---
## Consequences Of Violation
Worker processes crash with OOM errors after processing large batches, loss of in-progress jobs, increased operational overhead from manual restarts.

---

## Rule Name
Do not inject HTTP-specific services into console commands.
---
## Category
Architecture
---
## Rule
Never use the `Request` facade, session, or cookie helpers inside Artisan commands. Rely on CLI arguments, options, and `$this->laravel->environment()` instead.
---
## Reason
Console commands lack HTTP context — the Request object is not available in CLI. Session, auth, and request facades will fail or return unexpected null values.
---
## Bad Example
```php
public function handle(): int
{
    $user = Auth::user(); // NULL in CLI
    $env = app('request')->input('env'); // Fails
}
```
---
## Good Example
```php
public function handle(): int
{
    $env = $this->option('env') ?? $this->laravel->environment();
    $userId = $this->argument('user');
}
```
---
## Exceptions
Commands that explicitly bootstrap HTTP context (e.g., tinker-like REPL commands) may access request data, but this is rare and should be documented as a non-standard behavior.
---
## Consequences Of Violation
Runtime errors when command executes, undefined behavior from null facades, broken CI/CD pipelines, commands that work in testing but fail in production.

---

## Rule Name
Keep schedule task evaluation fast and idempotent.
---
## Category
Performance
---
## Rule
Avoid heavy computations, database queries, or HTTP calls inside the `schedule()` method definition. Defer expensive work to the command's `handle()` method.
---
## Reason
`schedule:run` evaluates every registered task's due constraints on each cron tick. Complex due-check logic (eager-loaded relationships, API calls in the closure) adds measurable overhead that compounds with every task added.
---
## Bad Example
```php
protected function schedule(Schedule $schedule): void
{
    $schedule->call(function () {
        $report = Report::with('relatedData')->get();
        // heavy work
    })->daily();
}
```
---
## Good Example
```php
protected function schedule(Schedule $schedule): void
{
    $schedule->command('reports:generate')->daily()->withoutOverlapping();
}
```
---
## Exceptions
Trivial in-memory calculations or simple property checks (e.g., `config('app.timezone')`) used in schedule conditionals are acceptable.
---
## Consequences Of Violation
Slow `schedule:run` execution, delayed cron ticks, overlapping tasks when cron cycle is shorter than evaluation time, missed scheduled task windows.

---

## Rule Name
Use `->withoutOverlapping()` for all long-running scheduled tasks.
---
## Category
Reliability
---
## Rule
Apply `->withoutOverlapping()` to any scheduled task whose execution may exceed the scheduling interval. Never allow overlapping instances of the same task.
---
## Reason
Without overlapping protection, a task that runs longer than its interval starts a second concurrent instance, causing race conditions, duplicate processing, and resource contention.
---
## Bad Example
```php
$schedule->command('reports:generate')->everyMinute();
```
---
## Good Example
```php
$schedule->command('reports:generate')->everyMinute()->withoutOverlapping();
```
---
## Exceptions
Idempotent read-only tasks that are safe to run concurrently (e.g., cache warming) may omit `->withoutOverlapping()`. Document the rationale explicitly.
---
## Consequences Of Violation
Duplicate records from concurrent processing, database deadlocks, file corruption from simultaneous writes, server resource exhaustion.

---

## Rule Name
Prefer `->runInBackground()` for non-critical scheduled tasks.
---
## Category
Performance
---
## Rule
Send scheduled tasks that do not produce output to the background using `->runInBackground()` instead of running them in the foreground.
---
## Reason
Foreground tasks block the `schedule:run` process. If a task is slow, the next scheduled tasks in the list are delayed. Background tasks execute independently, allowing `schedule:run` to return immediately.
---
## Bad Example
```php
$schedule->command('analytics:aggregate')->daily();
```
---
## Good Example
```php
$schedule->command('analytics:aggregate')->daily()->runInBackground();
```
---
## Exceptions
Tasks whose output is needed by subsequent scheduled tasks in the same run, or tasks that must complete before `schedule:run` exits (for exit-code dependent supervisors).
---
## Consequences Of Violation
Sequential task blocking, delayed task execution, cron drift when the total task list execution time exceeds the cron interval.

---

## Rule Name
Keep console command `handle()` methods thin by delegating to service classes.
---
## Category
Maintainability
---
## Rule
Limit console command `handle()` methods to argument parsing, input validation, and single delegation calls. Move business logic into dedicated service or action classes.
---
## Reason
Commands are entry points — not application logic containers. Thick `handle()` methods resist testing, duplicate logic across commands, and couple CLI concerns to business rules.
---
## Bad Example
```php
public function handle(): int
{
    $users = User::where('expires_at', '<', now())->get();
    foreach ($users as $user) {
        Mail::to($user->email)->send(new ExpirationWarning($user));
        Log::info('Notified user '.$user->id);
    }
    return 0;
}
```
---
## Good Example
```php
public function handle(ExpirationNotifier $notifier): int
{
    $dryRun = $this->option('dry-run');
    $count = $notifier->notifyExpiringUsers($dryRun);
    $this->info("Notified {$count} users.");
    return 0;
}
```
---
## Exceptions
Prototyping or throwaway commands (e.g., one-off data migrations) may keep logic inline. Refactor before merging to a shared branch.
---
## Consequences Of Violation
Low test coverage on command logic, duplicated business rules across commands, difficulty reusing logic in HTTP controllers or queue jobs, bloated command files.
