# Console Kernel Structure & Handle Flow

## Metadata
- **ID:** ku-02-console-kernel-structure / ku-04-console-kernel-handle-flow
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Kernel Architecture
- **Last Updated:** 2026-06-02

## Overview
The Console Kernel (`Illuminate\Foundation\Console\Kernel`) handles all CLI/Artisan command invocations. Unlike the HTTP Kernel's single request-response cycle, the Console Kernel parses command-line input, registers and resolves Artisan commands, manages the task scheduler, and handles the bootstrap lifecycle. It is the entry point for `artisan`, queue workers, scheduled tasks, and maintenance-mode commands. Every `php artisan` command runs through this class.

## Core Concepts
- **Artisan Command Registration**: Commands are registered via `$commands` property array, the `commands()` method, or auto-discovery via `load()` directory scanning.
- **Input Parsing**: Uses Symfony's `ConsoleInput` and `ConsoleOutput` to parse CLI arguments and options.
- **Schedule Resolution**: The `schedule()` method defines scheduled tasks evaluated on every `schedule:run` invocation.
- **Bootstrap Flow**: Same six bootstrappers as HTTP Kernel but with identical default order.
- **Symfony Console Integration**: Wraps Symfony Console `Application` for full CLI lifecycle — command resolution, input/output handling, help text, exit codes.
- **Lazy Command Loading**: Commands are not instantiated until resolved, keeping memory low for `list` and `help` commands.

## When To Use
- **All Artisan commands**: Every `php artisan` command flows through the Console Kernel.
- **Scheduled tasks**: Task definitions in `schedule()` are evaluated and executed.
- **Queue workers**: `php artisan queue:work` is an Artisan command — shares the same boot sequence.
- **Maintenance mode**: `php artisan up` / `php artisan down` are console commands.

## When NOT To Use
- **HTTP requests**: HTTP Kernel handles web requests.
- **Direct PHP script execution**: Use the HTTP or Console Kernel entry points, not raw PHP scripts.
- **Queue job processing loop internals**: The job loop runs within the `queue:work` command; the Console Kernel handles the command setup.

## Best Practices (WHY)
- **Use `$commands` array in production**: Auto-discovery via `load()` triggers Composer autoloader for all files in the commands directory. Explicit registration is more predictable. *Why: Auto-discovery scans all files, causing autoloading overhead and potential errors from non-command classes in commands directories.*
- **Set --max-jobs and --max-time for queue workers**: Without these limits, workers run until OOM. `--max-jobs=500` is a safe default. *Why: Singleton state leaks and static accumulation cause unbounded memory growth in long-running processes.*
- **Keep schedule tasks fast**: `schedule:run` evaluates all scheduled tasks on every call. Complex schedule logic adds overhead. *Why: Every cron minute triggers a full bootstrap + schedule evaluation; 50+ tasks with heavy due() checks add measurable overhead.*
- **Avoid HTTP-specific services in commands**: The Request object is not available in CLI. Check `$this->laravel->environment()` rather than relying on request data. *Why: Console commands lack HTTP context — session, auth, and request facades will fail or return unexpected results.*

## Architecture Guidelines
- **Symfony Console Foundation**: Built on Symfony Console rather than a custom CLI framework. Provides battle-tested input parsing, output formatting, help generation at the cost of Symfony API coupling.
- **Separate bootstrap from HTTP**: Reuses the same six bootstrappers but in a different logical context. Keeps initialization consistent across HTTP and CLI while allowing different middleware/route behavior.
- **Schedule as userland code**: Scheduling lives in userland `Kernel.php` (or `bootstrap/app.php` in Laravel 11+) rather than configuration files. Allows closures, type-hinted dependencies, and conditional logic.
- **Lazy command loading**: Commands instantiated only when resolved by Symfony Application. Keeps memory low for non-execution commands.

