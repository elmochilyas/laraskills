# Metadata

**Domain:** api-integration-engineering
**Subdomain:** saloonphp
**Knowledge Unit:** saloon-pagination
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `hasNext()` returns false when no more pages are available
- [ ] Concurrent page fetching completes without race conditions or duplicate processing
- [ ] Cursor-based pagination handles empty result sets and single-page responses
- [ ] Always Set Maximum Page Limits
- [ ] Combine Pagination with Rate Limiting Plugin
- [ ] Implement Checkpointing for Long-Running Pagination
- [ ] Prefer Cursor Pagination for Production Data Syncs
- [ ] Use LazyCollection for Large Paginated Data Sets
- [ ] `HasPagination` implemented with correct config
- [ ] `paginate()` returns lazy collection for memory efficiency
- [ ] Cursor pagination custom class implemented where needed
- [ ] Collect pagination metrics: total pages, items, duration
- [ ] Configure pagination class with page parameter and response path
- [ ] For cursor pagination: implement custom cursor pagination class

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Collect pagination metrics: total pages, items, duration
- [ ] Configure pagination class with page parameter and response path
- [ ] For cursor pagination: implement custom cursor pagination class
- [ ] Handle empty result sets and end-of-pagination gracefully
- [ ] Identify pagination style (page-based, cursor-based, offset-based)
- [ ] Implement `HasPagination` on Connector
- [ ] Test with paginated API responses in MockClient
- [ ] Use `paginate()` method on Request for lazy collection iteration
- [ ] Always Set Maximum Page Limits
- [ ] Combine Pagination with Rate Limiting Plugin
- [ ] Implement Checkpointing for Long-Running Pagination
- [ ] Prefer Cursor Pagination for Production Data Syncs

---

# Performance Checklist

- [ ] Concurrent page fetching: reduces wall-clock time to ~max(per-page latency) but increases upstream load proportionally
- [ ] Cursor/ID-based pagination: more efficient server-side than offset pagination for large data sets (no `OFFSET` scan)
- [ ] Default page size (20-100): balances request count against response size; check API's max `per_page` limit
- [ ] LazyCollection memory: holds one page in memory at a time (~20-100 DTOs), not the entire result set
- [ ] Page size tradeoff: smaller pages = more requests but lower latency per request, lower memory per page
- [ ] Sequential pagination: O(N) requests where N = number of pages; total time = N Ã— per-page latency

---

# Security Checklist

- [ ] API cursors should be treated as opaque values; never parse or modify them client-side
- [ ] Pagination metadata may expose total record counts â€” consider if this leaks business-sensitive information
- [ ] Rate limiting during pagination prevents abuse; enforce per-connector rate limits even during bulk data fetches
- [ ] User-supplied page numbers/offsets must be validated to prevent SSRF via malformed pagination parameters

---

# Reliability Checklist

- [ ] Always Set Maximum Page Limits

---

# Testing Checklist

- [ ] `hasNext()` returns false when no more pages are available
- [ ] `HasPagination` implemented with correct config
- [ ] `paginate()` returns lazy collection for memory efficiency
- [ ] Concurrent page fetching completes without race conditions or duplicate processing
- [ ] Cursor pagination custom class implemented where needed
- [ ] Cursor-based pagination handles empty result sets and single-page responses
- [ ] Custom paginator correctly extracts `next` cursor/page from API response
- [ ] End-of-pagination handled gracefully
- [ ] LazyCollection wraps paginated iteration without memory exhaustion
- [ ] Maximum page limit stops pagination after configured boundary

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Page Pagination for Production Data Syncs (Concurrent Write Drift)]
- [ ] [No Maximum Page Limit â€” Infinite Loop Risk]
- [ ] [Loading All Pages into Memory (Memory God Collection)]
- [ ] [Deep Pagination Without Rate Limiting]
- [ ] [No Checkpointing for Long-Running Pagination]
- [ ] Infinite Loop Assumption
- [ ] Memory God Collection
- [ ] Raw Pagination URL Construction
- [ ] Simultaneous Page+Offset Pagination

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


