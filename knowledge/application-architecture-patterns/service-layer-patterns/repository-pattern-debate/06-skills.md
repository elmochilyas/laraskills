# Skill: Decide When to Use Repository Pattern

## Purpose
Use feature-oriented repositories (with business-specific query methods) when complex query logic needs centralization, data comes from multiple sources, or Clean Architecture requires port-adapter boundaries. Skip repositories for simple CRUD. Never create generic `BaseRepository`.

## When To Use
- Complex, duplicated query logic needs centralization
- Data comes from multiple sources (Eloquent + external API)
- Need to swap implementations (in-memory for tests, Eloquent for production)
- Following Clean Architecture (port-adapter boundaries required)

## When NOT To Use
- Simple CRUD, single data source, small team
- Repository wraps every Eloquent model one-to-one with generic CRUD
- Primary justification is "swap the database" (rarely realized in practice)

## Prerequisites
- Understanding of Eloquent ORM capabilities
- Knowledge of interface contracts and DI

## Inputs
- Identified complex query logic that is duplicated across services
- Data source variation requirements

## Workflow
1. **Use feature-oriented repositories, not generic CRUD.** A repository with `findOverdueInvoices()` provides value by centralizing complex query logic. A repository with `find()`, `all()`, `create()`, `update()`, `delete()` adds ceremony without value.

2. **Skip the `BaseRepository`.** Generic base repositories with shared CRUD recreate the problem at the inheritance level. Each repository should have methods specific to its domain.

3. **Test repository methods with integration tests.** A feature-oriented method with a wrong WHERE clause is a data retrieval bug. Test against a real database with `RefreshDatabase`.

4. **Do not use "swap the database" as justification.** Eloquent semantics permeate the application — a repository interface doesn't make a MongoDB or DynamoDB switch trivial. Use repos for multi-source data, not hypothetical database swaps.

5. **Repository must not leak Eloquent types.** Do not return `Builder` or `LengthAwarePaginator` from repository methods. Return collections, domain objects, or DTOs.

6. **Avoid abandoned repositories.** If a repository is created, it must be used. If services bypass the repo and call Eloquent directly, remove the unused repository.

## Validation Checklist
- [ ] Repositories are feature-oriented, not generic CRUD
- [ ] No `BaseRepository` or generic inheritance
- [ ] Repository methods are tested with integration tests
- [ ] Repositories are actually used (not abandoned)
- [ ] Feature-oriented methods map to business queries
- [ ] Repository does not leak Eloquent types (Builder, Paginator)
- [ ] "Swap the database" is NOT the primary justification

## Common Failures
- **Generic repository.** `BaseRepository` with CRUD methods extended by every entity repository — ceremony without value.
- **Repository leaking Eloquent.** Methods returning `Builder` or `LengthAwarePaginator` — leaks ORM coupling to consumers.
- **Repository without tests.** Wraps Eloquent methods but has no tests — untested data access is dead code.

## Decision Points
- **Repository vs direct Eloquent?** Use repositories for complex query centralization or multi-source data. Use Eloquent directly for simple CRUD.

## Performance Considerations
- Repository indirection adds a method call per data access. Negligible.

## Security Considerations
- No direct implications. Repositories are data access abstractions.

## Related Rules
- Rule: Use Feature-Oriented Repositories, Not Generic CRUD (SLP-14/05-rules.md)
- Rule: Skip The BaseRepository (SLP-14/05-rules.md)
- Rule: Test Repository Methods With Integration Tests (SLP-14/05-rules.md)
- Rule: If "Swap The Database" Is Primary Justification, Skip The Repository (SLP-14/05-rules.md)
- Rule: Repository Should Not Leak Eloquent Types (SLP-14/05-rules.md)
- Rule: Avoid Abandoned Repositories (SLP-14/05-rules.md)

## Related Skills
- Design Feature-Oriented Repositories (SLP-15/06-skills.md)
- Design Query Objects (SLP-16/06-skills.md)
- Design Interface Contracts (SLP-13/06-skills.md)
- Test Service Layer (SLP-17/06-skills.md)

## Success Criteria
- Repositories are feature-oriented with business-specific methods, not generic CRUD.
- No `BaseRepository` exists in the codebase.
- Every repository method has an integration test against a real database.
- All repositories are actively used (no abandoned repos).
- Repository return types are domain objects or DTOs, not Eloquent builders/paginators.
