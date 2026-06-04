# Anti-Patterns â€” Conditional Aggregate Inclusion
## Metadata
| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Response Structures |
| Knowledge Unit | Conditional Aggregate Inclusion |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Always Loading All Aggregates | High | High | Query always loads counts/sums even when client doesn't request them |
| N+1 Aggregate Queries | High | Medium | Aggregates computed via lazy loading instead of withCount |
| Inefficient Conditional Load Implementation | Medium | Medium | Conditionally loaded aggregates computed via separate queries |
| Missing Index for Aggregate Queries | Medium | Medium | withCount queries missing indexes on foreign key columns |
| Aggregate Loading Without Client Protocol | Medium | Medium | No with_counts parameter; aggregates always returned or never |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Aggregate Loading Convention | No standard for when and how aggregates are included in responses | Inconsistent performance and response payload size |
| Over-fetching Aggregates on List Endpoints | Aggregates loaded for every item in a paginated list | Excessive query time for list responses |

## Anti-Pattern Details

### AP-CAI-01: Always Loading All Aggregates
**Description**: Every response includes counts like comments_count, likes_count even when the client doesn't need them.
**Root Cause**: Developer uses a default resource that always loads all aggregates.
**Impact**: Unnecessary database load. Larger response payloads.
**Detection**: withCount called without checking if client needs aggregates.
**Solution**: Load aggregates conditionally based on request parameter or resource type.

### AP-CAI-02: N+1 Aggregate Queries
**Description**: Aggregates computed via lazy loading ($post->comments->count()) instead of eager-load with withCount.
**Root Cause**: Developer unaware of withCount or takes shortcut.
**Impact**: N+1 query problem for list endpoints. Database load spikes.
**Detection**: Lazy count loading in loops. Debugbar shows repeated queries.
**Solution**: Use withCount('comments') for aggregate loading.

### AP-CAI-03: Inefficient Conditional Load Implementation
**Description**: Conditionally loading aggregates via separate if/else queries instead of withCount with conditional adds.
**Root Cause**: Manual conditional logic instead of using query builder's conditional methods.
**Impact**: Code duplication, harder to maintain.
**Detection**: Multiple query variations for same endpoint based on parameters.
**Solution**: Use when() on the query builder to conditionally add withCount.
