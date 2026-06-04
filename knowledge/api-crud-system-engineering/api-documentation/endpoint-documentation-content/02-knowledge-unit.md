# Endpoint Documentation Content

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Documentation
- **Knowledge Unit:** Endpoint Documentation Content
- **Last Updated:** 2026-06-02

---

## Executive Summary

Endpoint documentation content refers to the descriptive metadata associated with each API endpoint — what the endpoint does, when to use it, what parameters it accepts, what responses it returns, and what errors can occur. Unlike schema documentation (which describes data shapes) or authentication documentation (which describes access), endpoint documentation focuses on the behavioral contract of each individual API operation.

Well-written endpoint documentation answers five questions: What does this endpoint do? What do I need to call it? What will I get back? What can go wrong? How do I get started quickly? The answers are embedded in the OpenAPI path item as summary, description, operationId, tags, parameters, requestBody, responses, and externalDocs.

---

## Core Concepts

### Operation Summary
A short, imperative description of the endpoint: "List all users" or "Create a new user". Summaries should be 5-10 words, fit in a sidebar, and describe the action performed. Patterns: `{verb} {resource}` for lists/creates; `{verb} {resource} {qualifier}` for specific operations.

### Operation Description
A 2-5 sentence explanation of the endpoint's purpose, when to use it, and any non-obvious behavior. Descriptions should:

- Explain the business operation ("Creates a user account and sends a welcome email")
- Note side effects ("Also logs the user in and returns a session token")
- Mention rate limits or restrictions ("Limited to 10 requests per minute")
- Link to related documentation

### Parameters Documentation
Each parameter (path, query, header) should document:
- **Name and location** — Where the parameter goes
- **Type and format** — What values are valid
- **Required or optional** — Whether the endpoint works without it
- **Default value** — What happens if omitted
- **Example** — A concrete valid value
- **Description** — What the parameter controls

### Request Body Documentation
For POST, PUT, PATCH endpoints:
- **Content type** — Usually `application/json`
- **Schema** — Link to the request schema component
- **Example** — A complete request body example
- **Required fields** — Which fields must be present

### Response Documentation
For each status code:
- **Description** — What this response means
- **Content type** — Usually `application/json`
- **Schema** — Link to the response schema component
- **Example** — A complete response example
- **Headers** — Response headers if relevant (RateLimit-Remaining, etc.)

### Error Documentation
Every endpoint should document its error responses:
- **400/422** — Validation error format
- **401** — Authentication required
- **403** — Authorization failure
- **404** — Resource not found
- **429** — Rate limited
- **500** — Server error

---

## Mental Models

### The Five-Question Model
Every endpoint's documentation should answer:
1. What does this do? (summary + description)
2. What do I send? (parameters + request body)
3. What do I get? (responses)
4. What goes wrong? (errors)
5. How do I try it? (example)

### Consumer-First Writing
Write endpoint descriptions from the consumer's perspective. Describe what the endpoint achieves for the caller, not what the server does internally. "Creates a user account" not "Inserts a record into the users table."

### Progressive Disclosure
Start with the summary (quick scan), then description (understanding), then parameters/responses (integration details), then examples (copy-paste). This allows readers to get the information they need at their reading depth.

---

## Internal Mechanics

### Documentation in OpenAPI
Endpoint documentation maps to OpenAPI path item fields:

| OpenAPI Field | Purpose |
|---|---|
| `summary` | One-line endpoint title |
| `description` | Detailed explanation (Markdown supported) |
| `operationId` | Unique identifier for code generation |
| `tags` | Category grouping |
| `parameters` | Query, path, header, cookie params |
| `requestBody` | Request payload schema |
| `responses` | Response schemas per status code |
| `externalDocs` | Links to external guides |
| `deprecated` | Deprecation flag |

### Documentation in Scramble
Scramble extracts endpoint documentation from:
- Route method names (converted to summaries)
- Controller PHPDoc descriptions
- Route group names → OpenAPI tags
- Form Request rules → parameter schemas
- API Resources → response schemas

### Documentation in Scribe
Scribe extracts endpoint documentation from:
- `@group` annotations → tags
- Method PHPDoc → description
- `@bodyParam`, `@queryParam`, `@urlParam` → parameters
- `@response` → response examples

---

## Patterns

### Operation ID Convention
Use `{resource}.{action}` format for operation IDs:
```yaml
operationId: users.list
operationId: users.create
operationId: users.show
operationId: users.update
operationId: users.delete
```

This maps naturally to SDK method naming.

### Status Code Documentation
Document all realistic status codes, not just 200:
```yaml
responses:
  '200':
    description: User retrieved successfully
  '401':
    $ref: '#/components/responses/Unauthorized'
  '404':
    $ref: '#/components/responses/NotFound'
```

### Example-First Documentation
Provide real, copy-pasteable examples for every endpoint. Examples should:
- Use realistic but fake data
- Be consistent across endpoints (same user ID in related examples)
- Include edge cases (empty lists, nullable fields)

