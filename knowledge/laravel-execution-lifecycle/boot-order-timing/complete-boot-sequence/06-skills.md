# Skill: Navigate the Complete Boot Sequence

## Purpose
Trace and understand every step of Laravel's 16-step boot pipeline — from `public/index.php` through response dispatch — to debug bootstrap issues and optimize startup time.

## When To Use
- Debugging bootstrap failures (missing config, provider resolution errors, unexpected middleware behavior)
- Understanding where in the lifecycle a piece of code executes
- Optimizing application startup time by identifying expensive boot steps
- Onboarding developers to Laravel's internal architecture

## When NOT To Use
- For provider-specific register/boot details — use targeted skills for `register-phase-order` or `boot-phase-order`
- For Octane-specific variations — use `octane-boot-timing` skill
- For console vs HTTP boot differences — use `console-vs-http-boot-differences` skill
- For bootstrap event system details — use `bootstrap-with-event-system` skill

## Prerequisites
- Basic understanding of the HTTP request lifecycle in Laravel
- Familiarity with `public/index.php` and `bootstrap/app.php`

## Inputs
- The bootstrapper list from the HTTP Kernel or Console Kernel
- Service provider list from `config/app.php`
- Bootstrap timing data (e.g., `LARAVEL_START` to middleware delta)

## Workflow
1. Start at `public/index.php` — the single entry point that requires Composer autoloader and creates the Application
2. Trace into `bootstrap/app.php` — creates the Application instance and registers framework core providers
3. Identify which kernel is used (`Http\Kernel` or `Console\Kernel`) — determines bootstrapper set
4. Map the 6 kernel bootstrappers executed by `Kernel::bootstrap()`:
   - `LoadEnvironmentVariables` (step 2)
   - `LoadConfiguration` (step 3)
   - `HandleExceptions` (step 4)
   - `RegisterFacades` (step 5)
   - `RegisterProviders` (step 6)
   - `BootProviders` (step 7)
5. Identify provider `register()` phase (step 6) — all providers register bindings
6. Identify provider `boot()` phase (step 7) — all providers initialize
7. Map the middleware pipeline (steps 8-10): global → group → route middleware
8. Trace route dispatch (step 11) through controller (step 12) to response (step 13)
9. Map termination (steps 14-16): response sent, terminable middleware runs
10. Measure bootstrap duration by comparing `LARAVEL_START` to the first middleware execution

## Validation Checklist
- [ ] Can describe the 16-step boot sequence in order from memory
- [ ] Understand which bootstrappers run and in what fixed order
- [ ] Know the difference between `register()` and `boot()` phases
- [ ] Can trace a request from `public/index.php` through middleware to response
- [ ] Production bootstrap caching (`config:cache`, `route:cache`, `event:cache`) is configured
- [ ] Bootstrap duration is monitored in production (<100ms target)

## Common Failures
- Assuming `register()` and `boot()` phases overlap — they are strictly sequential (all `register()` then all `boot()`)
- Trying to reorder or remove kernel bootstrappers — they are fixed in the kernel class
- Resolving services in `register()` — fails because dependent providers haven't registered yet
- Calling `$app->boot()` manually — forces double-boot or early boot before all registrations

## Decision Points
- If a step in the sequence is slow, check if caching applies (config, route, event cache)
- If a provider fails to resolve a service in `boot()`, check provider registration order in `config/app.php`
- If Octane is used, understand that steps 1-15 run once per worker, not per request

## Performance Considerations
- Bootstrap time breakdown: Composer autoloader (1-3ms), config loading (10-40ms), provider registration (5-20ms), provider boot (10-30ms)
- Config caching reduces config loading to <1ms; route caching eliminates route registration overhead
- Without cache, bootstrap takes 30-80ms; with full caching, 5-15ms
- Octane amortizes bootstrap cost over thousands of requests

## Security Considerations
- `HandleExceptions` bootstrapper registers error/exception handlers before any application code
- `RegisterFacades` provides global access to services — ensure facades are not abused
- Configuration loading must complete before providers register to ensure consistent config
- Octane's one-time boot means auth/gate services are initialized once — they must be stateless or scoped

## Related Rules
- Complete Boot Sequence Rule 3: Understand the 16-Step Boot Sequence Order
- Complete Boot Sequence Rule 5: Monitor Bootstrap Time in Production
- Complete Boot Sequence Rule 6: Never Call $app->boot() Manually

## Related Skills
- Structure Service Provider register() Methods (register-phase-order)
- Structure Service Provider boot() Methods (boot-phase-order)
- Leverage Bootstrap Events for Monitoring and Setup (bootstrap-with-event-system)
- Adapt Boot Timing for Octane (octane-boot-timing)
- Write Context-Aware Boot Code for Console vs HTTP (console-vs-http-boot-differences)

## Success Criteria
- Developer can trace any code path back to its position in the 16-step sequence
- Bootstrap issues are diagnosed by identifying which step causes the failure
- Bootstrap time is measured, monitored, and optimized using caching strategies
- No manual `$app->boot()` calls exist in application code
