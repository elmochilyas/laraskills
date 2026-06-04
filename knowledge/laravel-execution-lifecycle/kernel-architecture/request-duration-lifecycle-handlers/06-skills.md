# Skill: Implement Graduated Slow-Request Monitoring with Duration Handlers

## Purpose
Register request duration lifecycle handlers at multiple thresholds to implement graduated performance monitoring — logging slow requests at a warning level and escalating to critical alerts for severe outliers.

## When To Use
- Setting up passive performance monitoring without external APM tools
- Detecting performance regressions in staging or production
- Establishing a baseline for application response times
- Implementing graduated alerting (info → warning → critical) based on request duration

## When NOT To Use
- Real-time response modifications (use middleware instead — handlers cannot modify responses)
- Per-request timing that must affect the user experience (handlers run post-response)
- High-precision profiling below 50ms (platform timing precision is limited)
- Blocking request processing (handlers are observational only)

## Prerequisites
- Laravel 11+ (where duration handlers were introduced)
- Access to the service provider where handlers will be registered (typically `AppServiceProvider::boot()`)
- A log channel configured for slow request logs (e.g., `'slow'` channel in `config/logging.php`)
- Understanding of the application's typical response time distribution (or willingness to start conservative)

## Inputs
- Threshold values in milliseconds: warning (e.g., 500ms), critical (e.g., 2000ms), severe (e.g., 5000ms)
- Handler callbacks for each threshold
- Request fields to extract for diagnostics (url, method, status, user_id)

## Workflow
1. **Register the handlers in a service provider's `boot()` method** (never `register()`):
   ```php
   public function boot(): void
   {
       $kernel = $this->app->make(\Illuminate\Contracts\Http\Kernel::class);

       $kernel->whenRequestLifecycleIsLongerThan(500, function ($request, $response, $duration) {
           try {
               Log::channel('slow')->info('Request slower than 500ms', [
                   'duration' => $duration,
                   'url' => $request->fullUrl(),
                   'method' => $request->method(),
                   'status' => $response->getStatusCode(),
               ]);
           } catch (\Throwable $e) {
               Log::error('Slow request handler failed', ['error' => $e->getMessage()]);
           }
       });

       $kernel->whenRequestLifecycleIsLongerThan(2000, function ($request, $response, $duration) {
           try {
               Log::channel('slow')->warning('Request slower than 2000ms', [
                   'duration' => $duration,
                   'url' => $request->fullUrl(),
                   'status' => $response->getStatusCode(),
               ]);
           } catch (\Throwable $e) {
               Log::error('Slow request handler failed', ['error' => $e->getMessage()]);
           }
       });

       $kernel->whenRequestLifecycleIsLongerThan(5000, function ($request, $response, $duration) {
           try {
               Log::channel('slow')->critical('Request slower than 5000ms', [
                   'duration' => $duration,
                   'url' => $request->fullUrl(),
               ]);
               AlertSlowRequest::dispatch($request->fullUrl(), $duration);
           } catch (\Throwable $e) {
               Log::error('Critical slow request handler failed', ['error' => $e->getMessage()]);
           }
       });
   }
   ```
2. **Extract only safe diagnostic fields** — never dump the full request or response objects
3. **Wrap every handler body in try-catch** — uncaught exceptions in terminate crash the process silently
4. **Keep handlers lightweight** — log writes are fast; dispatch queues for expensive work (Slack alerts, PagerDuty)
5. **Guard against recursion** — if the handler dispatches an HTTP call or queued job that itself triggers monitoring, implement a recursion guard
6. **Start with conservative thresholds** (2000ms) and calibrate downward after analyzing real traffic data

## Validation Checklist
- [ ] Handlers registered in `boot()` method, not `register()`
- [ ] Handler callbacks wrapped in try-catch — no uncaught exceptions can propagate
- [ ] Multiple thresholds used — at least info/warning/critical levels
- [ ] Only safe diagnostic fields extracted — no full request/response objects logged
- [ ] Heavy work (Slack alerts, HTTP calls) dispatched to queue, not executed inline
- [ ] Recursion guards in place for handlers that trigger outbound requests
- [ ] Log channel configured for slow request entries
- [ ] Tested with a threshold of 0ms to verify handler fires on every request

