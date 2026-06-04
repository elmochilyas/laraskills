# Anti-Patterns â€” Cursor Pagination Metadata
## Metadata
| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Response Structures |
| Knowledge Unit | Cursor Pagination Metadata |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Including Total in Cursor Responses | High | Medium | Cursor pagination responses include 	otal field (requires expensive COUNT) |
| Missing has_more Flag | High | Medium | No has_more field, clients can't tell if more results exist |
| Exposing Raw Cursor Values | High | Medium | Cursor values directly expose sort column data |
| Inconsistent Cursor Metadata Keys | Medium | Medium | Different endpoints use different key names for cursor fields |
| No Next Page URL | Medium | Medium | Clients must construct next page URL from cursor value themselves |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Inconsistent Pagination Metadata | Different pagination methods return different metadata structures | Clients need multiple parsers |
| Missing Metadata Documentation | Cursor pagination metadata fields not documented | Client integration requires reverse-engineering |

## Anti-Pattern Details

### AP-CPM-01: Including Total in Cursor Responses
**Description**: Cursor pagination includes 	otal field requiring a COUNT query that defeats cursor's performance advantage.
**Root Cause**: Copying offset pagination response format to cursor responses.
**Impact**: COUNT queries on large tables negate cursor pagination benefits.
**Detection**: Cursor response includes total or last_page.
**Solution**: Omit total from cursor responses. Provide has_more for forward navigation.

### AP-CPM-02: Missing has_more Flag
**Description**: Cursor response doesn't indicate whether more results exist after the current page.
**Root Cause**: Assuming clients can infer has_more from data count vs per_page.
**Impact**: Clients don't know when to stop requesting more pages.
**Detection**: Cursor response lacks has_more boolean.
**Solution**: Always include has_more field in cursor pagination responses.

### AP-CPM-03: Exposing Raw Cursor Values
**Description**: Cursor value is a raw database value (ID or timestamp) exposed to clients.
**Root Cause**: Developer uses default cursor encoding without additional security.
**Impact**: Clients can guess other cursors, enumerate records.
**Detection**: Cursor value is a plain number or timestamp.
**Solution**: Encode cursor values with encryption or hashing to make them opaque.
