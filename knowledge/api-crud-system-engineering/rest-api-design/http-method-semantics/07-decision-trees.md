# HTTP Method Semantics — Decision Trees

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: rest-api-design
- Knowledge Unit: http-method-semantics
- Phase: 7-decision-trees
- Last Updated: 2026-06-02

## Decision Inventory

| ID | Decision | When Relevant |
|----|----------|---------------|
| D1 | Which HTTP method to use for a given operation | Every endpoint definition |
| D2 | Whether to use PUT vs PATCH for updates | Resource update endpoints |
| D3 | What to return from successful DELETE | Every destroy endpoint |
| D4 | How to handle non-CRUD actions | Custom operation endpoints |
| D5 | How to register CRUD routes | Route file organization |
| D6 | How to check resource existence | Authorization or presence checks |

## Architecture-Level Decision Trees

### D1: Which HTTP method to use for a given operation

**Decision Context:**
Every API endpoint must select the correct HTTP method. The method determines caching behavior, idempotency guarantees, safety properties, and how intermediaries handle the request.

**Criteria:**
- Does the operation read or modify server state?
- Does the operation create a new resource?
- Is the operation idempotent (same result on retry)?
- Is the operation a full or partial update?

**Decision Tree:**

```
What is the operation's primary effect on server state?
├── No state change (read)
│   ├── Is it an existence check only (no body needed)?
│   │   ├── YES → HEAD
│   │   └── NO → GET
│   └── Outcome: GET for data retrieval, HEAD for existence
│
├── New resource creation
│   └── Outcome: POST (returns 201 + Location header)
│
├── Resource modification
│   ├── Is the client sending the complete resource representation?
│   │   ├── YES → PUT (idempotent, full replacement)
│   │   └── NO → PATCH (partial update, sometimes rules)
│   └── Outcome: PUT for full replacement, PATCH for partial
│
└── Resource removal
    └── Outcome: DELETE (returns 204 No Content)
```

**Rationale:**
GET is safe and cacheable — the primary performance advantage. POST correctly signals non-idempotent creation. PUT signals idempotent replacement. PATCH signals partial modification. DELETE signals removal. Using the correct method enables HTTP-level caching and intermediary optimization.

**Default Decision:**
GET for reads, POST for creates, PUT/PATCH for updates, DELETE for removals.

**Risks:**
- POST for reads bypasses caching infrastructure
- PUT for partial updates nullifies omitted fields
- DELETE with body may be stripped by intermediaries

**Related Rules:**
- Use GET For All Read Operations
- Use POST For All Operations That Create Resources
- Return 204 For Successful DELETE
- Use PATCH For Partial Updates, PUT For Full Replacement
- Use POST For Actions That Don't Map To CRUD

**Related Skills:**
- HTTP Status Code Selection
- Idempotency Semantics
- Resource Naming Conventions

---

### D2: Whether to use PUT vs PATCH for updates

**Decision Context:**
Both PUT and PATCH can update resources but have different semantics. PUT requires the complete resource representation; PATCH accepts only changed fields. Choosing incorrectly leads to data loss or client confusion.

**Criteria:**
- Does the client send all resource fields or only changed ones?
- Can omitted fields be safely set to null/default?
- Is idempotency required for the update operation?

**Decision Tree:**

```
Does the client know all fields of the resource?
├── YES (client retrieved resource, modifies all fields, sends back)
│   ├── Is the update idempotent (same result on N identical requests)?
│   │   ├── YES → PUT — correct semantics, full replacement
│   │   └── NO → This is unusual; verify the operation is truly full replacement
│   └── Outcome: PUT is safe and semantically correct
│
└── NO (client only has some fields, or only wants to change a few)
    ├── Outcome: PATCH with `sometimes` validation rules
    └── Note: PATCH is not inherently idempotent — use If-Match if needed
```

**Rationale:**
PUT requires the full representation. A PUT with only some fields implies omitted fields should be reset. PATCH with `sometimes` correctly handles partial payloads. Most production APIs that claim both PUT and PATCH actually implement PATCH-only when developers realize PUT's strict requirement.

**Default Decision:**
Use PATCH for all resource updates unless the client explicitly sends the full representation.

**Risks:**
- PUT with partial data resets omitted fields to null
- PATCH without `sometimes` rules rejects valid partial updates
- Client confusion between PUT and PATCH persists in most APIs

**Related Rules:**
- Use PATCH For Partial Updates, PUT For Full Replacement

**Related Skills:**
- Input Validation Architecture
- HTTP Status Code Selection

---

### D3: What to return from successful DELETE

**Decision Context:**
After a successful DELETE, the resource no longer exists. The response body and status code communicate this to the client.

**Criteria:**
- Is there any metadata to return about the deletion?
- Was the operation truly successful?
- Does the client need confirmation beyond the status code?

**Decision Tree:**

