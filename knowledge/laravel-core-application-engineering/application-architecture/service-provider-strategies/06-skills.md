# Skill: Keep register() Thin with Container Bindings

## Purpose
Implement service provider `register()` methods that contain only container binding calls, with no service resolution, side effects, or business logic.

## When To Use
- Writing a new service provider
- Refactoring an existing provider with logic in `register()`
- Creating a deferred provider
- Reviewing provider code for best practices

## When NOT To Use
- In `boot()` methods (can contain service resolution and side effects)
- When registering providers conditionally by environment (use `$this->app->register()` in `register()`)
- For model observers and event listeners (belong in `boot()`)

## Prerequisites
- Understanding of the two-phase provider contract (all `register()` before any `boot()`)
- Service class and interface definitions ready for binding
- Service provider class already scaffolded

## Inputs
- Provider class file
- List of bindings to register (abstract → concrete, binding type)
- Whether the provider should be deferred

## Workflow
1. Open the service provider class
2. In `register()`, add only the following type of calls:
   - `$this->app->bind(Abstract::class, Concrete::class)`
   - `$this->app->singleton(Abstract::class, Concrete::class)`
   - `$this->app->instance(Abstract::class, $instance)`
   - `$this->app->tag([...], 'tag')`
   - `$this->app->scoped(Abstract::class, Concrete::class)` (Laravel 11+)
   - Environment-gated sub-provider registration: `$this->app->register(Provider::class)`
3. Do NOT include in `register()`:
   - `$this->app->make()` — no service resolution
   - `$this->app->call()` — no method injection calls
   - Facade calls — facades may not be available
   - Helper functions (except `$this->app`)
   - Database queries, API calls, business logic
4. If the service is not used on every request, mark the provider as deferred:
   - Set `protected $defer = true`
   - Implement `provides()` returning all bound abstract names
5. Move any service resolution or side effects to `boot()` using method injection

## Validation Checklist
- [ ] `register()` contains only binding calls — no `$this->app->make()` or facade calls
- [ ] All bindings use interfaces as the abstract where possible
- [ ] Stateless services use `singleton()` or `scoped()`
- [ ] Deferred providers have `$defer = true` and implement `provides()`
- [ ] Provider does not contain business logic, database queries, or API calls
- [ ] Method injection is used in `boot()` instead of manual `$this->app->make()`
- [ ] Environment-gated providers (debug toolbar, profiler) are wrapped in `if (! $this->app->environment('production'))`

## Common Failures
- Calling `$this->app->make()` in `register()` — resolves partially initialized service
- Using facades in `register()` — facades may not have their application reference set yet
- Forgetting `provides()` on deferred providers — `BindingResolutionException` at resolution time
- Putting business logic in `register()` — logic runs on every request untestably
- Not deferring providers for infrequent services — unnecessary bootstrap overhead

## Decision Points
- Eager vs deferred? Deferred if service is used on <80% of requests
- Single provider vs split into multiple? Split by domain/bounded context for modular applications
- Environment gating? Debug/profiler providers must only register in non-production

## Related Rules
- Keep register() Thin — Only Container Bindings (05-rules.md)
- Use Method Injection in boot() (05-rules.md)
- Defer Providers for Services Not Used on Every Request (05-rules.md)
- Implement provides() for Every Deferred Provider (05-rules.md)
- Organize Providers by Domain or Bounded Context (05-rules.md)
- Never Put Business Logic in Service Providers (05-rules.md)
- Gate Debug/Profiler Providers by Environment (05-rules.md)

## Related Skills
- Skill: Bind and Resolve Services in Container
- Skill: Optimize Bootstrap Performance
- Skill: Organize Service Providers by Domain

## Success Criteria
- `register()` contains only container binding calls
- No service resolution, facades, or business logic exists in `register()` or `boot()`
- Deferred providers correctly implement `$defer` and `provides()`
- Method injection is used in `boot()` for service interaction
- Environment gating protects debug/profiler providers from production registration

