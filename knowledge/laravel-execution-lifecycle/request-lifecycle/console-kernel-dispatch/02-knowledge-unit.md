# Console Kernel Dispatch

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Request Lifecycle
- **Knowledge Unit:** Console Kernel Dispatch
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Console Kernel Dispatch covers how Laravel processes CLI commands through the Artisan runtime. Unlike the HTTP kernel, the Console kernel (`Illuminate\Foundation\Console\Kernel`) bootstraps the Application with fewer bootstrappers (no `LoadEnvironmentVariables` — env comes from CLI context), resolves the Artisan application, registers commands, and dispatches to the matching command's `handle()` method. The console kernel also manages the task scheduler, which evaluates scheduled commands on every `php artisan schedule:run` invocation.

The critical engineering decision differentiating console dispatch from HTTP dispatch is that the Console kernel must handle command registration from multiple sources: framework commands, application commands in `app/Console/Commands`, provider-registered commands via `$publishes` and `$commands` properties, and the `load()` method for directory-based auto-discovery. Command collision (two commands with the same signature) is resolved by registration order — last registered wins — which means package commands can be overridden by application commands registered later.

For production engineers, the Console kernel is the deployment and operations interface. Commands for migrations (`php artisan migrate`), caching (`php artisan optimize`), queue management (`php artisan queue:work`), and health checks (`php artisan health:check`) all flow through this path. The console kernel also handles command scheduling, which is how production cron jobs interact with Laravel — understanding the kernel's boot flow determines whether a scheduled command can access services that require a fully booted application.

---

## Core Concepts

### 1. Artisan Entry Point
`artisan` is a PHP script at the project root identical in structure to `public/index.php` but dispatching to the Console kernel:

```php
#!/usr/bin/env php
$app = require __DIR__.'/bootstrap/app.php';
$status = $app->handleCommand(
    new SymfonyInput($argv),
    new SymfonyOutput()
);
```

### 2. `handleCommand()` vs `handle()`  
In Laravel 11+, the Application itself has `handleCommand()` which bootstraps the Console kernel and dispatches:

```php
// Illuminate\Foundation\Application
public function handleCommand(InputInterface $input, OutputInterface $output)
{
    $kernel = $this->make(Kernel::class);
    $kernel->bootstrap();
    return $kernel->handle($input, $output);
}
```

### 3. Command Registration Sources
Commands are registered from four sources:
- **Framework commands**: Built-in commands like `serve`, `make:model`, `migrate`
- **Provider commands**: Any command listed in a service provider's `$commands` array
- **Directory scanning**: `$kernel->load('app/Console/Commands')` auto-discovers commands
- **Manual registration**: `$kernel->addCommand()` for programmatic registration

### 4. The Task Scheduler
The `schedule()` method defines scheduled tasks evaluated by `php artisan schedule:run`:

```php
// app/Console/Kernel.php (Laravel 10) or bootstrap/app.php
Schedule::command('emails:send')->hourly();
Schedule::job(ProcessPodcast::class)->dailyAt('03:00');
Schedule::call(fn() => Cache::forget('stats'))->everyFiveMinutes();
```

### 5. Console Bootstrap Differences
The Console kernel skips some HTTP-specific bootstrap while adding CLI-specific initialization:

```php
// Console Kernel bootstrappers (fewer than HTTP)
public function bootstrappers(): array
{
    return [
        \Illuminate\Foundation\Bootstrap\LoadConfiguration::class,
        \Illuminate\Foundation\Bootstrap\HandleExceptions::class,
        \Illuminate\Foundation\Bootstrap\RegisterFacades::class,
        \Illuminate\Foundation\Bootstrap\SetRequestForConsole::class,
        \Illuminate\Foundation\Bootstrap\RegisterProviders::class,
        \Illuminate\Foundation\Bootstrap\BootProviders::class,
    ];
}
```

---

## Mental Models

**The CLI Router vs the Web Router.** The HTTP kernel has a Router that matches URI patterns to controllers. The Console kernel has an Artisan Application that matches command names (via Symfony Console's `InputDefinition`) to `Command` class `handle()` methods. Both are dispatchers, but the console version uses Symfony Console's `Application::run()` rather than `Router::dispatch()`.

**The Command Registrar as a Class Directory.** Think of the kernel's command registration as building a CLI phonebook. Framework commands are the yellow pages (always available), provider commands are business listings (registered by packages), and `app/Console/Commands` is the white pages (your application's personal entries). The scheduler is an automated assistant that calls these phonebook entries at preset times.

