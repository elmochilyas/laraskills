# Skills for Kernel Architecture

---

## Skill: Register Artisan Commands Explicitly for Production

### Purpose
Register Artisan commands using the explicit `$commands` array pattern to avoid autoloader overhead from auto-discovery.

### When To Use
- When registering commands in a production Laravel application
- When you know the exact list of commands your application uses

### When NOT To Use
- During rapid local development where commands are frequently added/removed
- When prototyping with a small command set where `load()` convenience outweighs overhead

### Prerequisites
- Knowledge of `Illuminate\Foundation\Console\Kernel` structure
- Access to the kernel configuration file (`bootstrap/app.php` in Laravel 11+ or `App\Console\Kernel` in Laravel 10)

### Inputs
- List of fully qualified Artisan command class names

### Workflow (numbered steps)
1. Identify all command classes in your application's `Console/Commands` directory
2. Open kernel configuration file (`bootstrap/app.php` for Laravel 11+, or `app/Console/Kernel.php` for Laravel 10)
3. Replace or supplement any `load(__DIR__.'/Commands')` call with explicit class array
4. For Laravel 11+: add `->withCommands([CommandClass::class, ...])` to the ApplicationBuilder chain
5. For Laravel 10: populate the `$commands = [CommandClass::class, ...]` property
6. Verify registration: run `php artisan list` and confirm all commands appear
7. Test that each command executes correctly: `php artisan <command> --help`

### Validation Checklist
- [ ] All intended commands appear in `php artisan list` output
- [ ] No class-not-found errors when running any registered command
- [ ] Autoloader calls reduced compared to `load()` approach (verify with Xdebug trace if needed)

### Common Failures
- Typo in class name or namespace causes runtime resolution error
- Missing `use` import for command class in bootstrap file
- Commands registered in both `$commands` and `load()` — duplicate registration

### Decision Points
- If the command list changes frequently: maintain a central registry file imported by both kernel config and `artisan` make:command generator
- If using Laravel 11+ `->withCommands()`: use array spread to merge dynamic and static lists

### Performance Considerations
- Explicit registration avoids loading every file in the commands directory
- Each class registered explicitly is still autoloaded lazily (only when resolved by Symfony Console)
- For 50+ commands, explicit registration shaves ~2-5ms off every `artisan` invocation

### Security Considerations
- Ensure command classes are not accessible via public HTTP endpoints
- Commands run with the same permissions as the CLI user — avoid running dangerous commands as root

### Related Rules (from 05-rules.md)
- Prefer explicit command registration over auto-discovery in production
- Keep console command `handle()` methods thin by delegating to service classes

### Related Skills
- HTTP Kernel — Trace `sendRequestThroughRouter()` Flow
- Kernel Bootstrappers — Customize Bootstrap Sequence

### Success Criteria
- `php artisan list` shows all registered commands
- No autoloader errors for command files during registration
- Console bootstrap time measurably reduced compared to `load()` approach

---

## Skill: Trace Console Kernel Handle Flow End-to-End

### Purpose
Understand the complete flow from `php artisan` invocation through the Console Kernel's `handle()` method to command execution.

### When To Use
- When debugging why an Artisan command behaves differently than expected
- When writing a custom kernel or extending the console kernel
- When analyzing bootstrap overhead for CLI commands

### When NOT To Use
- For simple command implementation — the handle flow is abstracted away
- When the framework handles everything correctly and no debugging is needed

### Prerequisites
- Access to `Illuminate\Foundation\Console\Kernel` source code
- Basic understanding of Symfony Console Application

### Inputs
- The Artisan command name and arguments being traced

### Workflow (numbered steps)
1. Locate `Illuminate\Foundation\Console\Kernel::handle()` source
2. Identify the three phases: input parsing, bootstrap, Symfony Application dispatch
3. Trace how the Symfony Console `InputInterface` is constructed from `$_SERVER['argv']`
4. Follow the bootstrap call — note the six bootstrappers and their fixed order
5. Examine how the Symfony Application resolves the matching command
6. Trace the command's `handle()` method invocation with injected dependencies
7. Observe the exit code returned and how it propagates back to the CLI

### Validation Checklist
- [ ] Each of the six bootstrappers executes in the documented order
- [ ] The correct Artisan command is resolved for the given input
- [ ] Command dependencies are injected correctly via the container
- [ ] Exit code is properly communicated to the shell

### Common Failures
- Misidentifying which kernel (HTTP vs Console) handles a request
- Expecting HTTP services (request, session, auth) to be available in console commands
- Overlooking the guarded bootstrap flag in test scenarios with multiple `$this->artisan()` calls

### Decision Points
- If debugging command resolution failure: check alias registration in `$commands` or `->withCommands()`
- If command receives wrong arguments: verify Symfony Console argument definitions match CLI usage

