# Console vs HTTP Boot Differences

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Boot Order & Timing
- **Last Updated:** 2026-06-02

## Executive Summary
Laravel provides two distinct kernel implementations—`HttpKernel` and `ConsoleKernel`—each with its own boot sequence tailored to its execution context. While both traverse the same fundamental 16-step pipeline, they differ in bootstrapper composition, service provider registration, environment initialization, and termination semantics. Console commands typically boot fewer providers (many are deferred and never triggered), skip session and cookie middleware, and use a simplified output pipeline. Understanding these differences is critical for writing Artisan commands that behave correctly in both contexts, optimizing console command boot time, and debugging issues that manifest only in one environment.

## Core Concepts

### Two Kernel Paths
```
HTTP Request                          Artisan Command
    │                                      │
    ▼                                      ▼
public/index.php                     artisan (script)
    │                                      │
    ▼                                      ▼
bootstrap/app.php                    bootstrap/app.php
    │                                      │
    ▼                                      ▼
App\Http\Kernel                      App\Console\Kernel
    │                                      │
    ▼                                      ▼
Kernel::handle(Request)              Kernel::handle(Input)
    │                                      │
    ▼                                      ▼
bootstrap()                          bootstrap()
(6 bootstrappers)                    (5 bootstrappers—no RegisterFacades)
    │                                      │
    ▼                                      ▼
Send request through                 Parse command input,
middleware pipeline                  run command, return exit code
    │                                      │
    ▼                                      ▼
Return Response                      Return exit code (int)
```

### Bootstrapper Comparison

| Bootstrapper | HTTP | Console | Notes |
|---|---|---|---|
| LoadEnvironmentVariables | ✅ | ✅ | Both need .env |
| LoadConfiguration | ✅ | ✅ | Both need config |
| HandleExceptions | ✅ | ✅ | Both need error handling |
| RegisterFacades | ✅ | ❌ | Facades loaded lazily in console |
| RegisterProviders | ✅ | ✅ | Both register providers |
| BootProviders | ✅ | ✅ | Both boot providers |

### Kernel Class Differences

```php
// App\Http\Kernel
class Kernel extends HttpKernel
{
    protected $bootstrappers = [
        \Illuminate\Foundation\Bootstrap\LoadEnvironmentVariables::class,
        \Illuminate\Foundation\Bootstrap\LoadConfiguration::class,
        \Illuminate\Foundation\Bootstrap\HandleExceptions::class,
        \Illuminate\Foundation\Bootstrap\RegisterFacades::class,
        \Illuminate\Foundation\Bootstrap\RegisterProviders::class,
        \Illuminate\Foundation\Bootstrap\BootProviders::class,
    ];

    protected $middlewareGroups = [
        'web' => [...],
        'api' => [...],
    ];
}

// App\Console\Kernel
class Kernel extends ConsoleKernel
{
    // No $bootstrappers property—uses parent default
    // which excludes RegisterFacades
    
    protected $commands = [
        Commands\Inspire::class,
    ];
}
```

### The `runningInConsole()` Check
```php
// Application::runningInConsole()
public function runningInConsole()
{
    return php_sapi_name() === 'cli' || php_sapi_name() === 'phpdbg';
}
```

This method is referenced throughout the framework to conditionally register routes, providers, and middleware:

```php
// Example: RouteServiceProvider
public function boot()
{
    parent::boot();
    
    if (! $this->app->runningInConsole()) {
        // HTTP-only routes
        Route::middleware('web')
            ->group(base_path('routes/web.php'));
    }
}
```

## Mental Models

### The Two Doors
Imagine the same building (Application) with two different entrances:

- **HTTP Door:** A full-service entrance with coat check, security, and reception (facades, sessions, cookies, CSRF). Every visitor goes through the complete process.
- **Console Door:** A service entrance with only basic security (no frills). Workers (commands) enter efficiently, do their job, and leave.

Both doors lead to the same interior (the booted application), but the experience and available services differ.

