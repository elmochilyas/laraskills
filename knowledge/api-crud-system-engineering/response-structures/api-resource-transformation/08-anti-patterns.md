# Anti-Patterns: API Resource Transformation

## God Resource
**Description:** A single resource class handles multiple output formats based on conditional logic, auth state, and request parameters — `toArray()` contains ten `$this->when()` calls for different contexts.
**Why it happens:** Developers try to avoid creating multiple resource classes, believing one class is simpler to maintain.
**Consequences:** Resource is hard to read; changing one output format risks breaking others; untestable branches.
**Better approach:** Separate resources per use case: `UserListResource`, `UserDetailResource`, `UserAdminResource`.

## Model Leakage
**Description:** Returning model attributes directly without transformation: `'name' => $this->name` when the model column is `full_name` or when internal IDs are exposed.
**Why it happens:** Developers return raw model data thinking "the consumer needs the data anyway."
**Consequences:** Changing a database column name breaks the API contract; internal structure is coupled to external consumers.
**Better approach:** Always map internal names to API field names. Use `'name' => $this->full_name` to abstract storage from presentation.

## N+1 In Resource
**Description:** Resource accesses `$this->comments` directly (not via `whenLoaded`), causing N+1 queries on every resource instance.
**Why it happens:** Developers don't realize the resource is called per-model and that each direct relationship access triggers a query.
**Consequences:** Collection endpoints with 100 items trigger 101 queries instead of 2.
**Better approach:** Always use `$this->whenLoaded('comments')` for relationship access. Eager load in controller.

## Business Logic In Resource
**Description:** Resource performs calculations, applies discounts, checks authorization, or queries the database in `toArray()`.
**Why it happens:** Convenience — the developer needs the computed value and places it where the output is built.
**Consequences:** Resources become untestable; logic runs on every serialization; side effects from resources are unpredictable.
**Better approach:** Resources transform data only. Move calculations to services/actions and pass computed values through.

## Conditional Overload
**Description:** A single `toArray()` has ten `$this->when()` conditions for different contexts, auth states, and optional fields, making the method unreadable.
**Why it happens:** Growing the same resource incrementally instead of splitting when complexity increases.
**Consequences:** Impossible to reason about what fields appear in which context; one buggy condition affects all consumers.
**Better approach:** Split into separate resource classes per context. Use composition (traits) for shared fields.

## Wrapping Everything
**Description:** Every response — even single-resource, non-paginated, and error responses — uses the `data` wrapper key when a bare body would suffice.
**Why it happens:** Applying the same envelope rule to every response without evaluating whether wrapping adds value.
**Consequences:** Unnecessary nesting; extra bytes on every response; clients must unwrap for single-resource endpoints that could return bare data.
**Better approach:** Use wrapping for collections and paginated responses. Use bare body for single resources or follow JSON:API spec consistently.
