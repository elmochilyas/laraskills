# Skill: Build a Robust Artisan Command

## Purpose

Create an Artisan command with proper constructor injection, integer exit codes, lightweight constructors, and explicit command registration for reliable console operations.

## When To Use

When creating any new Artisan command, refactoring existing commands that return strings instead of exit codes, or when commands have heavy constructor logic that slows every `artisan` invocation.

## When NOT To Use

One-off commands in development that will not be committed. Commands that delegate to sub-commands — `$this->call()` propagates exit codes automatically.

## Prerequisites

- Understanding of the Console Kernel dispatch flow
- Knowledge of container resolution for commands
- Familiarity with the Artisan command signature syntax

## Inputs

- Command purpose and signature (name, arguments, options)
- Required dependencies (services, repositories, etc.)
- Deployment environment (production registration strategy)

## Workflow

1. Generate the command: `php artisan make:command ProcessEmails`
2. Define the command signature in `$signature` property (e.g., `emails:process {--force}`)
3. Inject dependencies via constructor — never use facades or `app()` inside `handle()`:
   ```php
   public function __construct(private EmailService $emails, private LoggerInterface $logger)
   {
       parent::__construct();
   }
   ```
4. Place all initialization logic in `handle()` — not in constructor (constructor runs during registration, on every artisan call):
   ```php
   public function handle(): int
   {
       try {
           $this->emails->process();
           $this->logger->info('Emails processed');
           return Command::SUCCESS;
       } catch (\Throwable $e) {
           $this->error($e->getMessage());
           return Command::FAILURE;
       }
   }
   ```
5. Return `Command::SUCCESS` (0) or `Command::FAILURE` (1) — never strings or `void`
6. Register the command explicitly in `bootstrap/app.php` (Laravel 11+) or `App\Console\Kernel`:
   ```php
   ->withCommands([
       ProcessEmails::class,
       GenerateReport::class,
   ])
   ```
7. For production, use explicit class-string registration — avoid `load()` directory scanning for every artisan call

## Validation Checklist

- [ ] Constructor is lightweight — no I/O, no heavy computation, no service resolution
- [ ] All dependencies use constructor injection — not facades, not `app()` in `handle()`
- [ ] `handle()` returns `Command::SUCCESS` or `Command::FAILURE` on every code path
- [ ] Command is registered explicitly — not relying solely on directory scanning in production
- [ ] Error handling in `handle()` catches exceptions and returns `Command::FAILURE`
- [ ] `$signature` uses correct syntax with arguments `{arg}`, options `{--option}`
- [ ] Destructive commands include confirmation prompts or environment checks

## Common Failures

- Heavy constructor logic — runs on every `artisan` call, not just when the command executes
- Returning nothing (void) or a string — `handle()` default return is `null`, which produces exit code 0 but with `null` output
- Using facades over injected dependencies — reduces testability and couples to facade aliases
- Using `load()` for command registration in production — filesystem scanning adds 5-10ms per artisan call
- Not catching exceptions in `handle()` — uncaught exceptions produce exit code 1 but with stack trace output

## Decision Points

- If the command needs request-scoped services, resolve them inside `handle()` via `$this->resolve()` — but document why constructor injection was not used
- If the command must call another command, use `$this->call(OtherCommand::class)` which propagates exit codes
- For destructive commands, add `$this->confirm()` prompts and `->environments(['staging'])` constraints

## Performance Considerations

Heavy constructors slow every artisan invocation — a 2-second constructor delays every `artisan` command by 2 seconds. Explicit registration avoids 5-10ms directory scanning. Container resolution of the command adds 1-5ms — negligible for most use cases.

## Security Considerations

Commands run with the same permissions as the web server process. Destructive commands (delete, reset, purge) must include authorization checks, confirmation prompts, and environment gates. Read-only commands (list, show, status) require no authorization.

## Related Rules

- Return Integer Exit Codes From Commands (console-kernel-dispatch:5)
- Use Constructor Injection Over Facades (console-kernel-dispatch:5)
- Avoid Heavy Logic In Command Constructors (console-kernel-dispatch:5)
- Prefer Cached Command Registration Over Directory Scanning (console-kernel-dispatch:5)
- Isolate Sensitive Command Logic From Web Permissions (console-kernel-dispatch:5)

## Related Skills

- Configure the Task Scheduler with Safe Overlap Control (console-kernel-dispatch:6)
- Debug Command Registration Failures (console-kernel-dispatch:6)
- Configure ApplicationBuilder in bootstrap/app.php (entry-point-mechanics:6)

## Success Criteria

Command has lightweight constructor, injected dependencies, integer exit codes on all paths, and explicit registration. Destructive commands have confirmation prompts and environment gates. `handle()` returns `Command::SUCCESS` or `Command::FAILURE`.

