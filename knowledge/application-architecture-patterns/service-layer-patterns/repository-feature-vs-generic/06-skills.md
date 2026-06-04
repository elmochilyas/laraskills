# Skill: Create Feature-Oriented Repository Methods

## Purpose
Design repositories with business-specific query methods (not generic CRUD), name methods after business queries, return the right type per method, avoid the 50+ method god repository, and organize repositories per aggregate root.

## When To Use
- When using the repository pattern (must be feature-oriented)
- Complex query logic needs centralization
- Query methods map to specific business use cases

## When NOT To Use
- Simple CRUD where Eloquent scopes or query objects suffice
- Generic BaseRepository or CRUD-only repository
- Every single query in the application (use for complex/repeated only)

## Prerequisites
- Understanding of aggregate roots in domain-driven design
- Knowledge of the business domain queries

## Inputs
- Business use cases requiring data access
- Identified complex or repeated query patterns

## Workflow
1. **Use feature-oriented repositories always if using repositories.** Methods like `findOverdueInvoices()` centralize meaningful query logic. Generic CRUD methods like `findAll()` add ceremony without business value.

2. **Name methods after business queries, not data operations.** `findOverdueInvoices()` communicates business purpose. `findAll()` does not. Method names should describe what business question the query answers.

3. **Return the right type for each method.** `getMonthlyRevenue()` returns a `Money` value object. `findOverdueInvoices()` returns a Collection of models. Not every method returns Eloquent models — return DTOs, value objects, or primitives where appropriate.

4. **Avoid repository with 50+ methods.** When a repository exceeds 50 methods, split into multiple repositories by concern (e.g., `OrderQueryRepository`, `OrderReportRepository`, `OrderSearchRepository`).

5. **Create repositories per aggregate root, not per database table.** Group related data access for a domain aggregate (Order + OrderItems + Payments) in one repository.

6. **Never create a generic `BaseRepository`.** No shared CRUD inheritance. Each repository stands alone with its domain-specific methods.

7. **Add methods when a use case needs them.** Methods exist because a specific business use case requires them. Do not pre-create methods speculatively.

## Validation Checklist
- [ ] Repository methods are business queries, not CRUD
- [ ] No `BaseRepository` or inheritance-based generic repository
- [ ] Return types match the query (model, DTO, value object)
- [ ] No repository has 50+ methods
- [ ] Integration tests verify query correctness
- [ ] Repository per aggregate root, not per table

## Common Failures
- **Generic base repository.** `BaseRepository` with shared CRUD extended by all repositories — recreates generic problem at inheritance level.
- **Repository returning models for all methods.** Even `getMonthlyRevenue()` returns a model collection — wrong abstraction level.
- **Repository with 50+ methods.** Data access god object — all queries go to one repository.

## Decision Points
- **One method per query vs multiple methods per query object?** Use one repository per aggregate root with related query methods. Split when the repository exceeds 50 methods.

## Performance Considerations
- Feature-oriented methods can be optimized per query. Each method uses the most efficient query for that business need.

## Security Considerations
- Query methods should be scoped by authorization rules. Do not expose unfiltered data.

## Related Rules
- Rule: Use Feature-Oriented Repositories Always If Using Repositories (SLP-15/05-rules.md)
- Rule: Name Methods After Business Queries, Not Data Operations (SLP-15/05-rules.md)
- Rule: Return The Right Type Per Method (SLP-15/05-rules.md)
- Rule: Avoid Repository With 50+ Methods (SLP-15/05-rules.md)
- Rule: Repository Per Aggregate Root, Not Per Table (SLP-15/05-rules.md)
- Rule: Do Not Use Generic Base Repository (SLP-15/05-rules.md)

## Related Skills
- Decide When to Use Repository Pattern (SLP-14/06-skills.md)
- Design Query Objects (SLP-16/06-skills.md)
- Design Interface Contracts (SLP-13/06-skills.md)
- Apply Domain-Driven Design Boundaries (DBC-01/06-skills.md)

## Success Criteria
- All repository methods are named after business queries, not data operations.
- Return types match the query (Money for revenue queries, model collections for entity queries).
- No repository has 50+ methods; no `BaseRepository` exists.
- Repositories are organized per aggregate root, not per table.
- Each repository method has an integration test.
