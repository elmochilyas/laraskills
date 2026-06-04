# HTTP Status Code Selection — Decision Trees

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: rest-api-design
- Knowledge Unit: http-status-code-selection
- Phase: 7-decision-trees
- Last Updated: 2026-06-02

## Decision Inventory

| ID | Decision | When Relevant |
|----|----------|---------------|
| D1 | Which 2xx status code to return | Every successful response |
| D2 | Whether to return 401 vs 403 | Authentication/authorization failures |
| D3 | Whether to return 400 vs 422 for client errors | Input validation failures |
| D4 | Which status code for resource conflicts | Duplicate creation, stale data |
| D5 | How to handle rate limit responses | Rate-limited endpoints |
| D6 | How to respond to batch operations | Multi-item processing endpoints |

## Architecture-Level Decision Trees

### D1: Which 2xx status code to return

**Decision Context:**
Successful responses span multiple 2xx codes. Choosing correctly signals to clients what happened and enables automated handling.

**Criteria:**
- Was a new resource created?
- Is there a response body to return?
- Was the operation asynchronous?
- Was the operation conditional (If-None-Match)?

**Decision Tree:**

```
What type of operation succeeded?
├── Resource creation (POST store)
│   └── 201 Created + Location header with new resource URI
│
├── Resource deletion (DELETE destroy)
│   ├── Is there metadata about the deletion?
│   │   ├── YES → 200 OK with body
│   │   └── NO → 204 No Content, empty body
│   └── Otherwise: 204 No Content
│
├── Asynchronous operation (queued, background)
│   └── 202 Accepted — processing started, no result yet
│
├── Conditional GET (resource unchanged)
│   └── 304 Not Modified — empty body, same cache headers
│
├── GET/PUT/PATCH with body
│   └── 200 OK with resource representation
│
└── GET/PUT/PATCH with no body needed
    └── 204 No Content (rare for GET)
```

**Rationale:**
Each 2xx code has specific semantics. 201 signals creation with Location. 204 signals success with no body. 202 signals async acceptance. Using the correct code enables generic HTTP clients to understand the outcome without parsing the body.

**Default Decision:**
200 OK for data responses, 201 Created for new resources with Location header, 204 No Content for deletions.

**Risks:**
- 200 for created resources confuses creation vs retrieval
- 200 for deleted resources with body is misleading
- 304 must include same cache headers as 200

**Related Rules:**
- Return 201 With Location Header For Resource Creation
- Return 204 For Successful DELETE
- Use 304 Not Modified For Conditional GET

**Related Skills:**
- HTTP Method Semantics
- Conditional Requests

---

### D2: Whether to return 401 vs 403

**Decision Context:**
Authentication (who you are) vs authorization (what you can do) are distinct concerns that map to different status codes. Interchanging them confuses client error handling and security auditing.

**Criteria:**
- Did the request include valid authentication credentials?
- Does the authenticated user have permission for the operation?
- Is the resource known to exist?

**Decision Tree:**

```
Did the request include authentication credentials (token, API key)?
├── NO → 401 Unauthorized — "I don't know who you are"
│   └── Response: "Authenticate and retry"
│
└── YES → credentials are present
    ├── Are the credentials valid?
    │   ├── NO → 401 Unauthorized — invalid or expired token
    │   └── YES → proceed
    │
    └── Does the authenticated user have permission?
        ├── YES → proceed with the operation (2xx)
        ├── NO — does the resource exist?
        │   ├── YES → 403 Forbidden — "known user, insufficient permissions"
        │   └── NO → 404 Not Found — resource doesn't exist
        └── Response: 403 for known resource, 404 for unknown
```

**Rationale:**
401 tells the client to present credentials. 403 tells the client credentials are valid but insufficient. Conflating them prevents correct client retry behavior. 401 triggers browser auth dialogs; 403 does not.

**Default Decision:**
401 for missing/invalid auth, 403 for authenticated but unauthorized.

**Risks:**
- 403 for missing token prevents client from knowing to authenticate
- Revealing resource existence (401 vs 404) is a security consideration
- Some APIs use 404 for unauthorized access to hide resource existence

**Related Rules:**
- Distinguish 401 vs 403 Correctly

**Related Skills:**
- REST Architectural Constraints
- Authentication Patterns

---

### D3: Whether to return 400 vs 422 for client errors

**Decision Context:**
Client errors span syntactic issues (malformed input) and semantic issues (validation failures). Using the correct code helps clients differentiate parse failures from business rule violations.

**Criteria:**
- Is the request malformed at the syntax level?
- Are there field-level validation failures?
- Can the client fix the error by changing the request format?

**Decision Tree:**

```
Is the request syntactically malformed?
├── YES — malformed JSON, wrong data type, invalid format
│   └── 400 Bad Request — "fix your request format"
│
└── NO — syntactically valid
    ├── Does the request violate field-level business rules?
    │   ├── YES → 422 Unprocessable Entity — "valid format, invalid data"
    │   └── NO → proceed (2xx or other 4xx)
    └── Response: 422 with field-level error messages
```