### Performance Considerations
- Bootstrap accounts for >80% of execution time for simple commands
- The guarded bootstrap flag prevents redundant initialization on repeated calls within the same process
- Lazy command loading means unexecuted commands (like `list`) instantiate almost nothing

### Security Considerations
- Console commands run with CLI permissions — avoid allowing user-controlled input to trigger dangerous operations
- `.env` files are parsed during bootstrap — ensure filesystem permissions restrict access
- Exit codes matter in CI/CD — always return `Command::SUCCESS` or `Command::FAILURE`

### Related Rules (from 05-rules.md)
- Always bound long-running commands with `--max-jobs` and `--max-time`
- Do not inject HTTP-specific services into console commands

### Related Skills
- HTTP Kernel — Trace `sendRequestThroughRouter()` Flow
- Kernel Bootstrappers — Customize Bootstrap Sequence
- Register Artisan Commands Explicitly for Production

### Success Criteria
- Can articulate every step from CLI invocation to command `handle()` execution
- Can identify where in the flow a given bug or performance issue originates
- Can write a test that verifies command behavior using `$this->artisan()`

---

## Skill: Add Task Scheduler with Overlap Protection

### Purpose
Configure Laravel's task scheduler with best-practice overlapping protection, background execution, and resource limits to prevent race conditions and memory leaks.

### When To Use
- When defining scheduled tasks in any Laravel application
- When a scheduled task's execution time may exceed its scheduling interval

### When NOT To Use
- For tasks that complete in under 1 second and are scheduled hourly or less frequently
- For tasks that are already managed by an external cron system outside Laravel

### Prerequisites
- Access to kernel schedule definition (in `App\Console\Kernel::schedule()` for Laravel 10 or `bootstrap/app.php` for Laravel 11+)
- Understanding of cron expression equivalence for fluent methods like `->daily()`, `->hourly()`

### Inputs
- List of commands or job classes to schedule
- Desired frequency and timing constraints
- List of tasks that may run longer than their interval

### Workflow (numbered steps)
1. Open the schedule definition file
2. For each task, add `$schedule->command(Command::class)->frequency()`
3. Apply `->withoutOverlapping()` to any task that may exceed its interval
4. Apply `->runInBackground()` for tasks whose output is not needed by subsequent tasks
5. Set `->maxRunTime()` with a realistic upper bound per task
6. For tasks prone to memory leaks, add `->maxJobs()` or wrap with process-level limits
7. Verify all tasks appear in `php artisan schedule:list` output
8. Test manually: run `php artisan schedule:run` and observe behavior

### Validation Checklist
- [ ] Each scheduled task has appropriate frequency, overlap guard, and time limit
- [ ] `->withoutOverlapping()` is applied to all long-running tasks
- [ ] Background tasks use `->runInBackground()` where appropriate
- [ ] `php artisan schedule:list` shows all tasks with their scheduling expressions

### Common Failures
- Forgetting `->withoutOverlapping()` causes duplicate processes for the same task
- Missing `->runInBackground()` blocks subsequent tasks in the schedule
- Incorrect cron mapping: `->everyMinute()` for tasks meant to run hourly
- Task definitions that depend on request context fail with null values

### Decision Points
- If a task must send output: use `->emailOutputTo()` or `->sendOutputTo()` instead of `->runInBackground()`
- If two tasks share dependencies: schedule them sequentially or use `->before()` / `->after()` callbacks

### Performance Considerations
- `schedule:run` evaluates every registered task's due constraints — 50+ slow `due()` checks add overhead
- Foreground tasks block the entire schedule sequence — use `->runInBackground()` liberally
- `->withoutOverlapping()` uses a cache lock — ensure cache driver supports atomic locks

### Security Considerations
- Never pass secrets or credentials directly in command arguments visible in `ps` output
- Background task output is discarded unless explicitly redirected — use logging instead
- `->environments('production')` restricts task execution to specific environments

### Related Rules (from 05-rules.md)
- Keep schedule task evaluation fast and idempotent
- Use `->withoutOverlapping()` for all long-running scheduled tasks
- Prefer `->runInBackground()` for non-critical scheduled tasks
- Keep console command `handle()` methods thin

### Related Skills
- Register Artisan Commands Explicitly for Production
- Trace Console Kernel Handle Flow End-to-End

### Success Criteria
- All scheduled tasks execute at correct frequencies without overlap
- Long-running tasks do not block subsequent tasks
- Workers are recycled before memory leaks cause OOM

---

## Skill: Trace `sendRequestThroughRouter()` Flow in HTTP Kernel

### Purpose
Understand the complete request processing pipeline from HTTP kernel `handle()` through middleware to router dispatch.

### When To Use
- When debugging middleware execution order issues
- When writing custom kernel extensions or middleware hooks
- When analyzing per-request performance bottlenecks in the framework

