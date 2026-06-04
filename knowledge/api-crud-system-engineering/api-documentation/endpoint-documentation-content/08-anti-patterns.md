# ECC Anti-Patterns — Endpoint Documentation Content

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | API & CRUD System Engineering |
| **Subdomain** | API Documentation |
| **Knowledge Unit** | Endpoint Documentation Content |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Describing Internal Implementation Instead of Consumer Behavior
2. Documentation Without Error Responses
3. Copy-Pasted Descriptions Across Similar Endpoints
4. Terse Or Missing Descriptions
5. Stale Examples That Mismatch Current Schema

---

## Repository-Wide Anti-Patterns

- Premature Optimization
- Copy-Paste Programming

---

## Anti-Pattern 1: Describing Internal Implementation Instead of Consumer Behavior

### Category
Documentation

### Description
Writing endpoint descriptions that explain what the server does internally (SQL queries, service calls, caching strategies) instead of what the endpoint does for the consumer.

### Why It Happens
Developers write documentation from their own perspective. They know the implementation, so they naturally describe it. Auto-generation tools (Scramble, Scribe) use PHPDoc and method names, which often contain implementation details.

### Warning Signs
- Descriptions mention SQL, database tables, or query terms
- Service class names or repository patterns appear in documentation
- Internal architecture terms ("Redis cache", "queue job", "event listener")
- Description reveals infrastructure details (server names, database engines)
- Implementation changes require documentation updates even when behavior stays the same

### Why It Is Harmful
Consumers do not care about implementation — they care about behavior and outcomes. Implementation details expose unnecessary attack surface and create maintenance debt: every internal refactor requires a documentation update even when the API contract is unchanged. The documentation becomes a maintenance burden instead of a consumer resource.

### Real-World Consequences
An endpoint description says "Queries the users table with a LEFT JOIN on profiles and caches in Redis for 5 minutes." The team switches from Redis to Memcached. Now the documentation is wrong, even though the API behavior is identical. A security auditor flags the SQL mention as excessive information disclosure. The documentation team must audit all endpoints for exposed internals.

### Preferred Alternative
Write every description from the consumer's perspective: what the endpoint does, what it returns, and under what conditions it might fail. Use behavior-oriented language: "Creates a user" not "Inserts a record."

### Refactoring Strategy
1. Audit all current endpoint descriptions for implementation language
2. Replace each implementation detail with a consumer-facing behavior description
3. Use the five-question model (What, Send, Get, Errors, Example) as a template
4. Add a documentation style guide that bans internal implementation terms
5. Include consumer-perspective review in the documentation PR checklist

### Detection Checklist
- [ ] Search descriptions for SQL keywords (SELECT, INSERT, JOIN, query)
- [ ] Check for infrastructure keywords (cache, queue, Redis, database)
- [ ] Verify descriptions answer "what does it do for me?" without internal context
- [ ] Confirm implementation changes do not require documentation updates

### Related Rules
- Write From Consumer Perspective Not Implementation Perspective (05-rules.md)

### Related Skills
- Document Endpoint Content (06-skills.md)

### Related Decision Trees
- Documentation Depth — Summary-Only vs Full Five-Question Model (07-decision-trees.md)

---

## Anti-Pattern 2: Documentation Without Error Responses

### Category
Reliability

### Description
Documenting only the success response (200/201) for each endpoint while omitting all error status codes and their schemas, leaving consumers to discover error shapes through trial and error.

### Why It Happens
Success responses represent the normal flow and are easier to document. Error documentation is perceived as "extra" because not every endpoint fails in the same way. Teams often plan to add error docs "later" but never prioritize them.

### Warning Signs
- Endpoint docs show only 200 or 201 responses
- No 401, 403, 404, 422, 429, or 500 entries in the spec
- Error responses section is empty or contains only a status code without a schema
- Consumer error handlers break on first unexpected status code
- Support tickets include "what does a 422 look like?" questions

### Why It Is Harmful
Without documented error responses, consumers cannot write robust error-handling code. Every consumer must build their integration through trial and error, encountering unexpected error shapes one at a time. This multiplies support volume and increases integration time from hours to days. The most common consumer complaint for documented APIs is undocumented error shapes.

