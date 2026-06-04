# Skill: Implement Query Handlers

## Purpose

Encapsulate data retrieval in dedicated query classes, separating read logic from write logic for performance and clarity.

## When To Use

- Complex queries requiring filtering, sorting, pagination, or projection
- Need for distinct read models optimized for specific use cases
- Separating read concerns from write models for performance
- Monitoring and optimizing query performance independently

## When NOT To Use

- Simple lookup-by-id (repository method is sufficient)
- When query overhead exceeds the value of separation
- Read-only applications with no write side

## Prerequisites

- CQRS basics
- DTO pattern understanding
- Query monitoring infrastructure

## Inputs

- Query requirements (filters, sorting, pagination)
- Read model definitions
- Performance requirements (p50/p95/p99 latency targets)

## Workflow

1. Define query objects for complex queries (filtering, sorting, pagination)
2. Keep simple lookups (findById) as repository methods
3. Ensure queries are read-only: no state modification, no events, no persistence
4. Return DTOs or read models, never ORM entities from query handlers
5. Create optimized read models for cross-aggregate queries
6. Index and monitor query handlers (p50/p95/p99 latency)
7. Apply caching at the query handler level for slowly-changing data
8. Validate with integration tests that queries return expected data shapes

## Validation Checklist

- [ ] Query handlers are read-only (no side effects)
- [ ] Queries return DTOs/read models, not ORM entities
- [ ] Complex queries have dedicated query objects
- [ ] Cross-aggregate queries use optimized read models
- [ ] Query monitoring in place (p50/p95/p99)
- [ ] Queries exceeding 500ms at p95 have caching or optimization
- [ ] Caching invalidated by event handlers on data change

## Common Failures

- Query handler modifying state (violates CQRS)
- Query returning ORM entities instead of DTOs
- Query handler in same class as command handler
- Over-separating: query handler per field combination
- Not optimizing for read patterns (using write-optimized models for reads)

## Decision Points

- Dedicated query object vs repository method for this query?
- Cache at query handler level vs HTTP caching layer?
- Read model (query-optimized) vs in-memory transformation?

## Performance Considerations

- Index all read model tables for common query patterns
- Cache query results with appropriate TTL
- Monitor and alert on slow queries (> 500ms p95)
- Consider materialized views for expensive aggregations

## Security Considerations

- Query handlers must enforce data access permissions
- Cached query results must respect authorization boundaries
- Read models should not expose sensitive fields not needed by the query

## Related Rules (from 05-rules.md)

- Rule 1: Each query must return data, never modify state
- Rule 2: Create specific query objects for complex queries; simple finders need only a repository method
- Rule 3: Index query handlers for performance — measure p50/p95/p99 latency
- Rule 4: Use read models / materialized views for complex queries to keep write model optimized
- Rule 5: Apply caching at the query handler level when data is immutable or slowly changing

## Related Skills

- Implement a Command Bus
- Implement Read Model Strategies
- Apply CQRS Selectively per Bounded Context

## Success Criteria

- All complex queries have dedicated query objects with monitoring
- Query latency meets p95 targets (< 500ms)
- Read and write models can be optimized independently
