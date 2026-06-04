# Decision Trees — Conditional Relationships

---

## Decision: whenLoaded vs Direct Access for Relationships

---

## Decision Context

Should a relationship in a resource be guarded by `whenLoaded()` or accessed directly?

---

## Decision Criteria

* **Loading guarantee:** Is this relationship always eager-loaded by every controller?
* **N+1 risk:** How many items could appear in a collection using this resource?
* **Defense posture:** How important is preventing accidental lazy loading?

---

## Decision Tree

Need to access a relationship in a resource?

↓

Is this relationship guaranteed to be eager-loaded by every controller that uses this resource?

YES → Can you guarantee this through code (model `$with` property, base controller) rather than discipline?

    YES → Direct access is acceptable — `$this->posts` — the data is always loaded

    NO → Use `whenLoaded()` defensively — prevents N+1 if a future controller forgets to load

NO → Will this resource ever be used in a collection (multiple items)?

    YES → Use `whenLoaded()` — mandatory. An unguarded relation in a 100-item collection = 101 queries

    NO → Use `whenLoaded()` — single item or collection, the defense is free and prevents future regression

---

## Rationale

`whenLoaded()` is zero-cost when the relation is loaded (it returns the collection/model directly) and prevents N+1 when the relation is not loaded (it returns `MissingValue`). There is almost no reason to skip it — the only exception is when the relationship is unconditionally loaded and the developer wants the field to always appear. Even then, `whenLoaded()` defends against future refactoring mistakes at zero runtime cost.

---

## Recommended Default

**Default:** Always use `whenLoaded()` for every relationship access in every resource
**Reason:** Zero cost when loaded; N+1 prevention when not loaded; defense against future controller mistakes

---

## Risks Of Wrong Choice

A single unguarded `$this->posts` in a resource used for a collection of 100 users produces 101 queries instead of 2 (initial query + eager load). This is the most common performance bug in Laravel API Resources and is invisible in development (where datasets are small) but catastrophic at scale.

---

## Related Rules

* Rule: Always Use whenLoaded for Every Relationship Access (conditional-relationships/05-rules.md)
* Rule: Document Required Eager Loads in the Resource Class (conditional-relationships/05-rules.md)

---

## Related Skills

* Add Conditional Relationships to an API Resource (conditional-relationships/06-skills.md)
* Resource Fundamentals (resource-fundamentals/06-skills.md)

---

---

## Decision: whenCounted vs whenAggregated for Relationship Summary Values

---

## Decision Context

Should you use `whenCounted()` for relationship counts or `whenAggregated()` for custom aggregate values?

---

## Decision Criteria

* **Aggregate type:** Is the value a simple count or a custom aggregate (sum, avg, min, max)?
* **Naming collision:** Does the model have an accessor that collides with the `_count` suffix?
* **Controller pairing:** Which aggregate method does the controller use?

---

## Decision Tree

Need to show a relationship summary value (count, sum, average)?

↓

Is the value a simple count of related records?

YES → Does the model have an accessor matching `{relation}_count` (e.g., `postsCount` / `getPostsCountAttribute`)?

    YES → Use `whenAggregated` with an explicit alias — avoids accessor collision

    NO → Use `whenCounted('posts')` — simplest, pairs with `withCount('posts')` in controller

NO → Is the value a custom aggregate (sum of `amount`, average rating, minimum price)?

    YES → Use `whenAggregated('orders', 'sum', 'amount')` — pairs with `withAggregate('orders', 'sum(amount) as total_revenue')` in controller

---

## Rationale

`whenCounted` is syntactic sugar for the most common case (counting related records) and expects the default `_count` suffix. `whenAggregated` provides explicit control over the aggregate function and column. Use `whenCounted` for simplicity when there is no naming conflict; use `whenAggregated` for anything beyond a simple count or when aliasing is needed.

---

## Recommended Default

**Default:** Use `whenCounted('relation')` for simple counts; `whenAggregated()` for any custom aggregate or when aliasing to avoid accessor collisions
**Reason:** `whenCounted` is simpler and pairs naturally with `withCount`; `whenAggregated` is needed only when you need sum/avg/min/max or explicit aliasing

---

## Risks Of Wrong Choice

Using `whenCounted` when the model has a `postsCount` accessor creates ambiguity — the response field's provenance is unclear. Using `whenAggregated` for a simple count adds unnecessary verbosity. The real risk is forgetting the controller pairing: `whenCounted('posts')` without `withCount('posts')` silently omits the field.

---

## Related Rules

* Rule: Pair whenCounted with withCount and whenAggregated with withAggregate (conditional-relationships/05-rules.md)
* Rule: Use Explicit Aggregate Aliasing to Avoid Accessor Collisions (conditional-relationships/05-rules.md)

---

## Related Skills

* Add Conditional Relationships to an API Resource (conditional-relationships/06-skills.md)
* Resource Fundamentals (resource-fundamentals/06-skills.md)

---

---

## Decision: Relationship Loading Strategy — Shallow vs Deep per Endpoint

---

## Decision Context

Should the controller load a relationship for a given endpoint, or should the field silently be omitted?

---

## Decision Criteria

* **Endpoint depth:** Does this endpoint need the relationship data?
* **Performance budget:** Is the extra query acceptable for this endpoint's traffic?
* **Client expectation:** Does the client always need this relationship?

---

## Decision Tree

Need to decide whether to load a relationship for an endpoint?

↓

Is the relationship needed by the response at this endpoint?

YES → Load it in the controller: `User::with('posts')->paginate()`

NO → Does the client sometimes request this relationship via an `include` parameter?

    YES → Load conditionally based on the `include` parameter: `$user->when($request->has('include'), fn($q) => $q->with('posts'))`

    NO → Do NOT load it — let `whenLoaded()` omit the field. The relationship is not relevant to this endpoint.

---

## Rationale

The controller controls the query strategy. If a relationship is needed, eager load it. If it is optional (per-endpoint or per-request), load it conditionally. If it is not needed at all, do not load it. The resource's `whenLoaded()` gracefully handles all three cases — the field appears when loaded, disappears when not. This decouples the controller's loading decision from the resource's formatting logic.

---

## Recommended Default

**Default:** Eager-load only what the endpoint needs; use `whenLoaded()` in the resource to handle both loaded and unloaded states
**Reason:** The controller should never load data the client does not need; the resource should gracefully handle both states

---

## Risks Of Wrong Choice

Loading every possible relationship on every endpoint wastes database resources and increases response time. Loading nothing and relying on lazy loading causes N+1 queries. The correct balance is endpoint-specific loading with `whenLoaded()` guarding in the resource.

---

## Related Rules

* Rule: Controllers Must Eager-Load Every Relationship the Resource Uses (conditional-relationships/05-rules.md)
* Rule: Test Both Loaded and Unloaded States (conditional-relationships/05-rules.md)

---

## Related Skills

* Add Conditional Relationships to an API Resource (conditional-relationships/06-skills.md)
* Resource Testing (resource-testing/06-skills.md)