---

# Skill: Configure the Task Scheduler with Safe Overlap Control

## Purpose

Set up scheduled tasks with mutex expiration, environment constraints, subprocess isolation, and lazy resolution to prevent deadlocks, data loss, and state corruption.

## When To Use

When defining any recurring scheduled task, when migrating from `->call()` to `->command()` for stateful tasks, or when debugging scheduler deadlocks where tasks permanently stop running.

## When NOT To Use

For one-time or manually-triggered tasks. For tasks that must execute in-process (e.g., sharing a connection pool) — though this is rare and should be documented.

## Prerequisites

- Understanding of the scheduler bootstrap and mutex mechanism
- Knowledge of Symfony Process subprocess isolation
- Familiarity with environment constraints

## Inputs

- Task command or closure to execute
- Schedule frequency (everyMinute, daily, hourly, etc.)
- Runtime constraints (environment, overlap, maintenance mode)

## Workflow

1. Define the schedule in `bootstrap/app.php` (Laravel 11+) or `App\Console\Kernel` (Laravel 10):
   ```php
   protected function schedule(Schedule $schedule): void
   {
       // ...
   }
   ```
2. Prefer `->command()` over `->call()` for tasks that modify state — subprocess isolation prevents state leakage:
   ```php
   $schedule->command('emails:send')->everyMinute();
   ```
3. Add `->withoutOverlapping($expiresIn)` with an expiration in seconds — prevents deadlocks if a task crashes:
   ```php
   $schedule->command('emails:send')->withoutOverlapping(3600)->everyMinute();
   ```
4. Constrain destructive tasks by environment:
   ```php
   $schedule->command('db:reset --force')
       ->daily()
       ->environments(['staging', 'testing']);
   ```
5. For inline closures, use lazy resolution — never resolve services inside the `schedule()` method body:
   ```php
   $schedule->call(function () {
       app(TaskManager::class)->runPending();
   })->daily();
   ```
6. Add `->evenInMaintenanceMode()` for critical tasks that must run during maintenance windows
7. Add `->onOneServer()` for multi-server deployments to prevent duplicate execution (requires shared cache driver: redis, memcached, database)

## Validation Checklist

- [ ] Every `->withoutOverlapping()` has an `$expiresIn` parameter set
- [ ] Destructive tasks use `->environments()` to constrain to non-production
- [ ] Stateful tasks use `->command()` (subprocess) not `->call()` (in-process)
- [ ] `schedule()` method body uses lazy resolution — no `$this->app->make()` or `app()` directly
- [ ] Mutex storage directory (`storage/framework/`) has correct permissions
- [ ] Multi-server deployments use `->onOneServer()` with shared cache
- [ ] Critical tasks have `->evenInMaintenanceMode()` if needed

## Common Failures

- `->withoutOverlapping()` without `$expiresIn` — crashed tasks permanently hold the mutex, task never runs again
- Using `->call()` for stateful tasks — closure runs in current process, shares singletons, facades, connections
- Resolving services in `schedule()` method — container may not be fully ready, resolution fails with cryptic errors
- Not constraining destructive tasks by environment — `db:reset` can accidentally run in production
- Assuming `onOneServer()` works with file cache — requires shared cache (redis, memcached, database)

## Decision Points

- If the task is idempotent and stateless (logging, read-only), `->call()` is acceptable
- If the task must execute on every server (cache warming per region), omit `->onOneServer()`
- If the task must run during maintenance (queue worker, health check), add `->evenInMaintenanceMode()`

## Performance Considerations

`->command()` spawns a subprocess via Symfony Process — adds 30-60ms bootstrap cost per task. `->call()` is in-process (~0.1ms overhead) but shares state. For 50+ scheduled tasks, prefer `->command()` for state isolation and accept the bootstrap cost, or use `->call()` with explicit state isolation in the closure.

## Security Considerations

Mutex files in `storage/framework/schedule-*` should not be world-writable. Environment constraints (`->environments()`) provide defense-in-depth — do not rely on them as the sole protection for destructive commands. Scheduled task output may contain sensitive data if logged, emailed, or written to files.

## Related Rules

- Set Mutex Expiration For WithoutOverlapping (console-kernel-dispatch:5)
- Use Lazy Resolution In Schedule() Methods (console-kernel-dispatch:5)
- Constrain Scheduled Tasks By Environment (console-kernel-dispatch:5)
- Use Subprocess Isolation For Scheduler Stateful Tasks (console-kernel-dispatch:5)

## Related Skills

- Build a Robust Artisan Command (console-kernel-dispatch:6)
- Debug Command Registration Failures (console-kernel-dispatch:6)
- Implement Safe Terminable Middleware (response-sending-and-termination:6)

## Success Criteria

