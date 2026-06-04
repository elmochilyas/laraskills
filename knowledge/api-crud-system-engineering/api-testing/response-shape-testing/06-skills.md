# Skill: Assert Response Shape Before Content
## Purpose
Verify JSON response structure — keys, types, nesting, and optional fields — before asserting specific values to catch contract breaks early.
## When To Use
Every happy path test after status code check; contract verification before publishing API changes; regression testing for API Resource changes.
## When NOT To Use
Value assertions (use assertJson); error response structure (covered by Error Response Shape Testing); pagination-specific structure.
## Prerequisites
Happy Path Testing; Laravel API Resources; Pest Test Structure.
## Inputs
API endpoint URL; expected JSON shape definition (nested arrays with `*` wildcards); per-resource structure helpers.
## Workflow
1. Assert status code first (e.g. `assertOk()`)
2. Assert shape via `assertJsonStructure()` using wildcards (`*`) for collections
3. Assert specific values via `assertJsonFragment()` or `assertJson()`
4. Assert no unexpected keys via `assertJsonMissing()`
5. Repeat per API version with version-specific helpers
## Validation Checklist
- [ ] `assertJsonStructure` is called before value assertions
- [ ] `*` wildcard is used on all collection endpoints
- [ ] Per-resource-type structure helpers are defined and reused
- [ ] Deep nested structures (relations, pagination wrappers) are asserted explicitly
- [ ] Version-specific shape definitions exist when multiple API versions are active
- [ ] No unexpected keys (password, pivot, internal fields) are exposed
## Common Failures
- Forgetting `*` wildcard => only first element validated, empty arrays pass
- Using `assertJsonStructure` where `assertExactJson` is needed
- Asserting shapes for optional relations that aren't always loaded
- Using shape tests to validate values
## Decision Points
- Conditional vs unconditional shape assertions for optional fields
- Per-resource helper vs inline shape arrays
## Performance/Security Considerations
Shape tests are fast — decode JSON and walk key tree once. Bundle all shape assertions into one test method per endpoint. Security: detects accidental exposure of internal fields.
## Related Rules/Skills
API Testing: Response Status Code Testing, Pagination Response Testing, Error Response Shape Testing, Contract Testing with OpenAPI.
## Success Criteria
Contract breaks (renamed/removed keys, changed nesting) are caught before reaching production.
