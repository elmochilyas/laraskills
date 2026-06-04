# Rules: Include Related Resources

## Rule: Use Explicit Include Allowlist
- **Condition:** When implementing `?include=` functionality
- **Action:** Define an explicit allowlist of includable relationships per resource. Reject unknown include values.
- **Consequence:** Prevents relationship enumeration and expensive query loading.
- **Enforcement:** Integration tests verify unknown includes are rejected.

## Rule: Eager Load Included Relationships In Controller
- **Condition:** When processing include parameters
- **Action:** Apply `->with($validatedIncludes)` to the query before pagination. Load relationships eagerly.
- **Consequence:** N+1 queries are prevented; relationship data is available in resources.
- **Enforcement:** Review ensures includes are loaded before pagination.

## Rule: Use whenLoaded() For All Includable Relationships
- **Condition:** In API resources with includable relationships
- **Action:** Access relationships using `$this->whenLoaded('relationship')` only. Never access relationships directly.
- **Consequence:** Resources gracefully handle unloaded relationships.
- **Enforcement:** Review flags direct relationship access for includable relationships.

## Rule: Limit Include Nesting Depth
- **Condition:** When supporting nested includes
- **Action:** Limit nesting depth to 2 levels maximum (e.g., `posts.comments` but not `posts.comments.user`).
- **Consequence:** Prevents exponential query growth from deep includes.
- **Enforcement:** Include parser enforces depth limit.

## Rule: Validate Include Parameters
- **Condition:** When accepting include parameters from clients
- **Action:** Validate include parameter values against the allowlist. Return 422 for invalid values.
- **Consequence:** Clients receive clear error for invalid include requests.
- **Enforcement:** Form Request validation covers include parameter validation.
