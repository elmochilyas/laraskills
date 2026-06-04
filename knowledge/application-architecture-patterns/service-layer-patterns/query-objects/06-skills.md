# Skill: Design Query Objects as Read-Only Query Encapsulation

## Purpose
Create dedicated query objects for complex or repeated database queries. Keep them read-only, return arrays or DTOs (not Eloquent models), avoid creating one for every query, prevent duplication with model scopes, and respect authorization boundaries.

## When To Use
- Complex queries repeated across services
- Eloquent queries becoming unwieldy in controllers/services
- Want to decouple read logic from write logic (CQRS-lite)
- When a repository's CRUD overhead isn't justified but query centralization is needed

## When NOT To Use
- Simple `User::find($id)` — doesn't need a query object
- Every single query in the application (use for complex/repeated queries only)
- When model scopes suffice (scopes are the simplest query encapsulation)

## Prerequisites
- Understanding of Eloquent query builder
- Familiarity with read-model optimization

## Inputs
- Complex or repeated SQL queries
- Identified DTO structures for query results

## Workflow
1. **Keep query objects read-only.** Query objects encapsulate SELECT queries only. Do not add `create()`, `update()`, or `delete()` methods. Write operations belong in repositories or services.

2. **Return arrays or DTOs, not Eloquent models.** Consumers of query objects are often read-only views. Returning arrays or DTOs decouples consumers from the ORM, enables select-column optimization, and prevents N+1 lazy loading.

3. **Don't create a query object for every query.** Simple one-liners like `User::find($id)` stay inline. Extract only when the query is complex or repeated across multiple consumers.

4. **Avoid duplication with model scopes.** Choose one pattern: scopes for simple queries on the model, query objects for complex cross-entity queries. Do not define the same query in both places.

5. **Prefer query objects over repositories for read-heavy applications.** For reports, dashboards, and search, query objects are lighter and more focused on read optimization than repositories.

6. **Query objects must respect authorization boundaries.** Do not expose unfiltered queries that bypass visibility rules. Accept user/tenant context to scope results.

## Validation Checklist
- [ ] Query objects are read-only (no write methods)
- [ ] Query objects are for complex/repeated queries, not simple one-liners
- [ ] Return DTOs or arrays, not Eloquent models
- [ ] No duplication with model scopes
- [ ] Queries are testable in isolation
- [ ] Query objects respect authorization boundaries

## Common Failures
- **Query object with writes.** Adding create/update/delete methods — blurs read/write separation.
- **Query object for every query.** Creating objects for simple `find()` calls — unnecessary classes.
- **Returning Eloquent models.** Consumers coupled to ORM, N+1 lazy loading risk, no read-model optimization.
- **Query/scopes duplication.** Both model scope and query object define same query — two sources of truth.

## Decision Points
- **Query Object vs Model Scope?** Scope for simple queries on a single model. Query object for complex cross-entity queries or queries used by multiple services.
- **Query Object vs Repository?** Query objects for read-only complex queries. Repositories for read+write with feature-oriented methods.

## Performance Considerations
- No overhead. Query objects use Eloquent directly. Optimize per query (indexes, select optimization).

## Security Considerations
- Query objects must respect authorization boundaries. Do not expose unfiltered data queries.

## Related Rules
- Rule: Keep Query Objects Read-Only (SLP-16/05-rules.md)
- Rule: Return Arrays Or DTOs, Not Eloquent Models (SLP-16/05-rules.md)
- Rule: Don't Create A Query Object For Every Query (SLP-16/05-rules.md)
- Rule: Avoid Duplication With Model Scopes (SLP-16/05-rules.md)
- Rule: Prefer Query Objects Over Repositories For Read-Heavy Applications (SLP-16/05-rules.md)
- Rule: Query Objects Must Respect Authorization Boundaries (SLP-16/05-rules.md)

## Related Skills
- Decide When to Use Repository Pattern (SLP-14/06-skills.md)
- Create Feature-Oriented Repositories (SLP-15/06-skills.md)
- Implement Data Transfer Objects (SLP-05/06-skills.md)
- Apply CQRS Pattern (CPC-08/06-skills.md)

## Success Criteria
- Query objects are read-only and encapsulate only complex or repeated queries.
- Query objects return DTOs or arrays, not Eloquent models.
- No query exists in both a model scope and a query object (no duplication).
- Authorization boundaries are respected — no unfiltered data exposure.
- Read-heavy applications use query objects instead of repositories for reads.
