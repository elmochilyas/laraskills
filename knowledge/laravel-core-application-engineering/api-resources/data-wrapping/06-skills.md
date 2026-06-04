# Skill: Configure Data Wrapping for an API

## Purpose

Decide whether to wrap resource responses under a `data` key and implement the chosen wrapping strategy consistently across all endpoints in the same API version.

## When To Use

- Starting a new API and need to decide on wrapping strategy
- Migrating an existing API to a consistent wrapping format
- Adding pagination to an existing collection endpoint
- Aligning test wrapping configuration with production

## When NOT To Use

- When the API already has mixed wrapping — fix consistency first
- When nested resources need custom wrapping — only top-level wrapping applies
- When you need per-response wrapping variations — wrapping is a global or per-version decision

## Prerequisites

- A Laravel application with API resource classes
- Understanding of the `data` key default behavior
- Decision on whether the API should be wrapped or unwrapped

## Inputs

- API design specification (wrapped vs unwrapped)
- Resource classes that need wrapping configuration
- `AppServiceProvider` or version-specific service provider

## Workflow

1. Decide on the wrapping strategy for the API version:
   - **Wrapped**: Default — single resources in `data`, paginated collections get `data` + `links` + `meta`
   - **Unwrapped**: Call `JsonResource::withoutWrapping()` in `AppServiceProvider::boot()`
   - **Per-resource custom wrap**: Set `$wrap` property on individual resource classes
2. For unwrapped APIs, call `JsonResource::withoutWrapping()` globally — never rely on per-resource `$wrap = null`.
3. For per-resource custom wrapping, set `$wrap` only on resources returned as top-level responses (nested resources ignore `$wrap`).
4. Ensure all endpoints within the same API version use the same wrapping strategy.
5. Always wrap collection responses from the start (even without pagination) — an unwrapped collection returns a bare array that cannot later gain metadata without a breaking change.
6. Mirror the production wrapping configuration in the test base class `setUp()`.
7. Avoid bare JSON arrays as top-level responses for any endpoint that may later need metadata.
8. Use consistent `$wrap` keys for the same resource type across the entire API.

## Validation Checklist

- [ ] Wrapping choice is consistent across all endpoints in the same API version
- [ ] Collection responses are wrapped from the start (even without pagination)
- [ ] Test configuration mirrors production wrapping behavior
- [ ] No bare JSON arrays are used as top-level responses for list endpoints
- [ ] `$wrap` is not relied upon for nested resource formatting
- [ ] Wrapping behavior is documented in API docs
- [ ] Consistent `$wrap` keys are used for the same resource type

## Common Failures

- Forgetting `withoutWrapping()` in tests — production uses unwrapped but tests expect `data` key
- Collection without pagination returns bare array — adding pagination later breaks clients because format changes from array to object
- `$wrap` on nested resources — expecting a nested resource's custom `$wrap` to apply when only top-level wrapping takes effect
- Mixing wrapped and unwrapped responses in the same API version — clients cannot rely on a consistent response structure
- Inconsistent `$wrap` keys for the same resource type across different endpoints

## Decision Points

- **Wrapped vs unwrapped**: Wrap when top-level metadata (version, timestamps) is needed alongside data or when JSON:API compliance is required. Unwrap for simple REST APIs with no metadata needs or BFF APIs.
- **Global withoutWrapping vs per-resource $wrap**: Prefer global `withoutWrapping()` for unwrapped APIs. Use per-resource `$wrap` only when specific resources need custom wrapper keys.
- **Collection wrapping**: Always wrap collections from the start — even if not paginated today, the `data` key allows adding pagination metadata later without a breaking change.

## Performance Considerations

- Wrapping adds ~20 bytes per response (`"data":`) — for 100 items, ~2KB — negligible
- The wrap check is a single static property read — zero measurable overhead
- `withoutWrapping()` and `$wrap` have no impact on serialization performance

## Security Considerations

- Wrapping does not add security — it is a structural format decision
- Custom `$wrap` keys must not leak internal naming conventions (e.g., `$wrap = 'admin_secret_data'` hints at data nature)
- An unwrapped response that is a bare JSON array can be confused with other array responses — always distinguish response types clearly

## Related Rules

- Keep Wrapping Strategy Consistent Across All Endpoints (Architecture)
- Always Wrap Collection Responses from the Start (Scalability)
- Mirror Production Wrapping in Test Configuration (Testing)
- Never Rely on $wrap for Nested Resource Formatting (Design)
- Prefer Global withoutWrapping for Unwrapped APIs (Code Organization)
- Avoid Bare JSON Arrays as Top-Level Responses (Scalability)
- Use Consistent $wrap Keys Across the API (Design)

## Related Skills

- [Resource Fundamentals](../resource-fundamentals/06-skills.md)
- [Resource Collections](../resource-collections/06-skills.md)
- [Pagination Metadata](../pagination-metadata/06-skills.md)
- [Top-Level Meta Data](../top-level-meta-data/06-skills.md)

## Success Criteria

- All endpoints in the same API version use the same wrapping strategy
- Collection responses are always wrapped with a `data` key
- Test wrapping configuration exactly matches production
- No bare JSON arrays are returned for list endpoints
- Nested resources do not rely on `$wrap` for formatting
