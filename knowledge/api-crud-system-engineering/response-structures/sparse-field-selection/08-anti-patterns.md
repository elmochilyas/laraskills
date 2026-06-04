# Anti-Patterns: Sparse Field Selection

## Sensitive Fields In Allowlist
**Description:** Sensitive or private fields (SSN, internal notes, salary) are included in the sparse fieldset allowlist, making them selectable by any consumer.
**Why it happens:** Developers assume that since fields are not selected by default, they are not exposed — forgetting that clients can opt-in to any allowlisted field.
**Consequences:** Sensitive data is enumerable; any client can request sensitive fields; compliance violation.
**Better approach:** Sensitive fields should never appear in the allowlist or the default response. Exclude them entirely from the resource.

## No Allowlist (Wildcard Fields)
**Description:** Accepting any field name without validation, passing it through to the resource's `toArray()` and exposing the entire model.
**Why it happens:** Quick implementation without considering that wildcard field access exposes all model attributes.
**Consequences:** Full model (including `password`, `remember_token`, `internal_id`) is accessible via field selection.
**Better approach:** Explicit allowlist per resource. Only allow fields that are safe and commonly needed.

## Sparse Fieldsets As Authorization
**Description:** Using sparse field selection as the access control mechanism — hiding sensitive fields behind "not selected by default" instead of excluding them entirely.
**Why it happens:** Misunderstanding the purpose of sparse fieldsets. They are a bandwidth optimization, not an authorization mechanism.
**Consequences:** Any client that discovers the sensitive field name can request it via `fields[sensitive_data]=expose`.
**Better approach:** Authorization controls which resources a user can access. Sparse fieldsets control which fields of authorized resources are returned. Never conflate the two.

## Inconsistent Implementation
**Description:** Some resources support sparse fieldsets, others don't. The parameter names and behavior differ between endpoints.
**Why it happens:** Adding sparse fieldset support per-endpoint without a consistent framework or pattern.
**Consequences:** Clients cannot rely on sparse fieldsets across the API; every endpoint requires different parsing logic.
**Better approach:** Implement sparse fieldset consistently via a trait or middleware. Apply to all resources or none.

## No Documentation
**Description:** Sparse fieldsets are implemented but available fields per resource are not documented in the API spec.
**Why it happens:** Treating sparse fieldsets as an implementation detail rather than a public API feature.
**Consequences:** Clients don't know which fields are available; they don't use the feature; the optimization is wasted.
**Better approach:** Document available fields per resource in the OpenAPI schema. Include field names, types, and descriptions.

## Fields Not Reflected at Database Level
**Description:** Sparse fieldsets are filtered at the resource layer but the database query still selects all columns, defeating the performance purpose.
**Why it happens:** Only implementing response-level filtering without optimizing the database query.
**Consequences:** Response payload is smaller but database I/O and PHP memory are unchanged — the optimization is superficial.
**Better approach:** When implementing sparse fieldsets for performance, also select only the requested columns at the database level.
