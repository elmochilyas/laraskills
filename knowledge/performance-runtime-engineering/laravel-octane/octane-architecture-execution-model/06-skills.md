# Skill: Audit and Adapt Laravel Application for Octane's Persistent Execution Model

## Purpose
Transition a Laravel application from PHP-FPM's per-request lifecycle to Octane's boot-once handle-many architecture by auditing service providers, eliminating static state, and configuring worker recycling — preventing cross-request data leaks while maximizing throughput gains.

## When To Use
- Before migrating any Laravel application from PHP-FPM to Octane
- When onboarding a new codebase to Octane for the first time
- After adding new packages or making significant code changes to an Octane-deployed application
- When investigating cross-request data contamination incidents in Octane

## When NOT To Use
- For applications remaining on PHP-FPM (no migration planned)
- For stateless API-only applications already confirmed Octane-compatible with no recent changes
- When the goal is only performance benchmarking without deploying Octane

## Prerequisites
- Laravel application with `laravel/octane` installed and configured
- Access to application source code and all service providers
- PHP 8.1+ with required extensions for chosen Octane driver
- Staging environment with production-representative configurations
- List of all third-party Composer packages in use

## Inputs
- Application codebase (all service providers, facades, middleware)
- Current `composer.json` showing all dependencies
- Deployment scripts and configuration
- PHP-FPM baseline performance metrics (RPS, p95 latency, RSS)

## Workflow

### 1. Audit All Service Providers for Octane Compatibility
- List every service provider in `config/app.php` and any dynamically registered providers
- For each provider, examine `register()` and `boot()` methods
- Flag any singleton bindings that depend on request-scoped data (user, request, session, auth)
- Flag any `boot()` logic that registers event listeners, middleware, or route model bindings without idempotency checks
- Replace request-scoped singletons with `$this->app->scoped()` bindings
- Move non-idempotent `boot()` logic to `Octane::booted()` callbacks

### 2. Eliminate Static Properties Used for Request-Scoped Data
- Search entire codebase: `grep -rn "static \" app/ --include="*.php"` and `grep -rn "static \$" app/ --include="*.php"`
- For each static property found, determine if it holds request-scoped state
- Replace mutable static state with instance properties, container bindings, or method parameters
- For read-only shared state (configuration, feature flags) that must remain static, add explicit reset logic in `Octane::booted()` or document as intentionally shared

### 3. Configure Worker Recycling Threshold
- Set `max_requests` in `config/octane.php` to 1000 (initial safe default)
- Plan to monitor RSS growth and adjust: lower (500) if RSS grows >10% per 100 requests, higher (5000) if memory is stable
- Never set `max_requests` to 0 (unlimited) — unbounded memory drift guarantees eventual OOM
- Never set `max_requests` below 250 — excessive recycling negates Octane's bootstrap elimination benefit

### 4. Replace Global State Access with Laravel Abstractions
- Search for `$_GET`, `$_POST`, `$_SESSION`, `$_SERVER`, `$_COOKIE` direct access
- Replace with `Illuminate\Http\Request` facade or injected request instance
- Search for `$_ENV`, `getenv()` — replace with `config()` helper or Laravel's environment abstraction
- Verify no code relies on `register_shutdown_function()` or `__destruct()` for per-request cleanup

### 5. Implement State Leak Detection During Development
- Run `php artisan octane:start --watch` during development to enable automatic leak detection
- Use `php artisan octane:watch` in a separate terminal for real-time state leak logging
- Configure CI to run `php artisan octane:test` on every commit
- Add PHPStan or Larastan rules for static property misuse detection

### 6. Verify Sandbox Isolation for Request-Scoped Services
- List all services that must be unique per request (database connections, auth state, session data)
- Confirm they are not bound as singletons in the container
- For services that must be fresh per request without explicit binding, use `Octane::ensureSandboxed()` helper
- Test with concurrent requests: `ab -n 100 -c 10` and verify no cross-request data contamination

### 7. Validate Graceful Reload and Worker Lifecycle
- Test `php artisan octane:reload` — confirm old workers finish in-flight requests before terminating
- Verify new workers boot with latest code after reload
- Confirm no in-flight requests are dropped during reload
- Test reload under concurrent load to verify zero-downtime behavior

### 8. Conduct 24-Hour Worker Memory Soak Test
- Deploy to staging with production-representative traffic
- Monitor per-worker RSS every hour for 24 hours
- Alert if any worker shows >10% RSS growth per hour or absolute growth from baseline >50%
- If memory drift detected, investigate leaks using memory profiling and static property audit

