# Console Kernel Dispatch

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Request Lifecycle |
| Knowledge Unit | Console Kernel Dispatch |
| Difficulty | Intermediate |
| Lifecycle Phase | Kernel Orchestration (CLI) |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
Console Kernel Dispatch covers how Laravel processes CLI commands through the Artisan runtime. Unlike the HTTP kernel, the Console kernel (`Illuminate\Foundation\Console\Kernel`) bootstraps the Application with fewer bootstrappers (no `LoadEnvironmentVariables` — env comes from CLI context), resolves the Artisan application, registers commands, and dispatches to the matching command's `handle()` method. The console kernel also manages the task scheduler, which evaluates scheduled commands on every `php artisan schedule:run` invocation. The critical engineering decision is that command registration comes from multiple sources (framework, providers, directory scanning, manual) with last-wins collision resolution — application commands can override framework commands by registering later.

## Core Concepts
- **Artisan Entry Point** — `artisan` script mirrors `public/index.php` but dispatches to Console kernel via `$app->handleCommand()`.
- **Command Registration Sources** — Framework built-in commands, provider `$commands` array, directory scanning via `load()`, manual `addCommand()`.
- **Task Scheduler** — `schedule()` defines tasks evaluated by `schedule:run`; uses Symfony Process for subprocess isolation.
- **Console Bootstrap Differences** — Skips `LoadEnvironmentVariables` (env from CLI context), adds `SetRequestForConsole` to create dummy Request for providers that reference `request()`.
- **`handleCommand()` vs `handle()`** — In Laravel 11+, Application has `handleCommand()` which bootstraps the Console kernel and dispatches.

## When To Use
- Building custom Artisan commands for application operations
- Configuring the task scheduler for recurring jobs
- Debugging command registration or resolution failures
- Setting up CI/CD deployment scripts that use Artisan commands

## When NOT To Use
- Running HTTP-specific logic (console kernel lacks HTTP bootstrappers)
- Adding heavy bootstrapping that should be deferred (use provider boot)
- Using `$this->app->make()` inside `schedule()` method (container not fully ready)

## Best Practices
- **Return integer status codes** — Always return `Command::SUCCESS` (0) or `Command::FAILURE` (1) from command `handle()`.
- **Use constructor injection for dependencies** — Commands are resolved through the container; all constructor dependencies auto-inject.
- **Use `->withoutOverlapping()` with expiration** — Pass `$expiresIn` parameter (e.g., 3600) to auto-expire crashed mutexes.
- **Set `APP_RUNNING_IN_CONSOLE` in deployment scripts** — Prevents edge cases where `runningInConsole()` SAPI detection fails.
- WHY: Console commands are the operations interface for deployment, maintenance, and automation. Reliable command resolution and scheduling prevents production incidents.

## Architecture Guidelines
- The Console kernel uses Symfony Console's `Application::run()` rather than Laravel's `Router::dispatch()`.
- Command registration follows last-wins ordering — application commands can override framework commands.
- The scheduler runs each command in a separate PHP process via Symfony Process to prevent state leakage.
- In Laravel 11+, `App\Console\Kernel` is removed; commands are configured via `->withCommands()` in `bootstrap/app.php`.

## Performance Considerations
- Each command is resolved via the container (1-5ms). Pre-resolve hot-path commands using `$app->instance()`.
- Scheduler subprocess overhead: each scheduled command pays full bootstrap cost (30-60ms per command).
- Directory scanning via `load()` adds 5-10ms for 50+ command files on every artisan call.
- `artisan list` with cached command listings reduces rendering from ~100ms to ~5ms.

## Security Considerations
- Commands run with the same permissions as the web server; avoid running sensitive operations without authorization checks.
- Scheduled task output may contain sensitive data if logged or emailed.
- Environment-specific scheduling (`->environments()`) prevents staging cleanup tasks from running in production.
- Mutex files in `storage/framework/` should not be world-writable.

## Common Mistakes
| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Using `$this->app->make()` inside `schedule()` | Unaware of bootstrap timing | Resolution fails or returns incomplete services | Use closures that resolve lazily |
| Returning string/Response instead of int status | Confusion with HTTP controller pattern | Incorrect process exit codes, scheduler mutex issues | Return `Command::SUCCESS` or `Command::FAILURE` |
| Not setting mutex expiration for `withoutOverlapping` | Missing API parameter understanding | Crashed commands block future runs permanently | Add `$expiresIn` parameter (e.g., 3600) |

## Anti-Patterns
- **Heavy logic in command constructor** — Constructor runs during registration, not execution. Use `handle()` for logic.
- **Using facades over injected dependencies** — Commands are container-resolved; use constructor injection for testability.
- **Inline closures in schedule without error handling** — Uncaught exceptions in `Schedule::call()` crash the scheduler run.

## Examples

### Command with dependency injection
```php
class ProcessEmails extends Command
{
    protected $signature = 'emails:process';
    
    public function __construct(
        private EmailService $emails,
        private LoggerInterface $logger
    ) {
        parent::__construct();
    }
    
    public function handle(): int
    {
        $this->emails->process();
        return Command::SUCCESS;
    }
}
```

### Conditional command registration (Laravel 11+)
```php
// bootstrap/app.php
->withCommands(function (Application $app) {
    if ($app->environment('local')) {
        require base_path('routes/dev-commands.php');
    }
})
```

## Related Topics
- **Prerequisites:** Entry Point Mechanics, Application Bootstrap, Service Container
- **Closely Related:** HTTP Kernel Dispatch, Service Providers, Boot Order & Timing
- **Advanced:** Custom Kernel Implementations, Symfony Console Component Internals
- **Cross-Domain:** Task Scheduling, Queue Workers (Horizon)

## AI Agent Notes
- When debugging "Command not found", check registration source (framework, provider, directory, manual) and verify class extends `Command` with `$signature`.
- For scheduler mutex issues, check `storage/framework/schedule-*` files and `withoutOverlapping` expiration.
- In Octane, the scheduler always uses subprocess isolation via Symfony Process — verify it's not intercepted by Octane wrappers.

## Verification
- [ ] Can trace the full flow from `artisan` through `handleCommand()` to command `handle()`
- [ ] Understand the 4 command registration sources and last-wins resolution
- [ ] Know the Console kernel's different bootstrapper set vs HTTP kernel
- [ ] Can explain scheduler subprocess isolation and mutex management
- [ ] Can diagnose common command failures (missing signature, wrong registration)
