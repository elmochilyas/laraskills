# ECC Anti-Patterns — Error Response Documentation

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | API & CRUD System Engineering |
| **Subdomain** | API Documentation |
| **Knowledge Unit** | Error Response Documentation |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Error Messages Leaking Implementation Details
2. Inconsistent Error Shape Across Endpoints
3. Errors as an Afterthought
4. Missing Rate Limit Error Documentation
5. Error Schema Not Matching Actual Response

---

## Repository-Wide Anti-Patterns

- Magic Numbers
- Silent Failures

---

## Anti-Pattern 1: Error Messages Leaking Implementation Details

### Category
Security

### Description
Error responses in documentation (or worse, in production) that expose internal implementation details: SQL queries, stack traces, file paths, server architecture, or database schema information.

### Why It Happens
Framework default error handlers are often used in development, and those defaults include stack traces and query details. When documentation examples are copied from development responses, those details get baked into the docs. Teams forget to sanitize examples before publication.

### Warning Signs
- Error examples include SQL query text
- Stack trace fragments appear in error response examples
- File paths (e.g., `/var/www/html/app/Http/Controllers/UserController.php:42`) in error messages
- Internal server names or environment identifiers visible
- Database table names or column names in error descriptions
- Error codes that map to internal systems (e.g., cache keys, queue names)

### Why It Is Harmful
Implementation details in error responses expose attack surface. An attacker learns the server's directory structure, the database schema, the framework version, and the caching infrastructure — information that enables targeted exploits. Additionally, implementation-focused examples become stale when the codebase evolves, even if the API behavior is unchanged.

### Real-World Consequences
An error response example shows `"message": "SQLSTATE[23000]: Integrity constraint violation: 1062 Duplicate entry 'john@example.com' for key 'users_email_unique'"`. A malicious actor learns the exact database column name (`users_email_unique`), confirming the table structure and constraint naming convention. They use this information in a SQL injection attempt on a related endpoint.

### Preferred Alternative
Design all error examples with generic, consumer-friendly messages that describe the failure mode without exposing internals. Use `"message": "A resource with this email already exists."` instead of SQL text.

### Refactoring Strategy
1. Audit every error response example for implementation details
2. Replace SQL text, stack traces, file paths, and internal names with consumer-friendly messages
3. Define a centralized error message catalog that maps error codes to safe messages
4. Add a CI lint rule that rejects error examples containing SQL keywords, path separators, or stack trace patterns
5. Train the team to capture error examples from production (where debug mode is off) rather than development

### Detection Checklist
- [ ] Search error examples for SQL keywords (SELECT, INSERT, UPDATE, DELETE, SQLSTATE)
- [ ] Check for file path patterns (/var/, /app/, C:\)
- [ ] Verify stack trace fragments are absent
- [ ] Confirm error messages do not mention database tables, columns, or indexes
- [ ] Test that production error responses match documented examples

### Related Rules
- Include Machine-Readable Error Codes (05-rules.md)
- Provide Scenario-Based Error Examples (05-rules.md)

### Related Skills
- Document Error Responses (06-skills.md)

### Related Decision Trees
- Error Schema Organization — Inline vs Reusable Components (07-decision-trees.md)

---

## Anti-Pattern 2: Inconsistent Error Shape Across Endpoints

### Category
Code Organization

### Description
Each endpoint returns errors in a different format — some use `{message: string}`, others use `{error: string}`, some include `errors: object`, others return an array — forcing consumers to write per-endpoint error handling.

### Why It Happens
Teams grow endpoints organically. Different developers implement error handling independently. There is no centralized error response standard or reusable error component. New endpoints follow whatever pattern the implementer prefers.

### Warning Signs
- Error payload structure varies between endpoints
- Some endpoints return `error` as a key, others return `message`
- Field-level validation errors are inconsistently formatted
- Error examples across endpoints show different JSON structures
- Consumer integration code includes endpoint-specific error parsing
- Code review reveals ad-hoc error response construction in controllers

### Why It Is Harmful
Inconsistent error shapes prevent consumers from writing a single, reusable error handler. Instead, they must inspect the endpoint being called and branch their error handling logic accordingly. This multiplies code complexity, increases the chance of unhandled error cases, and makes SDK generation produce inconsistent error types.

