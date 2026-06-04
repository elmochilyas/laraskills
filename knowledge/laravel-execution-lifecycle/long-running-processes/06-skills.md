# Skills for Long-Running Processes

---

## Skill: Track Per-Request Memory Delta for Leak Detection

### Purpose
Monitor memory growth per request using `memory_get_usage()` before and after each request to detect accumulation trends early.

### When To Use
- When deploying Octane or queue workers to production for the first time
- When investigating OOM crashes in long-running workers
- When setting up continuous memory observability

### When NOT To Use
- In PHP-FPM deployments where memory is freed per-request
- During a single development request — worker lifecycle is too short for meaningful trends
- When the profiling tool itself becomes the source of memory accumulation

### Prerequisites
- Understanding of `memory_get_usage(true)` vs `memory_get_usage(false)`
- Access to register `RequestReceived` and `RequestTerminated` event listeners

### Inputs
- Octane or queue worker configuration
- Logging infrastructure (structured log channel for memory metrics)

### Workflow (numbered steps)
1. Register a `RequestReceived` listener that captures `memory_get_usage(false)` into request attributes
2. Register a `RequestTerminated` listener that calculates delta: `memory_get_usage(false) - start`
3. Log the delta, baseline (`memory_get_usage(true)`), URL, method, and timestamp as structured data
4. Deploy and collect data over at least 1000 requests across all workers
5. Analyze trends: look for consistent positive deltas (accumulation) vs stable baseline
6. If baseline grows monotonically, identify the accumulating source using static scanning or heap analysis
7. Set up alerts: baseline grows >5MB after 1000 requests, or per-request delta >5MB consistently

### Validation Checklist
- [ ] `memory_get_usage(false)` captured at both request start and end
- [ ] Delta calculated and logged as structured data
- [ ] Baseline (`memory_get_usage(true)`) tracked separately as OS-level indicator
- [ ] Accumulation trend identified: stable vs growing
- [ ] Alert configured for baseline growth exceeding threshold
- [ ] GC roots count (`gc_status()['roots']`) also tracked periodically

### Common Failures
- Using `memory_get_usage(true)` for delta — OS allocation never shrinks, always positive
- Not capturing start-of-request baseline — delta is meaningless without it
- Only tracking peak memory, not baseline — misses accumulation pattern
- Logging too frequently overwhelms storage — sample or aggregate

### Decision Points
- If delta is consistently positive but small (< 0.5MB): monitor trend weekly; no immediate action
- If baseline grows >20% in 1000 requests: treat as actionable leak and investigate
- If delta spikes intermittently: check if specific endpoints or payload sizes cause it

### Performance Considerations
- `memory_get_usage()` takes ~0.001ms — negligible overhead
- Structured logging adds I/O — batch or use in-memory aggregation for high-throughput
- Reflection-based static scanning is slow (1-3s) — run as background job, not per-request

### Security Considerations
- Memory metrics struct log must not expose request content — log only URL, method, size
- Profiling data volume can be high — set appropriate retention policies
- Alert thresholds must account for legitimate memory-intensive operations (large exports)

### Related Rules (from 05-rules.md)
- Track per-request memory delta on every request
- Monitor baseline trend, not instantaneous memory
- Use `memory_get_usage(false)` for actual usage, `true` for OS allocation
- Use structured logging over ad-hoc metrics for memory data
- Inspect GC root counts as a leading leak indicator
- Limit profiling tool overhead in production
- Cache static property reflection results

### Related Skills
- Identify and Fix Static Property Accumulation in Long-Running Processes
- Diagnose Singleton State Leaks Under Octane

### Success Criteria
- Per-request memory delta reliably measured and logged
- Accumulation trends identified before they cause OOM
- Memory baseline tracked continuously with alert thresholds
- GC root count monitored as leading indicator

---

## Skill: Configure Octane Workers with Memory-Profiled `max_requests`

### Purpose
Set Octane's `max_requests` worker recycling threshold based on measured memory growth rate, balancing safety against throughput.