### When NOT To Use
- For simple route or controller debugging — the router handles most concerns internally
- When the default flow is correct and no customization is needed

### Prerequisites
- Access to `Illuminate\Foundation\Http\Kernel` source code
- Understanding of `Illuminate\Pipeline\Pipeline` pattern

### Inputs
- The HTTP request object entering the kernel

### Workflow (numbered steps)
1. Locate `Illuminate\Foundation\Http\Kernel::handle()` source
2. Identify the bootstrap call — note it runs exactly once per kernel instance
3. Trace into `sendRequestThroughRouter()` — observe the Pipeline construction
4. Examine how `$this->middleware` (global + groups + route) is gathered and flattened
5. Observe the priority sort via `sortMiddleware()` using `$middlewarePriority`
6. Trace `then($this->dispatchToRouter())` — the destination closure
7. Follow `dispatchToRouter()` into `Router::dispatch()` — observe route matching and controller resolution
8. Trace the response returning through reversed middleware (post-middleware code executing in reverse order)

### Validation Checklist
- [ ] Bootstrap executes once per kernel instance (guarded by `$this->hasBeenBootstrapped`)
- [ ] Middleware gathers from global, group, and route sources in correct order
- [ ] Priority array correctly reorders cross-source middleware
- [ ] `dispatchToRouter()` passes the fully processed request to the router
- [ ] Response correctly returns through all middleware layers

### Common Failures
- Missing middleware due to incorrect group assignment or priority misconfiguration
- Overriding `handle()` instead of using middleware — bypasses the entire pipeline
- `sendRequestThroughRouter()` not called if `handle()` is customized

### Decision Points
- If adding custom bootstrapper: add to `$bootstrappers` array, not by overriding `handle()`
- If modifying response composition: use middleware post-code, not kernel extension

### Performance Considerations
- Bootstrap accounts for 60-80% of framework overhead — config caching is critical
- Pipeline construction per request: array gathering + priority sort is O(n) and negligible (<0.1ms)
- Route caching serializes middleware definitions, eliminating per-request gathering overhead

### Security Considerations
- Middleware that short-circuits (auth failure) prevents downstream execution — order matters
- `TrustProxies` must run before any middleware that inspects request IP
- Bootstrappers load environment and config — must complete before any middleware runs

### Related Rules (from 05-rules.md)
- Keep global middleware minimal; prefer group or route middleware
- Always return `$next($request)` from middleware handle methods
- Do not override `handle()` on the HTTP Kernel — use middleware or bootstrappers
- Verify middleware execution order with `php artisan route:list -v`

### Related Skills
- Trace Console Kernel Handle Flow End-to-End
- Kernel Bootstrappers — Customize Bootstrap Sequence

### Success Criteria
- Can diagram the full flow: `handle()` → `bootstrap()` → `sendRequestThroughRouter()` → Pipeline → `dispatchToRouter()`
- Can predict where in the pipeline a given middleware executes
- Can identify the root cause of middleware ordering or bootstrap issues

---

## Skill: Configure Middleware Registration and Execution Order

### Purpose
Register, order, and verify middleware across global, group, and route levels with correct priority for cross-source dependencies.

### When To Use
- When adding new middleware to a Laravel application
- When reordering existing middleware for dependency resolution
- When debugging middleware execution order issues

### When NOT To Use
- For simple default configurations where no customization is needed
- When middleware ordering is already correct and verified

### Prerequisites
- Knowledge of the middleware pipeline model (global → group → route)
- Understanding of `$middlewarePriority` and its cross-source sort mechanism
- Access to middleware configuration file (`bootstrap/app.php` for Laravel 11+, kernel properties for Laravel 10)

### Inputs
- List of middleware classes to register
- Desired execution order relative to existing middleware
- Known dependency constraints between middleware

### Workflow (numbered steps)
1. Determine each middleware's scope: global (all routes), group (route file), or route-specific
2. For global middleware: add to `$middleware->append()` / `->prepend()` (Laravel 11+) or `$middleware` array (Laravel 10)
3. For group middleware: modify the specific group with `$middleware->web(append: [...])` or define a new group
4. For route middleware: register an alias with `$middleware->alias('name', Class::class)` and apply in routes
5. If middleware must run before/after framework middleware from different sources, add to `$middleware->priority()`
6. Run `php artisan route:list -v` to verify the resolved middleware stack for affected routes
7. Test each route's behavior — confirm pre- and post-middleware code executes as expected

### Validation Checklist
- [ ] Each middleware correctly registered at the intended scope level
- [ ] Route middleware aliases resolve to correct class names
- [ ] `route:list -v` shows middleware in the expected execution order
- [ ] Priority only used for cross-source ordering, not within a single array
- [ ] No duplicate middleware running on any route

