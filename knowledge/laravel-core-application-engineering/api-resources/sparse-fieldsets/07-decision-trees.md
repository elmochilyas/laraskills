# Decision Trees — Sparse Fieldsets

---

## Decision: Response-Level Filtering vs Database-Level Field Selection

---

## Decision Context

Should sparse fieldset filtering happen only at the response level (in the resource's `toArray()`) or also at the database level (in the controller's query)?

---

## Decision Criteria

* **Dataset size:** How many rows are typically returned?
* **Bandwidth savings:** How much response size reduction matters?
* **Relationship needs:** Does Eloquent need primary/foreign keys for relationship resolution?

---

## Decision Tree

Need to implement sparse fieldset filtering?

↓

Is the dataset typically small (< 100 rows per response)?

YES → Response-level filtering only — `array_intersect_key()` in `toArray()` is sufficient

NO → Is the response size reduction critical (mobile API, bandwidth-constrained)?

    YES → Add database-level selection — always include primary keys, foreign keys in select statement

    NO → Does the endpoint return 1000+ rows regularly?

        YES → Add database-level selection — reduces database-to-app transfer, meaningful savings

        NO → Response-level filtering is sufficient — `array_intersect_key()` is O(n), negligible cost

---

## Rationale

Response-level filtering (`array_intersect_key`) is cheap and always necessary — it ensures the response only contains requested fields regardless of what the database returns. Database-level selection (`Model::select()`) adds performance benefit by reducing data transfer from the database to the application server. For small datasets, the database-level optimization adds complexity without meaningful benefit. For large datasets, it reduces memory and transfer time.

---

## Recommended Default

**Default:** Implement response-level filtering always; add database-level selection only for large datasets
**Reason:** Response-level filtering is mandatory for correctness; database-level is an optimization, not a requirement

---

## Risks Of Wrong Choice

Database-level selection without including primary and foreign keys breaks Eloquent relationships. Response-level filtering alone on a 10K-row response wastes database-to-app transfer bandwidth. Neither is wrong per se, but each has specific applicability.

---

## Related Rules

* Rule: Always Include Primary and Foreign Keys in Database Selection (sparse-fieldsets/05-rules.md)
* Rule: Always Include Identifier Fields Regardless of Sparse Fieldset (sparse-fieldsets/05-rules.md)

---

## Related Skills

* Implement Sparse Fieldsets for a Resource (sparse-fieldsets/06-skills.md)
* JSON:API Resources (json-api-resources/06-skills.md)

---

---

## Decision: Reject vs Silently Ignore Invalid Field Names

---

## Decision Context

When a client requests a field name that does not exist on the resource, should the server reject the request (400 error) or silently ignore the invalid field?

---

## Decision Criteria

* **API maturity:** Is the API public with many consumers?
* **Client development feedback:** Do you want clients to know immediately when they use wrong field names?

---

## Decision Tree

Client requests a field that does not exist in the allowed list?

↓

Is this a public API where clients need clear feedback during development?

YES → Reject with 400 error — "Invalid fields for users: 'invalid_field'" — immediate, clear feedback

NO → Is this an internal API where field names may change without notice?

    NO → Reject with 400 error — invalid field names always indicate a client bug

    YES → Silently ignore — future field removals won't break existing internal clients

---

## Rationale

Rejecting invalid fields with a 400 error provides immediate feedback to client developers that they are using wrong field names. This prevents silent bugs where clients request non-existent fields and receive incomplete data. Silently ignoring invalid fields is only appropriate for internal APIs where field names may evolve without versioning and clients should not depend on specific field existence.

---

## Recommended Default

**Default:** Reject invalid fields with a 400 error — catches client bugs early, provides clear feedback
**Reason:** Silent omission of invalid fields hides bugs; the server should validate client input

---

## Risks Of Wrong Choice

Silently ignoring invalid fields means the client receives fewer fields than expected without any error indication. The client may miss critical data and not realize the field name was wrong. Rejecting with a 400 gives clear, immediate feedback.

---

## Related Rules

* Rule: Validate Requested Field Names Against an Allowed List (sparse-fieldsets/05-rules.md)
* Rule: Validate Before Passing to Database select() (sparse-fieldsets/05-rules.md)

---

## Related Skills

* Implement Sparse Fieldsets for a Resource (sparse-fieldsets/06-skills.md)
* Resource Fundamentals (resource-fundamentals/06-skills.md)

---

---

## Decision: Default Field Set Composition

---

## Decision Context

What fields should the resource return when the client does not specify a sparse fieldset?

---

## Decision Criteria

* **Common use case:** What fields do most clients need?
* **Performance:** Should the default be minimal (small response) or complete (all safe fields)?

---

## Decision Tree

Need to define the default field set?

↓

Does the API serve mobile clients where response size is critical?

YES → Curate a minimal default set — only fields used by the primary mobile interface

NO → Does the API serve multiple client types (web + mobile + third-party)?

    YES → Curate a balanced default set — core identity fields + commonly used data fields

    NO → Return all safe fields by default — clients that need fewer can use sparse fieldsets

---

## Rationale

The default field set should match the most common use case. For mobile clients with limited bandwidth, a minimal default (id, name, core fields) reduces data transfer for the majority of requests. For web or third-party APIs, returning all safe fields is more forgiving — clients that do not use sparse fieldsets still get complete data.

---

## Recommended Default

**Default:** Return all safe fields by default; curate a minimal set only when bandwidth is a primary concern
**Reason:** Returning all fields is the most predictable behavior; sparse fieldsets exist for clients that want to be selective

---

## Risks Of Wrong Choice

An overly minimal default set breaks clients that do not use sparse fieldsets — they receive incomplete data. An overly complete default set wastes bandwidth for mobile clients. The default must balance inclusivity with efficiency.

---

## Related Rules

* Rule: Provide a Sensible Default Field Set (sparse-fieldsets/05-rules.md)
* Rule: Never Use Sparse Fieldsets as Authorization (sparse-fieldsets/05-rules.md)

---

## Related Skills

* Implement Sparse Fieldsets for a Resource (sparse-fieldsets/06-skills.md)
* Resource Fundamentals (resource-fundamentals/06-skills.md)
