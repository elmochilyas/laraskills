# Skill: Select Injection Strategy by Class Type

## Purpose
Choose the correct injection pattern (constructor vs method injection) for each Laravel class type — controllers, jobs, listeners, middleware, services, commands, and providers — based on framework conventions and lifecycle requirements.

## When To Use
- When creating a new class of a specific Laravel type
- When refactoring existing code to match framework conventions
- When onboarding developers and establishing injection conventions

## When NOT To Use
- As rigid rules — team-specific conventions may vary
- When introducing new class types not covered — follow the closest matching pattern
- When team coding standards conflict — team conventions take priority

## Prerequisites
- Understanding of constructor injection and method injection mechanics
- Knowledge of how each class type is resolved by the framework (via `make()` vs `call()`)
- Familiarity with job serialization and listener dispatch lifecycle

## Inputs
- Class type being created (Controller, Job, Listener, Middleware, Command, Service, etc.)
- List of dependencies needed by the class

## Workflow
1. Identify the class type and its injection conventions from the reference table
2. Controllers: inject shared services in constructor, action-specific (Request, services) via method injection
3. Jobs: inject serializable data in constructor, non-serializable services in `handle()` method injection
4. Listeners: inject event and services in `handle()` method — never use constructor injection
5. Middleware: use constructor injection for all dependencies — `handle()` has a fixed signature
6. Services/Repositories: use constructor injection exclusively — never `app()` or facades
7. Commands: use constructor injection for configuration, `handle()` injection for runtime services
8. Service Providers: inject dependencies in `boot()` method signature — never in `register()`
9. Blade Directives: use `app()` since directives are not resolved by the container
10. Verify injection pattern works with the class lifecycle (serialization, registration timing)

## Validation Checklist
- [ ] Controllers use constructor injection for shared, method injection for action-specific deps
- [ ] Jobs use constructor injection for serialized payload, `handle()` injection for runtime services
- [ ] Listeners use method injection in `handle()` — not constructor injection
- [ ] Middleware uses constructor injection — no extra params in `handle()`
- [ ] Services and repositories use constructor injection exclusively
- [ ] Service Provider dependencies are injected via `boot()` method signature
- [ ] Blade directives use `app()` when no constructor injection is available
- [ ] Queued job payload does not contain heavy, non-serializable services

## Common Failures
| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Listener service not resolved | Service injected in constructor, not `handle()` | Move to method injection in `handle()` |
| Job serialization error | Non-serializable service in constructor | Move to `handle()` method injection |
| Middleware type error | Extra params in `handle()` signature | Move to constructor injection |
| Provider resolution early | Service resolved in `register()` | Move resolution to `boot()` or use lazy binding |
| Hidden deps in Blade directive | Using constructor injection in directive | Use `app()` instead |

## Decision Points
- **Constructor vs method injection for controllers**: Constructor for shared deps (used across actions); method injection for action-specific deps (Request, route bindings, single-use services)
- **Constructor vs `handle()` for jobs**: Constructor for serializable payload (model IDs, data); `handle()` for non-serializable services (loggers, mailers, HTTP clients)
- **Constructor vs `app()` in Blade directives**: Directives are closures — no container resolution; always use `app()`

## Performance Considerations
- Method injection adds ~0.01-0.03ms per call for Reflection
- Constructor injection with singletons pays cost once
- Heavy constructor dependencies in queued jobs increase queue payload size
- Listeners registered with constructor injection resolve deps at registration, not dispatch
- Middleware constructor injection pays cost per request

## Security Considerations
- Security-related types (Middleware, Form Requests, Gates) should use constructor injection for clear dependency visibility
- Jobs and listeners handling sensitive data should inject security services explicitly
- Blade directives and facades bypass dependency controls — avoid security-sensitive services in them
- Queued job serialization may expose sensitive data in queue payload

## Related Rules
- Use Constructor Injection for Shared Controller Dependencies
- Use Method Injection in Listener handle() — Not Constructor Injection
- Use Method Injection for Queue Job handle() — Not Constructor Injection for Services
- Use Constructor Injection Exclusively in Services and Repositories
- Never Resolve Services in Service Provider register()
- Use Method Injection for Service Provider boot() Methods

## Related Skills
- Apply Constructor Injection for Explicit Dependencies
- Apply Method Injection for Action-Specific Dependencies
- Apply Facade Pattern for Static Proxy Access

## Success Criteria
- Each class type follows its recommended injection pattern
- No queued job payloads contain non-serializable services
- Listener dependencies resolve at event dispatch time, not registration time
- Controllers have clean separation between shared and action-specific deps
- Service providers resolve services in `boot()`, not `register()`