### Common Failures
- Using global append when group-specific append was intended — middleware runs on unintended routes
- Adding middleware to priority without checking scope — affects all routes globally
- Forgetting to register route middleware alias — alias not found at runtime
- Duplicate middleware running twice because it appears in both group and route-level assignments

### Decision Points
- If middleware must run on all routes: use global stack; if subset: use group or route
- If two middleware from different sources have a dependency: use priority; if same source: order the array

### Performance Considerations
- Each global middleware adds ~0.1-0.5ms per request — keep global stack minimal
- Priority sort is O(n*m) for n middleware and m priority entries — negligible for <30 middleware
- Route caching serializes resolved middleware identifiers — always cache after middleware changes

### Security Considerations
- Auth middleware must run before middleware that accesses authenticated user data
- `TrustProxies` must run before any IP-dependent middleware
- Infrastructure middleware (maintenance, trusted proxies) should be global

### Related Rules (from 05-rules.md)
- Keep global middleware minimal; prefer group or route middleware
- Always return `$next($request)` from middleware handle methods
- Keep `terminate()` methods lightweight; defer heavy work to queues
- Use `Contracts\Http\Kernel` for type-hints instead of concrete kernel classes

### Related Skills
- Trace `sendRequestThroughRouter()` Flow in HTTP Kernel
- Kernel Bootstrappers — Customize Bootstrap Sequence

### Success Criteria
- All middleware executes on intended routes only
- Execution order respects dependency constraints
- `route:list -v` confirms the resolved stack matches the intended design

---

## Skill: Configure Lifetime and Memory Limits for Long-Running Commands

### Purpose
Apply `--max-jobs` and `--max-time` limits to queue workers and other long-running Artisan commands to prevent memory leaks from causing OOM crashes.

### When To Use
- When running `php artisan queue:work` or queue workers via Horizon
- When writing or deploying any Artisan command that runs in a loop
- When configuring Supervisor or process manager for queue workers

### When NOT To Use
- For single-execution commands that complete immediately (e.g., `php artisan cache:clear`)
- For PHP-FPM HTTP requests where process isolation provides per-request freshness

### Prerequisites
- Knowledge of queue worker configuration deployment
- Access to Supervisor configuration or Horizon configuration files

### Inputs
- Memory profiling data: baseline memory per worker, per-job growth rate, memory limit
- Expected throughput: jobs per second or maximum execution time per worker session

### Workflow (numbered steps)
1. Profile worker memory: run worker for 100 jobs, measure baseline and endpoint `memory_get_usage(true)`
2. Calculate per-job growth rate: `(end_memory - start_memory) / job_count`
3. Calculate safe `max_requests`: `(memory_limit - safe_margin - baseline) / growth_per_job`
4. For `queue:work` CLI: add flags `--max-jobs=<calculated_value> --max-time=3600`
5. For Horizon config: set `maxJobs` and `maxTime` per worker pool in `config/horizon.php`
6. For Supervisor: ensure `stopwaitsecs` = `maxRunTime` + buffer to allow graceful shutdown
7. Verify: run worker, confirm it stops after `max-jobs` or `max-time`, memory is freed, worker respawns

### Validation Checklist
- [ ] Worker memory growth is estimated from baseline profiling
- [ ] `max_jobs` or `maxJobs` is configured and enforced
- [ ] `max_time` or `maxTime` is configured as a safety net
- [ ] Process manager (Supervisor/Horizon) restarts terminated workers
- [ ] No OOM crashes observed after multiple worker recycle cycles

### Common Failures
- Setting `max_jobs` too high based on flawed profiling — workers still OOM before limit
- Setting `max_jobs` too low — excessive worker churn wastes throughput
- Forgetting `--max-time` — worker may run indefinitely even if `max-jobs` is set (e.g., queue is empty)
- Horizon `maxJobs` and CLI `--max-jobs` are independent settings — both must be configured

### Decision Points
- If growth rate is zero or negligible: set `max_jobs` based on maximum acceptable response time, not memory
- If memory is highly variable per job: use `--max-time` as the primary limiter with a conservative `--max-jobs`

### Performance Considerations
- Lower `max_jobs` = higher worker churn = more bootstrap overhead and colder caches
- Higher `max_jobs` = more accumulation risk = higher OOM probability
- Aim for the sweet spot where workers recycle every 15-60 minutes under normal load

### Security Considerations
- OOM crash during a job may prevent `after()` callbacks or database transaction rollback
- `--max-time` with too-aggressive timeout causes lost jobs before they complete
- In Horizon, `maxJobs` is per-worker-pool — configure separately for different queue connections

### Related Rules (from 05-rules.md)
- Always bound long-running commands with `--max-jobs` and `--max-time`
- Always set `--max-jobs` or Horizon `maxJobs`

### Related Skills
- Trace Console Kernel Handle Flow End-to-End
- Add Task Scheduler with Overlap Protection

