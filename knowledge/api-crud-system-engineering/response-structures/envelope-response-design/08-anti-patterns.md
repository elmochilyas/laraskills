# Anti-Patterns â€” Envelope Response Design
## Metadata
| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Response Structures |
| Knowledge Unit | Envelope Response Design |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Inconsistent Envelope Structure | High | High | Different endpoints use different envelope shapes |
| Envelope Without Error Differentiation | High | Medium | Envelope has same structure for success and error responses |
| Nested Envelope Overhead | Medium | Medium | Multiple levels of wrapping (data > attributes > ...) |
| Envelope with Redundant Information | Medium | Medium | Envelope includes fields that can be derived from HTTP itself (status, success) |
| Mixed Envelope and Bare Responses | High | Medium | Some endpoints use envelope, others bare |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Envelope Standard | No defined envelope structure for the API | Inconsistent response format, client confusion |
| Over-engineered Envelope | Envelope includes unnecessary metadata | Larger payloads, slower responses |

## Anti-Pattern Details

### AP-ERD-01: Inconsistent Envelope Structure
**Description**: Different endpoints use different envelope key names: {status, data, message} vs {success, result, error}.
**Root Cause**: No centralized envelope response helper.
**Impact**: Client code must handle multiple envelope formats.
**Detection**: API responses show varying envelope key names.
**Solution**: Create a single response macro or trait for consistent envelope formatting.

### AP-ERD-02: Envelope Without Error Differentiation
**Description**: Success and error responses use the same envelope structure with different status values.
**Root Cause**: Reusing same envelope for all response types.
**Impact**: Clients must check status field instead of using HTTP status codes.
**Detection**: Error responses have same structure as success.
**Solution**: Different envelope structures for errors (error objects) vs success (data objects).

### AP-ERD-03: Envelope with Redundant Information
**Description**: Envelope includes fields like status: 'success' or http_code: 200 that duplicate HTTP semantics.
**Root Cause**: Copying envelope patterns from frameworks that don't use HTTP properly.
**Impact**: Unnecessary payload bloat.
**Detection**: Envelope contains status field that mirrors HTTP status code.
**Solution**: Remove redundant fields. Rely on HTTP status codes for response status.