## Common Failures
- Registering in `register()` method: Handler never fires because kernel is not yet fully resolved. Fix: move to `boot()` method
- Uncaught exception crashes terminate: Response already sent, crash is invisible to users. Fix: always wrap handler in try-catch
- Single threshold for all monitoring: Loses severity gradient. Fix: register at least 2-3 graduated thresholds
- Logging full request objects: Exposes passwords, tokens, PII in logs. Fix: extract only needed fields
- Handler triggers another monitored request: Creates infinite recursion. Fix: use local logs instead of HTTP calls, or implement guards

## Decision Points
- **Number of thresholds**: Start with 3 (warning at p95, critical at p99, severe at p99.9). Adjust based on traffic data
- **Inline vs queued heavy work**: Log writing is fast enough to be inline. API calls, Slack messages, PagerDuty alerts must be queued
- **Log channel vs default**: Use a dedicated log channel (`'slow'`) to separate slow request logs from application logs, preventing log noise in the default channel

## Performance Considerations
- `microtime(true)` overhead is ~0.001ms per call — effectively zero
- Threshold iteration is O(n) with n = number of handlers — microseconds for 3-5 handlers
- Handler callbacks run post-response — they don't affect TTFB or client experience
- Under high concurrency, many handlers firing simultaneously can consume server resources — ensure queued dispatch for expensive work
- Handlers fire only when threshold is exceeded — zero overhead for fast requests

## Security Considerations
- Never log `$request->all()`, `$request->headers->all()`, or `$request->input()` — these contain passwords, tokens, and PII
- Extract only: `url`, `method`, `status`, `duration`, `content-length`, and safe identifiers (hashed user ID, not raw user data)
- Handlers run post-response — there is no way to report errors to the client if the handler fails
- Infinite recursion from handler-triggered requests can cause resource exhaustion and DoS-like behavior

## Related Rules
- Always wrap handler logic in try-catch blocks (Reliability)
- Register duration handlers in the `boot()` method, not `register()` (Architecture)
- Use multiple thresholds for graduated severity levels instead of a single threshold (Observability)
- Do not log full request or response objects in duration handlers (Security)
- Guard against handler recursion when handlers trigger their own requests (Reliability)

## Related Skills
- Safeguard Duration Handlers Against Exceptions and Recursion
- Calibrate Duration Handler Thresholds Using Real Traffic Data

## Success Criteria
- At least two graduated thresholds registered (e.g., 500ms warning + 5000ms critical)
- Slow requests appear in the dedicated log channel with safe diagnostic fields
- Handler exceptions never crash the PHP process
- No sensitive data (passwords, tokens, PII) appears in slow request logs
- Fast requests (below threshold) produce zero handler overhead

---

# Skill: Safeguard Duration Handlers Against Exceptions and Recursion

## Purpose
Apply defensive patterns to request duration lifecycle handlers: wrap callbacks in try-catch, guard against recursive invocations, and ensure handler failures don't crash the terminate phase.

## When To Use
- Auditing existing duration handlers for reliability gaps
- Implementing duration handlers in a high-traffic production application
- Adding handlers that dispatch HTTP calls or queue jobs (recursion risk)
- Enforcing organizational standards for handler reliability

## When NOT To Use
- Simple local-logging handlers with no I/O (try-catch is still recommended but risk is lower)
- Handlers that only increment in-memory counters (no external side effects)
- Development or local environments where handler failure is acceptable

## Prerequisites
- Duration handlers already registered (see "Implement Graduated Slow-Request Monitoring")
- Understanding of the terminate phase and its lack of error recovery
- Knowledge of the handler's side effects (HTTP calls, queue dispatch, file writes)

## Inputs
- The registered handler callbacks
- The external systems or services each handler interacts with
- The application's logging and alerting infrastructure