### Success Criteria
- Workers recycle before memory limit is reached
- No OOM crashes in production over a 7-day period
- Worker uptime is stable (each cycle reaches `max_jobs` or `max_time` before termination)

---

## Skill: Configure Request Duration Lifecycle Handlers for Performance Monitoring

### Purpose
Register threshold-based callbacks that log or alert on slow requests, enabling passive performance monitoring without external profiling tools.

### When To Use
- When you need to detect slow requests in production without external monitoring
- When setting up graduated performance alerting (warning vs critical thresholds)
- When calibrating performance baselines for a new deployment

### When NOT To Use
- When you need to modify the response based on timing — handlers run post-response
- When real-time alerting for every request is needed — handlers only fire above threshold
- When the monitoring overhead from callbacks itself impacts performance

### Prerequisites
- Knowledge of `$kernel->whenRequestLifecycleIsLongerThan()` API
- Access to a service provider's `boot()` method or `bootstrap/app.php`

### Inputs
- Threshold values in milliseconds (start conservative, tune downward)
- Handler callbacks (log, alert, or diagnostic capture)
- Severity tiers (warning, critical, emergency)

### Workflow (numbered steps)
1. Open a service provider `boot()` method or `bootstrap/app.php`
2. Resolve the kernel: `$kernel = $this->app->make(Kernel::class)`
3. Register your first handler at a conservative threshold (e.g., 2000ms)
4. Inside the callback, wrap logic in try-catch to prevent crash propagation
5. Selectively extract diagnostic fields (URL, method, status, duration) — never log full objects
6. Register a second handler at a higher threshold (e.g., 5000ms) for critical alerting
7. Deploy, monitor for one week, analyze the distribution of durations
8. Calibrate thresholds downward incrementally (500ms steps) based on real data

### Validation Checklist
- [ ] At least two thresholds registered for graduated severity (warning + critical)
- [ ] All handler callbacks wrapped in try-catch blocks
- [ ] No full request/response objects logged — only extracted fields
- [ ] Handlers registered in `boot()` method, not `register()`
- [ ] No recursion risk — handlers do not trigger other monitored requests
- [ ] Thresholds calibrated from real traffic data, not arbitrary values

### Common Failures
- Handler throws an exception, crashing the terminate phase silently
- Handler logs full request objects, exposing passwords, tokens, and PII
- Handler triggers another HTTP request that is itself slow — infinite recursion
- Handler registered in `register()` before kernel is fully resolved — registration silently fails
- Single threshold generates too much noise (too low) or misses important outliers (too high)

### Decision Points
- If threshold produces too many alerts: increase the threshold; if too few: decrease
- If handler needs to send an HTTP alert: use queued dispatch instead of direct HTTP call to avoid recursion
- If running in Octane: handlers still run post-response but delay sandbox creation — keep lightweight

### Performance Considerations
- `microtime(true)` overhead is ~0.001ms per call — negligible
- Threshold array iteration is O(n) with typically 3-5 handlers — microseconds
- Handler callback cost is the main concern; keep under 5ms for most handlers
- In Octane, heavy handlers delay sandbox creation and reduce throughput

### Security Considerations
- Never log full request bodies or response content — extract only needed fields
- Handler callbacks have access to the complete request object — sanitize before logging
- An exception in a handler can crash the process (response already sent — invisible to users)

### Related Rules (from 05-rules.md)
- Always wrap handler logic in try-catch blocks
- Register duration handlers in the `boot()` method, not `register()`
- Use multiple thresholds for graduated severity levels instead of a single threshold
- Do not log full request or response objects in duration handlers
- Guard against handler recursion when handlers trigger their own requests

### Related Skills
- Configure Middleware Registration and Execution Order
- Trace `sendRequestThroughRouter()` Flow in HTTP Kernel

### Success Criteria
- Slow requests (>threshold) are logged with relevant diagnostic context
- No PII or secrets exposed in duration handler outputs
- Handlers never crash the process, even when external services fail
- Threshold levels are tuned to real traffic data, producing actionable alerts

---

## Skill: Customize Bootstrap Sequence with Custom Bootstrappers

### Purpose
Add custom bootstrapper classes that run during the kernel initialization sequence, enabling setup logic that must execute before service providers boot.

### When To Use
- When you need initialization logic that runs before service providers are registered
- When loading tenant-specific configuration from an external source before provider boot
- When you need to hook into the framework initialization at a specific point in the bootstrapper sequence

### When NOT To Use
- For request-specific logic — use middleware
- For service registration — use Service Providers (register/boot)
- For initialization that depends on services from providers — bootstrappers run before providers

### Prerequisites
- Understanding of the six core bootstrappers and their fixed execution order
- Knowledge of `Illuminate\Contracts\Foundation\Bootstrapper` interface

