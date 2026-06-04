| Section | Field | Content |
|---|---|---|
| **Metadata** | Domain | API & CRUD System Engineering |
| **Metadata** | Subdomain | Pagination Strategies |
| **Metadata** | Knowledge Unit | Pagination Strategy Selection |
| **Metadata** | Difficulty | Foundation |
| **Metadata** | Dependencies | Offset Pagination Design, Cursor Pagination Design, Keyset Pagination Design |
| **Metadata** | Last Updated | 2026-06-02 |

## Overview

Choosing the right pagination strategy — offset, cursor, or keyset — depends on dataset characteristics, access patterns, consistency requirements, and client capabilities. No single strategy is optimal for all scenarios. A decision matrix considering write concurrency, total dataset size, random access requirements, and performance budgets guides the selection. Many production APIs use a hybrid approach: offset pagination for shallow pages with total count, cursor pagination for deep pages and real-time feeds.

## Core Concepts

- **Three Strategies**: Offset (simple, random access, phantom reads), Cursor (consistent, O(1), no random access), Keyset (performant, transparent, exposes sort values).
- **Decision Factors**: Dataset size, write concurrency, random page access need, total count requirement, real-time consistency, client capability, security requirements.
- **Hybrid Strategy**: Different endpoints use different strategies; or a single endpoint switches strategy based on page depth.
- **No Universal Best Strategy**: The optimal choice depends on the specific use case and growth trajectory.
- **Migration Path**: Start with offset for simplicity, migrate to cursor/keyset as the dataset grows.

## When To Use

| Strategy | Use Case |
|---|---|
| Offset | Small datasets (<5000), random page access needed, admin panels with total count |
| Cursor | Real-time feeds, large unbounded datasets, infinite scroll, public APIs needing opaqueness |
| Keyset | Internal APIs, transparent sorting, debuggability valued, sort columns already exposed |
| Hybrid | Mixed workloads, migration in progress, different resources with different characteristics |

## When NOT To Use

- **Only one strategy for all endpoints**: Different data patterns require different strategies.
- **Cursor pagination when random page access is needed**: Cursor requires sequential navigation.
- **Offset pagination for real-time feeds**: Phantom reads cause duplicate/skipped records.
- **Keyset pagination for public APIs**: Exposing sort column values may leak business intelligence.
- **Any strategy without understanding the dataset's growth trajectory**: What works for 100 records fails at 10M.

## Best Practices (WHY)

| Practice | Rationale |
|---|---|
| Default to cursor pagination for new endpoints | Most datasets grow unbounded; cursor handles growth gracefully |
| Reserve offset for bounded datasets with random access needs | Offset's simplicity is valuable only where its limitations don't apply |
| Document pagination strategy per endpoint | Clients need to know which parameters to send and what to expect |
| Monitor offset page depth; plan migration when avg page > 100 | Early detection of offset performance problems |
| Use hybrid strategy during migration | Supports both old and new clients during transition |
| Consider dataset growth trajectory, not just current size | A 1000-record table today may be 10M in 12 months |

## Architecture Guidelines

- Define pagination strategy per resource based on its characteristics (e.g., posts feed → cursor, users list → offset).
- Implement a `PaginationStrategy` enum or config that maps resources to their chosen strategy.
- For hybrid endpoints, use an automatic switch: offset for pages < 100, cursor for pages >= 100.
- Document the strategy selection rationale in the API design document.
- Test pagination performance for each chosen strategy with realistic (production-scale) data.

## Performance Considerations

- At 1K rows, all strategies perform similarly (2-5ms).
- At 100K rows, offset degrades (5-200ms depending on depth); cursor/keyset remain at 2-5ms.
- At 10M rows, offset often times out; cursor/keyset stay at 2-10ms.
- At 1B rows, only cursor/keyset are viable (5-20ms).
- Maintenance overhead: offset (lowest), cursor (low), keyset (medium — manual WHERE clause).

## Security Considerations

- Offset pagination exposes record count via `total` — may leak business information.
- Cursor pagination's opaque tokens prevent enumeration but must be tamper-proof.
- Keyset pagination exposes sort column values — avoid for sensitive ordering.
- All strategies must enforce authorization boundaries regardless of pagination method.
- Rate limiting should account for the selected strategy's access pattern (sequential vs random).

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Using offset for infinite scroll | Offset is the easiest in Laravel | Deep pages cause DB stress; phantom reads cause duplicates | Use cursor pagination for infinite scroll |
| Assuming offset works for all sizes | Works fine during development with 100 records | Production with 10M records causes timeouts | Stress-test with realistic data volumes |
| Implementing multiple strategies inconsistently | Different developers for different endpoints | Clients learn different patterns per resource | Standardize one primary strategy; document exceptions |
| Over-engineering pagination | Using cursor pagination for 200-row admin panel | Unnecessary complexity and maintenance | Use offset for small, stable datasets |

## Anti-Patterns

- **Defaulting to offset for everything**: The most common mistake — offset works until it catastrophically fails at scale.
- **One-size-fits-all strategy**: Different resources need different strategies.
- **Not documenting pagination behavior**: Clients must reverse-engineer pagination parameters and response format.
- **Choosing strategy based on developer convenience**: The strategy should match data characteristics, not developer familiarity.
- **No migration plan**: Ignoring that the optimal strategy may change as data grows.

## Examples

- **Resource-based strategy config**: `match(config('pagination.posts.strategy')) { 'cursor' => cursorPaginate(), default => paginate() }`
- **Hybrid with auto-switch**: `if ($page > 100) { return cursorPaginate(); } return paginate();`
- **Decision flowchart**: Dataset < 5K? → Offset. Random access required? → Offset with limit. High write concurrency? → Cursor. Exposed sort values OK? → Keyset. Otherwise → Cursor.
- **API version strategy**: v1 → offset (default), v2 → cursor (default), offset as opt-in.

## Related Topics

- Offset Pagination Design — Baseline understanding
- Cursor Pagination Design — Alternative strategy
- Keyset Pagination Design — Alternative strategy
- Total Count Performance — When to include total metadata
- Offset-to-Cursor Migration — Practical migration guide
- Per-Page Parameter Design — Limit/per_page defaults and maximums

## AI Agent Notes

- For new API endpoints, default to cursor pagination unless random page access is explicitly required.
- Use offset pagination sparingly and only for bounded datasets with a clear maximum size.
- When a resource needs total count and random access, use offset with a maximum page limit.
- Document the strategy choice and rationale in the API specification.
- For growth-prone datasets, implement cursor pagination from day one to avoid costly migration later.

## Verification

- [ ] Pagination strategy is explicitly chosen per resource, not defaulted
- [ ] Decision matrix documented for each paginated endpoint
- [ ] Strategy matches data characteristics (write concurrency, size, access patterns)
- [ ] Dataset growth trajectory is considered in strategy selection
- [ ] Hybrid strategy has clear rules for when each method is used
- [ ] Migration plan exists for endpoints that may outgrow their current strategy
- [ ] Pagination behavior is documented in API reference
- [ ] Performance testing conducted with production-scale data for the chosen strategy
