# ECC Anti-Patterns — JSON:API Resources

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | API Resources |
| **Knowledge Unit** | JSON:API Resources |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Unvalidated `include` Parameters (N+1 via Arbitrary Includes)
2. Eagerly Resolved Relationships in `toRelationships()`
3. Circular Includes (Self-Referencing Resource Graph)
4. Using JSON:API for Simple Internal APIs (Overkill)

---

## Repository-Wide Anti-Patterns

- Overengineering (JSON:API specification for internal BFF APIs)
- N+1 Query Problem (via unvalidated includes)

---

## Anti-Pattern 1: Unvalidated `include` Parameters

### Category
Security | Performance

### Description
Allowing clients to include any relationship via `?include=...` without whitelist validation, enabling N+1 queries and exposing non-public relations.

### Why It Happens
The `include` feature is implemented without validation because "the client should be able to include whatever it needs."

### Warning Signs
- Any relationship name in `?include=` is accepted
- Deep includes like `include=posts.comments.author.profile` execute without limit
- Non-public relations are included and exposed

### Preferred Alternative
Whitelist allowed includes. Reject invalid include values with 400.

### Related Rules
- Rule: Validate `include` Parameters Against a Whitelist

---

## Anti-Pattern 2: Eagerly Resolved Relationships in `toRelationships()`

### Category
Performance

### Description
Returning resolved resource instances instead of closures in `toRelationships()`, causing relationship data to resolve even when not included.

### Why It Happens
Developers return `PostResource::collection($this->posts)` directly instead of `fn() => PostResource::collection($this->posts)`.

### Warning Signs
- `toRelationships()` returns resolved values, not closures
- Performance degrades when `include` parameter is not used
- Relationship data is computed even when not requested

### Preferred Alternative
Always use closures in `toRelationships()` for lazy evaluation.

### Related Rules
- Rule: Use Closures in `toRelationships()` for Lazy Evaluation
