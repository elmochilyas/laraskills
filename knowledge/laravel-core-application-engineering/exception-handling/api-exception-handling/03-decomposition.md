# Decomposition: API Exception Handling

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Exception Handling
- **Knowledge Unit:** API Exception Handling
- **Difficulty Level:** Intermediate

## Atomic Chunks

### Chunk 1: Consistent JSON Error Envelope
- **Topics:** Standard error response structure (message, errors, code), envelope format
- **Key Content:** Defining a consistent JSON schema across all error responses, field naming conventions
- **Learning Objectives:** Design a consistent JSON error response envelope for all API error scenarios

### Chunk 2: Content Negotiation for Exceptions
- **Topics:** Detecting API requests vs web requests, `ExpectsJson` trait, custom negotiation
- **Key Content:** `$request->expectsJson()`, `Accept` header handling, route prefix detection
- **Learning Objectives:** Implement content negotiation that returns JSON for API routes and HTML for web routes

### Chunk 3: Mapping Exceptions to HTTP Codes
- **Topics:** Custom exception → HTTP status mapping, exception-specific status codes
- **Key Content:** `PaymentFailedException` → 402/422, domain exceptions → business-logic-appropriate codes
- **Learning Objectives:** Map domain and HTTP exceptions to appropriate HTTP status codes for API responses

### Chunk 4: API Error Rendering in Handler
- **Topics:** `renderable()` callback for API routes, per-exception rendering, fallback JSON handler
- **Key Content:** Registering API-specific render callbacks, default JSON fallback, validation error formatting for APIs
- **Learning Objectives:** Implement API-specific exception rendering in the Handler that covers all exception types
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization