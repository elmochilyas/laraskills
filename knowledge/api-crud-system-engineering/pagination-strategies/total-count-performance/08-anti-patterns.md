# Anti-Patterns â€” Total Count Performance
## Metadata
| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Pagination Strategies |
| Knowledge Unit | Total Count Performance |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| COUNT on Every Paginated Request | High | High | paginate() on large tables without considering COUNT(*) cost |
| COUNT on Filtered Large Datasets | High | Medium | Filtered COUNT(*) on complex queries takes 500ms+ |
| COUNT for Infinite Scroll Endpoints | Medium | Medium | paginate() used where no total count is needed |
| COUNT in Read-Heavy Real-Time Feeds | Medium | Low | paginate() used where cursorPaginate() is appropriate |
| No COUNT Caching Strategy | Medium | Medium | Fresh COUNT query on every request for slow-changing data |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Over-fetching Count Metadata | Returning total, last_page when client only needs data | Unnecessary database load |
| Ignoring simplePaginate | Using paginate() everywhere instead of simplePaginate() | Wasted COUNT queries |

## Anti-Pattern Details

### AP-TCP-01: COUNT on Every Paginated Request
**Description**: paginate() runs SELECT COUNT(*) on every request, even when total not needed.
**Root Cause**: Defaulting to paginate() without considering if total is needed.
**Impact**: Response times doubled on large tables.
**Detection**: Query log shows COUNT(*) before every paginated query.
**Solution**: Use simplePaginate() or cursorPaginate() when total not needed.

### AP-TCP-02: COUNT on Filtered Large Datasets
**Description**: COUNT(*) for complex filtered queries becomes expensive on large tables.
**Root Cause**: Performance tested on unfiltered data only.
**Impact**: Filtered list endpoints become slowest in the application.
**Detection**: Slow query log shows COUNT(*) with complex WHERE on large tables.
**Solution**: Use simplePaginate() for filtered lists. Compute totals asynchronously.

### AP-TCP-03: COUNT for Infinite Scroll Endpoints
**Description**: paginate() used for infinite scroll where client never uses total.
**Root Cause**: Not matching pagination method to UI pattern.
**Impact**: Unnecessary COUNT queries. Unused metadata in response.
**Detection**: paginate() for endpoints consumed by infinite scroll.
**Solution**: Use cursorPaginate() for infinite scroll.

### AP-TCP-04: COUNT in Read-Heavy Real-Time Feeds
**Description**: Offset pagination with COUNT for real-time feeds where phantom reads cause duplicates.
**Root Cause**: Same pattern used for all list endpoints regardless of data characteristics.
**Impact**: Feed inconsistency, duplicates, COUNT overhead.
**Detection**: paginate() on high-write-throughput endpoint.
**Solution**: Use cursorPaginate() for all real-time feeds.

### AP-TCP-05: No COUNT Caching Strategy
**Description**: Fresh COUNT(*) on every request even for slow-changing data.
**Root Cause**: Not considering COUNT caching.
**Impact**: Repeated identical queries waste database resources.
**Detection**: Identical COUNT queries seconds apart in query log.
**Solution**: Cache counts with short TTL. Use simplePaginate with cached totals.