Every scheduled task with `->withoutOverlapping()` has an expiration set. Destructive tasks are constrained by environment. Stateful tasks use `->command()` subprocess isolation. The `schedule()` method uses lazy resolution only. Multi-server tasks use `->onOneServer()` with shared cache.

---

# Skill: Debug Command Registration Failures

## Purpose

Troubleshoot Artisan commands that are not found, run the wrong implementation, or behave unexpectedly by tracing registration through the 4 command sources with last-wins resolution.

## When To Use

When `php artisan list` does not show a command, when a command runs unexpected logic, when a framework command behaves differently than documented, or when a custom command overrides a framework command unintentionally.

## When NOT To Use

Commands that exist but fail at runtime (handle() errors, missing dependencies) — those are runtime issues, not registration issues. Console kernel not loading at all (check entry point).

## Prerequisites

- Understanding of the 4 command registration sources
- Knowledge of last-wins collision resolution
- Access to command registration code in providers and bootstrap/app.php

## Inputs

- Command signature (name) that is not working
- Framework version (Laravel 10 vs 11+)
- List of all registered service providers
- bootstrap/app.php or App\Console\Kernel contents

## Workflow

1. Confirm the command's `$signature` property matches the name used in the terminal — case-sensitive, exact match required
2. Trace registration through the 4 sources in execution order:
   - **Framework built-in commands**: registered first by the Console kernel constructor — includes `make:model`, `migrate`, `cache:clear`, etc.
   - **Provider `$commands` array**: each provider can register commands via `$commands` property — loads during provider registration
   - **Directory scanning `load()`**: `$this->load(__DIR__.'/../Commands')` — scans filesystem for command classes; runs during kernel configuration
   - **Manual `addCommand()`**: explicit `$kernel->addCommand()` — runs last, highest priority
3. Check for overrides: if two registrations share the same `$signature`, the last one wins. Application commands registered after framework defaults will override framework commands
4. Verify the command class extends `Illuminate\Console\Command` and has a non-empty `$signature` property
5. Check for environment-conditional registration (e.g., `if ($app->environment('local'))` blocks production registration)
6. Test with `php artisan list --raw` to see all registered command names
7. If the command is still not found, add `dd('registered')` to the provider's `register()` method or the `->withCommands()` closure to verify the code path executes

## Validation Checklist

- [ ] Command `$signature` matches the terminal invocation exactly
- [ ] Command class extends `Illuminate\Console\Command`
- [ ] Registration code path is hit — verify with temporary logging if needed
- [ ] No environment guard is blocking production registration accidentally
- [ ] If overriding a framework command, the override is intentional and last-wins ordering is confirmed
- [ ] Directory scanning (`load()`) path is correct — file exists at the expected location
- [ ] Command is not registered in a deferred service provider that never boots

## Common Failures

- Typo in `$signature`: `emails:proces` instead of `emails:process` — command registered but under wrong name
- Environment guard blocks production: `->withCommands(function () { if (app()->environment('local')) { ... } })` — command is development-only
- Deferred provider never boots: command registered in a deferred provider's `$commands` array, but the provider never resolves because no other service requests it
- `load()` path is wrong: `__DIR__.'/Commands'` when commands are in `app/Console/Commands` — path mismatch means zero commands loaded from that source
- Namespace mismatch: class is `App\Console\Commands\MyCommand` but registered under wrong namespace string
- Framework upgrade removed the command: a command from Laravel 9 that was removed in Laravel 10

## Decision Points

- If overriding a framework command, register it explicitly in `bootstrap/app.php` after framework defaults — document the override intent
- If the command should not be available in production, use environment-conditional registration explicitly
- If `load()` is failing silently, switch to explicit class-string registration for clarity

## Performance Considerations

Debugging registration failures has no production cost. The fix (explicit registration) reduces directory scanning overhead. Each registration source adds ~0.5-5ms to command resolution time.

## Security Considerations

Unintentional command overrides can run malicious logic if a package replaces a system command. Audit all `$commands` arrays in third-party provider classes. Never trust command registration from untrusted packages.

## Related Rules

- Audit Command Registration Order For Intentional Overrides (console-kernel-dispatch:5)
- Prefer Cached Command Registration Over Directory Scanning (console-kernel-dispatch:5)
- Return Integer Exit Codes From Commands (console-kernel-dispatch:5)

## Related Skills

- Build a Robust Artisan Command (console-kernel-dispatch:6)
- Configure the Task Scheduler with Safe Overlap Control (console-kernel-dispatch:6)
- Configure ApplicationBuilder in bootstrap/app.php (entry-point-mechanics:6)

## Success Criteria

Found the missing or wrong command. Registration source identified (framework, provider, directory scan, manual). Override confirmed intentional or fixed. Environment guards verified correct. Command runs as expected in target environment.