### The Flashlight vs The Floodlight
HTTP boot is like turning on a floodlight: it illuminates everything (all providers, all middleware, all facades). Console boot is like a flashlight: it only illuminates what the command needs (minimal providers, no facades unless triggered). The flashlight is more efficient but you can't see everything at once.

## Internal Mechanics

### Console Kernel Bootstrap
```php
// Illuminate\Foundation\Console\Kernel
public function bootstrap()
{
    if (! $this->app->hasBeenBootstrapped()) {
        $this->app->bootstrapWith($this->bootstrappers());
    }
}

protected function bootstrappers()
{
    return [
        \Illuminate\Foundation\Bootstrap\LoadEnvironmentVariables::class,
        \Illuminate\Foundation\Bootstrap\LoadConfiguration::class,
        \Illuminate\Foundation\Bootstrap\HandleExceptions::class,
        // Note: NO RegisterFacades here
        \Illuminate\Foundation\Bootstrap\RegisterProviders::class,
        \Illuminate\Foundation\Bootstrap\BootProviders::class,
    ];
}
```

### The Artisan Command Flow
```php
// In artisan script
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$status = $kernel->handle(
    $input = new Symfony\Component\Console\Input\ArgvInput,
    new Symfony\Component\Console\Output\ConsoleOutput
);

// Inside ConsoleKernel::handle():
public function handle($input, $output = null)
{
    try {
        $this->bootstrap();  // Boots the app (without facades)
        
        return $this->getArtisan()->run($input, $output);
    } catch (Exception $e) {
        $this->reportException($e);
        $this->renderException($output, $e);
        return 1;
    }
}
```

### Facade Loading in Console
Without `RegisterFacades` as a bootstrapper, facades are not automatically aliased in console commands. However, `ArtisanServiceProvider` registers facades when needed:

```php
// Illuminate\Foundation\Providers\ArtisanServiceProvider
public function register()
{
    if ($this->app->runningInConsole()) {
        // Registers Artisan-necessary facades
    }
}
```

If a command uses `\Cache::get()` and the Cache facade alias isn't registered, PHP throws a class-not-found error. The solution is to either:
1. Add `RegisterFacades` to the console kernel's bootstrappers
2. Import the facade explicitly: `use Illuminate\Support\Facades\Cache;`

### Default Bootstrapper Resolution
```php
// HttpKernel
protected $bootstrappers = [
    // Explicit list with all 6
];

// ConsoleKernel
// Inherits from parent, which only has 5 (no RegisterFacades)
```

### The RunningInConsole Effects
The `runningInConsole()` check affects:
- **Service provider registration:** Some providers skip middleware registration in console mode
- **Route loading:** Console commands typically don't load web routes
- **Session/Cookie handling:** Not initialized in console mode
- **Maintenance mode:** `php artisan down`/`up` checks skip in console mode
- **Debugbar/Telescope:** These disable or reduce in console mode

```php
// TelescopeServiceProvider
public function boot()
{
    if ($this->app->runningInConsole()) {
        $this->commands([...]);
    }
    // Watchers only register for HTTP in certain cases
}
```

### Termination Differences
```php
// ConsoleKernel::terminate()
public function terminate($input, $status)
{
    // No terminable middleware to fire
    $this->app->terminate();
}
```

```php
// HttpKernel::terminate()
public function terminate($request, $response)
{
    $this->terminateMiddleware($request, $response);
    $this->app->terminate();
}
```

HTTP kernel fires terminable middleware; console kernel does not. Console termination is simpler—no middleware, no response objects.

## Patterns

### Environment-Conditional Registration
```php
public function boot()
{
    if ($this->app->runningInConsole()) {
        $this->commands([
            InstallCommand::class,
            ResetCommand::class,
        ]);
    }
    
    if ($this->app->runningInConsole()) {
        // Don't register HTTP routes in console
        return;
    }
    
    $this->loadRoutesFrom(__DIR__.'/../routes/web.php');
}
```

### Command-Only Provider
```php
class CommandProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->singleton(ReportGenerator::class);
    }
    
    public function boot()
    {
        if ($this->app->runningInConsole()) {
            $this->commands([
                GenerateReportCommand::class,
            ]);
        }
    }
}
```

