# Decision Trees — JSON:API Resources

---

## Decision: JsonApiResource vs JsonResource

---

## Decision Context

Should a resource extend `JsonApiResource` (JSON:API spec) or `JsonResource` (standard)?

---

## Decision Criteria

* **API consumers:** Is the API public, consumed by third parties?
* **Spec compliance:** Is JSON:API compliance a requirement?
* **Client diversity:** Is the API consumed by multiple client types?
* **Team proficiency:** Is the team familiar with the JSON:API spec?

---

## Decision Tree

Need to create a new resource?

↓

Is this a public API consumed by third parties requiring standardized responses?

YES → Is the team familiar with the JSON:API specification?

    YES → Use `JsonApiResource` — `type`, `id`, `attributes`, `relationships`, `links`

    NO → Use `JsonResource` with consistent conventions — JSON:API learning curve is steep

NO → Is this a large API (>10 resources) with many related resources?

    YES → Consider `JsonApiResource` — compound documents simplify client data fetching

    NO → Is this a BFF or single-client internal API?

        YES → Use `JsonResource` — JSON:API overhead adds little value

        NO → Use `JsonResource` — simpler for standard APIs

---

## Rationale

`JsonApiResource` enforces the JSON:API structure (type, id, attributes, relationships, links) and provides built-in include handling and sparse fieldsets. It is the right choice when spec compliance matters (public APIs, third-party consumers) or when the API has complex relationships that benefit from compound documents. For simple CRUD or internal APIs, `JsonResource` is simpler and has less overhead.

---

## Recommended Default

**Default:** Use `JsonResource` for most APIs; use `JsonApiResource` only when JSON:API compliance is a documented requirement
**Reason:** `JsonApiResource` adds structural constraints (type, id as string, relationship closures) that require team familiarity with the spec; `JsonResource` is universally understood

---

## Risks Of Wrong Choice

Using `JsonApiResource` without team spec knowledge leads to subtle spec violations (non-string IDs, non-closure relationships). Using `JsonResource` for a public API that advertised JSON:API compliance requires manual implementation of include handling, sparse fieldsets, and relationship linking — duplicating what `JsonApiResource` provides.

---

## Related Rules

* Rule: Use JsonApiResource for JSON:API Compliance (json-api-resources/05-rules.md)
* Rule: Always Return Closures from toRelationships (json-api-resources/05-rules.md)

---

## Related Skills

* Build a JSON:API-Compliant Resource (json-api-resources/06-skills.md)
* Resource Fundamentals (resource-fundamentals/06-skills.md)

---

---

## Decision: Whitelist Includes vs Allow All Includes

---

## Decision Context

Should the controller validate `include` parameters against a whitelist, or allow clients to include any relationship?

---

## Decision Criteria

* **Security:** Are some relationships sensitive or internal?
* **Performance:** Could arbitrary includes cause N+1 or deep joins?
* **API surface:** Does the API document which includes are supported?

---

## Decision Tree

Need to handle `include` parameters?

↓

Are some relationships internal-only (not intended for API consumption)?

YES → Whitelist allows only — reject unlisted includes with 400 error or silently remove them

NO → Could arbitrary includes cause performance degradation (deep joins, unindexed relations)?

    YES → Whitelist allows only — cap include count and depth (max 5 includes, max 3 levels deep)

    NO → Is this an internal API where all relationships are safe and performance impact is understood?

        YES → Allow all — no validation needed

        NO → Whitelist allows only — the safe default

---

## Rationale

Unvalidated `include` parameters are a security and performance risk. Clients can request arbitrary relationships, potentially exposing non-public data or triggering expensive joins on unindexed columns. Even for public relationships, arbitrary depth (e.g., `posts.comments.author.profile.settings`) can produce massive compound documents. A whitelist makes the supported include surface explicit and safe.

---

## Recommended Default

**Default:** Always validate `include` parameters against a whitelist with depth and count limits
**Reason:** The cost of parsing and validating is negligible; the risk of unvalidated includes is data exposure and performance degradation

---

## Risks Of Wrong Choice

Allowing arbitrary includes opens a DoS vector (client requests `posts.comments.author.posts.comments...` infinitely), exposes non-public relationships, and makes the API surface unpredictable. Whitelisting is trivial to implement and prevents all these issues.

---

## Related Rules

* Rule: Validate Include Parameters Against a Whitelist (json-api-resources/05-rules.md)
* Rule: Limit Include Depth and Count (json-api-resources/05-rules.md)

---

## Related Skills

* Build a JSON:API-Compliant Resource (json-api-resources/06-skills.md)
* Conditional Relationships (conditional-relationships/06-skills.md)

---

---

## Decision: Copy-and-Modify vs Closure Relationships in toRelationships

---

## Decision Context

Should `toRelationships()` return resolved collections/models or closures wrapping them?

---

## Decision Criteria

* **Lazy evaluation:** Should the relationship only resolve when included?
* **Consistency:** Is the pattern always closures, making it a team convention?

---

## Decision Tree

Need to return a relationship from `toRelationships()`?

↓

Always return closures — always `fn() => PostResource::collection($this->whenLoaded('posts'))`

Never return resolved values directly.

---

## Rationale

This is not a real decision — closures are mandatory for `toRelationships()`. They ensure lazy evaluation: the relationship data is only resolved when the client includes it via the `include` parameter. Returning resolved values defeats this optimization and runs the relationship resolution on every request.

---

## Recommended Default

**Default:** Always wrap every relationship in `toRelationships()` as a closure
**Reason:** This is a framework requirement, not an engineering choice; closure wrapping is the only correct implementation

---

## Risks Of Wrong Choice

Returning `PostResource::collection($this->posts)` from `toRelationships()` resolves the relationship on every request, even when the client never includes it. This wastes the primary performance benefit of JSON:API — lazy relationship inclusion.

---

## Related Rules

* Rule: Always Return Closures from toRelationships (json-api-resources/05-rules.md)

---

## Related Skills

* Build a JSON:API-Compliant Resource (json-api-resources/06-skills.md)