### When To Use
- When deploying Octane to production
- When tuning an existing Octane deployment for memory efficiency
- When responding to OOM crashes in Octane workers

### When NOT To Use
- In local development where default `max_requests` is sufficient
- In PHP-FPM deployments where Octane is not used
- When immediate incident response requires lowering `max_requests` temporarily (do that first, profile later)

### Prerequisites
- Octane installed and configured in `config/octane.php`
- Memory profiling data from tracking per-request delta
- Knowledge of the target runtime's worker model (Swoole vs RoadRunner vs FrankenPHP)

### Inputs
- Worker memory baseline (idle memory after boot)
- Per-request memory growth rate (MB/request) from profiling
- Server memory limit (`memory_limit` in `php.ini`)
- Number of CPU cores for `worker_count`

### Workflow (numbered steps)
1. Start Octane with default `max_requests` (500) in a staging environment
2. Profile memory over 500+ requests: measure baseline after boot and after recycling
3. Calculate growth rate: `(memory_after_500_requests - baseline) / 500`
4. Calculate safe `max_requests`: `(memory_limit - baseline - safety_margin) / growth_rate`
5. Round down to nearest 50 for safety margin
6. Set `worker_count` to `auto` (CPU core count) or manually to match CPU cores
7. Update `config/octane.php` with the calculated values
8. Deploy and monitor: verify workers recycle before reaching `memory_limit`
9. After fixing leaks, re-profile and increase `max_requests` to reduce churn

### Validation Checklist
- [ ] `max_requests` based on measured growth rate, not arbitrary guess
- [ ] Safety margin included (at least 20% below calculated OOM point)
- [ ] `worker_count` set to CPU cores (or `auto`)
- [ ] Graceful shutdown timeout configured (`max_wait_time` >= slowest request)
- [ ] Staged `max_requests` reduction used during deployments for zero-downtime rotation
- [ ] Workers recycle at expected intervals without OOM

### Common Failures
- Setting `worker_count =` expected concurrent users instead of CPU cores
- Setting `max_requests` to 0 (no safety valve) — workers grow until OOM
- Underestimating per-request growth because baseline was measured after cold cache warmup
- Forgetting runtime-specific config (Swoole `max_execution_time`, RoadRunner `request_timeout`)
- Thinking `max_requests` is global — it's per-worker: `workers × max_requests` total capacity

### Decision Points
- If growth rate is zero: set `max_requests` based on code freshness, not memory
- If one route is memory-heavy: consider separate Octane instance with different config
- If using Swoole coroutines: keep `worker_count` at CPU cores, rely on coroutines for concurrency

### Performance Considerations
- Lower `max_requests` = more worker churn = colder caches = more bootstrap overhead
- Higher `max_requests` = less churn = warmer caches = lower latency
- Calculate total capacity: `worker_count × max_requests` before full rotation
- Each worker baseline consumes 30-50MB — budget total memory: `workers × per-worker-RSS`

### Security Considerations
- Worker OOM can lose the current request — configure gracefully
- `max_wait_time` must allow in-flight requests to complete
- Staged `max_requests` reduction during deployments ensures zero-downtime rotation
- Monitor for worker death spikes — may indicate code-level memory regression

### Related Rules (from 05-rules.md)
- Set worker count to CPU core count, not concurrent user count
- Always set `max_requests` based on profiled memory growth
- Understand that `max_requests` is per-worker, not global
- Use staged `max_requests` reduction for zero-downtime deployments
- Configure graceful shutdown timeouts per runtime
- Match runtime-specific timeout config to application needs

### Related Skills
- Track Per-Request Memory Delta for Leak Detection
- Identify and Fix Static Property Accumulation in Long-Running Processes
- Diagnose Singleton State Leaks Under Octane

### Success Criteria
- Workers recycle before memory limit is reached
- OOM crashes eliminated in production
- Worker churn balanced between memory safety and throughput
- Graceful shutdown prevents in-flight request loss

---

## Skill: Register Octane Lifecycle Hooks for State Cleanup

