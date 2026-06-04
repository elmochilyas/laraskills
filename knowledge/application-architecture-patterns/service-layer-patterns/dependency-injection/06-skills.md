# Skill: Inject Service Dependencies via Constructor Injection

## Purpose
Use constructor injection for all required service/action dependencies, depend on interfaces at variation points, avoid facades in injected services, and watch for 5+ constructor dependencies as a splitting signal.

## When To Use
- Always — constructor injection should be the default for all services and actions

## When NOT To Use
- Prototype-stage where DI setup overhead isn't justified
- Trivial scripts or one-off commands

## Prerequisites
- Understanding of Laravel's service container
- Knowledge of service providers for interface binding

## Inputs
- Service/action class with identified dependencies
- Interface contracts where variation is needed

## Workflow
1. **Use constructor injection for all required dependencies.** Declare dependencies as constructor parameters with `private`/`protected`/`public` visibility. The container resolves automatically. Do not use `app()`, service locator, or facades in services.

2. **Depend on interfaces, not concrete classes, at variation points.** When a service may need alternative implementations (payment gateways, notification channels), depend on an interface and bind the implementation in a service provider.

3. **Avoid facades in injected services.** Replace `\Cache::get()`, `\Log::info()`, and other facades with injected contracts. Facades hide dependencies and make testing harder.

4. **Monitor for 5+ constructor dependencies.** Five or more constructor parameters signals the class is doing too much. Extract related behavior into separate services.

5. **Perform no work in constructors.** Constructors must only assign parameters. No logic, no external API calls, no database queries, no event dispatching.

6. **Add interfaces only when variation is needed.** Do not create an interface for every service. Interface-per-class without need adds ceremony without value.

7. **Avoid circular dependencies.** If Service A depends on Service B which depends on Service A, extract the shared dependency to break the cycle.

## Validation Checklist
- [ ] Constructor injection is used for all required dependencies
- [ ] Services depend on interfaces at variation points (not concrete classes)
- [ ] No facades used in services/actions
- [ ] No class has 5+ constructor dependencies
- [ ] No constructor performs logic (only assignment)
- [ ] Interfaces exist only where variation is needed
- [ ] No circular dependencies exist

## Common Failures
- **Facade usage in services.** Using `\Cache::get()` instead of injecting `Cache` — hidden dependency, harder testing.
- **Constructor work.** Performing logic in constructor — side effects during resolution, difficult testing.
- **Too many interfaces.** Interface for every service with single implementation — YAGNI violation.

## Decision Points
- **Interface vs concrete for dependency?** Add interfaces only when multiple implementations exist or are planned (payment, storage, notification). Skip for single-implementation business services.

## Performance Considerations
- Container uses Reflection for unresolvable parameters. Cached after first resolution. With `optimize` command, resolution is fast (~1-5μs per resolution).

## Security Considerations
- No direct implications. DI is structural.

## Related Rules
- Rule: Use Constructor Injection For Required Dependencies (SLP-09/05-rules.md)
- Rule: Depend On Interfaces, Not Concrete Classes (SLP-09/05-rules.md)
- Rule: Avoid Facades In Injected Services (SLP-09/05-rules.md)
- Rule: Watch For Five-Plus Constructor Dependencies (SLP-09/05-rules.md)
- Rule: No Constructor Work — Assign Only (SLP-09/05-rules.md)
- Rule: Add Interfaces Only When Variation Is Needed (SLP-09/05-rules.md)
- Rule: Avoid Circular Dependencies (SLP-09/05-rules.md)

## Related Skills
- Design Service Classes (SLP-01/06-skills.md)
- Design Action Classes (SLP-02/06-skills.md)
- Choose Service Binding Strategies (SLP-12/06-skills.md)
- Design Interface Contracts (SLP-13/06-skills.md)
- Manage Service State in Octane (SLP-19/06-skills.md)

## Success Criteria
- All services and actions use constructor injection with no facades or service locator calls.
- Interfaces exist only at true variation points, not for every service.
- No class has 5+ constructor dependencies or performs work in the constructor.
- No circular dependencies exist between services.
