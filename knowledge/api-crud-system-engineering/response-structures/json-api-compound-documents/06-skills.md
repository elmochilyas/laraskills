# Skill: Include Related Resources as Compound Documents (JSON:API Includes)
## Purpose
Allow clients to request and receive related resources (e.g., post author, comments) in the same response payload using `?include=author,comments` — reducing N+1 requests.
## When To Use
Related resources that are frequently accessed together; when the client needs related data immediately (not lazy-loaded); to reduce API call count from the client.
## When NOT To Use
Deeply nested includes (limit to 1-2 levels); unrelated resources that have no relation; always-eager-loaded relationships (use default eager loading).
## Prerequisites
Laravel API Resources; Eloquent Relationships; JSON:API spec understanding (optional).
## Inputs
List of allowed include relationships; resource model with relations; API Resource classes for included resources.
## Workflow
1. Define an allowed includes whitelist (e.g., author, comments, tags)
2. In controller/index/show, parse `include` parameter and validate against whitelist
3. Use `with()` on the query to eager load the requested relations
4. Add an `included` key alongside `data` in the JSON response
5. In the API Resource, return only the requested relations in `included` via `->whenLoaded()`
6. Flatten included resources into a non-nested array (JSON:API-style) or nest under `included`
7. Limit include depth (e.g., allow `author` but not `author.comments`)
8. Return an error for invalid or disallowed include values
## Validation Checklist
- [ ] Include values are whitelisted — no raw relation names from user input
- [ ] Eager loading happens before pagination — no N+1
- [ ] `whenLoaded()` is used in the resource to conditionally include relations
- [ ] Include depth is limited (max 2 levels)
- [ ] Invalid include values return 400 error
- [ ] Included resources use their own API Resource class
- [ ] Response includes both `data` and `included` when includes are requested
- [ ] Default response (no include parameter) has no `included` key
- [ ] Multiple includes are comma-separated or array-format
## Common Failures
- Not whitelisting includes — user can embed any relation (security and performance risk)
- Including relations that aren't eager-loaded — N+1 on every serialization
- Deeply nested includes create massive responses and complex query graphs
- `whenLoaded()` not used — resource calls relation on unloaded relation
- Included resources don't use API Resources — raw model attributes exposed
- `included` key is present even when no includes are requested
## Decision Points
- JSON:API `included` key vs custom `_embedded` key
- Comma-separated (`?include=author,comments`) vs array notation (`?include[]=author`)
- Depth limit (1 level vs 2 levels vs configurable per endpoint)
## Performance/Security Considerations
Compound documents can get large (many included relations added). Limit the number of included resources per request. Security: whitelist only relation names that are safe to expose; never include unloaded or unauthorized relations.
## Related Rules/Skills
Conditional Aggregate Inclusion; Sparse Fieldset Design; Laravel API Resources; Resource Controller Response Selection.
## Success Criteria
Related resources are included on demand; eager loading prevents N+1; whitelist prevents invalid includes; response envelopes are consistent; performance degrades gracefully with number of includes.
