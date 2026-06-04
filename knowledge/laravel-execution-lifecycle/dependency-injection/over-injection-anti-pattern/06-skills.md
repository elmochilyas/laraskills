# Skill: Refactor Over-Injected Classes by Grouping Dependencies

## Purpose
Identify and refactor classes with excessive constructor parameters (5+) by grouping related dependencies into higher-level abstractions or splitting the class — reducing parameter count while maintaining explicit dependency contracts.

## When To Use
- Code review when a class has 5+ constructor parameters
- Designing new classes — keep constructor parameters minimal (≤ 4)
- Refactoring legacy classes that have grown too many dependencies
- Before the class accumulates too many responsibilities (SRP violation)

## When NOT To Use
- As a hard rule — some classes legitimately need many dependencies (orchestrators, HTTP client wrappers)
- To justify switching to service locator — `app()` hides dependencies but doesn't fix the problem
- For framework classes that follow different patterns (controllers may inject multiple services)
- When unrelated dependencies would be bundled together — grouping must be semantically cohesive

## Prerequisites
- Understanding of the Single Responsibility Principle
- Knowledge of Parameter Object pattern and Facade Service pattern
- Familiarity with class decomposition strategies (splitting by concern)

## Inputs
- Class with 5+ constructor parameters
- List of dependencies and how each is used
- Identification of which dependencies change together (cohesion analysis)

## Workflow
1. Count the constructor parameters. If 5+, flag as over-injection candidate
2. Examine how each dependency is used — group them by concern (logging, notification, data access, etc.)
3. Identify groups of dependencies that change together and serve a common purpose
4. Choose a refactoring strategy:
   - **Group related deps**: Create a higher-level service (e.g., `NotificationService` groups logger + mail + analytics)
   - **Parameter Object pattern**: Bundle related config values into a typed DTO (e.g., `MailConfiguration`)
   - **Split the class**: Separate distinct responsibilities into focused classes
5. Implement the refactoring, keeping the constructor parameter count to ≤ 4
6. Never use `Container $container` or `app()` as an alternative to refactoring
7. Verify the refactored class still meets all functional requirements

## Validation Checklist
- [ ] No class has more than 5 constructor parameters (exceptions documented and justified)
- [ ] Related dependencies are grouped into higher-level services where appropriate
- [ ] No class uses `Container $container` or `app()` to hide over-injection
- [ ] CI pipeline flags constructors with excessive parameters (5+)
- [ ] Over-injected classes are refactored during normal development, not deferred
- [ ] Grouped dependencies are semantically cohesive (not unrelated services bundled together)
- [ ] No unrelated services are grouped into a "miscellaneous" parameter object

## Common Failures
| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Parameter count stays high after refactor | Grouped unrelated deps into a "misc" object | Create cohesive groups by concern |
| Hidden dependencies via app() | Replaced explicit injection with service locator | Keep constructor injection; group or split instead |
| Wrong splitting boundary | Split class but same deps duplicated in both | Identify natural separation of concerns |
| Generic "services" parameter | Bundled all remaining deps into one opaque object | Each group must have a clear responsibility |
| Class still does too much | Only parameter count reduced, responsibilities not | Actually split the class, don't just repackage |

## Decision Points
- **Group vs split**: Group when dependencies serve a common purpose (logger + metrics → `InfrastructureService`); split when the class has two distinct responsibilities (order processing AND invoice generation)
- **Parameter Object vs Facade Service**: Use Parameter Object for configuration values (host, port, timeout → `MailConfig`); use Facade Service for behavioral services (mail + logger + analytics → `NotificationService`)
- **Refactor vs tolerate**: Tolerate over-injection only for documented orchestrator classes (controllers, service facades) where parameter count reflects genuine orchestration needs

## Performance Considerations
- Constructor parameter count does NOT directly affect resolution performance
- Splitting classes may increase total resolution count (more `make()` calls) but improves maintainability
- Grouping dependencies into higher-level services can improve caching (one singleton vs many)
- Over-injection is primarily a maintainability concern, not a performance concern
- Well-factored classes are easier to optimize individually

## Security Considerations
- Classes with many dependencies are harder to audit for security — each is a potential attack surface
- Over-injected classes may leak capabilities through their many dependencies
- Security-critical code should have clearly scoped dependencies — over-injection obscures which deps handle sensitive operations
- Injecting the container (`Container $container`) to avoid over-injection is the worst outcome — hides ALL dependencies

## Related Rules
- Limit Constructor Parameters to 4 or Fewer
- Never Fix Over-Injection by Switching to Service Locator
- Group Related Dependencies into Higher-Level Abstractions
- Do Not Use Container as a Single Dependency to Avoid Listing All Dependencies
- Use Parameter Count as a Code Review Trigger
- Do Not Bundle Unrelated Dependencies

## Related Skills
- Apply Constructor Injection for Explicit Dependencies
- Detect and Break Circular Dependencies
- Replace Service Locator with Constructor Injection

## Success Criteria
- No class has more than 4 constructor parameters (or 5 with documented justification)
- Related dependencies are grouped into cohesive, named abstractions
- No `app()` or `Container $container` is used to circumvent injection
- Grouped abstractions serve a clear, single purpose (no "misc" objects)
- CI pipeline automatically flags potential over-injection during code review
