# Anti-Patterns â€” Conditional Relationship Inclusion
## Metadata
| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Response Structures |
| Knowledge Unit | Conditional Relationship Inclusion |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| N+1 from Conditional Includes | High | High | Included relationships loaded lazily, causing N+1 per included item |
| Always Loading All Relationships | High | Medium | All possible relationships loaded regardless of client request |
| No Include Parameter Support | High | Medium | No include or with parameter for client-requested relationships |
| Unauthorized Relationship Exposure | High | Low | Relationships included without authorization checks |
| Circular Relationship Includes | Medium | Low | A includes B which includes A, causing infinite recursion |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Relationship Loading Convention | No standard for how relationships are conditionally loaded | Inconsistent performance and response sizes |
| Unbounded Relationship Depth | No limit on how deep relationships can be included | Performance degradation from deep nesting |

## Anti-Pattern Details

### AP-CRI-01: N+1 from Conditional Includes
**Description**: Relationships loaded lazily when conditionally included, causing N+1 query problems.
**Root Cause**: Loading conditions applied after data retrieval instead of before.
**Impact**: Database queries multiply by number of results.
**Detection**: Debugbar shows repeated queries for included relationships.
**Solution**: Eager-load conditionally included relationships using when() + with().

### AP-CRI-02: Always Loading All Relationships
**Description**: Resource always loads all possible related data regardless of whether client requested includes.
**Root Cause**: Default resource eager-loads everything.
**Impact**: Slow responses, excessive database load.
**Detection**: Eager loads present for relationships client never requested.
**Solution**: Load relationships only when requested via include parameter.

### AP-CRI-03: No Include Parameter Support
**Description**: No include or with query parameter letting clients request related data.
**Root Cause**: Server doesn't support client-driven include protocol.
**Impact**: Multiple API calls needed to fetch related data.
**Detection**: API lacks include/with parameter documentation.
**Solution**: Implement JSON:API-style include parameter support.
