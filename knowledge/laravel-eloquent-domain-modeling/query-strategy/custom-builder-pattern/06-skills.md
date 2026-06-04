# Skill: Implement Custom Builder Pattern for Rich Query APIs

## Purpose
Create a dedicated Eloquent Builder class for a model with 5+ custom query methods, moving domain-specific query logic out of the model into a testable, IDE-friendly class.

## When To Use
- Models with 5+ custom query methods that would clutter the model class
- Domain-specific query APIs that compose multiple constraints
- Query methods needing constructor injection (tenant resolver, auth manager)
- Cross-model shared query logic via a base custom builder
- Teams where code organization and IDE support are priorities

## When NOT To Use
- Models with only 1-2 simple scopes — scopes on the model are sufficient
- Query methods are purely one-off constraints in controllers
- Overriding core builder methods (`where`, `get`, etc.)
- Creating a custom builder for every model — only for those with rich query APIs

## Prerequisites
- Understanding of Eloquent Builder and method chaining
- `HasBuilder` trait (Laravel 10+) or `newEloquentBuilder()` override

## Inputs
- Model class with 5+ scope or query methods
- List of domain-specific query methods to extract

## Workflow
1. Create a builder class extending `Illuminate\Database\Eloquent\Builder` in `app/Models/Builders/`
2. Name the class after the model (e.g., `UserBuilder` for `User`)
3. Add fluent methods with `: static` return type for proper IDE chaining
4. Register the builder on the model using the `HasBuilder` trait (Laravel 10+)
5. Add `@mixin \App\Models\Builders\UserBuilder` PHPDoc on the model for IDE autocompletion
6. Move scope methods from the model to the custom builder
7. Test builder methods independently from the model

## Validation Checklist
- [ ] Custom builder registered via `HasBuilder` trait or `newEloquentBuilder()` override
- [ ] Custom class extends `Illuminate\Database\Eloquent\Builder`
- [ ] All fluent methods return `: static`
- [ ] `@mixin` annotation on model for IDE support
- [ ] Builder methods tested independently
- [ ] No overriding of core builder methods (`where`, `get`, `first`)
- [ ] No business logic (external calls, calculations) in builder methods
- [ ] Builder state not shared across separate queries

## Common Failures
- Not extending `Builder` — the custom class must extend `Illuminate\Database\Eloquent\Builder`
- Wrong return type — forgetting `: static` breaks IDE autocompletion
- Overriding core methods — overriding `where()` or `get()` is error-prone
- Missing `HasBuilder` or `newEloquentBuilder` — the custom builder class is never used
- Calling model methods from builder — couples the builder; prefer builder methods
- Builder state leakage — storing mutable state across queries

## Decision Points
- `HasBuilder` trait vs `newEloquentBuilder()`: use `HasBuilder` (Laravel 10+) for declarative registration; use `newEloquentBuilder()` for pre-Laravel 10 projects or when constructor arguments are needed
- Custom builder vs query objects: use custom builder for model-specific query methods; use query objects for multi-model or complex reporting logic

## Performance Considerations
- No runtime overhead — custom builder instantiated once per query
- Method calls cost the same as equivalent scope calls
- Custom builder methods can optimize SQL without affecting calling code
- Builder instantiation is negligible — same cost as base builder

## Security Considerations
- Custom builder methods should not bypass model-level security (global scopes, access control)
- Avoid methods that accept raw SQL or column names without validation
- Document any builder method that suppresses global scopes

## Related Rules
- Only Create Custom Builders for Models with 5+ Distinct Query Methods (query-strategy/custom-builder-pattern)
- Register Custom Builders via HasBuilder Trait (query-strategy/custom-builder-pattern)
- Always Return : static from Fluent Custom Builder Methods (query-strategy/custom-builder-pattern)
- Never Override Core Builder Methods (query-strategy/custom-builder-pattern)
- Place Custom Builder Classes in app/Models/Builders/ Directory (query-strategy/custom-builder-pattern)
- Never Place Business Logic in Builder Methods (query-strategy/custom-builder-pattern)
- Add @mixin Annotation on Model for IDE Autocompletion (query-strategy/custom-builder-pattern)

## Related Skills
- Implement Domain-Specific Query Methods on Custom Builders
- Implement Local Scopes for Reusable Constraints
- Compose Fluent Eloquent Query Chains with Correct Termination

## Success Criteria
- Custom builder correctly registered and used on the model
- IDE autocompletion works for all custom methods
- Builder methods are tested independently of the model
- No core builder methods overridden
- No business logic leaks into builder methods
