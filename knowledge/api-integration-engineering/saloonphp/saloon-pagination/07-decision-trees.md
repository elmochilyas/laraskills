# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 02-saloonphp
**Knowledge Unit:** saloon-pagination
**Generated:** 2026-06-03

---

# Decision Inventory

1. Pagination Strategy Selection
2. Paginator Implementation Approach
3. Memory and Performance Management Strategy

---

# Architecture-Level Decision Trees

---

## Pagination Strategy Selection

---

## Decision Context

Choosing the appropriate pagination strategy (cursor, page, or offset) for consuming a paginated API.

---

## Decision Criteria

* performance
* architectural
* reliability

---

## Decision Tree

Is the data being synchronized in a background job (ETL/replication)?
↓
YES → Use cursor-based pagination (stable under concurrent writes)
  ↓
  Does the API support cursor/token pagination?
  ↓
  YES → Implement cursor paginator; it handles concurrent record insertion
  NO → Fall back to offset pagination with timestamp checkpointing
NO → Is the data displayed in a user-facing list with random page access?
  ↓
  YES → Use page-based pagination (supports "jump to page N" UX)
  NO → Is this a bulk export or data migration?
    ↓
    YES → Use cursor pagination with checkpointing for resumability
    NO → Use offset pagination for simplicity if cursor not available
  ↓
  Need to avoid page drift under concurrent writes?
  ↓
  YES → Cursor pagination is mandatory
  NO → Page pagination acceptable for low-concurrency admin UIs

---

## Rationale

Cursor pagination eliminates duplicate/missed records during concurrent writes by using opaque tokens instead of positional offsets. Page pagination trades consistency for UX convenience (random access). Offset pagination is a fallback when cursor is unavailable.

---

## Recommended Default

**Default:** Cursor pagination for data syncs; page pagination for user-facing lists
**Reason:** Correctness for background jobs, convenience for interactive UIs

---

## Risks Of Wrong Choice

Page pagination during concurrent writes causes duplicates or missed records. Cursor pagination for user-facing lists loses random-access navigation.

---

## Related Rules

Prefer Cursor Pagination for Production Data Syncs, Always Set Maximum Page Limits

---

## Related Skills

Handle Paginated API Responses with SaloonPHP

---

## Paginator Implementation Approach

---

## Decision Context

Deciding whether to use SaloonPHP's built-in pagination or implement a custom paginator.

---

## Decision Criteria

* maintainability
* performance

---

## Decision Tree

Does the API follow standard pagination patterns (page=N or cursor in query param)?
↓
YES → Does the API return pagination metadata in standard fields (total, last_page)?
  ↓
  YES → Use built-in Saloon PHP paginator with HasPagination trait
  NO → Does the API use Link headers for pagination?
    ↓
    YES → Use built-in paginator with Link header config
    NO → Custom paginator required for non-standard pagination schema
NO → Implement custom Pagination interface
  ↓
  Is the pagination token embedded in the response body (not headers)?
  ↓
  YES → Extract next cursor from response body field in custom paginator
  NO → Extract pagination info from custom response headers
  ↓
  Does pagination require concurrent page fetching?
  ↓
  YES → Implement pool-based parallel pagination for speed
  NO → Sequential pagination with LazyCollection is sufficient

---

## Rationale

Built-in paginator handles 80% of APIs with standard patterns. Custom paginator addresses the remaining 20% with non-standard schemas (body-embedded cursors, proprietary metadata).

---

## Recommended Default

**Default:** HasPagination trait with built-in paginator config
**Reason:** Covers standard APIs with zero custom code; drop-in configuration

---

## Risks Of Wrong Choice

Custom paginator for standard APIs is unnecessary maintenance overhead. Built-in paginator for non-standard APIs silently produces wrong pagination (incomplete data sets).

---

## Related Rules

Prefer Cursor Pagination for Production Data Syncs

---

## Related Skills

Handle Paginated API Responses with SaloonPHP

---

## Memory and Performance Management Strategy

---

## Decision Context

Managing memory usage and request concurrency during paginated data processing.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Is the total expected result set large (>10000 records)?
↓
YES → Use LazyCollection wrapping for streaming one page at a time
  ↓
  Is memory pressure a concern (>50000 records)?
  ↓
  YES → LazyCollection with yield per item; never collect all
  NO → LazyCollection with page-level yield; acceptable memory
NO → Can the entire result set fit in memory (<1000 records)?
  ↓
  YES → Collect all pages into array (simpler code, acceptable memory)
  NO → Use LazyCollection regardless of size for safety
  ↓
  Need to minimize wall-clock time for pagination?
  ↓
  YES → Use concurrent page fetching via Saloon pool (2-5x speedup)
  NO → Sequential pagination is simpler and respects rate limits
  ↓
  Combine pagination with rate limiting?
  ↓
  YES → Enable rate limit plugin on connector; deep pagination stays compliant
  NO → Risk of rate limit hitting on deep pagination (100+ pages)

---

## Rationale

LazyCollection prevents OOM by processing items as they're fetched rather than buffering all results. Concurrent fetching reduces time but increases upstream load. Rate limit integration prevents throttling during deep pagination.

---

## Recommended Default

**Default:** LazyCollection with sequential pagination and max page limits
**Reason:** Memory-safe, respects rate limits, simplest to debug and maintain

---

## Risks Of Wrong Choice

Collecting all pages into memory causes OOM on large data sets. Concurrent fetching without rate limiting triggers upstream throttling. No max page limit causes runaway requests and unexpected costs.

---

## Related Rules

Use LazyCollection for Large Paginated Data Sets, Combine Pagination with Rate Limiting Plugin, Always Set Maximum Page Limits

---

## Related Skills

Handle Paginated API Responses with SaloonPHP
