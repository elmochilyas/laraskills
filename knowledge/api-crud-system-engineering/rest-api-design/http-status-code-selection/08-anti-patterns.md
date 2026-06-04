# HTTP Status Code Selection: Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | rest-api-design |
| Knowledge Unit | http-status-code-selection |
| Phase | 8-anti-patterns |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. **200 OK for Everything** — Returning 200 for all successful operations regardless of semantics
2. **500 for Client Errors** — Returning 500 Internal Server Error when the client sends bad data
3. **Custom Status Codes** — Using non-standard status codes (e.g., 461, 299) that clients don't understand
4. **Stack Traces in Production** — Including debug backtraces in production error responses
5. **Inconsistent Error Structure** — Different error response shapes for different status codes

## Repository-Wide Anti-Patterns

- Using 400 for validation errors instead of 422 Unprocessable Entity
- Exposing `APP_DEBUG=true` in production, leaking stack traces in 500 responses
- Not setting `Cache-Control: no-store` on 4xx and 5xx error responses
- Omitting `Location` header on 201 Created responses

---

## 1. 200 OK for Everything

### Category
Semantic Loss

### Description
Returning 200 OK for all successful responses — including resource creation (should be 201), successful deletes (should be 204), and non-modification conditional GETs (should be 304).

### Why It Happens
Simplicity — 200 is the default status code in Laravel responses. Developers don't explicitly set status codes, so every successful response defaults to 200.

### Warning Signs
- `response()->json(...)` used without explicit status code parameter
- POST create endpoints return 200 without `Location` header
- DELETE endpoints return 200 with body instead of 204 with no body
- Conditional GET always returns 200, never 304

### Why Harmful
Clients cannot programmatically differentiate between creation, update, and delete success. Automated tooling (caching proxies, client SDKs, API gateways) relies on status codes for correct behavior.

### Real-World Consequences
A CDN caching layer caches a POST response (200 with created resource). The next client that reads the same URL receives the cached creation response. HTTP intermediaries treat 200 as cacheable by default, causing data inconsistency.

### Preferred Alternative
Use appropriate status codes: 201 for creation (with `Location` header), 204 for successful deletes, 304 for conditional GETs with no change.

### Refactoring Strategy
1. Audit all endpoint responses for correct status codes
2. Set explicit status codes in controllers: `response()->json($data, 201)`
3. Return `response(null, 204)` for successful deletes
4. Implement conditional GET handling for 304 responses
5. Add integration tests that verify status codes per operation

### Detection Checklist
- [ ] All successful responses use 200
- [ ] POST create returns 200, not 201
- [ ] DELETE returns body, not 204
- [ ] No 304 responses in GET endpoints
- [ ] No `Location` header on create responses

### Related Rules/Skills/Trees
- Rule: API-STATUS-001 (Semantic Status Codes)
- Skill: http-status-code-selection
- Tree: http-semantics

---

## 2. 500 for Client Errors

### Category
Error Misclassification

### Description
Returning 500 Internal Server Error when the client sends invalid data — malformed JSON, missing required fields, or validation violations. 500 indicates a server failure; client-caused problems should use 4xx codes.

### Why It Happens
Unhandled exceptions in controllers or form requests. The application throws an exception (e.g., `QueryException`, `MethodNotFoundError`) that the global exception handler catches and returns as 500.

### Warning Signs
- 500 responses with "Internal Server Error" for bad client input
- Error logs show client-caused exceptions logged as server errors
- Monitoring alerts trigger for client typos and validation failures
- No distinction in error handling between client and server faults

### Why Harmful
Client errors disguised as 500 responses pollute server monitoring and alerting. Ops teams investigate "server errors" that are actually client mistakes. Clients don't know they should fix their request.

### Real-World Consequences
A monitoring dashboard shows 500 errors spiking. The ops team pages an engineer at 2 AM. The engineer finds the "error" is caused by a client sending `null` for a required field. This should have been a 422.

### Preferred Alternative
Use 4xx codes for client errors: 400 for malformed syntax, 422 for validation failures, 404 for not found. Use 500 only for unexpected server failures.

### Refactoring Strategy
1. Add form request validation to catch client errors early
2. Customize exception handler to return 422 for validation exceptions
3. Add middleware to catch malformed JSON and return 400
4. Configure monitoring to exclude 4xx responses from error alerts
5. Log 500 errors with full context for investigation

### Detection Checklist
- [ ] 500 returned for missing/invalid client input
- [ ] Client-caused exceptions logged as errors
- [ ] Monitoring alerts for client mistakes
- [ ] No form request validation on write endpoints
- [ ] Global exception handler returns 500 for all exceptions

### Related Rules/Skills/Trees
- Rule: API-ERROR-001 (Error Classification)
- Skill: error-handling-design
- Tree: error-handling

---

## 3. Custom Status Codes

### Category
Protocol Violation

### Description
Using non-standard HTTP status codes (e.g., 461, 299, 420) to convey application-specific semantics. HTTP clients, proxies, CDNs, and tooling only recognize standard codes.

