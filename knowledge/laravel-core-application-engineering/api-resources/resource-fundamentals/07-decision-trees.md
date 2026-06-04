# Decision Trees — Resource Fundamentals

---

## Decision: Single Resource vs Per-Endpoint Resources

---

## Decision Context

Should you use one resource class per model, or separate resource classes per endpoint (list, detail, admin)?

---

## Decision Criteria

* **Field set variation:** How much does the field set differ between endpoints?
* **Conditional complexity:** Would a single resource need excessive conditionals?
* **Testability:** Can each endpoint response be tested independently?
* **Maintenance:** How many endpoints need to change when the schema changes?

---

## Decision Tree

Need to decide between one resource or per-endpoint resources?

↓

Does the same entity return significantly different field sets across endpoints (list vs detail vs admin)?

YES → Create separate resources per endpoint (`UserListResource`, `UserDetailResource`, `AdminUserResource`)

NO → Is the difference only 1-2 conditional fields?

    YES → Use a single resource with `when()` conditionals — acceptable for small differences

    NO → Use a single resource — all endpoints return the same field set

---

## Rationale

Per-endpoint resources make each endpoint's contract explicit and independently testable. A single resource with many conditionals becomes unreadable and has combinatorial test complexity (2^n combinations). The threshold is 1-2 conditional fields — beyond that, separate resources are cleaner.

---

## Recommended Default

**Default:** One resource per model for simple CRUD; per-endpoint resources when shape varies significantly
**Reason:** Avoids premature class proliferation while maintaining clarity when contracts diverge

---

## Risks Of Wrong Choice

A god resource with 10 conditional fields is impossible to test (2^10 = 1024 combinations) and breaks in unpredictable ways. Per-endpoint resources for every endpoint create unnecessary file duplication when the shape is identical.

---

## Related Rules

* Rule: Use Per-Endpoint Resources When Shape Varies Significantly (resource-fundamentals/05-rules.md)
* Rule: Keep toArray as Pure Transformation — No Business Logic (resource-fundamentals/05-rules.md)

---

## Related Skills

* Create an API Resource (resource-fundamentals/06-skills.md)
* Resource Organization (resource-organization/06-skills.md)

---

---

## Decision: Resource Naming — Match Model Name or API Resource Name

---

## Decision Context

Should a resource class be named after the underlying Eloquent model or the API resource name the client sees?

---

## Decision Criteria

* **API contract decoupling:** Does the API resource name differ from the model name?
* **Client perspective:** What does the API documentation call this resource?
* **Internal refactoring:** Will renaming the model break the API contract?

---

## Decision Tree

Need to name a resource class?

↓

Does the API expose this resource under a different name than the model (e.g., "profiles" from `User` model)?

YES → Name the resource after the API resource name (`ProfileResource`)

NO → Does the API resource name match the model name exactly?

    YES → Name after the model (`UserResource` for `User` model)

    NO → Name after the API resource name — the client contract is what matters

---

## Rationale

The resource is the API contract — it should be named for the consumer, not the internal implementation. If the API exposes "profiles," the resource should be `ProfileResource` even if it wraps a `User` model. This decouples the API contract from the database schema and allows model refactoring without API changes.

---

## Recommended Default

**Default:** Name resources after API resource names (what the client sees), not model names
**Reason:** Decouples the API contract from the internal schema; survives model refactoring

---

## Risks Of Wrong Choice

Naming `UserResource` when the API exposes "profiles" creates confusion between the model and the API contract. Developers updating the API docs reference "profiles" but search for `UserResource`, creating a mental mapping burden.

---

## Related Rules

* Rule: Match Resource Names to API Resource Names, Not Model Names (resource-fundamentals/05-rules.md)
* Rule: Always Explicitly List Every Field in toArray (resource-fundamentals/05-rules.md)

---

## Related Skills

* Create an API Resource (resource-fundamentals/06-skills.md)

---

---

## Decision: Relationship Exposition Strategy — whenLoaded vs Always Load

---

## Decision Context

How should resources expose related data — conditionally only when loaded, or always with eager loading guaranteed?

---

## Decision Criteria

* **Performance:** N+1 queries from lazy loading
* **Endpoint consistency:** Should all responses from an endpoint include the relationship?
* **Client expectations:** Does the client always need the related data?

---

## Decision Tree

Need to expose a relationship in a resource?

↓

Is the relationship needed by ALL responses from this endpoint (always loaded by the controller)?

YES → Expose directly — `'comments' => CommentResource::collection($this->comments)`

NO → Does the controller sometimes eager-load this relationship, sometimes not?

    YES → Use `whenLoaded()` — `CommentResource::collection($this->whenLoaded('comments'))`

    NO → Should the relationship be loaded on demand for specific requests?

        YES → Use `whenLoaded()` — controller decides per-request via `->with('comments')`

        NO → Omit the relationship from the resource entirely

---

## Rationale

`whenLoaded()` prevents N+1 queries by guarding relationship access — if the controller did not load the relationship, the resource does not access it, and no lazy query is triggered. Always-loaded relationships should be guaranteed by the controller and do not need `whenLoaded()`, but using it defensively costs nothing.

---

## Recommended Default

**Default:** Always use `whenLoaded()` for relationship access, even when the controller is expected to eager-load
**Reason:** Defensive — prevents N+1 if a future endpoint forgets to eager-load; zero performance cost when the relationship is loaded

---

## Risks Of Wrong Choice

Accessing a relationship without `whenLoaded()` and without guaranteed eager loading triggers N+1 — for a collection of 100 items, one unguarded relationship adds 100 extra queries. Lazy loading in a response is invisible in development and catastrophic at scale.

---

## Related Rules

* Rule: Never Access Relationships Without Eager Loading in Resources (resource-fundamentals/05-rules.md)
* Rule: Use Resources for All Public API Endpoints (resource-fundamentals/05-rules.md)

---

## Related Skills

* Create an API Resource (resource-fundamentals/06-skills.md)
* Conditional Relationships (conditional-relationships/06-skills.md)
