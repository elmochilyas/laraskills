# Error Code Taxonomy

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** error-handling-design
- **Knowledge Unit:** Error Code Taxonomy
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary
Error Code Taxonomy defines a structured classification system for API error codes that enables automated error handling by clients, simplifies debugging, and ensures consistent communication between API and consumers.

---

## Core Concepts
- **Machine-Readable Error Codes**: Unique identifiers like `USER_NOT_FOUND` or `RATE_LIMIT_EXCEEDED` that clients can programmatically handle
- **Error Code Hierarchy**: Structured namespacing (e.g., `AUTH::TOKEN_EXPIRED`, `VALIDATION::INVALID_EMAIL`) for organized error codes
- **HTTP Status Code Mapping**: Each error code maps to an HTTP status code for transport-level signaling
- **Error Code Registry**: A central document or class defining all error codes with descriptions and httpStatus
- **Backward Compatibility Rules**: Error codes are part of the API contract; changing them is a breaking change

---

## Mental Models
1. **Library Dewey Decimal Model**: Error codes are like a library classification system — each code has a specific, unambiguous meaning organized in a hierarchy.
2. **Airline Flight Code Model**: Like flight numbers (AA123), error codes encode meaning in a structured format that both humans and machines parse.

---

## Internal Mechanics
A centralized error code registry (enum or class with constants) defines all codes. When an exception is thrown, it carries an error code. The exception handler includes the code in the error response. Clients can switch on the code for automated handling — retry on `RATE_LIMIT_EXCEEDED`, redirect to login on `AUTH_TOKEN_EXPIRED`, etc.

---

## Patterns

### Pattern 1: PHP Enum Error Codes
**Purpose**: Use PHP 8.1 enums to define error codes with metadata
**Benefits**: Type-safe, IDE autocompletion, easy to document
**Tradeoffs**: Enum values can't be serialized to JSON without transformation

### Pattern 2: Class Constant Error Codes
**Purpose**: Define error codes as class constants with a documentation block
**Benefits**: Simple, widely understood, no PHP version requirement
**Tradeoffs**: No type safety, no structured metadata

---

## Architectural Decisions
### When To Use
- Public APIs consumed by third-party applications
- APIs where automated error handling is expected
- Multi-service architectures where error codes cross service boundaries

### When To Avoid
- Simple internal APIs with human-only consumers
- Prototypes where error consistency isn't a priority
- APIs where error detail is always communicated via free-text messages

### Alternatives
- HTTP status codes only (no application-level error codes)
- Free-form error messages (no structured codes)
- Error slugs (human-readable but less structured)

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Automated client error handling | Error code maintenance overhead | Regular audit and cleanup of codes |
| Consistent error classification | Upfront design investment | Start with common codes, expand as needed |
| Cross-service error tracing | Error code proliferation risk | Use hierarchical namespacing |

---

## Performance Considerations
- Enum-based code lookup is O(1) and negligible
- Error code serialization adds ~0.1ms per error response
- Centralized code registry has no runtime performance impact

---

## Production Considerations
- Document all error codes in API documentation automatically
- Monitor error code frequency to detect patterns and issues
- Establish a deprecation process for retiring error codes
- Include error code in logging for easier debugging

---

## Common Mistakes
**Too generic error codes**: `ERROR_GENERIC` or `UNKNOWN_ERROR` provide no actionable information. Codes should be specific enough to trigger automated handling.
**Inconsistent error code format**: Mixing snake_case, PascalCase, and numeric codes creates confusion. Choose one format and enforce it.
**Reusing error codes for different scenarios**: An error code should map to exactly one error condition. Different conditions need different codes.

---

## Failure Modes
**Error code collision**: Two errors with different meanings share the same code. *Detection:* Code review catches naming conflicts. *Mitigation:* Use namespace prefixes to isolate domains.
**Orphaned error codes**: Codes defined but never used or codes used but never documented. *Detection:* Static analysis. *Mitigation:* Automated tests that verify code definitions match usage.

---

## Ecosystem Usage
Laravel doesn't define application error codes — this is a project-level concern. The `ValidationException` has `$errors` but no machine codes. Custom exceptions can define `$code` properties. Enums from `spatie/enum` or PHP 8.1 native enums are common choices.

---

## Related Knowledge Units
### Prerequisites
- Error response shape design
- HTTP status code selection

### Related Topics
- Error code namespace design
- Exception-to-code mapping
- Domain-specific error codes

### Advanced Follow-up Topics
- Cross-service error code agreement
- Automated error code documentation generation
- Error code deprecation and migration

---

## Research Notes
- Stripe uses hierarchical error codes (e.g., `card_declined`, `expired_card`) that map to HTTP status codes
- Google APIs use a structured error model with code, message, status, and details fields
- Error codes in headers (e.g., `X-Error-Code`) enable middleware-level handling without parsing the response body
