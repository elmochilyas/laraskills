# Skill: Inject Dependencies Directly Into Controller Methods
## Purpose
Use Laravel's method injection to inject services, repositories, or actions directly into individual controller methods — avoiding constructor bloat when a dependency is needed in only one method.
## When To Use
When a dependency is used by only one controller method; when constructor injection would create many unused dependencies; for action classes that encapsulate a single use case.
## When NOT To Use
Dependencies used by multiple methods (use constructor injection); controller-wide dependencies (request, auth); simple scalar values (resolve from route parameters).
## Prerequisites
Laravel Service Container; Resource Controller Pattern; constructor injection understanding.
## Inputs
Controller method signature; dependency class (service, action, repository); Laravel container binding.
## Workflow
1. Type-hint the dependency in the controller method signature
2. Laravel's container resolves it automatically when the route is called
3. Use the resolved instance directly in the method body
4. For interfaces, bind the concrete implementation in a ServiceProvider
5. For action classes, keep the action single-purpose and inject only what it needs
6. Use method injection for dependencies that are context-specific (request, pagination params)
7. Do not mix method injection and constructor injection for the same dependency
## Validation Checklist
- [ ] Dependency is used only in the method where it's injected — not reused
- [ ] Constructor injection is preferred for shared dependencies
- [ ] Interface bindings are registered in a ServiceProvider
- [ ] Method injection does not create confusion about the dependency's scope
- [ ] Tests can mock the injected dependency by passing a mock in the method call
- [ ] Action classes injected via method injection follow single-responsibility
## Common Failures
- Injecting the same dependency in multiple methods — should use constructor injection
- Method injection of heavy dependencies that should be resolved lazily
- Using method injection for primitive values (use route parameters)
- Confusion in tests — mock must be passed to the method call, not the constructor
## Decision Points
- Constructor injection vs method injection for single-use dependencies
- Action class (injected into method) vs inline logic
## Performance/Security Considerations
Method injection has negligible overhead. Security: ensure injected services don't leak authZ context between methods — each injection is fresh.
## Related Rules/Skills
Resource Controller Pattern; Service Container; Action Classes; Controller Code Limits.
## Success Criteria
Single-use dependencies are injected via method injection; constructor injection is used only for shared dependencies; tests can easily mock injected dependencies.
