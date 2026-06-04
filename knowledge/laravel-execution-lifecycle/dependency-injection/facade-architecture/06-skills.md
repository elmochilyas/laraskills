# Skill: Apply Facade Pattern for Static Proxy Access

## Purpose
Use Laravel's facade pattern to provide concise, testable static access to container-resolved services, primarily in presentation-layer code where constructor injection is impractical.

## When To Use
- In controllers, route files, and Blade views for common services (Cache, Log, Config, DB)
- During prototyping for quick access to services without constructor wiring
- In templates where constructor injection is not available

## When NOT To Use
- In domain services, repositories, or business logic — use constructor injection instead
- When the dependency is used in multiple methods of a class — inject it once in the constructor
- When testability is critical — constructor injection provides cleaner test setup
- In Octane long-running processes without per-request facade root clearing

## Prerequisites
- Understanding of `__callStatic()` proxy pattern and `getFacadeAccessor()` method
- Knowledge of facade resolution: static call → resolveFacadeInstance() → container make() → instance
- Familiarity with `Facade::fake()`, `shouldReceive()`, and facade root caching

## Inputs
- Service class or container binding key to expose via facade
- Facade class extending `Illuminate\Support\Facades\Facade` (optional — use Real-Time Facades for simple cases)
- Alias registration in `config/app.php` `aliases` array (optional)

## Workflow
1. Determine if a facade is appropriate — limit to presentation-layer code (controllers, views, routes)
2. If creating a custom facade: extend `Facade`, implement `getFacadeAccessor()` returning the container binding key or class name
3. Register the facade alias in `config/app.php` `aliases` array if global access is desired
4. For Real-Time Facades: prefix the class namespace with `Facades\` — e.g., `Facades\App\Services\PaymentService`
5. Use `Facade::shouldReceive()` in tests to set Mockery expectations and assertions
6. Clear facade resolved instances between tests via `Facade::clearResolvedInstances()` in `setUp()`
7. For Octane: clear facade roots per-request via `RequestHandled` event listener

## Validation Checklist
- [ ] Facades are used only in controllers, views, and route files (not business logic)
- [ ] Domain services and repositories use constructor injection, not facades
- [ ] Test `setUp()` clears facade resolved instances
- [ ] Octane deployment handles facade root clearing per request
- [ ] Custom facades are created only when a service is used via static proxy across many classes
- [ ] No facade calls exist inside class constructors

## Common Failures
| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `RuntimeException: facade root not set` | `getFacadeAccessor()` called before container bootstrapped | Only access facades after application bootstrap |
| Stale facade state across tests | Facade `$resolvedInstance` static cache persists | Call `Facade::clearResolvedInstances()` in `setUp()` |
| Facade mock not taking effect | Facade root resolved before `shouldReceive()` | Clear resolved instance before setting expectations |
| Stale service in Octane | Facade root cached across requests | Clear per-request via `RequestHandled` listener |
| Unnecessary custom facade | Service used in 1-2 places only | Remove facade, use constructor injection |

## Decision Points
- **Standard facade vs Real-Time Facade**: Use standard facade for services accessed in many locations; use Real-Time Facade for one-off convenience
- **Facade vs constructor injection**: Use facade in controllers/views; use constructor injection in services/repositories
- **`shouldReceive()` vs `swap()`**: Use `shouldReceive()` for assertion-rich tests with Mockery expectations; use `swap()` for simple instance replacement

## Performance Considerations
- Facade root resolved once per facade per request (cached in static property)
- Alias autoloading: first use triggers alias resolution + class loading + container resolution (~0.1ms)
- Real-Time Facades add autoloader lookup overhead
- In Octane: facade root caching persists across requests — clear per-request if service should refresh

## Security Considerations
- Facades provide global access to services — sensitive operations exposed via static methods
- Facade access bypasses constructor dependency controls — any code can call `Cache::get()`
- Real-Time Facades auto-resolve any bound class — avoid untrusted class names as facade accessors
- Security-critical services should use constructor injection, not facades

## Related Rules
- Restrict Facades to Controllers, Views, and Route Files
- Clear Facade State Between Tests
- Inject Dependencies in Business Logic, Do Not Use Facades
- Never Use Facade Resolution Inside Constructors
- Use Facade::fake() Over Real Service Setup in Tests
- Avoid Custom Facades for Services Used in Few Places
- Clear Facade Roots Per-Request in Octane

## Related Skills
- Apply Constructor Injection for Explicit Dependencies
- Replace Service Locator with Constructor Injection
- Test Container-Dependent Code with Instance Binding

## Success Criteria
- Facades appear only in presentation-layer code (controllers, views, routes)
- Business logic classes use constructor injection exclusively
- All facade tests use `shouldReceive()` or `Facade::fake()` with proper cleanup
- Octane deployments have facade root clearing configured
- Custom facades are created only for services with broad cross-cutting usage
