# Decision Trees: Dashboard Widget Data Provider Pattern

## Decision: Provider vs Inline Query

**Q: Is the data query used in more than one place?**
- Yes → Provider (DRY, single source of truth)
- No → Inline query may be acceptable for very simple cases

**Q: Is the query expensive (> 100ms)?**
- Yes → Provider with caching
- No → Provider still recommended for separation of concerns

## Decision: Caching Strategy

**Q: How fresh must the data be?**
- Real-time (< 30s) → Short cache (30s) or no cache with query optimization
- Near real-time (1-15 min) → Cache with TTL, invalidate on data import
- Batch (1h+) → Cache with TTL, no invalidation needed

## Decision: Provider Execution

**Q: Do providers depend on each other?**
- Yes (provider B needs provider A's result) → Sequential execution
- No → Parallel execution via `Concurrency::run()`
