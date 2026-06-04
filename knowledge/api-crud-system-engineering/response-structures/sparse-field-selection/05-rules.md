# Rules: Sparse Field Selection

## Rule: Define Explicit Field Allowlist
- **Condition:** When implementing sparse field selection
- **Action:** Define an allowlist of selectable fields per resource. Never expose all model attributes.
- **Consequence:** Sensitive fields are never exposed; field selection is predictable.
- **Enforcement:** Integration tests verify unknown field requests are rejected.

## Rule: Use Resource-Type Scoped Field Parameters
- **Condition:** When defining field selection parameter format
- **Action:** Use `?fields[resource_type]=field1,field2` format. Scope fields to resource type for multi-resource responses.
- **Consequence:** Clear which fields apply to which resource; JSON:API compatible.
- **Enforcement:** API style guide documents field parameter format.

## Rule: Validate Field Names
- **Condition:** When processing field selection parameters
- **Action:** Validate field names against the allowlist. Return 422 for unknown field names.
- **Consequence:** Consumers receive clear error for invalid field requests.
- **Enforcement:** Form Request validation covers field parameter validation.

## Rule: Default To All Allowed Fields
- **Condition:** When no field selection is specified
- **Action:** Return all allowed fields by default. Sparse fieldsets are opt-in reduction.
- **Consequence:** Clients that don't use sparse fieldsets receive complete responses.
- **Enforcement:** Integration tests verify full response when no fields parameter is provided.

## Rule: Never Use Sparse Fieldsets For Access Control
- **Condition:** When designing field selection
- **Action:** Exclude sensitive fields from the allowlist entirely. Don't rely on clients not selecting them.
- **Consequence:** Sensitive fields are never accessible via the API.
- **Enforcement:** Security review verifies sensitive fields are not in the allowlist.
