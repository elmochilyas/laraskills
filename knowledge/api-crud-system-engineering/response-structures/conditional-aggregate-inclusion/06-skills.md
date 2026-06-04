# Skill: Conditionally Include Aggregate Data in Resource Responses
## Purpose
Add computed aggregates (comment count, like count, rating average) to API resource responses only when the client requests them — using query parameters or load flags — to avoid over-fetching on every request.
## When To Use
When aggregate data requires extra queries; when the aggregate is expensive to compute; when most clients don't need the aggregate; for listing endpoints where aggregates would N+1.
## When NOT To Use
Always-needed aggregates (include unconditionally); aggregates that are free (already loaded); admin-only endpoints (include unconditionally).
## Prerequisites
Laravel API Resources; Eloquent `withCount`, `withSum`, `loadCount`; conditional resource attributes.
## Inputs
Aggregate definitions (count, sum, avg, min, max); client request parameter (e.g., `?with[]=comments_count`); resource class.
## Workflow
1. Define allowed aggregate query parameters (e.g., `?with[]=comments_count&with[]=likes_count`)
2. In the controller/index action, parse the `with` parameter and whitelist against allowed aggregates
3. Use `withCount()` or eager load the relationships before paginating
4. In the API Resource, conditionally include the aggregate based on a flag or loaded relation
5. Use a `when()` condition on the resource attribute — skip if not loaded
6. Document which aggregates are available and their performance cost per aggregate
7. Always whitelist aggregates server-side — never pass raw relation names to `withCount()`
## Validation Checklist
- [ ] Aggregate parameters are validated against a server-side whitelist
- [ ] `withCount()` / `loadCount()` is used before serialization — not in the resource
- [ ] Resource uses `when($this->comments_count)` to conditionally include
- [ ] Default response does NOT include aggregates (must be requested)
- [ ] Whitelist is tested — invalid aggregate names return 400 or are silently ignored
- [ ] Multiple aggregates are aggregated into one query (`withCount(['comments', 'likes'])`)
- [ ] Performance impact of each aggregate is documented
## Common Failures
- Using `$this->whenLoaded()` for computed aggregates — `withCount` is not a loaded relation
- Passing raw user input to `withCount()` — SQL injection via relation name
- Including aggregates unconditionally in list endpoints — N+1 or extra queries on every request
- Not validating the `with` parameter — client requests nonexistent aggregate silently ignored
## Decision Points
- `?with[]=` parameter vs `?include=` parameter vs `?fields=` parameter
- Computed at query time (`withCount`) vs stored counter cache in DB
- Whitelist approach vs open-ended aggregates (whitelist is safer)
## Performance/Security Considerations
Each aggregate adds a subquery — limit the number of aggregates per request. Use counter caches for performance-critical aggregates. Security: always whitelist aggregate names — never pass user input to `withCount()` or `loadCount()`.
## Related Rules/Skills
Laravel API Resources; JSON:API Compound Documents; Resource Controller Response Selection; Sparse Fieldsets.
## Success Criteria
Aggregates are available via request parameter but excluded by default; whitelist prevents invalid aggregate names; resources conditionally include only loaded aggregates; no N+1 on list endpoints.