### Inputs
- The custom bootstrapper class implementing `bootstrap(Application $app)`
- The desired position in the bootstrapper array relative to the six core steps

### Workflow (numbered steps)
1. Create a new class implementing `Illuminate\Contracts\Foundation\Bootstrapper`
2. Implement `bootstrap(Application $app)` with your initialization logic
3. Determine the correct position in the bootstrapper array:
   - After `LoadConfiguration` if you need config access
   - After `BootProviders` if you need services from providers
4. In the kernel configuration (`bootstrap/app.php` or property), insert your bootstrapper at the determined position
5. For Laravel 10: override `$bootstrappers` property in `App\Http\Kernel` or `App\Console\Kernel`
6. For Laravel 11+: prepend/append to the bootstrappers via `$app->bootstrapWith()` extension
7. Verify execution: add a log line in `bootstrap()` and run any artisan command or HTTP request

### Validation Checklist
- [ ] Custom bootstrapper executes at the intended position in the sequence
- [ ] It has access to the application state that the preceeding bootstrappers provide
- [ ] It does not resolve services that depend on not-yet-executed bootstrappers
- [ ] The bootstrap method is fast and synchronous (no HTTP calls, no complex I/O)
- [ ] Both HTTP and Console kernels include the bootstrapper (or only one, as intended)

### Common Failures
- Placing bootstrapper before a required dependency (e.g., before `LoadConfiguration` when needing config)
- Resolving services from the container whose providers haven't been registered yet
- Adding heavy I/O or HTTP calls in the bootstrapper — delays every request
- Forgetting to add the bootstrapper to both HTTP and Console kernel arrays

### Decision Points
- If initialization needs to happen per-request rather than once: use middleware
- If initialization needs services from providers: place after `BootProviders` or use a Service Provider's `boot()`
- If initialization must happen before any request: place at the end of the array (after BootProviders)

### Performance Considerations
- Bootstrappers run on every request — keep them fast (<1ms preferred)
- Config caching eliminates filesystem I/O in `LoadConfiguration` — use it in production
- Each bootstrapper adds at least one class autoload and one method call to bootstrap time

### Security Considerations
- Error handling is active after `HandleExceptions` bootstrapper — exceptions before that are uncaught
- Environment variables are available after `LoadEnvironmentVariables`
- Config is available after `LoadConfiguration` — don't access config before this

### Related Rules (from 05-rules.md)
- Use config caching in production to eliminate filesystem I/O during bootstrap
- Never resolve services in bootstrappers that depend on other bootstrappers yet to run
- Register custom bootstrappers in the correct position relative to the six core bootstrappers
- Keep custom bootstrappers fast and side-effect-free
- Defer service providers that only register container bindings

### Related Skills
- Trace `sendRequestThroughRouter()` Flow in HTTP Kernel
- Trace Console Kernel Handle Flow End-to-End
- Register Artisan Commands Explicitly for Production

### Success Criteria
- Custom bootstrapper runs at the intended position in the sequence
- Bootstrap time impact is measured and acceptable (<1ms added per bootstrapper)
- Application functions correctly with the bootstrapper active
- No services are resolved before their providers are registered

---

## Skill: Migrate Kernel Configuration from Laravel 10 to Laravel 11+ ApplicationBuilder

### Purpose
Safely migrate middleware, commands, and schedule configuration from legacy kernel classes (`App\Http\Kernel`, `App\Console\Kernel`) to the Laravel 11+ `bootstrap/app.php` ApplicationBuilder pattern.

### When To Use
- When upgrading from Laravel 10 to Laravel 11 or later
- When migrating an existing application from kernel properties to ApplicationBuilder
- When standardizing kernel configuration across a team's Laravel projects

### When NOT To Use
- For new Laravel 11+ projects starting from a skeleton — use ApplicationBuilder from the start
- For applications staying on Laravel 10 without plans to upgrade
- For packages that must support both patterns — use the BC detection approach instead

### Prerequisites
- Understanding of both legacy kernel property syntax and ApplicationBuilder method syntax
- Access to `bootstrap/app.php` and existing kernel files

### Inputs
- Content of `App\Http\Kernel` (middleware arrays, groups, aliases, priority)
- Content of `App\Console\Kernel` (commands array, schedule method)

### Workflow (numbered steps)
1. Run `php artisan route:list -v > before-migration.txt` to create a baseline
2. In `bootstrap/app.php`, add `->withMiddleware(function (Middleware $middleware) { ... })`
3. Map `$middleware` entries to `$middleware->append()` or `->prepend()` calls
4. Map `$middlewareGroups` entries to `$middleware->groupName(append: [...])` calls
5. Map `$routeMiddleware` entries to `$middleware->alias(key, class)` calls
6. Map `$middlewarePriority` entries to `$middleware->priority([...])` calls
7. Add `->withCommands()` for console command registration
8. Add `->withSchedule()` for scheduled task definitions
9. Run `php artisan route:list -v > after-migration.txt` and diff against baseline
10. Keep old kernel files temporarily, test thoroughly in staging
11. After verification, delete `App\Http\Kernel` and `App\Console\Kernel`

