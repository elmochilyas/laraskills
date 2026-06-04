# Skill: Design a Stateless Service

## Purpose
To create a service class that captures no per-request or per-call state on `$this`, ensuring it is safe in any runtime (PHP-FPM, Octane, RoadRunner), composable without side effects, and trivially testable.

## When To Use
- When creating EVERY service class in the application
- When refactoring a stateful service that uses mutable properties
- When preparing a service for Octane or RoadRunner deployment
- When reviewing services for concurrency safety

## When NOT To Use
- Trivially — statelessness is always preferred
- Request-scoped services that are never reused (rare, document the exception)

## Prerequisites
- Service class with constructor injection
- PHP 8.2+ (for `readonly class` support)
- Understanding of Octane/RoadRunner's shared-instance model

## Inputs
- Service class to create or refactor
- List of operations the service will perform
- Dependencies that are stable across requests

## Workflow
1. Declare the service as `final readonly class`. This compiler-enforces that all properties are set at construction time and cannot be mutated.
2. List all dependencies the service needs. Pass ONLY stable dependencies (repositories, gateways, loggers, other services) via the constructor. Never pass per-request data (user, request ID, session) to the constructor.
3. For each method, design the signature to receive all operational data as parameters and return the result. A method must not set any `$this->property` during execution.
4. Replace any getter-for-result pattern (`doSomething()` + `getResult()`) with a single method that returns the result directly.
5. Replace any scratch-space-on-properties pattern (using `$this->total`, `$this->count` as accumulators) with local variables inside the method scope.
6. Verify that calling the same method twice with the same inputs on the same instance produces the same result and leaves no residual state.
7. If any state needs to be returned across multiple values, create a result object or DTO that aggregates all output values. Return this from the method.

## Validation Checklist
- [ ] Service is declared `final readonly class`
- [ ] All constructor parameters are stable, reusable dependencies — no per-request data
- [ ] No mutable properties exist on the class (compiler-enforced by `readonly`)
- [ ] No getter methods for execution results (`getResult()`, `getLastCreated()`)
- [ ] All operational data is passed as method parameters
- [ ] All results are returned as return values (or void for side-effect-only)
- [ ] No properties used as scratch space or accumulators during execution
- [ ] Method is safe to call multiple times — idempotent with respect to instance state
- [ ] Multi-value results use a result object/DTO, not stored properties

## Common Failures
- Setting `$this->lastCreated` or similar in a method, with a getter to retrieve it
- Using `$this->runningTotal` as an accumulator during method execution
- Passing `User` or `Request` objects to the constructor instead of as method parameters
- Mutable service that works in PHP-FPM (where state resets per request) but breaks in Octane
- Getter methods that retrieve state from a previous method call

## Decision Points
- Can this value be a method parameter instead of constructor-injected? → If it varies per call, yes
- Should this be a result object? → If a method produces multiple related output values, yes
- Is `final` appropriate here? → Yes for all services; use interfaces if mocking is needed in tests
- Memoization acceptable? → Only for expensive, immutable computations, and only if never used in Octane

## Performance Considerations
- `readonly class` has zero runtime overhead — compiler-level enforcement only
- Stateless services have no memory leak risk in long-lived processes
- Result objects add negligible allocation cost compared to stored-state patterns
- Stateless services can be safely reused across requests without re-instantiation

## Security Considerations
- Stateless services prevent data leakage across requests (no residual state)
- Per-request data (user identity, roles) must be passed explicitly as method parameters, preventing accidental exposure of previous request data
- Immutable services are inherently thread-safe in concurrent contexts

## Related Rules
- **Rule 1**: Services Must Be Stateless
- **Rule 2**: Use `final readonly class` for Compiler Enforcement
- **Rule 3**: Never Use Class Properties as Scratch Space
- **Rule 4**: Return Results, Do Not Store Them
- **Rule 5**: Constructor Injection Is for Stable Dependencies Only
- **Rule 6**: Do Not Define Getter Methods for Execution Results
- **Rule 7**: Methods Must Be Safe to Call Multiple Times

## Related Skills
- Design a Service Class
- Refactor Stateful Service to Stateless

## Success Criteria
- Service class is declared `final readonly`
- No mutable properties exist on the instance
- All methods receive data as parameters and return results
- No getter methods exist for execution results
- Service is safe to use in Octane, RoadRunner, or any concurrent runtime