### Test-Aware Boot Logic
```php
public function boot()
{
    if ($this->app->runningUnitTests()) {
        config(['mail.driver' => 'array']);
    }
}
```

## Architectural Decisions

### Why omit RegisterFacades from ConsoleKernel?
Facade aliases provide developer convenience but consume memory (~20-40KB for the alias map) and add overhead. Console commands rarely need all facades; those that do can import facades explicitly. This keeps console boot leaner and faster.

### Why share the same Application instance?
Both kernels use the same `$app` instance from `bootstrap/app.php`. This ensures service providers, bindings, and configuration are consistent regardless of entry point. The application doesn't know which kernel invoked `boot()`—it just boots.

### Why no middleware in console kernel?
Console commands don't handle HTTP requests, so HTTP-specific middleware (session, CSRF, CORS) is irrelevant. The console kernel focuses on input parsing and command dispatch.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Console boot is faster (~20% fewer bootstrappers) | Console commands lack facade aliases by default | Commands must explicitly import facades or add RegisterFacades to console kernel |
| Shared application ensures consistent state | Console command timings differ from HTTP timings | Deferred providers triggered during a console command persist their singletons in shared memory for subsequent commands |
| Simpler console termination (no middleware) | Console commands cannot use terminable middleware | Must use alternative patterns (defer, shutdown callback) for post-command cleanup |
| runningInConsole() enables environment-specific logic | Overuse leads to untested HTTP-only code paths | Console-specific conditions in providers are hard to test without artisan |

## Performance Considerations

- **Console boot speed:** Without facade registration, console boot is ~5-15ms faster than HTTP boot.
- **Deferred providers in console:** Many deferred providers (mail, notifications, filesystem) may never load during a console command that only runs database operations. This keeps console memory usage lower.
- **Repeated command execution:** When running multiple artisan commands in a single process (e.g., in tests), the app is already booted. Subsequent commands skip the bootstrap phase entirely.
- **OPcache impact:** Console commands run in a CLI process with OPcache enabled. File I/O is cached the same as HTTP.
- **Command discovery overhead:** On first run, Artisan scans registered directories for command classes. `php artisan optimize` caches this.

## Production Considerations

- **Scheduler bootstrap:** `php artisan schedule:run` boots the full console application on every minute. Each scheduled task triggers a full boot. For high-frequency scheduling, consider `schedule:work` (Laravel 11+) which keeps the app booted between tasks.
- **Deferred provider awareness:** Console commands that trigger heavy deferred providers (e.g., `php artisan queue:work` triggers Horizon provider) may have slow first execution. Warm up with a dummy run after deploy.
- **`runningInConsole()` in production:** Some services (e.g., Sentry) alter behavior based on `runningInConsole()`. Ensure console error reporting is configured appropriately—don't suppress console logging in production.
- **Environment detection:** Console commands inherit the same `.env` as HTTP requests. There is no separate console environment file.
- **Maintenance mode:** `php artisan down` puts the app in maintenance mode for HTTP requests. Console commands are unaffected unless they explicitly check `$app->isDownForMaintenance()`.

## Common Mistakes

- **Assuming facades are available in console commands:** `Cache::get()`, `DB::select()`, etc. work only if the facade alias is registered (via `RegisterFacades` bootstrapper or explicit `use` import). Always import facades explicitly in console commands.
- **Using `exit()` or `dd()` in commands:** These terminate the command but also prevent `terminate()` from running. Use `$this->error()` or return appropriate exit codes.
- **Calling `abort()` in console commands:** `abort()` sends HTTP responses. Use `throw new \RuntimeException('message')` instead.
- **Depending on HTTP middleware in commands:** Session, cookies, and CSRF protection are not available in console commands. Use direct database/API access instead.
- **Overusing `runningInConsole()`:** If a method has both HTTP and console paths, consider splitting into separate services rather than branching on `runningInConsole()`.
- **Forgetting that `php artisan tinker` boots the app:** Tinker boots the full console kernel. Heavy service providers (Horizon, Telescope) run on every tinker session.

## Failure Modes