### Validation Checklist
- [ ] `route:list -v` output is identical before and after migration (identical middleware per route)
- [ ] All custom commands still work via `php artisan list` and execution
- [ ] All scheduled tasks still execute at correct times
- [ ] Old kernel files are deleted only after full verification
- [ ] No `$kernel->pushMiddleware()` calls remain in service providers
- [ ] All `App\Http\Kernel` type-hints replaced with `Contracts\Http\Kernel`

### Common Failures
- Removing kernel files before ApplicationBuilder config is complete — silent middleware loss
- Missing middleware entries in `withMiddleware()` — routes lose protections
- `$kernel->pushMiddleware()` calls in service providers become no-ops
- Duplicate middleware from both old kernel and new config during transition

### Decision Points
- If using Laravel 10.43+: migrate middleware config using `withMiddleware()` before upgrading core
- If a package registers middleware via `$kernel->pushMiddleware()`: move to `withMiddleware()` or update the package

### Performance Considerations
- Zero runtime performance difference between kernel property and ApplicationBuilder config
- ApplicationBuilder creates intermediate objects during bootstrap — freed after initialization
- Route caching works identically with both approaches after migration

### Security Considerations
- Silent middleware loss is the #1 risk during migration — verify with `route:list -v` diff
- Auth, CSRF, and session middleware must be explicitly migrated — missing any is a security gap
- Old kernel fallback (`class_exists()` check) provides safety net until files are deleted

### Related Rules (from 05-rules.md)
- Use `Contracts\Http\Kernel` type-hints to ensure version compatibility
- Migrate kernel configuration in Laravel 10.43+ before upgrading to Laravel 11
- Audit all `$kernel->pushMiddleware()` calls in service providers before upgrading
- Keep the old kernel file until migration is fully verified in staging
- Replace all `$kernel->pushMiddleware()` calls in service providers before migration
- Migrate configuration one property at a time with verification between each step
- Verify middleware lists match exactly using `php artisan route:list -v` before and after

### Related Skills
- Configure Middleware Registration and Execution Order
- Kernel Bootstrappers — Customize Bootstrap Sequence
- Register Artisan Commands Explicitly for Production

### Success Criteria
- Identical `route:list -v` output before and after migration
- All middleware, commands, and schedules work correctly
- Old kernel files safely removed after staging verification
- No runtime errors or silent missing middleware in production

---

## Skill: Diagnose Singleton State Leaks Under Octane

### Purpose
Identify and fix singleton bindings that hold mutable per-request state, preventing cross-request data contamination in Octane long-running workers.