## Performance
- **Bootstrap overhead**: Each `artisan` command runs the full bootstrap sequence. For simple commands, bootstrap accounts for >80% of execution time.
- **Schedule evaluation cost**: `schedule:run` evaluates all tasks on every call. With 50+ tasks, due() checks add measurable overhead.
- **Command autoloading**: Auto-discovered commands trigger autoloader for all files. Use `$commands` array in production for explicit loading.
- **OPcache impact**: Console commands benefit less from OPcache than HTTP requests since each `artisan` is a separate PHP process.
- **Route caching**: Typically unnecessary for console commands unless the command explicitly loads routes.

## Security
- **Environment detection**: Console commands may need `--env` flag or `APP_ENV` default. Wrong environment can lead to operating on incorrect data.
- **Exit codes**: Non-zero exit codes matter in CI/CD pipelines and cron. Always return appropriate exit codes.
- **Bootstrap failure**: Missing `.env` or misconfigured provider breaks all artisan commands, including `php artisan down` (recovery command).

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Injecting HTTP-specific services | Using Request facade in console commands | Request is not available in CLI — errors or null values | Check `$this->laravel->environment()` instead |
| Missing `load()` calls | Forgetting to call `$this->load()` in commands() | Command directory is not scanned; commands not found | Always call `$this->load(__DIR__.'/Commands')` |
| Schedule frequency misunderstanding | Using `->everyMinute()` for hourly tasks | Task runs more frequently than intended | Understand cron-equivalent mappings |
| Background task output expectation | Running tasks in background (`->runInBackground()`) | Background process output is discarded | Use logging instead of console output |
| Memory leaks in long-running commands | Commands that loop accumulate memory | OOM crashes after processing many items | Always set `--max-jobs` and `--max-time` |

## Anti-Patterns
- **Console command as monolith**: Putting all business logic inside the command's `handle()` method instead of delegating to services. Commands should be thin orchestrators.
- **Request-dependent command logic**: Building commands that assume HTTP context (session, cookies, request data). Use CLI arguments and options instead.
- **Unbounded queue workers**: Running `queue:work` without `--max-jobs` or `--max-time`, causing eventual OOM.
- **Scheduling overlapping tasks**: Not using `->withoutOverlapping()` for long-running scheduled tasks, causing multiple concurrent processes.

## Examples

```php
// Console command registration
protected $commands = [
    App\Console\Commands\ProcessReports::class,
];

// In bootstrap/app.php (Laravel 11+)
->withCommands([
    App\Console\Commands\ProcessReports::class,
])

// Schedule definition
protected function schedule(Schedule $schedule)
{
    $schedule->command('reports:generate')
             ->daily()
             ->withoutOverlapping()
             ->runInBackground();
}
```

## Related Topics
- **HTTP Kernel Internals**: The HTTP counterpart with shared bootstrapping but request/response focus.
- **Kernel Bootstrappers**: The six initialization steps shared with the HTTP kernel.
- **Task Scheduling Internals**: How schedule() definitions are parsed and executed.
- **Queue Worker Lifecycle**: How artisan commands like `queue:work` integrate with the console kernel.
- **Symfony Console Component**: Foundation for CLI input parsing, output formatting.

## AI Agent Notes
- `Illuminate\Foundation\Console\Kernel.php` is ~300 lines — notably larger than HTTP Kernel due to command registration, schedule handling, and Symfony Application integration.
- The console kernel's `handle()` can be called multiple times in the same process (e.g., in tests with `$this->artisan()`). The guarded bootstrapper flag prevents redundant initialization.
- Laravel 11+ removed userland `App\Console\Kernel`. Schedule and commands are now configured via `bootstrap/app.php` using `->withSchedule()` and `->withCommands()`.
- The guarded bootstrapping (`$this->hasBeenBootstrapped`) is on the Application instance, not the Kernel. Multiple kernels sharing the same Application instance only bootstrap once.

## Verification
- [ ] Read `Illuminate\Foundation\Console\Kernel::handle()` source
- [ ] Trace command registration flow: `$commands` → `commands()` → `load()` → Symfony Application
- [ ] Understand the six bootstrappers and their identical order to HTTP Kernel
- [ ] Test with `php artisan route:list` (not a route command — verify console command listing works)
- [ ] Create a custom Artisan command and register it via all three methods
- [ ] Set up a schedule with `->withoutOverlapping()` and verify behavior