**The Cron Bridge.** The task scheduler is a bridge between the operating system's cron daemon and Laravel's command system. Instead of adding 20 cron entries for every scheduled task, you add one (`* * * * * cd /project && php artisan schedule:run >> /dev/null 2>&1`) and let the kernel evaluate which tasks should run at that minute.

---

## Internal Mechanics

### Console Kernel Dispatch Flow

```
┌────────────────────────────────────────────────────────────┐
│ artisan                                                     │
│  $app = require bootstrap/app.php                           │
│  $status = $app->handleCommand($input, $output)              │
│                                                             │
├────────────────────────────────────────────────────────────┤
│ Application::handleCommand()                                 │
│  $kernel = $this->make(Kernel::class)                       │
│  $kernel->bootstrap()                                       │
│                                                             │
│  ├─ Kernel::bootstrap()                                     │
│  │  Only if ! $app->hasBeenBootstrapped()                   │
│  │  LoadConfiguration                                       │
│  │  HandleExceptions                                        │
│  │  RegisterFacades                                         │
│  │  SetRequestForConsole (creates empty Request)            │
│  │  RegisterProviders                                       │
│  │  BootProviders                                           │
│  │                                                          │
│  └─ Kernel::handle($input, $output)                         │
│     $this->resolveCommand($input)                           │
│     → Artisan::findCommand($name)                           │
│       (Symfony Console Application command lookup)          │
│     → Command::run($input, $output)                         │
│       → Command::execute($input, $output)                   │
│         → Your custom handle() method                       │
│                                                             │
│  Return int status code (0 = success, 1+ = failure)         │
└────────────────────────────────────────────────────────────┘
```

### Scheduler Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│ schedule:run command                                         │
│  $kernel->schedule() → returns Schedule instance             │
│  $schedule->dueEvents($app) → filters to runnable events     │
│  foreach ($dueEvents as $event):                             │
│    $event->run($app)                                          │
│      → command: exec artisan command via Symfony Process     │
│      → job: dispatch queue job                               │
│      → call: invoke Closure                                  │
│                                                              │
│  Each event checks mutex (file lock) to prevent overlap      │
│  Events can be filtered by environment, maintenance mode,    │
│  callback conditions (->when(), ->skip())                    │
└─────────────────────────────────────────────────────────────┘
```

### Command Registration in Laravel 10 vs 11+

```php
// Laravel 10: Kernel class registers commands
class Kernel extends ConsoleKernel
{
    protected $commands = [DeployCommand::class];
    protected function commands()
    {
        $this->load(__DIR__.'/Commands');
        require base_path('routes/console.php');
    }
}

// Laravel 11+: bootstrap/app.php registers commands
return Application::configure(...)
    ->withCommands(base_path('app/Console/Commands'))
    ->withCommands(base_path('routes/console.php'))
    // or via closure
    ->withCommands(function () {
        require base_path('routes/console.php');
    })
    ->create();
```

---

## Patterns

### 1. Command Registration with Dependencies
**When**: Your command requires constructor-injected dependencies.
**How**: Commands are resolved through the container, so all constructor dependencies auto-inject:

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

### 2. Conditionally Registered Commands
**When**: Commands should only register in specific environments.
**How**:

```php
// bootstrap/app.php
->withCommands(function (Application $app) {
    if ($app->environment('local')) {
        require base_path('routes/dev-commands.php');
    }
})
```

### 3. Scheduler with Overlap Prevention
**When**: Long-running tasks must not overlap.
**How**: Laravel uses file-based mutex (`storage/framework/schedule-*`) by default:

```php
// Scheduler mutex handling
$schedule->command('emails:send')
    ->hourly()
    ->withoutOverlapping(60); // 60 minute lock expiration