### Real-World Consequences
The Users API returns errors as `{message: "Not found", code: "NOT_FOUND"}`. The Posts API returns errors as `{error: "Not found", status: 404}`. A consumer building a mobile app writes two separate error handlers. Six months later, a third team adds the Comments API with yet another error format. The consumer misses the third pattern. Their app crashes on Comment API errors for two release cycles before anyone notices.

### Preferred Alternative
Define a single, reusable error response schema that all endpoints use consistently. Use OpenAPI `$ref` components to enforce the standard across the entire API.

### Refactoring Strategy
1. Define a single `ErrorResponse` schema in `components/schemas/` with `message`, `code`, and `errors` fields
2. Define reusable response objects in `components/responses/` for each common status code
3. Update all controllers to use a centralized exception handler or response builder that guarantees the standard shape
4. Add a CI lint rule that flags any inline error schema definition
5. Write an integration test that calls every endpoint's error path and validates the response shape matches the standard

### Detection Checklist
- [ ] Compare error response structures across 3+ endpoints
- [ ] Verify all endpoints use the same `ErrorResponse` schema reference
- [ ] Check for inline error definitions in endpoint specs
- [ ] Test that error responses from different endpoints produce identical JSON structures
- [ ] Confirm the centralized error handler is used by all controllers

### Related Rules
- Define Reusable Error Response Components (05-rules.md)
- Document All Error Status Codes On Every Endpoint (05-rules.md)

### Related Skills
- Document Error Responses (06-skills.md)

### Related Decision Trees
- Error Schema Organization — Inline vs Reusable Components (07-decision-trees.md)
- Error Status Code Coverage — All vs Essential Only (07-decision-trees.md)

---

## Anti-Pattern 3: Errors as an Afterthought

### Category
Documentation

### Description
Documenting all success responses perfectly while leaving error response sections empty or incomplete, making it impossible for consumers to build robust error handling.

### Why It Happens
Error documentation is perceived as "negative testing" — it describes what happens when things go wrong, which feels less important than describing the happy path. Teams prioritize success documentation because it has visible output. Error documentation feels like documenting failure cases that "shouldn't happen."

### Warning Signs
- Error responses exist but contain only a status code with no schema
- Error sections are marked "TODO" or "coming soon"
- Only 500 Internal Server Error is documented (with no schema)
- Error documentation was added only after consumer complaints
- No consumer-written error handler works on the first integration attempt

### Why It Is Harmful
An API with undocumented errors is an API that cannot be used safely. Every consumer's first integration request will fail — validation errors, auth errors, rate limits — and the consumer will have no documented reference for handling these responses. The API appears hostile to new consumers, and integration time increases dramatically.

### Real-World Consequences
A startup evaluates two competing APIs for their product. API A documents every error status code with examples and schemas. API B documents only success responses. The startup can integrate with API A in one afternoon. API B requires days of trial-and-error to discover error shapes. The startup chooses API A. API B loses a customer because errors were an afterthought.

### Preferred Alternative
Treat error documentation as equally important as success documentation. Every endpoint must document all realistic error status codes with schemas and examples before being marked as complete.

### Refactoring Strategy
1. Create a completion checklist that requires error documentation for all applicable status codes
2. Define reusable error components first, then reference them from every endpoint
3. Add error documentation coverage to the definition of "done" for each endpoint
4. Track error documentation completeness in the API documentation dashboard
5. PR reviewers must verify error docs are present before approving documentation changes

### Detection Checklist
- [ ] Count error status codes documented vs. not documented per endpoint
- [ ] Verify every endpoint has at minimum 422 and 500 documented
- [ ] Check schema completeness: error responses must include `message`, `code`, and `errors`
- [ ] Confirm error examples exist for at least one scenario
- [ ] Review PR process — does error documentation block merges?

### Related Rules
- Document All Error Status Codes On Every Endpoint (05-rules.md)
- Include Machine-Readable Error Codes (05-rules.md)

### Related Skills
- Document Error Responses (06-skills.md)

### Related Decision Trees
- Error Status Code Coverage — All vs Essential Only (07-decision-trees.md)

---

## Anti-Pattern 4: Missing Rate Limit Error Documentation

### Category
Documentation

### Description
Omitting the 429 Too Many Requests response documentation, including the `Retry-After` header format and the rate limit error body schema, leaving consumers to discover rate limits through hard failures.

### Why It Happens
Rate limiting is configured in the infrastructure layer (middleware, Nginx, API gateway) and feels separate from application-level error documentation. Teams document application errors (422, 404) but forget that rate limiting produces a different error shape with its own header semantics.