### When To Use
- When deploying an existing Laravel application to Octane
- When debugging cross-request data leaks (User A sees User B's data)
- When auditing application code for Octane compatibility

### When NOT To Use
- For PHP-FPM deployments where process isolation provides per-request freshness
- For truly stateless singletons (config readers, HTTP clients, loggers)
- For transient bindings (`bind()`) that produce new instances per resolve

### Prerequisites
- Understanding of `singleton()` vs `scoped()` vs `bind()` container semantics
- Access to all service providers (application and vendor)

### Inputs
- List of all `singleton()` and `instance()` calls across application and vendor code
- The service classes instantiated by these bindings

### Workflow (numbered steps)
1. Generate binding inventory: create or run an artisan command that dumps all registered bindings with type and shared status
2. For each singleton, inspect the class properties that change during request handling:
   - Look for mutable properties (`$user`, `$locale`, `$tenant`, `$request`)
   - Look for cached results stored in instance properties
   - Look for setters called during request lifecycle
3. Classify each singleton: Safe (immutable/stateless) or Unsafe (mutable per-request state)
4. For each unsafe singleton, determine the correct fix:
   - Convert to `scoped()` if the service needs per-request freshness
   - Refactor to stateless design if possible (pass state as method parameters)
5. Write a test: send two sequential requests as different users, assert full data isolation
6. Deploy the fix, re-run the integration test under the target runtime

### Validation Checklist
- [ ] All singletons are classified as Safe or Unsafe with documented reasoning
- [ ] Unsafe singletons are converted to `scoped()` or refactored to stateless design
- [ ] Integration test confirms no data leakage between two sequential user requests
- [ ] Test passes under the target Octane runtime (Swoole, RoadRunner, or FrankenPHP)
- [ ] No singletons holding mutable request state remain

### Common Failures
- Missing a singleton because it's registered by a vendor package
- Converting a singleton that should remain global (connection pool, config reader) to scoped
- Fixing the direct binding but missing the transitive dependency contamination
- Testing only in PHPUnit (no sandbox) — scoped behaves like singleton in tests
- Using `app()->instance()` for per-request state — overwrites for all requests

### Decision Points
- If the singleton is widely depended on: convert to scoped, verify all dependents work
- If the singleton has expensive construction: consider refactoring to accept state as method args instead

### Performance Considerations
- Scoped bindings add ~0.5-2ms per binding per request (instantiation + sandbox registration)
- A stateless singleton refactor has zero performance cost
- Blind conversion of all singletons to scoped adds unnecessary overhead

### Security Considerations
- Cross-user data leak is the primary security concern — audit auth, session, and tenant bindings first
- Auth manager singletons are the highest risk — authenticated state leaks to next request
- Never use `Auth::onceUsingId()` in Octane — mutates guard state persistently

### Related Rules (from 05-rules.md)
- Audit every singleton for mutable per-request state
- Convert request-aware singletons to `scoped()`
- Test with two sequential requests for different users
- Never use `app()->instance()` for per-request state
- Do not use `Auth::onceUsingId()` in Octane workers
- Keep Eloquent caches out of singleton properties

### Related Skills
- Configure Scoped Bindings for Per-Request State Isolation
- Generate Service Binding Inventory for Octane Audit
- Identify and Fix Static Property Accumulation in Long-Running Processes

### Success Criteria
- No cross-request data leaks detected in integration tests
- All unsafe singletons are either scoped or stateless
- Two sequential requests from different users never share state
- The application passes the same test under both PHP-FPM and Octane

---

## Skill: Implement Backward-Compatible Package Support for Kernel Versions

### Purpose
Write Laravel packages that support both the pre-11 kernel property approach and the 11+ ApplicationBuilder approach, using `class_exists()` detection.

### When To Use
- When developing packages that must support Laravel 10 through Laravel 13+
- When publishing packages where you cannot require a specific Laravel version
- When maintaining legacy package code during the Laravel 11 transition

### When NOT To Use
- For packages targeting Laravel 11+ exclusively — use ApplicationBuilder patterns only
- For internal applications that control the Laravel version — no BC needed

### Prerequisites
- Understanding of both kernel configuration approaches
- Knowledge of `class_exists()` autoloader behavior

### Inputs
- The middleware, command, or schedule registration logic that varies by Laravel version

### Workflow (numbered steps)
1. Identify in your service provider where kernel configuration happens
2. Wrap configuration in a version check: `if (class_exists(\App\Http\Kernel::class))`
3. In the `true` branch: use legacy patterns (`$kernel->pushMiddleware()`, property registration)
4. In the `false` branch: use ApplicationBuilder patterns (`Middleware::class`, `withMiddleware()`)
5. If registering middleware: resolve the Middleware config object via `$this->callAfterResolving()`
6. Document in your README the minimum Laravel version and which approach is used
7. Test with both a Laravel 10 project (with `App\Http\Kernel`) and a Laravel 11+ skeleton (without it)

### Validation Checklist
- [ ] Package works with Laravel 10 (kernel class exists) without warnings
- [ ] Package works with Laravel 11+ (no kernel class) without errors
- [ ] Middleware, commands, and schedules register correctly in both environments
- [ ] No hard dependency on `App\Http\Kernel` type-hints

### Common Failures
- Using `app(App\Http\Kernel::class)` directly without BC check — crashes on Laravel 11+
- Type-hinting `App\Http\Kernel` in constructor — class not found
- Assuming `bootstrap/app.php` always uses `withMiddleware()` — only in Laravel 11+

### Decision Points
- If your package only adds middleware: use the BC detection in `boot()` with `callAfterResolving(Middleware::class)`
- If your package must support very old Laravel versions (< 5.5): use a version comparison with `app()->version()`

### Performance Considerations
- `class_exists()` triggers autoloader — negligible cost for a single call in boot
- No runtime performance difference between the two registration approaches
- Conditional branches are resolved once at boot — zero per-request cost

### Security Considerations
- Middleware not registered if BC detection fails — test both paths
- Use `callAfterResolving()` for Middleware config to ensure it's available
- If `class_exists()` returns false but `App\Http\Kernel` exists in a custom location, registration may fail

### Related Rules (from 05-rules.md)
- For packages supporting pre-11 and 11+, detect version via `class_exists()`
- Use `Contracts\Http\Kernel` type-hints to ensure version compatibility

### Related Skills
- Migrate Kernel Configuration from Laravel 10 to Laravel 11+ ApplicationBuilder
- Configure Middleware Registration and Execution Order

### Success Criteria
- Package installs and works on Laravel 10 without modification
- Package installs and works on Laravel 11+ without modification
- All middleware/commands/schedules register identically on both versions
- No errors or deprecation warnings on either version