| Failure | Symptom | Root Cause | Mitigation |
|---|---|---|---|
| Facade class not found | `Class "Cache" not found` in console command | RegisterFacades bootstrapper not running | Import facade: `use Illuminate\Support\Facades\Cache` |
| Command runs differently in HTTP vs console | Different results for same logic | `runningInConsole()` branching creates untested paths | Test both environments; minimize branching |
| Console boot hangs | artisan command never returns | Deferred provider triggers infinite loop or network timeout | Profile with `-vvv` flag; check deferred provider dependencies |
| Command works locally but fails in production | Environment difference | Config cache changes provider behavior in console | Run `php artisan config:cache` after deployment; check `APP_ENV` |
| Memory leak in long-running artisan command | Growing RSS | Loop within command allocates without freeing | Use `memory_get_usage()` to monitor; batch process; unset variables |
| Scheduler running commands too slowly | Cron job timing out | Each scheduled command does full boot | Use `schedule:work` (Laravel 11) to keep app booted between tasks |

## Ecosystem Usage

- **Laravel Horizon:** `php artisan horizon` boots the console kernel and then forks into a long-running daemon. Horizon adds its own bootstrappers for supervising queue workers.
- **Laravel Telescope:** In console commands, Telescope registers a special tag to distinguish Artisan executions from HTTP requests. It uses `runningInConsole()` to adjust its data recording.
- **Laravel Backup (Spatie):** The `backup:run` command boots the console kernel, triggers deferred providers for filesystem and notification services, and terminates after completion.
- **Laravel Debugbar:** Disables itself when `runningInConsole()` is true, since there's no HTTP response to inject a debug bar into.
- **Nova:** Nova's Artisan commands (`nova:install`, `nova:publish`) boot with the console kernel. They register Nova-specific bindings only needed during installation.
- **Livewire:** Livewire's `livewire:make` command creates component classes. It uses the console kernel, skipping Livewire's HTTP-specific middleware registration.

## Related Knowledge Units

### Prerequisites
- [Complete Boot Sequence](../complete-boot-sequence/02-knowledge-unit.md) — the 16-step pipeline that differs between HTTP and Console kernels.
- [Bootstrapper Sequence](../application-bootstrap/bootstrapper-sequence/02-knowledge-unit.md) — how kernel-specific bootstrapper arrays differ.

### Related Topics
- [Bootstrap with Event System](../bootstrap-with-event-system/02-knowledge-unit.md) — how bootstrap events are suppressed differently in console vs HTTP.
- [Register Phase Order](../register-phase-order/02-knowledge-unit.md) — how the registration phase differs without RegisterFacades in console.
- [Boot Phase Order](../boot-phase-order/02-knowledge-unit.md) — shared boot mechanics across both kernel types.
- [Deferred Provider Loading Timing](../deferred-provider-loading-timing/02-knowledge-unit.md) — how deferred providers affect console command performance differently.

### Advanced Follow-up Topics
- [Octane Boot Timing](../octane-boot-timing/02-knowledge-unit.md) — Octane as a third execution context with its own boot characteristics.
- [Optimize Command](../caching-optimization/optimize-command/02-knowledge-unit.md) — how caching affects console vs HTTP boot performance differently.
- [Application Builder Configuration](../application-bootstrap/application-builder-configuration/02-knowledge-unit.md) — context-conditional builder configuration patterns.

## Research Notes
- Laravel 11's ConsoleKernel moved command discovery to the `commands` method, removing the need to list commands in `$commands` property. This changed the provider registration flow for commands.
- `php artisan optimize` generates a cached command manifest (`bootstrap/cache/packages.php` and `bootstrap/cache/services.php`) that speeds up command discovery.
- The `RegisterFacades` exclusion from console bootstrappers has been in place since Laravel 5.0. It was originally a memory optimization for CLI scripts.
- Future versions may merge HTTP and Console kernels into a unified kernel with context-dependent behavior, reducing code duplication.
- Swoole/RoadRunner (Octane) adds a third execution context: the Octane worker process. Its boot sequence combines elements of both HTTP (needs facades) and Console (long-running process).