```
Does the DELETE return metadata (cascaded deletions, cleanup results)?
├── YES
│   └── Return 200 OK with body containing cleanup metadata
│       Example: { "deleted": true, "cascaded": ["posts/1", "comments/3"] }
│
└── NO (standard deletion, no additional metadata)
    └── Return 204 No Content with empty body
        Example: return response(null, 204);
```

**Rationale:**
After deletion the resource is gone — there's nothing to return. 204 unambiguously signals success with no body. 200 with a body is misleading. Only include body when deletion metadata is genuinely needed.

**Default Decision:**
Return 204 No Content with empty body.

**Risks:**
- 200 with body creates client expectation of resource representation
- 204 response cannot have a body — clients must not attempt to parse
- Inconsistent pattern (some 204, some 200) confuses clients

**Related Rules:**
- Return 204 For Successful DELETE

**Related Skills:**
- HTTP Status Code Selection
- Response Caching Headers

---

### D4: How to handle non-CRUD actions

**Decision Context:**
Operations like cancel, send, approve, or restore don't map to standard CRUD. They must be modeled as explicit action endpoints rather than forced into unnatural PATCH semantics.

**Criteria:**
- Does the operation trigger side effects beyond state change?
- Is the operation a simple state transition (field update)?
- Does the operation need to be idempotent?

**Decision Tree:**

```
Is the operation a simple state transition (changing a single status field)?
├── YES
│   ├── Does changing this field trigger any side effects?
│   │   ├── NO → PATCH with validated status field (resource-oriented)
│   │   └── YES → POST action endpoint (side effects are explicit)
│   └── Outcome: PATCH for simple, POST for side effects
│
└── NO (complex operation with multiple effects)
    ├── Outcome: POST action endpoint
    └── Place under the related resource: POST /orders/{order}/cancel
```

**Rationale:**
Simple state changes (activate, archive, mark-as-read) are field updates — PATCH correctly models them. Operations with side effects (cancellation with refunds, sending notifications) need explicit action endpoints that make the side effects visible in the endpoint name.

**Default Decision:**
PATCH for simple state transitions; POST action endpoint for operations with side effects.

**Risks:**
- PATCH that hides side effects surprises clients (unexpected charges, emails)
- Action endpoint proliferation when PATCH would suffice
- Inconsistent pattern across the API

**Related Rules:**
- Use POST For Actions That Don't Map To CRUD

**Related Skills:**
- Resource vs Action Orientation
- Single-Action Controllers

---

### D5: How to register CRUD routes

**Decision Context:**
Laravel offers multiple ways to register CRUD routes: `Route::resource()`, `Route::apiResource()`, and manual route definitions. The wrong choice adds unused routes or misses necessary ones.

**Criteria:**
- Is this an API route or a web route?
- Are `create` and `edit` form routes needed?
- Are there custom actions alongside CRUD?

**Decision Tree:**

```
Is this an API route (not web)?
├── YES
│   ├── Are `create` and `edit` routes needed?
│   │   ├── NO → Route::apiResource() — excludes create/edit
│   │   └── YES → Route::resource() — includes create/edit (rare for APIs)
│   └── Outcome: apiResource for APIs, resource for web forms
│
└── NO (web route)
    └── Route::resource() — includes create/edit for HTML form rendering
```

**Rationale:**
`Route::apiResource()` registers only index, store, show, update, destroy — the five CRUD methods without `create` and `edit` HTML form routes. This keeps API route listings clean and avoids unnecessary endpoints.

**Default Decision:**
Always use `Route::apiResource()` for API CRUD endpoints.

**Risks:**
- Using `Route::resource()` for APIs adds useless routes
- Manual route definitions may miss middleware or route naming
- Custom actions mixed with apiResource need manual route additions

**Related Rules:**
- Use Route::apiResource() For CRUD Endpoints

**Related Skills:**
- Resource Controllers
- URL Structure Design

---

### D6: How to check resource existence

**Decision Context:**
Sometimes a client only needs to know if a resource exists without downloading its full representation. HEAD requests serve this purpose.

**Criteria:**
- Does the client need the response body or just headers?
- Is the check for authorization, caching, or presence?
- What is the network cost of downloading the full body?

**Decision Tree:**

```
Does the client need the response body content?
├── YES
│   └── Use GET — client needs full resource representation
│
└── NO (only needs to know if resource exists / check access)
    └── Use HEAD — returns same headers as GET without body
        Note: Laravel auto-converts HEAD to corresponding GET route
```

**Rationale:**
HEAD returns the same headers as GET without the response body, saving bandwidth and serialization time. For resource existence checks, authorization checks, or cache validation, the body is unnecessary overhead.

**Default Decision:**
Use HEAD for resource existence checks, GET for data retrieval.

**Risks:**
- HEAD must return same headers as GET — verify middleware applies consistently
- Some proxies may not forward HEAD correctly
- Laravel handles HEAD auto-conversion transparently

**Related Rules:**
- Use HEAD For Resource Existence Checks

**Related Skills:**
- Conditional Requests
- Response Caching Headers
