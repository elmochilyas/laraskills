# Anti-Patterns â€” Bare Body Response Design
## Metadata
| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Response Structures |
| Knowledge Unit | Bare Body Response Design |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Inconsistent Response Structure | High | High | Different endpoints return different key names for the same data |
| Data Nesting Inconsistency | Medium | Medium | Some endpoints return {'data': {...}}, others {'data': [...]} |
| Missing HTTP Status Code Semantics | High | Medium | Bare body responses always return 200 regardless of operation result |
| No Error Response Format | High | Medium | Bare body error responses lack standard structure |
| Bare Body Without Content-Type Negotiation | Medium | Low | Response assumes JSON without Accept header negotiation |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Inconsistent Response Contract | No standard for bare vs envelope response format across endpoints | Clients must adapt to each endpoint individually |
| Missing Response Format Documentation | Bare body format not documented in API spec | Client integration requires reverse-engineering |

## Anti-Pattern Details

### AP-BBR-01: Inconsistent Response Structure
**Description**: Different endpoints return different key names and structures for similar data patterns. One returns {'user': {...}}, another returns {'data': {...}}.
**Root Cause**: No response standardization across the team.
**Impact**: Client code must handle multiple response shapes.
**Detection**: API audit shows varying response key names.
**Solution**: Define a standard response structure and enforce it across all endpoints.

### AP-BBR-02: Data Nesting Inconsistency
**Description**: Some endpoints wrap data in a data key while others return data directly at the root.
**Root Cause**: Different developers implement different response patterns.
**Impact**: Clients can't predict whether data will be wrapped.
**Detection**: Response inspection shows inconsistent data wrapping.
**Solution**: Standardize on one approach â€” either always wrap or never wrap.

### AP-BBR-03: Missing HTTP Status Code Semantics
**Description**: Bare body responses return HTTP 200 for all operations including errors.
**Root Cause**: Developer treats all responses as successful JSON returns.
**Impact**: Clients can't use status codes to determine operation result.
**Detection**: Error responses return 200 with error message in body.
**Solution**: Use proper HTTP status codes: 201 for create, 204 for delete, 4xx for client errors.

### AP-BBR-04: No Error Response Format
**Description**: Error responses lack a standard format â€” different endpoints return different error structures.
**Root Cause**: No centralized error response formatting.
**Impact**: Clients can't write generic error handling code.
**Detection**: Error responses have varying shapes across endpoints.
**Solution**: Define standard error response format with consistent keys (error, message, code).

### AP-BBR-05: Bare Body Without Content-Type Negotiation
**Description**: All responses return JSON regardless of Accept header.
**Root Cause**: Developer assumes all clients accept JSON.
**Impact**: Cannot support alternative formats (XML, YAML) when needed.
**Detection**: Content-Type always application/json regardless of Accept header.
**Solution**: Implement content negotiation via Accept header checking.