### Purpose
Use `Octane::tick()`, `RequestTerminated`, and `RequestReceived` event listeners to manage state, perform periodic maintenance, and clean up accumulated data between requests.

### When To Use
- When running Octane and needing to clean up static properties between requests
- When setting up periodic health metric collection via `Octane::tick()`
- When implementing per-request initialization or cleanup that runs before/after each sandbox
- When integrating with packages that hold singleton state needing reset

### When NOT To Use
- For response modification — hooks run after response, cannot modify it
- For per-request business logic — use middleware instead
- For heavy periodic work — ticks block the worker from accepting requests
- For request-scoped state — use scoped bindings instead of manual cleanup

### Prerequisites
- Understanding of Octane's master container vs sandbox lifecycle
- Access to register event listeners in a service provider

### Inputs
- List of known leaky classes and their cleanup methods
- Desired tick interval in seconds
- List of request attributes to capture in `RequestReceived`

### Workflow (numbered steps)
1. In a service provider's `boot()` method, register `Octane::tick()` callbacks for periodic tasks
2. Guard each `tick()` registration with a flag to prevent duplicates on provider re-invocation
3. Wrap tick callback bodies in try-catch — uncaught exceptions can kill the worker
4. Register `RequestTerminated` listeners for known cleanup operations (`Str::resetCache()`, `Collection::clearMacros()`, etc.)
5. Keep cleanup listeners fast (<5ms) — they block the next request's sandbox creation
6. Optionally register `RequestReceived` listeners for early request inspection or rate limiting
7. Verify each hook fires correctly under the target runtime (Swoole, RoadRunner, or FrankenPHP)
8. Monitor tick durations to ensure no tick blocks for more than its interval

### Validation Checklist
- [ ] `tick()` callbacks are wrapped in try-catch
- [ ] `tick()` registration guarded against duplicates (flag check)
- [ ] `RequestTerminated` listeners run cleanup for all known leaky classes
- [ ] Listeners complete in under 5ms
- [ ] No request-scoped services resolved inside tick callbacks
- [ ] Runtime-specific behavior verified for target runtime

### Common Failures
- Uncaught exception in tick kills the worker silently
- Duplicate tick registration on worker restart — callbacks execute N times
- Resolving `request()` inside `tick()` — returns stale or null values from master container
- Heavy work in `RequestTerminated` delays the next request's sandbox creation
- Assuming `RequestTerminated` fires per-request in FrankenPHP (it may not)

### Decision Points
- If cleanup is for a third-party package: use `RequestTerminated` listener with method_exists check
- If periodic work is heavy (DB aggregation, report generation): use queue job, not tick
- If early request blocking is needed (IP deny list): use `RequestReceived` listener

