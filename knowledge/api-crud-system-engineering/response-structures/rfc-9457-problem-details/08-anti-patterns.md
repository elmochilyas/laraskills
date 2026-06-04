# Anti-Patterns â€” RFC 9457 Problem Details
## Metadata
| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Response Structures |
| Knowledge Unit | RFC 9457 Problem Details |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Non-Standard Error Response Format | High | High | Error responses don't follow RFC 9457 structure |
| Missing Required Problem Details Fields | High | Medium | Error response missing 	ype, 	itle, status, or detail fields |
| Including Stack Traces in Problem Details | High | Medium | Error responses include debug information in production |
| Generic Problem Type URIs | Medium | Medium | All errors use same generic 	ype URI instead of specific error types |
| No Extension Members for Domain Errors | Medium | Low | Domain-specific error information not included in extensions |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Inconsistent Error Format Across Endpoints | Different endpoints return different error shapes | Clients can't write generic error handling code |
| No Error Registry | No central registry of error types and their problem details | Inconsistent error responses for same error types |

## Anti-Pattern Details

### AP-RPD-01: Non-Standard Error Response Format
**Description**: Error responses have custom format that doesn't follow RFC 9457.
**Root Cause**: Developer not aware of or not implementing the RFC 9457 standard.
**Impact**: Custom error handling needed for each API integration.
**Detection**: Error responses lack 	ype, 	itle, status, detail fields.
**Solution**: Implement RFC 9457 problem details for all error responses.

### AP-RPD-02: Missing Required Problem Details Fields
**Description**: Error responses missing required RFC 9457 fields like 	ype or detail.
**Root Cause**: Partial implementation of the standard.
**Impact**: Doesn't conform to RFC 9457. Clients can't rely on standard parsing.
**Detection**: Error response missing type or detail fields.
**Solution**: Always include all required RFC 9457 fields.

### AP-RPD-03: Including Stack Traces in Problem Details
**Description**: Production error responses include stack traces or internal debugging information.
**Root Cause**: Debug mode enabled or no environment-specific error handling.
**Impact**: Sensitive information leakage. Security vulnerability.
**Detection**: Error responses contain stack traces or file paths.
**Solution**: Omit debug information in production responses. Use log IDs for correlation.
