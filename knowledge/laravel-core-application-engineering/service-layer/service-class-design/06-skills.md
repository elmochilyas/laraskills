# Skill: Design a Service Class

## Purpose
To create a well-structured service class with appropriate constructor dependencies, typed methods, proper granularity, and clear entity/capability organization.

## When To Use
- When creating a new service class for a business entity or capability
- When refactoring a god service or poorly structured service
- When extracting service methods from a controller

## When NOT To Use
- Single, isolated operations better suited to action classes
- CRUD pass-through that adds no business value
- Operations with no shared dependencies (prefer actions)

## Prerequisites
- Understanding of the entity or capability the service will serve
- Knowledge of the dependencies required (repositories, gateways, other services)
- Team convention on service grouping (entity vs capability)

## Inputs
- Entity or capability name
- List of operations to include
- List of shared dependencies across those operations

## Workflow
1. Determine the organizing principle: entity-oriented (e.g., `UserService` for all user operations) or capability-oriented (e.g., `NotificationService` for all notification operations).
2. List all operations the service will expose. If the count exceeds 15-20 methods, split into smaller services or extract complex operations to action classes.
3. Identify shared dependencies across operations. Inject them via constructor using typed, promoted properties. Keep the count at 8 or fewer.
4. Write each method as a focused, single-operation method. Methods must:
   - Use a business-verb name (not HTTP verb)
   - Accept typed parameters (DTOs, domain objects, primitives — never `Request`)
   - Declare an explicit return type (Model, DTO, result object, Collection, bool, or void)
   - Not set mutable instance properties (stateless execution)
5. Verify the service has no HTTP dependencies (`Request`, `Response`, `Session`). All HTTP data must be extracted in the controller and passed as plain data or DTOs.
6. Ensure methods that perform I/O or orchestration call actions/repositories, not inline raw queries with Eloquent in the service.

## Validation Checklist
- [ ] Service name follows `{Entity}Service` or `{Capability}Service` pattern
- [ ] Service is organized around one entity or capability, not a technical layer
- [ ] Constructor has 8 or fewer dependencies
- [ ] All dependencies injected via constructor (no `app()` or `resolve()` in methods)
- [ ] Method names are business verbs, not HTTP verbs
- [ ] Every method has explicit return type declaration
- [ ] No `mixed` or untyped `array` return types for structured data
- [ ] No HTTP dependencies injected (`Request`, `Response`, `Session`)
- [ ] Service is stateless — no mutable properties set during execution
- [ ] Service has fewer than 15-20 public methods (or split plan exists)
- [ ] Complex operations are extracted to action classes

## Common Failures
- 40-method god service violating single responsibility
- Injecting `Request` or `Session` into the service constructor
- Using `app()` inside methods to resolve dependencies
- Returning `mixed` or untyped arrays from methods
- Setting mutable state on `$this` during method execution
- HTTP verb method names (`store()`, `destroy()`)

## Decision Points
- Entity or capability grouping? → Entity first; capability for cross-cutting concerns
- Split into multiple services? → Split at 15-20 methods or 8+ dependencies
- Extract to action class? → Extract when method exceeds 30 lines or needs isolated testing
- Use readonly class? → Use `final readonly` for compiler-enforced statelessness

## Performance Considerations
- Constructor injection is resolved once by the container — minimal overhead
- Stateless services are safe in any runtime including Octane/RoadRunner
- Service orchestration adds a negligible method call layer compared to inline code

## Security Considerations
- Services must not receive raw `Request` objects — prevents mass-assignment and request tampering
- Authorization checks should precede service calls (in controller or middleware), not be embedded in services

## Related Rules
- **Rule 1**: Services Must Be Stateless
- **Rule 2**: Limit Constructor Dependencies to 8
- **Rule 3**: Name Methods as Business Operations, Not HTTP Actions
- **Rule 4**: Return Typed Results from Every Method
- **Rule 5**: Split Services Beyond 15-20 Methods
- **Rule 6**: Never Inject HTTP Dependencies into Services
- **Rule 7**: Use Constructor Injection as the Primary DI Mechanism
- **Rule 8**: Group Services by Entity or Capability

## Related Skills
- Name Service Classes and Methods by Convention
- Classify Service as Application or Domain Service
- Design Stateless Service

## Success Criteria
- Service class has a single, clear organizing principle (entity or capability)
- All methods have typed parameters and return types
- Dependencies are explicit in the constructor, resolvable by the container
- Service is stateless and safe in any runtime
- No HTTP-layer coupling exists in the service