### Performance Considerations
- Ticks execute inline between requests — a long tick blocks the worker
- `RequestTerminated` runs synchronously between requests — keep under 5ms
- Too many ticks add O(n) overhead per request cycle gap
- Heavy cleanup work dispatched to queue from `RequestTerminated` (don't do inline)

### Security Considerations
- Ticks can mutate singleton state (e.g., `config()`) — affects all subsequent requests
- Listener state accumulation: `RequestTerminated` listeners that accumulate data themselves become leak sources
- Early returns in `RequestReceived` may leave sandbox state partially initialized

### Related Rules (from 05-rules.md)
- Wrap `Octane::tick()` callbacks in try-catch
- Guard `Octane::tick()` registration against duplicates
- Keep `RequestTerminated` listeners fast and synchronous
- Never resolve request-scoped services inside tick callbacks
- Always handle early returns in `RequestReceived` listeners
- Test hooks explicitly against the target runtime

### Related Skills
- Configure Octane Workers with Memory-Profiled `max_requests`
- Track Per-Request Memory Delta for Leak Detection
- Identify and Fix Static Property Accumulation in Long-Running Processes

### Success Criteria
- All known leaky classes have cleanup in `RequestTerminated`
- Tick callbacks execute at correct intervals without crashing
- `RequestReceived` listeners block malicious requests early
- No z-request-scoped services are accessed from tick context
- All hooks work correctly under the target runtime

---

## Skill: Audit Packages for Octane Compatibility

### Purpose
Systematically evaluate every installed third-party package for Octane compatibility by examining service provider bindings, static property usage, and sequential request behavior.

### When To Use
- Before deploying Octane to production for the first time
- When adding a new package to an existing Octane deployment
- When troubleshooting unexpected cross-request data contamination from a package
- After upgrading any third-party package to a new version

### When NOT To Use
- In PHP-FPM-only deployments where compatibility is irrelevant
- For well-known first-party Laravel packages with explicit Octane support (Cashier, Passport, Sanctum, Scout)
- For packages with the `octane` Composer `suggest` and published Octane config

### Prerequisites
- List of all installed third-party packages (`composer show --tree`)
- Access to vendor source code for inspection
- Octane running in a staging environment for sequential request tests

### Inputs
- Package name and version from `composer.json`
- Package's service provider source code
- Sequential request test results

### Workflow (numbered steps)
1. Generate a complete list of installed packages with `composer show --tree`
2. For each package, inspect its service provider for `singleton()` calls with mutable state
3. Grep vendor code for static property assignments: `grep -r 'static.*\$' vendor/package`
4. Check for `$_SERVER`, `$_ENV`, `$_REQUEST` superglobal access patterns
5. Write a sequential request test that calls a feature from the package 100 times and checks for data isolation
6. Classify each package on the compatibility spectrum: Fully Compatible, Compatible with Hooks, Partially Compatible, Incompatible
7. For Compatible with Hooks packages: register `RequestTerminated` cleanup listeners
8. For Partially Compatible packages: gate incompatible features behind `app()->bound(Octane::class)` check
9. Document all findings in a living compatibility matrix

### Validation Checklist
- [ ] Every installed package evaluated for Octane compatibility
- [ ] Service providers checked for mutable singletons
- [ ] Static property usage scanned in vendor code
- [ ] Sequential request test (100+ requests) run for each package
- [ ] Compatibility matrix documented and versioned in the repository
- [ ] CI step blocks installation of known-incompatible package versions

### Common Failures
- Assuming "works in PHP-FPM = works in Octane" — FPM isolation masks all accumulation
- Testing with a single request — Octane bugs need 100+ sequences
- Confusing "no errors" with "compatible" — silent data corruption produces no exceptions
- Only auditing application code, not vendor packages
- Patching vendor directory instead of creating application-side shims

### Decision Points
- If a package is incompatible and no shim can fix it: fork only as last resort — prefer finding an alternative
- If a package has both compatible and incompatible features: gate, don't disable the entire package
- If a package already has Octane config files: trust but verify with sequential tests

### Performance Considerations
- Application-side shims add ~0.5-3ms per request
- `RequestTerminated` cleanup listeners add time between requests — keep under 5ms each
- Sequential request tests take time — run in CI nightly, not on every commit

### Security Considerations
- Silent incompatibility is the biggest risk — package appears to work but produces wrong results
- Partial feature breakage means some features work, others silently fail
- Version-specific compatibility — a minor update can introduce new singletons
- Runtime-specific compatibility — RoadRunner (process isolation) vs Swoole (coroutine sharing) differ

### Related Rules (from 05-rules.md)
- Audit every installed package for Octane compatibility before deployment
- Create shim layers over package forks
- Test packages with ≥100 sequential requests
- Maintain a living package compatibility matrix
- Re-audit package compatibility after every update
- Use feature-flag gating for partially compatible packages

### Related Skills
- Register Octane Lifecycle Hooks for State Cleanup
- Generate Service Binding Inventory for Octane Audit
- Diagnose Singleton State Leaks Under Octane

### Success Criteria
- Complete package compatibility matrix documented and maintained
- All packages classified with compatibility status
- Shims in place for packages needing cleanup hooks
- CI blocks incompatible package versions
- No silent data corruption from packages in production

---

## Skill: Configure Queue Workers with Memory-Safe Settings

### Purpose
Run queue workers with `--max-jobs`, `--max-time`, and `Queue::looping()` state reset to prevent memory leaks and cross-job state contamination.

### When To Use
- When deploying queue workers for production workloads
- When tuning existing queue workers for memory stability
- When migrating queue workers from PHP-FPM to long-running processes

### When NOT To Use
- For synchronous job processing (`dispatchNow()`) within the same process
- For serverless queue execution (Vapor) where each job runs in a fresh Lambda invocation
- For single-job short-lived workers (e.g., CI pipelines)

### Prerequisites
- Queue driver configured (Redis, database, SQS)
- Access to worker process manager (Supervisor or Horizon config)
- Memory profiling data for the queue workload

### Inputs
- Job processing profile: average job duration, per-job memory growth
- Queue configuration: connection, queue names, concurrency settings

### Workflow (numbered steps)
1. Configure memory limits: set `--max-jobs=500 --max-time=3600` in Supervisor command or Horizon config
2. Register a `Queue::looping()` callback in `AppServiceProvider::boot()` to reset state between jobs
3. In the callback: forget auth guards, reset string caches, clear static registries
4. Guard the `Queue::looping()` callback with `app()->runningInConsole()` check to avoid Octane interference
5. Ensure job classes load dependencies in `handle()`, not in the constructor
6. Avoid mutable state on `$this` properties in job classes — fresh state per `handle()` call
7. Deploy worker, monitor memory baseline over 1000+ jobs
8. Tune `--max-jobs` based on measured growth rate

### Validation Checklist
- [ ] `--max-jobs` or Horizon `maxJobs` configured and enforced
- [ ] `--max-time` configured as safety net
- [ ] `Queue::looping()` callback registered with context guard
- [ ] Job dependencies loaded in `handle()`, not constructor
- [ ] No mutable state on `$this` in job classes
- [ ] Worker memory stable over 1000+ job processing cycles

### Common Failures
- Running workers without `--max-jobs` — unbounded memory growth until OOM
- Registering `Queue::looping()` without context guard — fires in Octane too, resetting auth mid-request
- Constructor injection of Eloquent models — stale data serialized at dispatch time
- Storing mutable state on `$this` across retry attempts — cumulative side effects
- Using `dispatchNow()` inside a running job — overwrites singleton state

### Decision Points
- If jobs are very short (< 50ms): `Queue::looping()` overhead of a few ms is proportionally significant
- If jobs are long (> 1 minute): rely more on `--max-time` than `--max-jobs`
- If using Horizon: configure `maxJobs` per worker pool (different queues may have different profiles)

### Performance Considerations
- `Queue::looping()` overhead: a 10ms reset on a 50ms job adds 20% overhead
- Job deserialization: ~0.1-1ms per job
- `--sleep=3` reduces CPU idle spinning but delays job pickup
- Horizon auto-balancing adds worker churn overhead (~1s per start)

### Security Considerations
- Worker OOM crashes the current job without retry (depending on driver)
- Silent data corruption: a singleton `PaymentGateway` remembers last transaction's credentials
- Worker deadlock: job acquires DB row lock, then dies — connection left in broken state
- Horizon supervisor cascade: worker pool exhausts memory, supervisor respawns but backlog grows

### Related Rules (from 05-rules.md)
- Always set `--max-jobs` or Horizon `maxJobs`
- Register a `Queue::looping()` callback for state reset
- Load dependencies in `handle()`, not the constructor
- Guard `Queue::looping()` against non-queue contexts
- Avoid storing mutable state on `$this` in job classes

### Related Skills
- Track Per-Request Memory Delta for Leak Detection
- Register Octane Lifecycle Hooks for State Cleanup
- Configure Octane Workers with Memory-Profiled `max_requests`

### Success Criteria
- Workers recycle before memory limit is reached
- No cross-job data contamination in shared singletons
- `Queue::looping()` resets state without interfering with other contexts
- Jobs are stateless — fresh per `handle()` with no constructor-loaded models

---

## Skill: Configure Scoped Bindings for Per-Request State Isolation

### Purpose
Use `$app->scoped()` instead of `$app->singleton()` for services holding per-request state, ensuring automatic isolation across Octane requests without code changes to the service itself.

### When To Use
- When deploying Octane and identifying singletons with mutable request-specific state
- When registering new services that will hold per-request data (auth, session, locale, current tenant)
- When migrating an existing singleton to scoped for Octane safety

### When NOT To Use
- For truly stateless services (config readers, HTTP clients, connection pools) — keep as singletons
- For global infrastructure (database connections, event dispatchers, cache repositories)
- For value objects with no container dependencies — create directly with `new`
- For per-coroutine state in Swoole — use coroutine ID maps, not scoped

### Prerequisites
- Understanding of `singleton()` vs `scoped()` vs `bind()` semantics
- The `OctaneSandbox` provider contract knowledge

### Inputs
- List of unsafe singleton bindings identified during Octane audit
- Service classes that need per-request isolation

### Workflow (numbered steps)
1. Identify the service class that should be scoped
2. Replace `$this->app->singleton(Service::class)` with `$this->app->scoped(Service::class)`
3. If the binding has a factory closure, ensure it can be re-executed per-request (no side effects)
4. If the provider is not `OctaneSandbox`-aware, implement the `OctaneSandbox` interface and register scoped bindings in `boot()`
5. Prefer class-name registration over closures for performance: `$scoped(Contract::class, Concrete::class)`
6. Write a test that verifies: same instance within request, different instances across requests
7. Verify the binding is safe under the target runtime — test with sequential requests

### Validation Checklist
- [ ] Service registered as `scoped()` in the container
- [ ] Scoped binding registered in an `OctaneSandbox` provider (or equivalent per-request context)
- [ ] Test asserts identity equality within request and inequality across requests
- [ ] No dependencies on leaking singletons that scoped binding doesn't fix
- [ ] Global infrastructure services (DB, cache, event) remain as singletons

### Common Failures
- Registering scoped in non-sandbox-aware provider — binding never flushed, behaves as singleton
- Converting connection pools to scoped — connection storms on every flush
- Expecting per-coroutine isolation from scoped (it's per-request, not per-coroutine)
- Forgetting that PHPUnit testing doesn't use Octane sandbox — scoped behaves like singleton in tests
- Using closure-based scoped binding when class-name would work — missed optimization

### Decision Points
- If the service is expensive to construct (>10ms): consider stateless singleton design instead of scoped
- If the service depends on a leaking singleton: fix the dependency first, scoping only masks the symptom
- If the service manages external resources (file handles, DB transactions): scoped flush may release prematurely

### Performance Considerations
- Each scoped binding adds ~0.5-2ms per request for instantiation and sandbox registration
- 10 scoped bindings add ~5-20ms to request time
- Class-name registration (`$scoped(A::class)`) is faster than closures
- Blind mass conversion of all singletons to scoped adds unnecessary overhead

### Security Considerations
- Scoped bindings don't fix transitive contamination from mutable singleton dependencies
- Premature destruction: scoped binding's destructor runs during sandbox flush — if later resolved in a tick, gets a fresh instance with missing state
- Resource handle loss: scoped connection pools lose handles on flush — use singleton pool + scoped wrapper

### Related Rules (from 05-rules.md)
- Default to scoped for any service interacting with per-request data
- Prefer class-name registration over closures for scoped bindings
- Register scoped bindings inside `OctaneSandbox` providers
- Test scoped isolation with identity assertions
- Never use `scoped()` for global infrastructure services
- Use coroutine-ID maps, not scoped, for per-coroutine state in Swoole

### Related Skills
- Diagnose Singleton State Leaks Under Octane
- Generate Service Binding Inventory for Octane Audit
- Identify and Fix Static Property Accumulation in Long-Running Processes

### Success Criteria
- Per-request services provide fresh instances across requests, shared within request
- Scoped bindings are registered in sandbox-aware providers
- Integration test confirms identity isolation
- No unnecessary conversion of infrastructure singletons to scoped

---

## Skill: Generate Service Binding Inventory for Octane Audit

### Purpose
Create an automated inventory of all registered service container bindings with their type (singleton, scoped, transient) and shared status to drive the Octane compatibility audit.

### When To Use
- Before every Octane binding audit
- When adding new service providers and need to verify binding types
- In CI to enforce binding governance (flag new singleton registrations for review)
- After package updates to detect binding changes

### When NOT To Use
- For PHP-FPM-only projects where binding safety is irrelevant
- For transient-only bindings (no shared bindings) where audit is unnecessary
- During development workflows where the overhead of inventory generation is not justified

### Prerequisites
- Access to the service container
- An artisan command structure to dump binding information

### Inputs
- All registered service providers (application and vendor)
- The container's internal binding registry

### Workflow (numbered steps)
1. Create an artisan command (e.g., `php artisan audit:bindings`) that iterates all providers
2. For each provider, extract binding names, types (`singleton`/`scoped`/`bind`), and shared status
3. Output as a table with columns: Binding, Type, Shared, Source (provider class, file, line)
4. Classify each shared binding as Safe (stateless/immutable), Unsafe (mutable state), or Needs Review
5. Trace constructor dependencies for each shared binding to detect transitive contamination
6. Store the inventory as a baseline document
7. Add CI step: run the command, diff against baseline, flag new `singleton()` registrations

### Validation Checklist
- [ ] Inventory command outputs all binding names, types, and shared status
- [ ] Source provider identified for each binding
- [ ] Shared bindings classified into risk categories
- [ ] Dependency graph traced for transitive leaks
- [ ] Baseline committed to repository
- [ ] CI step flags new singletons not yet classified

### Common Failures
- Only auditing application providers, missing vendor package bindings
- Only inspecting direct bindings, missing transitive contamination
- Confusing `shared: false` with "safe" — a transient can hold static state
- Not updating the baseline after legitimate new singletons are added and reviewed
- Assuming all `scoped()` bindings are safe — scoped can depend on leaking singletons

### Decision Points
- If the inventory is too large (> 100 bindings): focus on shared bindings (singleton, scoped) only
- If a binding is safe but its dependency is unsafe: mark both as Needs Review
- If CI blocks legitimate singleton additions: add an exception mechanism (e.g., comment annotation)

### Performance Considerations
- Inventory generation is a one-time dev operation — no runtime cost
- Dependency graph tracing may need to resolve bindings — can take seconds for large graphs
- CI integration adds negligible time to pipeline (sub-second)

### Security Considerations
- The inventory reveals all service bindings — treat as internal documentation
- Unsafe bindings related to auth, session, or tenant services are highest priority
- Vendor binding analysis may reveal packages that leak user data across requests

### Related Rules (from 05-rules.md)
- Generate an automated binding inventory before every audit
- Trace the full dependency graph, not just direct bindings
- Classify bindings into three risk categories
- Add CI lint rules for new singleton registrations
- Score and prioritize remediation by risk impact
- Re-audit after every major package update or quarterly

### Related Skills
- Diagnose Singleton State Leaks Under Octane
- Configure Scoped Bindings for Per-Request State Isolation
- Audit Packages for Octane Compatibility

### Success Criteria
- Complete binding inventory generated and committed to repository
- Every shared binding classified with risk category
- Dependency graph traced for transitive contamination
- CI blocking new singleton registrations without review
- Quarterly re-audit cadence established

---

## Skill: Identify and Fix Static Property Accumulation in Long-Running Processes

### Purpose
Scan for static properties that accumulate data across requests in Octane or queue workers, and remediate with cleanup listeners, instance-based caching, or one-time registration guards.

### When To Use
- When preparing an application for Octane deployment
- When debugging OOM crashes in long-running workers
- When adding new code that uses static caching or callback registrations
- When evaluating third-party packages for memory leak risk

### When NOT To Use
- In PHP-FPM environments where static state is naturally reset per-request
- For truly constant statics (values initialized once, never modified)
- For singleton container state (covered by singleton leak skill)

### Prerequisites
- Ability to scan codebase for static property usage
- Understanding of `static::$cache` accumulation patterns
- Access to register `RequestTerminated` or `Queue::looping()` listeners

### Inputs
- Codebase (app and vendor) for static property scanning
- Known `Macroable` class registrations

### Workflow (numbered steps)
1. Scan `app/` and `vendor/` for static arrays: `static::$xxx[]` and `static::$xxx[$key]` patterns
2. Also scan for `static::` property assignments in methods called per-request
3. For each static accumulator, classify: grows per-request (leak) or constant (safe)
4. For per-request leaky statics, apply remediation:
   - If the class is container-resolved: replace `static::$cache` with instance property, register as `scoped()`
   - If not container-managed: register `RequestTerminated` listener to call the class's reset/clear method
5. For callbacks registered per-request (`Blade::directive()`, `Collection::macro()`):
   - Guard with `Octane::once()` or a manual flag check
6. For vendor packages: add cleanup call to the `RequestTerminated` listener
7. Verify: run 100+ identical requests in the same worker — baseline `memory_get_usage()` should not grow

### Validation Checklist
- [ ] Static properties scanned in both `app/` and vendor code
- [ ] Per-request accumulation identified and classified
- [ ] Instance-based caching replaces static caches where possible
- [ ] `RequestTerminated` cleanup registered for remaining leaky statics
- [ ] One-time registrations guarded against duplicates
- [ ] Memory baseline stable across 100+ sequential requests

### Common Failures
- Confusing static leaks with singleton leaks — fixing the wrong one has no effect
- Only scanning application code — vendor statics (Blade, Collection, Validator) are primary sources
- Registering cleanup without checking the class has a reset method — runtime error
- Using `isset(static::$cache[$key])` as memoization guard — keys unique per request cause unbounded growth
- Relying solely on `max_requests` to mask static leaks instead of fixing the root cause

### Decision Points
- If the static is in a framework class (e.g., `Str::resetCache()`): add framework cleanup listener
- If the static is in a vendor package not designed for Octane: add `RequestTerminated` listener with `method_exists()` check
- If the static holds truly immutable data (loaded once at boot): leave as-is, not a leak

### Performance Considerations
- Static array lookups are O(1) and extremely fast — not a CPU concern, only memory
- Accumulation cost is memory, not CPU — each addition is O(1)
- Growing static arrays increase GC pause times — entire array is scanned during `gc_collect_cycles()`
- `RequestTerminated` cleanup adds time between requests — keep under 5ms

### Security Considerations
- Graceful OOM: memory slowly climbs to `memory_limit` over thousands of requests
- Sudden OOM: single request triggers registration of a large static array
- Silent data drift: static array accumulating per-request data causes later requests to behave differently
- Worker threshold crash: worker dies right before `max_requests` due to accumulated memory exceeding limit

### Related Rules (from 05-rules.md)
- Replace static property caching with instance-based caching
- Register `RequestTerminated` cleanup for known leaky static registries
- Use `Octane::once()` for one-time registration guards
- Monitor `memory_get_usage()` baseline growth as static leak indicator
- Never use static arrays as request-scoped caches
- Scan for static property accumulation in third-party packages too
- Do not rely solely on `max_requests` to mitigate static leaks

### Related Skills
- Track Per-Request Memory Delta for Leak Detection
- Register Octane Lifecycle Hooks for State Cleanup
- Diagnose Singleton State Leaks Under Octane

### Success Criteria
- All per-request static accumulators identified and remediated
- Memory baseline stable across 100+ sequential requests in same worker
- Callback registrations guarded with `Octane::once()` or equivalent
- Vendor package statics handled with cleanup listeners
- `max_requests` set based on residual leak profile, not as primary mitigation
