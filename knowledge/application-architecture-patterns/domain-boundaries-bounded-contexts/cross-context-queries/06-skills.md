# Skill: Handle Cross-Context Queries Without Database JOINs

## Purpose
Query data across bounded contexts without SQL JOINs. Use application-level aggregation for simple real-time needs, local projections (event-synchronized) for frequent queries, CQRS read models for complex combined queries. Never use cross-context eager loading or N+1 patterns.

## When To Use
- Application-level aggregation: simple cross-context data needs, low query volume, real-time accuracy required
- Local projections: frequent cross-context queries, high performance, eventual consistency acceptable

## When NOT To Use
- Direct JOINs across context boundaries — never
- N+1 patterns across contexts (service call per item in loop)

## Prerequisites
- Bounded contexts with service contracts between them
- Understanding of event-driven synchronization

## Inputs
- Cross-context query requirements
- Frequency and performance requirements

## Workflow
1. **Never JOIN across context boundaries.** A cross-context JOIN couples the schemas of both contexts. Use application-level aggregation instead (call each context's service separately and combine in application code).

2. **Use application-level aggregation as the default pattern.** Call each context's service contract, combine results in application code. This maintains full context independence and is the simplest pattern.

3. **Use local projections for frequent queries.** Maintain a local copy of cross-context data updated via event listeners. Enables fast local queries without cross-context service calls.

4. **Use batch endpoints to avoid N+1 across contexts.** Never call a cross-context service in a loop. Provide batch endpoints that accept multiple IDs in a single request.

5. **Use CQRS read models for complex cross-context queries.** For queries combining data from multiple contexts with filtering/sorting across fields, build a dedicated denormalized read model maintained by event listeners.

6. **Invalidate local projections when source data changes.** Ensure every local projection has a corresponding event listener for create, update, and delete events from the source context.

7. **Prefer synchronous contract calls over shared database reads.** When real-time cross-context data is required, use synchronous service contract calls — not direct table reads.

8. **Do not use eager loading across contexts.** No `with()`, `load()` for relationships that cross bounded contexts.

## Validation Checklist
- [ ] No cross-context JOINs exist
- [ ] Cross-context data obtained via contracts or events
- [ ] N+1 patterns addressed with batch endpoints
- [ ] Local projections invalidated on source changes
- [ ] Application-level aggregation default for real-time data
- [ ] No cross-context eager loading
- [ ] No direct table reads across contexts

## Common Failures
- **Direct JOIN anyway.** Single `->join('other_context_tables', ...)` defeats isolation — couples schema evolution.
- **N+1 across contexts.** Service call per item in loop — N calls instead of 1.
- **Stale local projections.** Cache not invalidated when source changes — silent stale data.

## Decision Points
- **Application-level aggregation vs Local projection?** Aggregation for real-time accuracy with lower query volume. Local projection for frequent queries where eventual consistency is acceptable.

## Performance Considerations
- Application-level aggregation: slower (N service calls) but strongly consistent.
- Local projection: fast (local query) but eventually consistent.
- CQRS read model: fastest for complex queries but highest complexity.

## Security Considerations
- Cross-context queries through contracts ensure authorization is applied at the context boundary.
- Direct table reads bypass authorization — always use contracts.

## Related Rules
- Rule: Never JOIN across bounded context boundaries (DBC-07/05-rules.md)
- Rule: Use application-level aggregation as default for cross-context reads (DBC-07/05-rules.md)
- Rule: Use local projections for frequent cross-context queries (DBC-07/05-rules.md)
- Rule: Use batch endpoints to avoid N+1 across contexts (DBC-07/05-rules.md)
- Rule: Use CQRS read models for complex cross-context queries (DBC-07/05-rules.md)
- Rule: Invalidate local projections when source data changes (DBC-07/05-rules.md)
- Rule: Prefer synchronous contract calls over shared database reads (DBC-07/05-rules.md)
- Rule: Do not use eager loading across contexts (DBC-07/05-rules.md)

## Related Skills
- Enforce Model Ownership Per Context (DBC-05/06-skills.md)
- Organize Schema Per Context (DBC-06/06-skills.md)
- Manage Eventual Consistency (DBC-12/06-skills.md)
- Apply CQRS Pattern (CPC-08/06-skills.md)
- Handle Cross-Module Data Access (MMD-10/06-skills.md)

## Success Criteria
- No SQL JOINs or Eloquent relationships span bounded context boundaries.
- Application-level aggregation is the default pattern for real-time cross-context reads.
- Frequent cross-context queries use local projections invalidated by event listeners.
- No N+1 patterns exist across contexts (batch endpoints are used).
- Complex cross-context queries use CQRS read models for performance and code clarity.
