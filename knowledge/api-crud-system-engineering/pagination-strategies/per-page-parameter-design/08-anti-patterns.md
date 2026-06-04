# Anti-Patterns â€” Per-Page Parameter Design
## Metadata
| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Pagination Strategies |
| Knowledge Unit | Per-Page Parameter Design |
| Difficulty | Foundation |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Unlimited Per-Page | High | High | No cap on per_page, allowing excessive record retrieval |
| Default Per-Page Too High | Medium | Medium | Default >25 for public endpoints, wasting mobile bandwidth |
| Per-Page Not Configurable | Medium | Medium | Page size hardcoded, no query parameter support |
| Per-Page Ignored for Cursor Pagination | Medium | Low | cursorPaginate() ignores per_page parameter |
| Excessive Max Per-Page | High | Medium | Max per_page >100, allowing DoS via large requests |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Inconsistent Per-Page Across Endpoints | Different endpoints use different defaults and max values | Confuses consumers, unpredictable response sizes |
| No Per-Page Validation | per_page accepted without validation against min/max | API abuse, performance degradation |

## Anti-Pattern Details

### AP-PPP-01: Unlimited Per-Page
**Description**: No maximum enforced on per_page. Client requests 100K records, server attempts to load them.
**Root Cause**: Trusting clients to request reasonable page sizes.
**Impact**: Memory exhaustion, database timeouts, DoS vector.
**Detection**: Code review shows no per_page capping.
**Solution**: Enforce hard maximum (100 public, 500 admin). Cap with min().

### AP-PPP-02: Default Per-Page Too High
**Description**: Default page size too large for mobile clients (50+).
**Root Cause**: Default chosen for desktop/admin panels.
**Impact**: Mobile bandwidth waste, slow page loads.
**Detection**: Default per_page > 25 for public endpoints.
**Solution**: Set default to 15-25 for public API.

### AP-PPP-03: Per-Page Not Configurable
**Description**: Page size hardcoded, no per_page query parameter.
**Root Cause**: Server-centric pagination design.
**Impact**: Clients can't optimize response sizes.
**Detection**: Hardcoded integer in paginate() call.
**Solution**: Accept per_page parameter with validation.

### AP-PPP-04: Per-Page Ignored for Cursor Pagination
**Description**: per_page parameter accepted but cursorPaginate() uses hardcoded value.
**Root Cause**: Developer implements per_page only for offset, forgets cursor.
**Impact**: Inconsistent behavior between pagination methods.
**Detection**: Cursor pagination ignores per_page parameter.
**Solution**: Apply same per_page logic to all pagination methods.

### AP-PPP-05: Excessive Max Per-Page
**Description**: Maximum per_page >100, allowing large result sets in one request.
**Root Cause**: Developer sets high max for flexibility.
**Impact**: Database load spikes, memory exhaustion.
**Detection**: Max per_page > 100 for public endpoints.
**Solution**: Set reasonable max (100 public, 500 admin).