### Real-World Consequences
A consumer integrates with the Users API. The documentation shows only the 200 response. The consumer's first POST request returns a 422 with `{errors: {email: ["The email field is required."]}}`. The consumer expected `{message: string}` based on the success response format. Their generic error handler crashes. They file a support ticket. This pattern repeats for every status code on every endpoint.

### Preferred Alternative
Document every realistic HTTP status code per endpoint using `$ref` to reusable error components, including 401, 403, 404, 422, 429, and 500.

### Refactoring Strategy
1. Define reusable error response components for each common status code
2. Add `$ref` entries for all applicable error status codes to every endpoint
3. Include at least one error example per status code
4. Validate error documentation against the API's actual error responses using contract tests
5. Add error documentation completeness to the CI validation checklist

### Detection Checklist
- [ ] Count documented error status codes per endpoint
- [ ] Verify every endpoint lists at least 422 and 500
- [ ] Confirm error schemas include `message`, `code`, and `errors` fields
- [ ] Check that error examples exist for at least one scenario per code

### Related Rules
- Answer All Five Questions Per Endpoint (05-rules.md)
- Document Every Realistic HTTP Status Code (05-rules.md)

### Related Skills
- Document Endpoint Content (06-skills.md)

### Related Decision Trees
- Documentation Depth — Summary-Only vs Full Five-Question Model (07-decision-trees.md)

---

## Anti-Pattern 3: Copy-Pasted Descriptions Across Similar Endpoints

### Category
Documentation

### Description
Using identical or near-identical descriptions across endpoints that share similar functionality but differ in behavior, parameters, or error conditions — burying the unique details consumers need.

### Why It Happens
CRUD endpoints naturally follow similar patterns. Developers write one good description and duplicate it for the other CRUD operations, changing only the resource name. The differences between create, update, and list are subtle but critical — and they get lost in the duplicated text.

### Warning Signs
- Multiple endpoints share the same description word-for-word
- Only the resource name differs between descriptions
- Developers cannot quickly identify what makes each endpoint unique
- Endpoints with different error conditions have identical error documentation
- Parameter descriptions are identical across endpoints that accept different parameter sets

### Why It Is Harmful
Consumers reading copy-pasted descriptions cannot distinguish between endpoints efficiently. They must compare descriptions line-by-line to find the one difference. The repeated text also creates maintenance issues: updating one endpoint's behavior requires updating multiple descriptions, and teams inevitably miss some.

### Real-World Consequences
A consumer needs to find the endpoint that accepts a `filter` parameter. The list, search, and export endpoints all have nearly identical descriptions: "Returns users based on the specified criteria." The consumer must open each endpoint's parameter list to discover that only the export endpoint supports `filter`. They waste 20 minutes across the three endpoints.

### Preferred Alternative
Write unique descriptions for each endpoint that highlight what makes it different from related endpoints. Use the five-question model to ensure coverage while avoiding duplication.

### Refactoring Strategy
1. Identify all documentation groups with copy-pasted descriptions
2. For each group, list the behavioral differences between endpoints
3. Highlight each endpoint's unique capability in the first sentence of its description
4. Use a "Differs from X endpoint in that..." style for the second sentence
5. Add a PR review checklist item: "Verify endpoint descriptions are unique and distinct"

### Detection Checklist
- [ ] Compare descriptions across endpoints in the same resource group
- [ ] Highlight identical text blocks across multiple endpoint docs
- [ ] Verify parameter descriptions differ where parameter sets differ
- [ ] Confirm error documentation reflects each endpoint's unique error conditions

### Related Rules
- Answer All Five Questions Per Endpoint (05-rules.md)
- Write From Consumer Perspective Not Implementation Perspective (05-rules.md)

### Related Skills
- Document Endpoint Content (06-skills.md)

### Related Decision Trees
- Documentation Depth — Summary-Only vs Full Five-Question Model (07-decision-trees.md)

---

## Anti-Pattern 4: Terse Or Missing Descriptions

### Category
Documentation

### Description
Providing only a summary (one-line title) for each endpoint with no description, leaving consumers guessing about behavior, side effects, preconditions, and limitations.

### Why It Happens
Summaries are required by OpenAPI. Descriptions are optional. Auto-generation tools (Scramble) generate summaries from route names but not descriptions. Teams accept the default output without supplementing it.

### Warning Signs
- Endpoint has `summary` but no `description` field
- Summary is the only human-readable text in an endpoint definition
- Parameters lack individual descriptions
- Response codes have no description
- Consumer questions about endpoint behavior are common in support channels