```

---

## Architectural Decisions

**Why Console kernel uses fewer bootstrappers than HTTP kernel.** The HTTP kernel needs `LoadEnvironmentVariables` because web requests may have different env contexts; console commands receive environment via CLI context or `--env` flag directly. `SetRequestForConsole` creates a dummy Request because some service providers reference `request()` — without it, provider `boot()` would crash in CLI.

**Why Artisan commands extend Symfony Console commands with a Laravel layer.** Symfony Console provides battle-tested input parsing, output formatting, and command lifecycle. Laravel layers on container resolution and Artisan-specific features (event dispatching, maintenance mode awareness) via `Command::run()` wrapping.

**Why the scheduler runs events by executing a separate PHP process.** Running commands in-process would cause state leakage between scheduled tasks. Symfony Process isolation ensures each command gets a clean Application bootstrap, preventing memory growth and state contamination across scheduled tasks.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Subprocess isolation for scheduled tasks | Each scheduled command pays full bootstrap cost | A `schedule:run` that fires 5 commands launches 5 separate PHP processes, each taking 30-60ms bootstrap |
| Auto-discovery via directory scanning | Scanning adds filesystem I/O on every artisan call | With 50+ command files, discovery adds 5-10ms to every artisan invocation |
| Provider-based command registration | Command collision resolution is last-wins, not explicit | Two packages adding the same signature silently overrides; developer may not notice |
| Container-resolved commands | Constructor injection works, but commands with many dependencies are slow to resolve | Reflection-based resolution on every command call; for hot-path commands, consider `$app->bind()` |

---

## Performance Considerations

- **Command resolution overhead.** Each command is resolved via the container. For frequently invoked commands (especially in the scheduler), resolution adds 1-5ms. Pre-resolve critical commands using `$app->instance()` or register them as singletons.
- **Scheduler subprocess overhead.** A `schedule:run` launching 3 commands each with 50ms bootstrap + 20ms execution = 210ms total wall clock. PHP process startup is the dominant cost, not the command logic itself.
- **Directory scanning on every artisan call.** The `load()` method globs for `*Command.php` files on every Artisan invocation. With 200+ command files, this glob + require loop adds 15-30ms. In Octane, this is paid once per worker boot.
- **`artisan list` (cached vs uncached).** The `artisan list` command compiles all command descriptors. Laravel 11+ caches this in `bootstrap/cache/packages.php` for production, reducing list rendering from ~100ms to ~5ms.

---

## Production Considerations

- **Set `APP_RUNNING_IN_CONSOLE` to true in deployment scripts.** The `runningInConsole()` check affects provider registration. Some providers run only in console context. Explicitly setting this value prevents edge cases where SAPI detection fails.
- **Use `php artisan optimize` for production.** This caches the command listings in `bootstrap/cache/packages.php`. Without this cache, `artisan list` performance degrades linearly with command count.
- **Add `artisan` health check to deployment.** After deployment, run `php artisan --version` to verify the bootstrap path works before routing traffic. A broken `bootstrap/app.php` will crash the console kernel silently.
- **Monitor scheduled task failures.** Laravel does not retry failed scheduled commands by default. Use `->pingBefore()` and `->thenPing()` with Laravel Pulse or third-party monitoring to detect schedule failures.
- **Use the `->environments()` filter for environment-specific scheduling.** Prevent staging tasks from running in production by chaining `->environments('production')` on sensitive commands.

---

## Common Mistakes

**Why it happens:** Developers use `$this->app->make()` inside `schedule()` method.  
**Why it's harmful:** The `schedule()` method runs during kernel construction, before providers boot. Container resolution fails or returns incomplete services.  
**Better approach:** Use closures that resolve dependencies lazily: `$schedule->call(fn () => app(Service::class)->run())->hourly()`.

**Why it happens:** Confusing `handle()` return values between commands and controllers.  
**Why it's harmful:** Returning a string or `Response` from a command instead of integer status code causes errors in process exit code detection and scheduler mutex behavior.  
**Better approach:** Always return `Command::SUCCESS` (0) or `Command::FAILURE` (1) from command `handle()`.

**Why it happens:** Not setting the mutex expiration for overlapping prevention.  
**Why it's harmful:** If a command crashes without releasing the mutex, `->withoutOverlapping()` blocks all future runs until the mutex file is manually deleted.  
**Better approach:** Always pass a reasonable `$expiresIn` parameter (e.g., `->withoutOverlapping(3600)`) to auto-expire crashed mutexes.

---

## Failure Modes

**Failure: Command not found after registration.** A command registered in a provider or directory scan doesn't appear in `artisan list`. Detection: `Command "my:cmd" is not defined`. Common causes: Command file doesn't extend `Command`, missing `$signature` property, or registration runs before kernel boot. Mitigation: Run `php artisan list` to verify; check command class signature property.

**Failure: Scheduler mutex file stuck from crashed command.** The `storage/framework` mutex file persists after a command crash, preventing future runs. Detection: Scheduled tasks stop executing; check `storage/framework/schedule-*` files. Mitigation: Use `->withoutOverlapping(3600)` to auto-expire; add monitoring to alert when a command hasn't run in expected interval.

**Failure: Environment-specific schedule runs in wrong environment.** A `->environments('staging')` command runs in production due to misconfigured `APP_ENV`. Detection: Production executes staging-only cleanup tasks. Mitigation: Audit `APP_ENV` in production; add `->when($condition)` with explicit env check.

**Failure: Octane + scheduled commands state leak.** Under Octane, if a scheduled command runs in the same process, it contaminates the shared Application state. Detection: After a scheduled command runs, subsequent HTTP requests behave unexpectedly. Mitigation: Laravel's scheduler always uses Symfony Process (subprocess isolation) — verify your scheduler is not intercepted by Octane custom wrappers.

---

## Ecosystem Usage

**Laravel Horizon** registers its own Artisan commands (`horizon:install`, `horizon:supervisor`, `horizon:snapshot`) via the Console kernel. Horizon also uses the scheduler for snapshot metrics collection, demonstrating scheduled command integration with queue monitoring.

**Laravel Pulse** uses the scheduler's `Schedule::call()` and `Schedule::command()` extensively for data recording. Pulse registers a recurring command that captures application metrics (slow requests, queries, exceptions) on a configurable interval, showing production scheduler usage at scale.

**Spatie's Laravel Scheduled Backups** uses both command registration (for the backup command) and scheduling (`backup:clean`, `backup:monitor`) to provide a complete backup orchestration system. This package demonstrates how packages integrate with the Console kernel's scheduler to provide recurring operations.

**Akaunting** registers 40+ custom commands for accounting operations (invoicing, tax calculation, report generation). The command directory auto-discovery handles this scale without manual registration, showing how `$kernel->load()` scales with application complexity.

---

## Related Knowledge Units

### Prerequisites
- Entry Point Mechanics (the `artisan` entry mirrors `public/index.php` flow)
- Application Bootstrap (Application initialization before kernel dispatch)
- Service Container (command resolution via container)

### Related Topics
- HTTP Kernel Dispatch (parallel dispatch path — both use same bootstrap pattern)
- Service Providers (commands registered via provider `$commands` property)
- Boot Order & Timing (Console kernel bootstrapper differences)
- Response Sending and Termination (console commands use direct output, not Response objects)
- Kernel Architecture (Console kernel vs HTTP kernel class hierarchy)

### Advanced Follow-up Topics
- Custom Kernel Implementations
- Octane Lifecycle Differences for CLI commands
- Framework Bootstrap Performance Benchmarking
- Symfony Console Component Internals
- Long-Running Process Architecture (Horizon, queue workers)

---

## Research Notes

### Source Analysis
- `artisan` — The CLI entry point, mirrors `public/index.php` structure but dispatches to Console kernel.
- `Illuminate\Foundation\Console\Kernel` — The Console kernel class with `handle()`, `bootstrap()`, and `schedule()` methods.
- `Illuminate\Foundation\Application::handleCommand()` — The 11+ method that wraps `$kernel->bootstrap()` + `$kernel->handle()`.
- `Symfony\Component\Console\Application::run()` — The underlying command dispatch engine that finds and executes commands.
- `Illuminate\Foundation\Console\Kernel::load()` — Directory-based command auto-discovery using glob pattern matching.
- `Illuminate\Console\Scheduling\Schedule` — The schedule definition and evaluation engine used by `schedule:run`.

### Key Insight
Console kernel dispatch is fundamentally different from HTTP dispatch because it uses Symfony Console's `Application::run()` rather than Laravel's `Router::dispatch()`. Command registration is a multi-source conflict-resolution problem (framework commands, provider commands, directory scanning, manual registration) solved by last-wins ordering — meaning application commands can override framework commands by registering later. The scheduler's subprocess isolation (each scheduled command runs in a separate PHP process via Symfony Process) prevents state leakage across scheduled tasks but means every scheduled command pays full bootstrap cost.

### Version-Specific Notes
- **Laravel 10**: Dedicated `App\Console\Kernel` class extending `Illuminate\Foundation\Console\Kernel`. Commands registered via `$commands` property and `commands()` method. Scheduler defined in `schedule()` method on the Kernel class.
- **Laravel 11**: `App\Console\Kernel` removed. Commands configured in `bootstrap/app.php` via `->withCommands()`. Scheduler still defined in `routes/console.php` or application service provider.
- **Laravel 12**: `ApplicationBuilder` gains `->withCommands()` closure support for conditional command registration. Command cache added for `artisan list` optimization.
- **Laravel 13**: Scheduler event hooks (before/after task execution) added for observability. Octane-compatible command execution mode for long-running workers.
