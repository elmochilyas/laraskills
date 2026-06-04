# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** error-handling-design
**Knowledge Unit:** Error Code Taxonomy
**Difficulty:** Intermediate
**Category:** Error Handling
**Last Updated:** 2026-06-03

---

# Overview

Error Code Taxonomy is the systematic design of application-specific error codes for API errors — using a consistent `CATEGORY_CODE` format where the category prefix identifies the error type and the numeric suffix uniquely identifies the specific error. It exists because HTTP status codes alone are insufficient for API error handling — they lack the granularity to distinguish between "email already taken" and "username already taken," both of which are 409 Conflict.

Engineers must care because error codes are the primary mechanism for client-side error handling logic. Without a consistent taxonomy, consumers must parse error messages (fragile, language-dependent) or guess error types from context. A well-designed error code taxonomy enables precise, stable, language-independent error handling.

---

# Core Concepts

**Category Prefix:** Uppercase identifier for the error category: `VALIDATION_`, `AUTH_`, `AUTHORIZATION_`, `NOT_FOUND_`, `CONFLICT_`, `RATE_LIMIT_`, `SERVER_`.

**Numeric Suffix:** Sequential 3-digit code within each category: `VALIDATION_001`, `VALIDATION_002`. Each code represents a unique, specific error scenario.

**Code Stability:** Once assigned, error codes are never reused or repurposed. Retired codes are deprecated, not reassigned.

**Code Documentation:** Every error code is documented with its description, HTTP status code, and example scenario.

**Code Granularity:** The level of detail each code represents — per-error-type (VALIDATION_001 for all required field errors) vs per-scenario (VALIDATION_001 for missing email, VALIDATION_002 for missing name).

**Client Handling Logic:** Error code prefixes enable simple client-side branching: `code.startsWith('VALIDATION_')` for validation handling, `code.startsWith('AUTH_')` for re-authentication.

---

# When To Use

- Any API with consumer-facing error responses
- APIs with multiple error types that require different client handling
- Multi-language APIs where error messages must be localized
- APIs with programmatic consumers that need deterministic error handling
- Error tracking and monitoring where error codes enable aggregation

---

# When NOT To Use

- Internal-only APIs with a single consumer that controls both sides
- Prototype/early-stage APIs where error types are not yet stable
- Error responses that only need HTTP status codes (very simple APIs)

---

# Best Practices

**Use CATEGORY_CODE format.** `VALIDATION_001` is parseable by both humans and machines. The category prefix immediately identifies the error domain.

**Define categories comprehensively.** Cover validation, auth, authorization, not-found, conflict, rate-limit, and server errors. Missing categories force errors into inappropriate categories.

**Assign sequential codes within categories.** Sequential assignment is simple and prevents gaps. Don't use semantic numbering (1xx, 2xx) — it creates pressure to fit errors into pre-defined ranges.

**Document every error code.** Each code needs a human-readable description, the associated HTTP status, and example scenarios. Documentation enables consumers to integrate correctly.

**Never reuse codes.** When an error type is removed, deprecate the code but never reassign it to a different error. Code reuse breaks existing client error handling.

**Include error codes in the error envelope.** The error code must be returned in every error response, not just in documentation.

---

# Architecture Guidelines

**Error codes are defined as constants or enums.** `App\Enums\ErrorCode` with cases like `VALIDATION_001` provides type-safe code references throughout the application.

**Codes are assigned in the exception class or error response builder.** Domain exceptions should define their error code. Form requests map validation rules to error codes.

**Error code documentation is generated from code definitions.** Maintain the source of truth in code (enum or config) and generate documentation from it.

**The error code taxonomy is versioned with the API.** Adding new codes is non-breaking. Removing or changing codes is a breaking change.

---

# Performance Considerations

**Error code string comparison is O(n) on code length** — negligible at ~20 characters maximum.

**Code taxonomy is metadata only** — no runtime lookup performance impact.

**Large code sets (>200 codes)** may benefit from hierarchical schemes but are rarely necessary for well-designed APIs.

---

# Security Considerations

**Error codes must not reveal internal system details.** `NOT_FOUND_001` should be the same regardless of which resource type was not found, preventing resource enumeration.

**Auth error codes should be generic.** `AUTH_001` for "unauthenticated" — don't differentiate between "user not found" and "wrong password" to prevent enumeration attacks.

**Rate limit codes must not expose limit configuration.** `RATE_LIMIT_001` should indicate the limit was exceeded without revealing the exact threshold.

---

# Common Mistakes

**Too generic codes.** `ERROR_001` that is used for 401, 404, and 422 errors. The code provides no information about the error type.

**Code reuse.** `VALIDATION_001` reassigned from "required field" to "email format" after the first meaning was retired. Existing clients break.

**No category prefix.** Numeric-only codes (001, 002) that cannot be categorized by code alone. Clients must parse the response body to determine error type.

**No documentation.** Error codes exist in the codebase but nowhere documented. Consumers can't find code definitions.

**Too many codes.** 100+ codes for what should be 10-15 error scenarios. Excessive granularity creates maintenance burden without benefit.

---

# Anti-Patterns

**Semantic Numbering:** Using `1xx` for validation, `2xx` for auth, etc. Creates artificial constraints and gaps.
**Better approach:** Sequential numbering per category. Gap-free and simple.

**Category Overload:** Using a single category (like `GENERAL_`) for all error types because no category fits perfectly.
**Better approach:** Define appropriate categories. Add categories when needed.

**Code Ambiguity:** Same error code returned for different scenarios because the code is too generic.
**Better approach:** One code per distinct, actionable error scenario. If clients need to handle it differently, it needs a different code.

---

# Examples

**Error code enumeration:**
```
enum ErrorCode: string
{
    case VALIDATION_001 = 'VALIDATION_001'; // Required field missing
    case VALIDATION_002 = 'VALIDATION_002'; // Invalid format
    case VALIDATION_003 = 'VALIDATION_003'; // Value out of range
    case AUTH_001 = 'AUTH_001';             // Not authenticated
    case AUTH_002 = 'AUTH_002';             // Token expired
    case NOT_FOUND_001 = 'NOT_FOUND_001';   // Resource not found
    case CONFLICT_001 = 'CONFLICT_001';     // Duplicate resource
    case CONFLICT_002 = 'CONFLICT_002';     // Stale data (version conflict)
    case RATE_LIMIT_001 = 'RATE_LIMIT_001'; // Tier limit exceeded
    case SERVER_001 = 'SERVER_001';         // Internal server error
}
```

---

# Related Topics

**Prerequisites:**
- Standardized Error Envelope
- Error Type Taxonomy

**Closely Related Topics:**
- Domain-Specific Error Codes — extending taxonomy per domain
- Exception-to-Code Mapping — mapping exceptions to codes
- Validation Error Shape Design — validation-specific error codes

**Advanced Follow-Up Topics:**
- Error Code Documentation Generation
- Error Code Testing — verifying correct codes

**Cross-Domain Connections:**
- API Documentation — documenting error codes
- Error Response Testing — testing error codes in responses