---

# Skill: Organize Service Providers by Domain

## Purpose
Create separate service providers per domain or bounded context, replacing monolithic single-provider registration with clear, scoped ownership boundaries.

## When To Use
- Application has 10+ total container bindings
- Project uses domain-driven or modular organizational pattern
- Multiple teams own different parts of the codebase
- Selective provider deferral or registration is needed per domain

## When NOT To Use
- Small applications with fewer than 10 bindings (single `AppServiceProvider` suffices)
- Single-domain applications where all bindings belong to one context
- When the team is not familiar with domain boundaries

## Prerequisites
- Bounded contexts are documented and agreed upon
- Organizational pattern is selected (domain-driven or modular)
- List of all container bindings grouped by domain

## Inputs
- Current service provider structure (likely monolithic)
- Bounded context map with domain boundaries
- For each domain: list of service bindings, observers, event listeners

## Workflow
1. Identify bounded contexts from the ADR or business domain analysis
2. For each domain, create a dedicated service provider class:
   - `app/Providers/BillingServiceProvider.php`
   - `app/Providers/SalesServiceProvider.php`
   - `app/Providers/UsersServiceProvider.php`
3. Move bindings from the monolithic provider to the appropriate domain provider
4. In each domain provider's `register()` method, add only the domain's bindings
5. In each domain provider's `boot()` method, add domain-specific observers and event listeners using method injection
6. Register each domain provider:
   - **Laravel 10-**: add to `providers` array in `config/app.php`
   - **Laravel 11+**: add via `bootstrap/app.php` fluent API or `config/app.php`
7. Evaluate each domain provider for deferred registration:
   - If the domain's services are not used on most requests, set `$defer = true` and implement `provides()`
8. Remove migrated bindings from the original monolithic provider
9. Run `php artisan optimize:clear` and then `php artisan optimize` to rebuild provider manifest

## Validation Checklist
- [ ] Each domain has exactly one service provider
- [ ] All bindings are moved from the monolithic provider to domain providers
- [ ] `register()` methods contain only container binding calls
- [ ] `boot()` methods use method injection for dependencies
- [ ] Domain providers are registered in the application configuration
- [ ] Deferred providers implement `$defer` and `provides()`
- [ ] No binding exists in multiple providers (no duplication)
- [ ] `php artisan optimize` completes without errors
- [ ] Application behaves identically before and after the reorganization
- [ ] Full test suite passes

## Common Failures
- Leaving bindings in both monolithic and domain providers — duplicate registration
- Not updating `config/app.php` providers array after creating domain providers — provider not loaded
- Domain providers with unclear boundaries — cross-domain bindings in wrong provider
- Over-deferring domain providers — adding overhead if services are used on every request

## Decision Points
- One provider per domain or per sub-domain? One provider per bounded context; sub-domains within a context share a provider
- Deferred or eager per domain? Evaluate by profiling service resolution frequency per domain
- Shared bindings location? Place truly shared bindings (used by 3+ domains) in `AppServiceProvider`

## Related Rules
- Keep register() Thin — Only Container Bindings (05-rules.md)
- Use Method Injection in boot() (05-rules.md)
- Defer Providers for Services Not Used on Every Request (05-rules.md)
- Implement provides() for Every Deferred Provider (05-rules.md)
- Organize Providers by Domain or Bounded Context (05-rules.md)
- Never Put Business Logic in Service Providers (05-rules.md)
- Gate Debug/Profiler Providers by Environment (05-rules.md)

## Related Skills
- Skill: Keep register() Thin with Container Bindings
- Skill: Bind and Resolve Services in Container
- Skill: Select and Document Organizational Pattern

## Success Criteria
- Each bounded context has its own dedicated service provider
- No monolithic provider contains bindings from multiple domains
- Domain providers can be independently deferred or environment-gated
- Full test suite passes after reorganization
- Provider manifest is rebuilt and verified
