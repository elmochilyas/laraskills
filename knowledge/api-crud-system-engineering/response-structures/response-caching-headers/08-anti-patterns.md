# Anti-Patterns â€” Response Caching Headers
## Metadata
| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Response Structures |
| Knowledge Unit | Response Caching Headers |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Missing Cache Headers | High | High | No Cache-Control, ETag, or Last-Modified headers on cacheable responses |
| Always Setting No-Cache | Medium | High | All responses set Cache-Control: no-cache even for public, cacheable data |
| Stale ETag Implementation | Medium | Medium | ETags computed on every request without caching the computation |
| Missing Conditional Request Support | High | Medium | ETags sent but server doesn't handle If-None-Match |
| Cache Headers for Sensitive Data | High | Medium | Cache headers set on authenticated/private data without proper scope |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Caching Strategy | No defined caching strategy for different response types | Missed caching opportunities or inappropriate caching |
| Inconsistent Cache Headers | Different endpoints set different cache headers | Unpredictable client caching behavior |

## Anti-Pattern Details

### AP-RCH-01: Missing Cache Headers
**Description**: Responses don't include Cache-Control, ETag, or Last-Modified headers.
**Root Cause**: Caching considered an infrastructure concern, not API design.
**Impact**: Clients and proxies can't cache responses. Increased load on origin server.
**Detection**: Response inspection shows no caching headers.
**Solution**: Add appropriate cache headers for public, cacheable endpoints.

### AP-RCH-02: Always Setting No-Cache
**Description**: All responses set Cache-Control: no-cache, preventing caching even for stable resources.
**Root Cause**: Default configuration or assumption that all data changes frequently.
**Impact**: Missed caching opportunities, higher server load.
**Detection**: Cacheable endpoints also have no-cache headers.
**Solution**: Set appropriate Cache-Control based on data update frequency.

### AP-RCH-03: Stale ETag Implementation
**Description**: ETag computed on every request without caching, doubling response time.
**Root Cause**: ETag computation happens after expensive database queries.
**Impact**: ETag benefit negated by computation cost.
**Detection**: ETag computation queries database or computes hash on full response.
**Solution**: Compute ETags from cache-friendly sources (updated_at timestamps, data hashes).