### Why It Happens
"No standard code exists for my specific case" — developers invent custom codes instead of using the closest standard code with a descriptive error body.

### Warning Signs
- Status codes not in the IANA HTTP Status Code Registry
- Client code must handle special codes beyond the standard set
- CDN or proxy treats custom codes unexpectedly (caching or not)
- API documentation includes custom codes with special handling instructions

### Why Harmful
HTTP intermediaries (CDNs, load balancers, API gateways) don't understand custom codes. They may cache error responses, fail to retry, or treat them as success. Client SDK generators don't generate handlers for unknown codes.

### Real-World Consequences
An API returns 461 for "rate limit exceeded, but with a special condition." The CDN caches the 461 response because it doesn't recognize it as an error code. Subsequent clients receive stale rate-limit errors even after the limit resets.

### Preferred Alternative
Use the closest standard status code and put detailed semantics in the error response body. For example, use 429 for rate limiting with detailed reason in the body.

### Refactoring Strategy
1. Identify all custom status codes
2. Map each to the closest standard code with descriptive body
3. Remove custom code handling from client libraries
4. Add tests verifying only standard codes are used
5. Update documentation

### Detection Checklist
- [ ] Non-standard status codes in use
- [ ] IANA registry doesn't list the codes used
- [ ] Client code has special handling for unknown codes
- [ ] CDN/proxy treats custom codes unpredictably
- [ ] Documentation lists custom codes

### Related Rules/Skills/Trees
- Rule: API-STATUS-002 (Standard Status Codes Only)
- Skill: http-status-code-selection
- Tree: http-protocol

---

## 4. Stack Traces in Production

### Category
Security Vulnerability

### Description
Including PHP stack traces, file paths, SQL queries, and internal identifiers in production error responses. This occurs when `APP_DEBUG=true` in the production `.env` file.

### Why It Happens
Copying `.env.example` to production without setting `APP_DEBUG=false`. The framework defaults to debug mode, exposing detailed error information.

### Warning Signs
- Error responses include `file`, `line`, `trace` fields
- SQL queries visible in error responses
- Internal file paths like `/var/www/html/app/...` in JSON
- `APP_DEBUG=true` in production `.env`

### Why Harmful
Stack traces reveal the application's internal structure, file paths, database schema, and potentially credentials. Attackers use this information to craft targeted exploits.

### Real-World Consequences
A production 500 response reveals `SQL: select * from users where email = ?` with the binding `admin@example.com`. An attacker sees the query structure, knows the table name, and can perform SQL injection.

### Preferred Alternative
Always set `APP_DEBUG=false` in production. Return a generic error message with a request ID for traceability. Log full error details server-side.

### Refactoring Strategy
1. Set `APP_DEBUG=false` in production `.env`
2. Customize the exception handler to return generic error messages
3. Add request ID to error responses for log correlation
4. Verify no stack traces appear in production error responses

### Detection Checklist
- [ ] `APP_DEBUG=true` in production
- [ ] Error responses contain stack traces
- [ ] File paths visible in error output
- [ ] SQL queries in error responses
- [ ] Internal identifiers exposed

### Related Rules/Skills/Trees
- Rule: API-SEC-005 (No Debug in Production)
- Skill: sensitive-data-leak-prevention
- Tree: security-hardening

---

## 5. Inconsistent Error Structure

### Category
Poor Client Experience

### Description
Different status codes return different error response shapes — some return `{message}`, others `{error}`, others `{errors}`, and some use different nesting structures.

### Why It Happens
Multiple developers add error handling independently without a standardized error response format. Each uses their preferred structure.

### Warning Signs
- `400` response has different fields than `422` response
- `404` returns `{error: "Not found"}` but `403` returns `{message: "Forbidden"}`
- Client code has conditional parsing per status code
- No centralized error response formatting

### Why Harmful
Clients must implement status-code-specific parsing logic. Error handling code becomes complex and brittle. New team members must learn multiple error formats.

### Real-World Consequences
A client library parses errors with `response.data.errors.field` for 422, but `response.data.message` for 400. A 400 validation error (misclassified) returns `errors.field`, which the client parses as a string and displays "undefined" to the user.

### Preferred Alternative
Standardize on a single error response envelope across all status codes. Use `message`, `errors` (for field-level), `code`, and `request_id` fields consistently.

### Refactoring Strategy
1. Define a standard error response format in a base exception class
2. Implement a consistent exception handler that normalizes all errors
3. Remove ad-hoc error formatting from controllers
4. Add architecture test that verifies consistent error structure
5. Update client libraries to use a single error parser

### Detection Checklist
- [ ] Different status codes return different field names
- [ ] Error response structure varies by endpoint
- [ ] Client code has status-code-specific parsing
- [ ] No centralized error formatting exists
- [ ] Architecture test for error structure is missing

### Related Rules/Skills/Trees
- Rule: API-ERROR-003 (Unified Error Format)
- Skill: standardized-error-envelope
- Tree: api-consistency