### Why It Is Harmful
A summary alone cannot convey sufficient information for integration. Consumers must guess at behavior: Is this endpoint idempotent? Does it send emails? What are the side effects? Does it require specific scopes? Ambiguity drives support tickets and integration errors. Every missing description is a gap that a consumer must fill through experimentation or support requests.

### Real-World Consequences
A summary says "Create user." The consumer assumes it just inserts a database record. They POST with a name and email. The endpoint also sends a welcome email, checks for duplicate accounts, and rate-limits per IP. The consumer is surprised by the email, locked out by the rate limit, and confused by the duplicate check error. All of this would have been clear with a 3-sentence description.

### Preferred Alternative
Always provide a description alongside the summary. The description should answer: What does this endpoint do? When should consumers use it? What are the preconditions and side effects? Are there any rate limits or restrictions?

### Refactoring Strategy
1. Audit all endpoints for missing descriptions
2. For each endpoint with a summary only, write a 2-5 sentence description
3. Include side effects, idempotency notes, rate limits, and scope requirements
4. For auto-generated docs, add a post-generation step that injects curated descriptions
5. Add a CI lint rule that requires a minimum description length

### Detection Checklist
- [ ] Count endpoints with `description` field empty or missing
- [ ] Verify descriptions exceed 10-word minimum
- [ ] Confirm descriptions mention side effects where applicable
- [ ] Check that rate limits and scope requirements appear in endpoint descriptions

### Related Rules
- Answer All Five Questions Per Endpoint (05-rules.md)
- Document Every Realistic HTTP Status Code (05-rules.md)

### Related Skills
- Document Endpoint Content (06-skills.md)

### Related Decision Trees
- Documentation Depth — Summary-Only vs Full Five-Question Model (07-decision-trees.md)

---

## Anti-Pattern 5: Stale Examples That Mismatch Current Schema

### Category
Maintainability

### Description
Request and response examples that reference fields, types, or formats that no longer exist in the current schema, causing consumer copy-paste integrations to fail immediately.

### Why It Happens
Examples are written once during initial endpoint documentation. Schema evolves — fields are renamed, types change, formats are updated — but examples are not updated in sync. Manual documentation updates always deprioritize examples, which are viewed as "nice to have" rather than essential.

### Warning Signs
- Example payloads reference field names that don't exist in the current schema
- Example values have wrong types (number where string is expected, etc.)
- Consumers report "the example doesn't work" in support tickets
- Example responses include fields that have been removed from the schema
- Copy-pasting an example request produces a 422 validation error

### Why It Is Harmful
Developers building integrations start by copy-pasting examples. When examples fail, the first integration experience is a failure. Trust erodes immediately: if the simplest example doesn't work, how can the consumer trust the rest of the documentation? Stale examples are the most visible symptom of documentation neglect.

### Real-World Consequences
The User schema renamed `full_name` to `display_name` three months ago. The endpoint example still shows `full_name: "John Doe"`. A new integration developer copies the example into a POST request. The API returns 422: "The full_name field is disallowed." The developer assumes the API is broken and files a ticket. The support team spends 15 minutes tracing the issue to the stale example.

### Preferred Alternative
Keep examples synchronized with schemas by validating examples against schemas in CI and regenerating or updating examples whenever schemas change.

### Refactoring Strategy
1. Audit all endpoint examples against current schemas
2. Fix any examples with missing, extra, or wrong-type fields
3. Add CI validation that checks examples against their referenced schemas
4. Include example updates in the PR checklist whenever a schema changes
5. For auto-generated docs, configure the generator to produce examples from schemas automatically

### Detection Checklist
- [ ] Check example field names against current schema property names
- [ ] Verify example value types match schema types
- [ ] Confirm example response fields match the response schema
- [ ] Validate that copy-pasting an example request produces a successful response
- [ ] Add CI rule that fails if examples do not validate against schemas

### Related Rules
- Provide Real Copy-Pasteable Request And Response Examples (05-rules.md)
- Never Document Internal Implementation Details (05-rules.md)

### Related Skills
- Document Endpoint Content (06-skills.md)

### Related Decision Trees
- Documentation Depth — Summary-Only vs Full Five-Question Model (07-decision-trees.md)

---