### Changelog Links in Descriptions
For endpoints that have changed, link to the changelog entry:
```yaml
description: |
  Creates a new user account.
  > **Changed in v2.1:** The `role` field is now required.
  > See [changelog](/changelog) for details.
```

---

## Architectural Decisions

### Summary vs Description Distinction
Summaries are for navigation (sidebars, search results). Descriptions are for reading. Summaries should stand alone; descriptions should provide complete context.

### Inline vs Ref Examples
Inline examples are simpler but cannot be reused. Component-level examples (`components/examples/`) can be shared across endpoints but require more setup. Use component examples for shared data shapes; inline examples for endpoint-specific data.

### Documentation Granularity
Too little documentation leaves consumers guessing. Too much documentation overwhelms them and becomes unmaintainable. Strike a balance: document every parameter, every response status, and every error — but keep descriptions concise.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Comprehensive docs reduce support tickets | Writing and maintaining docs takes time | ROI is positive for public APIs |
| Examples speed integration | Examples become stale | Must regenerate in CI/CD |
| operationId enables clean SDKs | Naming collisions if not unique | Enforce uniqueness in CI validation |
| Markdown in descriptions is readable | Markdown rendering varies by tool | Test docs in target documentation viewer |

---

## Performance Considerations

### N/A
Endpoint documentation content has no runtime performance impact. Documentation files affect build time and CI pipeline duration proportionally to spec size.

---

## Production Considerations

### Review Documentation in Code Review
Treat documentation changes as code changes. Require documentation updates in PRs that add or modify endpoints.

### Accessibility of Documentation
Ensure documentation is searchable, screen-reader friendly, and available without authentication (for public APIs). Use consistent heading levels and descriptive link text.

### Version-Specific Documentation
Different API versions may have different endpoint documentation. Maintain separate spec files per API version.

---

## Common Mistakes

### Terse or Missing Descriptions
Why it happens: Developers assume the endpoint is self-explanatory. Why it's harmful: Consumers cannot determine the endpoint's purpose without reading source code. Better approach: Write descriptions as if the reader has never seen the codebase.

### Documenting Implementation, Not Behavior
Why it happens: Developers describe what the server does (SQL queries, internal calls). Why it's harmful: Consumers care about the behavior contract, not the implementation. Better approach: Describe inputs, outputs, and effects.

### Incomplete Error Documentation
Why it happens: Only happy-path responses are documented. Why it's harmful: Consumers don't know how to handle errors. Better approach: Document every status code the endpoint can return.

### Copy-Pasted Descriptions Across Endpoints
Why it happens: Similar endpoints share documentation text. Why it's harmful: Subtle differences are missed, confusing consumers. Better approach: Write unique descriptions for each endpoint, even if similar.

---

## Failure Modes

### Misleading Descriptions
An endpoint description says "deletes the user" but the endpoint actually soft-deletes or archives. Failure mode: Consumers build integrations expecting hard deletion and are surprised by recovery behavior.

### Stale Examples
A POST endpoint example shows a field that no longer exists. Failure mode: New developers copy the example, get validation errors, and file support tickets.

### Missing Error Status Codes
A 429 rate-limit response is not documented. Failure mode: Consumers implement retry logic for 500 errors instead of 429, causing unnecessary server load.

---

## Ecosystem Usage

### Stripe API Documentation
Stripe's API docs are widely regarded as the gold standard. Each endpoint has: a clear summary, a description with business context, every parameter documented with type and description, exact JSON examples, error documentation, and code samples in 7+ languages.

### GitHub API Documentation
GitHub's API docs emphasize clear operationIds, detailed descriptions of parameter behavior, and comprehensive error documentation. Their docs include "considerations" sections for edge cases.

### Twilio API Documentation
Twilio's docs focus on examples and use cases. Each endpoint includes multiple examples for different scenarios, making it easy for developers to adapt the API to their specific needs.

---

## Related Knowledge Units

### Prerequisites
- HTTP Methods and Semantics — Understanding GET vs POST vs PUT vs PATCH vs DELETE
- REST Resource Design — Resource-oriented endpoint naming

### Related Topics
- Request Body Schema Documentation — Deep dive on request schemas
- Response Schema Documentation — Deep dive on response schemas
- Error Response Documentation — Standardized error format documentation

### Advanced Follow-up Topics
- API Changelog Generation — Tracking endpoint changes over time
- Documentation CI Validation — Automating documentation quality checks

---

## Research Notes

### Source Analysis
- OpenAPI Specification, Path Item Object: https://spec.openapis.org/oas/v3.1.0#path-item-object — Defines endpoint description fields
- Stripe API Reference: https://stripe.com/docs/api — Reference implementation of endpoint documentation

### Key Insight
The best endpoint documentation answers the consumer's question before they ask it. Every parameter should include not just the type but why and when the consumer would use it.

### Version-Specific Notes
- OpenAPI 3.1: Descriptions support CommonMark Markdown (not GitHub Flavored Markdown)
- OpenAPI 3.0: Descriptions support only HTML subset (not Markdown)
- Swagger UI 5.x+ supports Markdown descriptions regardless of OpenAPI version