## Workflow
1. **Review each existing handler callback** for uncaught exception risk:
   - Any HTTP client call (`Http::post()`, `Http::get()`)
   - Any database query (`DB::insert()`, `Model::update()`)
   - Any file system operation (`Storage::put()`)
   - Any external service call (Slack, PagerDuty, email)
2. **Wrap every handler body in try-catch**:
   ```php
   $kernel->whenRequestLifecycleIsLongerThan(1000, function ($request, $response, $duration) {
       try {
           // Handler logic here
           Log::channel('slow')->warning('Slow request', [
               'duration' => $duration,
               'url' => $request->fullUrl(),
           ]);
       } catch (\Throwable $e) {
           // Log the failure — don't let it propagate
           Log::error('Duration handler failed', [
               'error' => $e->getMessage(),
               'threshold' => 1000,
               'duration' => $duration,
           ]);
       }
   });
   ```
3. **Identify recursion vectors** — any handler that initiates a new request through the application:
   - HTTP calls to an API endpoint served by the same application
   - Dispatch of a queued job that itself makes HTTP requests
   - File writes that trigger filesystem watchers which hit the application
4. **Implement recursion guards**:
   ```php
   // Option A: Use local logging instead of HTTP calls
   $kernel->whenRequestLifecycleIsLongerThan(1000, function ($request, $response, $duration) {
       Log::channel('slow')->warning(...); // Local — no new request
   });

   // Option B: Queue with exclusion
   $kernel->whenRequestLifecycleIsLongerThan(5000, function ($request, $response, $duration) {
       // Dispatch to queue — runs in separate process
       AlertSlowRequest::dispatch($request->fullUrl(), $duration);
   });

   // Option C: Static flag guard
   $kernel->whenRequestLifecycleIsLongerThan(1000, function ($request, $response, $duration) {
       static $handling = false;
       if ($handling) return;
       $handling = true;
       try {
           Http::post('https://monitor.internal/alert', [...]);
       } finally {
           $handling = false;
       }
   });
   ```
5. **Test handler failure scenarios**:
   - Simulate an exception in the handler (e.g., misconfigured log channel) — verify it's caught
   - Simulate a slow external API that triggers the handler again — verify recursion guard prevents infinite loops
   - Verify the main request completes successfully even when handlers fail
6. **Monitor handler failures** — add a metric or alert for handler exceptions so you know when monitoring itself is broken

## Validation Checklist
- [ ] Every handler callback wrapped in try-catch that catches `\Throwable`
- [ ] No handler makes synchronous HTTP calls that could trigger the same application's endpoints
- [ ] Handlers that queue jobs use asynchronous dispatch (not `dispatchSync`)
- [ ] Recursion guards (static flag, path exclusion, or queued dispatch) are in place for outbound handlers
- [ ] Handler failures are logged to a separate channel or monitored
- [ ] Simulated handler exceptions do not crash the PHP process
- [ ] Simulated recursion scenarios terminate gracefully (no stack overflow)

## Common Failures
- Catch block too narrow: `catch (Exception $e)` misses `\Error` (type errors, memory exhaustion). Fix: always use `catch (\Throwable $e)`
- Forgetting try-catch on new handlers: Adding a handler with external calls without wrapping it. Fix: establish a code review checklist that includes "try-catch on all handlers"
- Recursion via queued job: The job dispatches synchronously (`dispatchSync`) and makes an HTTP call that triggers the handler again. Fix: use async dispatch (`->dispatch()` instead of `->dispatchSync()`) or implement a guard
- Recursion via shared resource: Handler writes to a file that a file watcher sends to the application. Fix: write to a different path or use a static recursion flag

## Decision Points
- **Local logging vs external call**: Prefer local logging for all handlers. Use external calls (HTTP, queue) only for critical thresholds (>5000ms) where immediate human attention is needed
- **Static guard vs queue isolation**: Static guard is simpler but not thread-safe in multi-process environments. Queue isolation is safer for production — the queued job runs in a separate process with no shared state
- **Fail-open vs fail-closed**: Duration handlers should fail open — if the handler fails, the application continues unaffected. The try-catch ensures this

