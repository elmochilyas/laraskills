# Skill: Write Context-Aware Boot Code for Console vs HTTP

## Purpose
Write service providers and initialization code that correctly handles the differences between HTTP and Console kernel bootstrap, ensuring code behaves correctly in both contexts.

## When To Use
- Writing service providers that must behave differently in CLI vs HTTP contexts
- Debugging issues that manifest only in console commands (Artisan, queue workers, scheduler)
- Understanding why middleware-based features don't work in CLI
- Registering console-specific services or commands

## When NOT To Use
- For business logic decisions that should be context-independent — use dependency injection with different implementations
- For simulating middleware behavior in console commands — use command-specific event hooks instead
- For overriding kernel bootstrap behavior unless building a custom kernel

## Prerequisites
- Understanding of the 16-step boot sequence from `complete-boot-sequence`
- Knowledge of which services depend on middleware (session, auth, CSRF)

## Inputs
- Service provider code that needs context-aware registration
- Console command code that should be tested for context safety

## Workflow
1. Identify services that depend on middleware-provided state (session, auth, CSRF, cookies)
2. Guard their registration with `$this->app->runningInConsole()` in the provider's `register()` or `boot()` method
3. Audit all Artisan command `handle()` methods for unauthorized access to `auth()`, `session()`, `Cookie`, or `csrf_token()`
4. Replace middleware-dependent code in commands with direct container resolution or command arguments
5. Add `->withoutOverlapping()` to scheduled commands that may exceed their run interval
6. Check `app()->isDownForMaintenance()` in commands that should not run during maintenance
7. Run tests via `php artisan` in CI alongside HTTP feature tests to catch context-specific failures

## Validation Checklist
- [ ] Services depending on middleware state are guarded with `runningInConsole()` or not registered in CLI
- [ ] No Artisan command `handle()` method accesses `auth()`, `session()`, or CSRF token
- [ ] Scheduled commands have `->withoutOverlapping()` where execution may overlap
- [ ] Maintenance-sensitive commands check `app()->isDownForMaintenance()`
- [ ] CI pipeline runs `php artisan` command tests in addition to HTTP tests
- [ ] `runningInConsole()` is not used for business logic decisions

## Common Failures
- Assuming `auth()->user()` returns a user in console commands — it returns `null` because auth middleware doesn't run
- Registering HTTP-only services unconditionally — they fail when resolved in CLI context
- Forgetting `withoutOverlapping()` — long commands spawn parallel processes, wasting resources
- Using `env()` in commands that expect HTTP request context — env is loaded but request context is absent

## Decision Points
- Use `runningInConsole()` for provider registration decisions; use dependency injection for business logic differences
- If a command needs user context, accept a user ID as an argument rather than relying on auth
- If a feature must behave differently in CLI, inject different service implementations rather than branching on context

## Performance Considerations
- Console bootstrapping is typically faster than HTTP (no middleware pipeline)
- `schedule:run` boots the full application every invocation — cache config/routes/events to reduce cost
- `withoutOverlapping()` uses a file lock to prevent concurrent instances — adds minimal overhead

## Security Considerations
- Console commands run with full container access — validate user input and permissions explicitly
- No CSRF, no auth middleware, no session — commands must implement their own authentication if needed
- Scheduler tasks run as the web server user — validate file permissions and command arguments
- Maintenance mode is ignored by default in console — check `isDownForMaintenance()` for sensitive commands

## Related Rules
- Console vs HTTP Boot Differences Rule 1: Guard Console-Specific Provider Registration
- Console vs HTTP Boot Differences Rule 2: Never Depend on Middleware State in Console Commands
- Console vs HTTP Boot Differences Rule 6: Use runningInConsole() for Context-Aware Logic, Not Business Decisions

## Related Skills
- Navigate the Complete Boot Sequence (complete-boot-sequence)
- Structure Service Provider register() Methods (register-phase-order)
- Structure Service Provider boot() Methods (boot-phase-order)

## Success Criteria
- All console commands run without errors in a clean CLI environment
- No middleware-dependent code exists in any command `handle()` method
- Service providers correctly register CLI-specific services only when `runningInConsole()` is true
- Scheduled commands do not overlap and respect maintenance mode
- Business logic is context-independent and tested in both HTTP and CLI