**Rationale:**
400 means "I can't parse this." 422 means "I can parse this but the data doesn't make sense." Using 400 for validation errors conflates two distinct error categories. Laravel's validation errors naturally return 422.

**Default Decision:**
400 for malformed syntax, 422 for validation failures.

**Risks:**
- Some client frameworks cannot handle 422 — may need 400 for compatibility
- 400 without field-level errors hides the specific problem
- Inconsistent use of 400 vs 422 confuses client error handling

**Related Rules:**
- Use 422 For Validation Errors, 400 For Syntax Errors

**Related Skills:**
- Input Validation Architecture
- RFC 9457 Problem Details

---

### D4: Which status code for resource conflicts

**Decision Context:**
Conflicts arise from duplicate creation, stale data, or invalid state transitions. The status code signals whether the client should retry with different data.

**Criteria:**
- Is the conflict from duplicate data (unique constraint)?
- Is the conflict from stale data (version mismatch)?
- Is the conflict from invalid state transition?

**Decision Tree:**

```
What is the nature of the conflict?
├── Duplicate resource (unique email, duplicate order)
│   ├── Should the client know the duplicate exists?
│   │   ├── YES → 409 Conflict — "resource with this data already exists"
│   │   └── NO → 422 with generic message — security/obscurity
│   └── Outcome: 409 Conflict preferred
│
├── Stale data (version mismatch, optimistic locking)
│   ├── Does the conflict have a new version the client can fetch?
│   │   ├── YES → 409 Conflict + current resource version
│   │   └── NO → 409 Conflict — "data changed, retry with fresh data"
│   └── Outcome: 409 Conflict
│
└── Invalid state transition (cannot cancel shipped order)
    └── 409 Conflict — "resource in a state that prevents this operation"
```

**Rationale:**
409 carries specific conflict semantics distinct from validation (422) or syntax (400). It signals the request is valid but conflicts with current server state. Clients can implement automatic retry logic specifically for 409 responses.

**Default Decision:**
409 Conflict for all resource conflicts.

**Risks:**
- 409 with entity body exposes duplicate details — privacy concern
- Some clients conflate 409 with transient errors and retry infinitely
- Undocumented 409 responses confuse client developers

**Related Rules:**
- Return 409 For Resource Conflicts

**Related Skills:**
- Idempotency Semantics
- Conditional Requests

---

### D5: How to handle rate limit responses

**Decision Context:**
Rate-limited requests need a specific status code and headers that enable intelligent client retry behavior.

**Criteria:**
- Is the rate limit exceeded?
- What headers inform the client of limits and reset?

**Decision Tree:**

```
Has the client exceeded the rate limit?
├── YES
│   └── Return 429 Too Many Requests
│       With headers:
│       - Retry-After: seconds until limit resets
│       - X-RateLimit-Remaining: 0
│       - X-RateLimit-Reset: Unix timestamp of reset
│
└── NO — within limits
    └── Include informational rate limit headers on every response:
        - X-RateLimit-Limit: max requests per window
        - X-RateLimit-Remaining: requests remaining in window
```

**Rationale:**
429 is the HTTP-standard status code for rate limiting. `Retry-After` enables intelligent backoff. Rate-limit headers inform proactive throttling before the limit is reached.

**Default Decision:**
429 Too Many Requests with Retry-After and rate-limit headers.

**Risks:**
- 429 without Retry-After leaves clients guessing when to retry
- 403 for rate limiting conflates with authorization
- Rate limit headers must be consistent across all endpoints

**Related Rules:**
- Return 429 With Retry-After For Rate Limiting

**Related Skills:**
- Rate Limiting Patterns
- API Throttling

---

### D6: How to respond to batch operations

**Decision Context:**
Batch operations process multiple items with potentially different outcomes for each. A single status code cannot represent mixed results.

**Criteria:**
- Is atomicity required (all-or-nothing)?
- Can different items have different outcomes?
- Does the client need per-item status information?

**Decision Tree:**

```
Is atomicity required (all items must succeed or none)?
├── YES
│   └── Return single status code reflecting overall outcome
│       - All succeeded → 200/201
│       - Any failed → 400/422/409
│       Note: Atomicity must be documented
│
└── NO — per-item outcomes can differ
    └── Return 207 Multi-Status
        With array of per-item results:
        [
            { "status": 201, "data": { ... } },
            { "status": 422, "error": "Invalid email" }
        ]
```

**Rationale:**
207 Multi-Status contains individual status codes per item, allowing the client to handle each item's outcome independently and retry only the failed items. A single 200 or 400 cannot represent mixed outcomes.

**Default Decision:**
207 Multi-Status for non-atomic batch operations with per-item status.

**Risks:**
- 207 responses are more complex for clients to parse
- Atomicity requirement may conflict with batch semantics
- Per-item status may exceed response size limits for large batches

**Related Rules:**
- Return 207 Multi-Status For Batch Operations

**Related Skills:**
- Resource vs Action Orientation
- Idempotency Semantics