## Performance Considerations
- try-catch adds zero overhead when no exception is thrown — negligible cost
- Static recursion flags are in-memory and add no measurable overhead
- Queued dispatch from handlers adds a small Redis/DB write — acceptable for infrequent (critical threshold) events
- Local logging is fast (~0.5-2ms) — acceptable for inline handler execution

## Security Considerations
- Handler failure logging must not expose sensitive data — log only error message and threshold, not request/response data
- Static recursion guards in multi-process environments (PHP-FPM multiple workers) may not prevent all recursion — each worker has its own static state
- A misconfigured handler that causes infinite recursion can consume all available workers, leading to application unavailability

## Related Rules
- Always wrap handler logic in try-catch blocks (Reliability)
- Guard against handler recursion when handlers trigger their own requests (Reliability)
- Do not log full request or response objects in duration handlers (Security)
- Keep `terminate()` methods lightweight; defer heavy work to queues (Performance)

## Related Skills
- Implement Graduated Slow-Request Monitoring with Duration Handlers
- Calibrate Duration Handler Thresholds Using Real Traffic Data

## Success Criteria
- All duration handlers are wrapped in try-catch and cannot crash the terminate phase
- No handler produces recursive invocations under any condition
- Handler failures are logged and detectable without crashing the application
- The application serves requests correctly even when all handlers are failing

---

# Skill: Calibrate Duration Handler Thresholds Using Real Traffic Data

## Purpose
Analyze real application traffic to determine appropriate duration handler thresholds, starting conservatively and lowering incrementally based on measured latency distributions.

## When To Use
- First-time setup of request duration handlers
- Adjusting thresholds that produce too many (noisy) or too few (silent) alerts
- After a significant application change (deployment, infrastructure upgrade) that shifts latency distribution
- Establishing SLAs for request response times