### Warning Signs
- 429 status code is not documented on any endpoint
- 429 exists but has no schema — just a status code
- `Retry-After` header is not mentioned in the 429 response definition
- Rate limit error body schema is undefined or inconsistent with standard error shape
- Consumers ask "how long should I wait before retrying?"

### Why It Is Harmful
Every consumer hits rate limits eventually. Without documented 429 response format and `Retry-After` semantics, consumers either retry immediately (defeating rate limiting) or implement arbitrary backoff intervals (unnecessary latency). The most commonly undocumented error detail — `Retry-After` format — directly impacts consumer integration quality.

### Real-World Consequences
A consumer makes 100 requests per minute to an endpoint rate-limited at 60/minute. They get a 429 response with body `{"message": "Too Many Requests", "code": "RATE_LIMITED"}` and no `Retry-After` header. Not knowing the retry interval, they implement a 5-second backoff. The actual reset time is 60 seconds. For 55 seconds, their retries are wasted. Over a week, this adds 10,000 unnecessary requests.

### Preferred Alternative
Document 429 on every endpoint with both the error body schema and the `Retry-After` header format (seconds or HTTP-date).

### Refactoring Strategy
1. Add 429 to the required status code list for every endpoint
2. Define the rate limit error body in the reusable error component
3. Add `Retry-After` header documentation with type (integer) and description
4. Include a 429 example showing the error body and header value
5. Reference the rate limit configuration from endpoint documentation

### Detection Checklist
- [ ] Check every endpoint's response list for 429
- [ ] Verify 429 response includes `Retry-After` header documentation
- [ ] Confirm the rate limit error body matches the standard error schema
- [ ] Test that automatic retry logic can parse the documented `Retry-After` format

### Related Rules
- Document Retry-After Header In Rate Limit Errors (05-rules.md)

### Related Skills
- Document Error Responses (06-skills.md)

### Related Decision Trees
- Error Status Code Coverage — All vs Essential Only (07-decision-trees.md)

---

## Anti-Pattern 5: Error Schema Not Matching Actual Response

### Category
Testing

### Description
Documenting error response schemas that differ from what the API actually returns — wrong property names, missing fields, incorrect types — creating documented error handling code that fails in production.

### Why It Happens
Error documentation is written once and never validated against the actual implementation. Unlike success paths, which are exercised by integration tests, error paths are often not contract-tested. Documentation and implementation drift silently over time.

### Warning Signs
- Error contract tests do not exist
- Error documentation has not been updated in 3+ release cycles
- Consumer error handlers break on first error response
- Support tickets cite "documented error format doesn't match actual response"
- Error schema field names differ from actual response property names
- The documented error type (object vs array) differs from the actual response

### Why It Is Harmful
Documented error schemas that don't match reality are worse than no error documentation at all. Consumers write error handling code against the documented schema — code that fails when it encounters the actual response. This creates production incidents for errors that should have been handled gracefully. Trust in the entire documentation set erodes.

### Real-World Consequences
The spec documents error responses as `{message: string, code: string}`. The actual API returns `{error: string, status: number, details: object}` for validation errors — a completely different structure. A consumer writes error handling that reads `response.message` and `response.code`. On the first 422 response, `response.message` is `undefined` and `response.code` does not exist. The error handler throws. A routine validation error becomes a production incident.

### Preferred Alternative
Validate every documented error response schema against the actual API response using contract tests that cover all error status codes.

### Refactoring Strategy
1. Write contract tests that call each endpoint and deliberately trigger each error condition
2. Assert the response body matches the documented schema exactly
3. Add error contract tests to the slow-check CI job
4. When schemas change, update both implementation and documentation simultaneously
5. Include error schema validation in the API release checklist

### Detection Checklist
- [ ] Count error contract tests vs. documented error schemas — every documented error must be tested
- [ ] Verify error contract tests actually fail when the response mismatches the schema
- [ ] Run a diff between documented error schemas and actual API error responses
- [ ] Check that error contract tests cover all endpoints, not just a subset
- [ ] Confirm error schema changes trigger a documentation update requirement

### Related Rules
- Validate Error Response Schemas With Contract Tests (05-rules.md)
- Define Reusable Error Response Components (05-rules.md)

### Related Skills
- Document Error Responses (06-skills.md)

### Related Decision Trees
- Error Schema Organization — Inline vs Reusable Components (07-decision-trees.md)

---