### 9. Document Execution Model Decisions for the Team
- Record the Octane architecture decision, driver choice, and rationale
- Document all service provider changes made for Octane compatibility
- List any packages found incompatible and their workarounds or replacements
- Create runbook entries for `octane:status`, `octane:reload`, and health check monitoring

## Validation Checklist
- [ ] All service providers audited and no request-scoped singletons remain
- [ ] All mutable static properties eliminated or properly isolated
- [ ] `max_requests` configured between 500–1000 (initial value)
- [ ] No direct superglobal access (`$_GET`, `$_POST`, `$_SESSION`)
- [ ] `php artisan octane:test` passes with zero warnings
- [ ] Concurrent request test shows no cross-request data contamination
- [ ] Graceful reload (`octane:reload`) completes without dropping requests
- [ ] Per-worker RSS stable (<10% growth per hour) over 24-hour soak test
- [ ] Health check endpoint configured and responding
- [ ] Team documentation written covering execution model differences

## Common Failures

| Failure | Symptom | Root Cause | Mitigation |
|---------|---------|------------|------------|
| Cross-request data leak | User A sees User B's data | Singleton binding for request-scoped service | Audit and replace with `scoped()` binding |
| Duplicate event handlers | Event fires N times per trigger | `boot()` method registers listener without idempotency | Move registration to `Octane::booted()` |
| Worker OOM after N hours | RSS grows until killed | Accumulated memory fragmentation or state leak | Lower `max_requests` or investigate leak source |
| `octane:reload` drops requests | In-flight requests fail during reload | Load balancer not configured for graceful draining | Configure health check and load balancer retry logic |
| Static property contamination | Intermittent wrong data values | Mutable static retains value from previous request | Replace with instance property or container binding |

## Decision Points

| Decision | How To Decide |
|----------|---------------|
| Singleton vs scoped binding | Singleton for truly stateless services (config, logger); scoped for any service touching request state (auth, session, DB) |
| `max_requests` value | Start at 1000, lower if RSS grows >10% per 100 requests, raise if memory is stable and you want less recycling overhead |
| `Octane::booted()` vs provider `boot()` | Use `Octane::booted()` for one-time worker setup; use provider `boot()` only for per-request registration that is idempotent |
| Refactor vs exception list | Refactor if the code is in the application or first-party package; exception-list only for third-party packages where refactoring is impossible |

## Performance Considerations
- Each successful static property elimination saves 0.01-0.1ms per request in cloning overhead
- Setting `max_requests` too low (under 250) adds 10-40ms bootstrap cost per N requests, negating 25-50% of Octane's gain
- Per-request service container cloning costs 0.5-2ms — negligible compared to the 10-40ms bootstrap it replaces
- OpCache preloading reduces cold-start latency by 2-5ms per worker — configure before production
- Octane throughput drops 40-60% when memory pressure triggers swap — ensure adequate RAM

## Security Considerations
- Cross-request data leakage is the most critical Octane security risk — User A's data visible to User B
- Static properties bypass the sandbox entirely — data persists across requests regardless of container configuration
- Singleton misuse with request-scoped data causes privilege escalation and data leakage
- Third-party packages using global state introduce security vulnerabilities without any application code change
- Session data must use Laravel's session drivers — `$_SESSION` persists across requests in the same worker

## Related Rules

| Rule | File | Application |
|------|------|-------------|
| Audit all service providers before deploying Octane | `05-rules.md:1` | Step 1: provider audit workflow |
| Never use static properties for request-scoped data in Octane | `05-rules.md:29` | Step 2: static property elimination |
| Set max_requests to 500-1000 for Octane workers | `05-rules.md:55` | Step 3: worker recycling configuration |
| Use Octane::booted() for per-worker initialization | `05-rules.md:77` | Steps 1.6, 2.4: boot logic migration |

## Related Skills

| Skill | Relation |
|-------|----------|
| Install and Configure Octane for a Laravel Project | Prerequisite — this skill assumes Octane is installed |
| Select the Optimal Octane Driver | The driver choice affects state isolation guarantees (Swoole coroutines share memory) |
| Benchmark Octane Performance Gain Estimation | Run after Octane architecture adaptation to measure gain |
| Configure Octane Workers by Driver | Worker count and max_requests values depend on driver specifics |
| Perform FPM-to-Octane Migration | This skill is the audit phase of the larger migration workflow |
| Monitor and Debug Octane State Leaks | Used when soak test reveals state contamination issues |

## Success Criteria
- Application runs under Octane for 24+ hours with zero state leak incidents
- `php artisan octane:test` passes with no warnings
- Worker RSS remains stable (<10% growth over 24 hours)
- No static properties used for request-scoped state in the entire application
- All service providers use `scoped()` or `singleton()` correctly based on state nature
- Team can explain the boot-once handle-many model and the audit requirements