## When NOT To Use
- Applications with no request duration monitoring yet (start with a conservative 2000ms threshold first)
- Development environments with artificially low latency (calibrate against production traffic)
- Applications already using external APM tools (use those tools' data instead)

## Prerequisites
- Duration handlers already registered (see "Implement Graduated Slow-Request Monitoring")
- A production or staging environment with real (or realistic) traffic
- Access to logs or monitoring data to analyze request durations
- A log channel configured for slow request entries, or access to application request logs

## Inputs
- Current handler threshold values (if any)
- Application request logs with timing data
- Business requirements for acceptable response times (SLAs)
- Traffic patterns (peak hours, endpoint distribution, user geography)

## Workflow
1. **Start with a conservative threshold** of 2000ms (2 seconds). Register a single handler at this level:
   ```php
   $kernel->whenRequestLifecycleIsLongerThan(2000, function ($request, $response, $duration) {
       Log::channel('slow')->info('Request exceeded 2000ms', [
           'duration' => $duration,
           'url' => $request->fullUrl(),
           'method' => $request->method(),
           'status' => $response->getStatusCode(),
       ]);
   });
   ```
2. **Collect data for one week** — log every request that exceeds the 2000ms threshold
3. **Analyze the collected data**:
   - Count total slow requests per day
   - Find the 95th, 99th, and 99.9th percentile durations
   - Identify which endpoints are consistently slow
   - Identify temporal patterns (peak hours, day-of-week variations)
4. **Determine the p95 duration** from your analysis. Set the warning threshold at this value:
   - If p95 is 800ms, set warning threshold at 800ms
   - This captures the slowest 5% of requests
5. **Determine the p99 duration**. Set the critical threshold at this value:
   - If p99 is 2500ms, set critical threshold at 2500ms
   - This captures the slowest 1% of requests
6. **Determine the p99.9 duration**. Set the severe threshold at this value:
   - If p99.9 is 8000ms, set severe threshold at 8000ms
   - This captures the slowest 0.1% — genuine outliers that need immediate attention
7. **Lower thresholds incrementally by 500ms** over subsequent weeks:
   - Week 2: lower warning by 500ms, monitor noise level
   - If noise is acceptable (5-10% of requests trigger warning), lower further next week
   - If noise is too high, raise back by 250ms and stabilize
8. **Account for endpoint variance** — if some endpoints are inherently slower (report generation, exports), consider path-based filtering or separate thresholds per route group

## Validation Checklist
- [ ] Initial threshold is at least 2000ms — conservative starting point
- [ ] Data collected for at least one full business week (7 days) before calibration
- [ ] Percentile calculations (p95, p99, p99.9) are derived from real traffic data
- [ ] Warning threshold targets the slowest 5% of requests
- [ ] Critical threshold targets the slowest 1%
- [ ] Severe threshold targets the slowest 0.1%
- [ ] Thresholds adjusted incrementally (500ms steps), not in large jumps
- [ ] Noise level is acceptable — alerts are actionable, not ignored
- [ ] Endpoint-specific thresholds considered for inherently slow routes

## Common Failures
- Starting too low: Setting a 300ms threshold on day one floods logs with thousands of entries. Fix: start at 2000ms and lower incrementally
- Calibrating against development traffic: Localhost has different latency (no network, no real load) than production. Fix: always use production or staging-with-production-traffic for calibration
- Ignoring endpoint variance: A report export that takes 30 seconds is "normal" but triggers the same handler as a 30-second API endpoint that should respond in 200ms. Fix: add path-based filtering or endpoint-specific thresholds
- Not re-calibrating after changes: After a major deployment or infrastructure change, the latency distribution shifts. Fix: re-analyze data quarterly or after significant changes
- Setting thresholds and forgetting: Traffic patterns change over time. Thresholds that work today may be too noisy in six months. Fix: schedule quarterly calibration reviews

## Decision Points
- **Percentile-based vs fixed thresholds**: Percentile-based thresholds adapt to the application's natural latency distribution. Fixed thresholds (e.g., "1000ms") are simpler but may be wrong for your application
- **Endpoint-specific vs global thresholds**: Use global thresholds first. Add endpoint-specific thresholds only if the application has inherently slow endpoints (reports, exports, batch operations) that would dominate the slow request log
- **One-week vs longer calibration**: One week captures weekly traffic cycles. Longer periods (2-4 weeks) smooth out anomalies but delay the calibration. Start with one week

## Performance Considerations
- The handlers themselves don't affect calibration — they only log when thresholds are exceeded
- Log volume from handlers is proportional to threshold noise. Proper calibration keeps log volume manageable (5-10% of requests at warning level)
- Analysis of log data is offline — no runtime performance impact
- Percentile calculations on large datasets (millions of requests) may need batch processing; use log aggregation tools or database queries

## Security Considerations
- Slow request logs contain request URLs — ensure URLs don't contain sensitive query parameters (filter them out in the handler)
- Duration data itself is not sensitive but aggregated duration distributions can reveal infrastructure characteristics — restrict access to monitoring dashboards
- When calibrating with actual production traffic, ensure no PII or sensitive data is logged during the data collection phase (even at the conservative threshold)

## Related Rules
- Calibrate thresholds from real traffic data — start high, lower incrementally (Performance)
- Use multiple thresholds for graduated severity levels instead of a single threshold (Observability)
- Do not log full request or response objects in duration handlers (Security)

## Related Skills
- Implement Graduated Slow-Request Monitoring with Duration Handlers
- Safeguard Duration Handlers Against Exceptions and Recursion

## Success Criteria
- Thresholds are based on measured p95, p99, and p99.9 latency values from real production traffic
- Warning threshold captures ~5% of requests (actionable, not noisy)
- Critical threshold captures ~1% of requests (genuine outliers)
- Severe threshold captures ~0.1% of requests (immediate attention required)
- Thresholds are reviewed and adjusted incrementally based on ongoing traffic analysis
- Endpoints with inherently different latency profiles are handled separately if needed
