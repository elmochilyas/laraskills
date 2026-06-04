# Backward-Compatible Changes: Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Versioning |
| Knowledge Unit | Backward-Compatible Changes |
| Phase | 8-anti-patterns |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. **Silent Behavior Change** — Adding a field or parameter that silently changes existing behavior
2. **Validation Tightening** — Applying a new validation rule that rejects previously valid input
3. **No Documentation** — Adding new features without documenting them for consumers
4. **Non-Nullable Default Field** — Adding a field with a non-null default that changes behavior
5. **Field Removal in Minor Version** — Removing a field without a major version bump

## Repository-Wide Anti-Patterns

- Adding required query parameters that break existing clients who don't send them
- Removing fields from documentation but keeping them in responses (confusing consumers)
- Making optional fields required across versions
- Not using `$this->when()` or `nullable` defaults for new fields

---

## 1. Silent Behavior Change

### Category
Breaking Change in Disguise

### Description
Adding a new field or query parameter to an existing endpoint that, when present, modifies the behavior of existing fields or the overall response. Existing clients that don't send the new parameter get the same results, but those that do get different behavior — and the parameter's effect on existing fields is undocumented.

### Why It Happens
Developers add a new feature that needs an optional parameter but don't realize the parameter changes existing semantics. "It's optional, so existing clients aren't affected" ignores that new clients will discover and use the parameter differently.

### Warning Signs
- New query parameter changes the format or meaning of response fields
- Adding the parameter returns different data for the same record
- Documentation says "optional" but doesn't explain the behavioral impact
- Existing integration tests fail when the parameter is present

### Why Harmful
Clients that use the new parameter get different results than expected, causing data processing errors. Clients that don't use it are unaffected but may later discover the parameter and unknowingly change their behavior.

### Real-World Consequences
An API adds `?include_counts=true` to a users endpoint. When enabled, the `name` field changes format from "John Doe" to "John Doe (3 posts)". A client enables it to get counts, but their name-parsing code breaks because the format changed.

### Preferred Alternative
New parameters must not change existing field semantics. If behavioral changes are needed, create a new endpoint or version.

### Refactoring Strategy
1. Identify new parameters that alter existing field behavior
2. Either create separate endpoint for the new behavior
3. Or add the parameter as purely additive (new fields, not modified existing ones)
4. Document parameter's effect clearly in OpenAPI
5. Add tests ensuring existing fields are unchanged when parameter is present

### Detection Checklist
- [ ] New parameter modifies existing field values
- [ ] Existing tests fail when new parameter is used
- [ ] Parameter documentation doesn't describe semantic impact
- [ ] Client code for parsing existing fields needs changes

### Related Rules/Skills/Trees
- Rule: API-VERSION-001 (Additive Changes Only)
- Skill: when-to-create-new-version
- Tree: api-governance

---

## 2. Validation Tightening

### Category
Breaking Change

### Description
Adding or strengthening validation rules in an existing endpoint without a version bump. A field that previously accepted "any string" now requires "min:3|max:255". Clients that previously sent valid data now receive 422 errors.

### Why It Happens
Data quality improvements — the team discovers invalid data in production and "fixes" validation without realizing they're breaking existing API contracts.

### Warning Signs
- New validation rules applied to existing field in form request
- `nullable` removed from a field
- `string` changed to `email` or other specific format
- `min` or `max` constraints added to existing field
- 422 error rate increases after deployment

### Why Harmful
Existing clients that previously worked now fail. This is a breaking change shipped as a bug fix. Clients have no warning and no migration path.

### Real-World Consequences
A team adds `email:rfc,dns` validation to the `email` field in an existing form request. A client that previously successfully registered with a subdomain email (which fails DNS validation) now receives 422. The registration flow is broken.

### Preferred Alternative
Add new validation rules only in new API versions. For existing versions, keep existing validation and add optional new endpoints with stricter rules.

### Refactoring Strategy
1. Revert validation changes in the existing version's form request
2. Create a new form request for the next version with stricter rules
3. Add an optional validation endpoint that clients can call to pre-validate data
4. Document validation differences between versions

### Detection Checklist
- [ ] Existing field's validation rules changed without version bump
- [ ] Previously valid data now fails validation
- [ ] 422 error rate increased after deployment
- [ ] Form request modified without new version

### Related Rules/Skills/Trees
- Rule: API-VERSION-002 (Validation Stability)
- Skill: form-request-organization
- Tree: api-governance

---

## 3. No Documentation

### Category
Communication Failure

### Description
Adding new fields, endpoints, or parameters without updating the API documentation. Consumers don't know the new feature exists, or discover it accidentally and have no usage guidance.

### Why It Happens
Feature development outpaces documentation. "We'll document it later" becomes "we forgot to document it." Or the feature was added for a specific client and the team assumes others don't need to know.

### Warning Signs
- New fields appear in responses but are absent from OpenAPI spec
- New endpoints work but aren't in documentation
- Developers discover features by reading code, not docs
- Clients ask "how do I use X?" — X is undocumented
- OpenAPI spec is out of date with actual response shapes

### Why Harmful
Undocumented features are undiscoverable. Clients either miss the feature entirely or must reverse-engineer the API to use it. Inconsistent documentation erodes trust in the API's reliability.

### Real-World Consequences
A team adds an `include=author` parameter to a posts endpoint for a specific client. They don't update the OpenAPI spec. Six months later, another client needs the same feature and builds their own implementation, not knowing the parameter already exists.

### Preferred Alternative
Document every new field, endpoint, and parameter as part of the development process. Add documentation tests that verify documentation matches implementation.

### Refactoring Strategy
1. Audit response and request schemas against current OpenAPI spec
2. Add all undocumented fields, parameters, and endpoints to the spec
3. Add CI check that fails if OpenAPI spec is not updated alongside code changes
4. Schedule regular documentation reconciliation

### Detection Checklist
- [ ] New fields in response are absent from OpenAPI
- [ ] New query parameters work but aren't documented
- [ ] OpenAPI spec generation is not part of the deployment pipeline
- [ ] Clients discover features through code reading

### Related Rules/Skills/Trees
- Rule: API-DOC-003 (Documentation-First Changes)
- Skill: endpoint-documentation-content
- Tree: api-documentation

---

## 4. Non-Nullable Default Field

### Category
Semantic Change

### Description
Adding a new field with a non-null default value that changes the meaning or behavior of existing data. For example, `'is_featured' => false` when the previous behavior was "no is_featured concept exists."

### Why It Happens
The developer needs the field to always have a value for sorting or filtering, so they add a non-null default. They don't consider that this changes the interpretation of all existing data.

### Warning Signs
- New field has a non-null default (`default: false`, `default: 0`, `default: ''`)
- Existing data suddenly has values for a field they didn't have before
- Filtering or sorting by the new field categorizes existing data in a way the data owner didn't choose
- Migration script adds `default` instead of making the field nullable

### Why Harmful
Existing data inherits a default value that may not reflect the actual data owner's intent. All pre-existing records are categorized identically, which may be incorrect.

### Real-World Consequences
An API adds `is_verified: false` default to user profiles. All 50,000 existing users are now "not verified." The marketing team runs a campaign targeting "verified users" and accidentally excludes everyone.

### Preferred Alternative
Use `null` as the default for new fields on existing records. `null` universally means "this field wasn't set when the record was created."

### Refactoring Strategy
1. Change new field default to `nullable`
2. Update API resource to handle `null` values gracefully
3. Document that the new field may be `null` for existing records
4. Add migration that backfills the field only when the business logic is ready

### Detection Checklist
- [ ] New field has non-null default
- [ ] Existing records get a value they didn't choose
- [ ] Business logic uses the field for decisions affecting all records
- [ ] `null` would be a more accurate default

### Related Rules/Skills/Trees
- Rule: API-VERSION-003 (Nullable New Fields)
- Skill: backward-compatible-changes
- Tree: api-governance

---

## 5. Field Removal in Minor Version

### Category
Breaking Change

### Description
Removing a field from the API response without a major version bump. The field was deprecated in a previous release, but its actual removal breaks clients that haven't migrated away.

### Why It Happens
"We deprecated it six months ago, everyone should have migrated by now." The team assumes that deprecation warnings are sufficient and doesn't verify consumer migration.

### Warning Signs
- Field disappeared from response without major version bump
- Clients report errors because they try to access the removed field
- Deprecation was announced but removal was not communicated
- No sunset header or migration timeline was provided
- Monitoring shows errors for field access on removed fields

### Why Harmful
Clients break without warning. Even if the field was deprecated, actual removal is still a breaking change that requires consumer action. Unannounced removal erodes trust.

### Real-World Consequences
An API deprecates `user_name` in favor of `user.display_name`. After 6 months, the team removes `user_name` from the response without a version bump. A client that missed the deprecation notice (e.g., an infrequently updated integration) now receives `null` for `user_name` and displays "null" as the user's name.

### Preferred Alternative
Only remove fields in a new major version. Keep deprecated fields in existing versions until the version is retired.

### Refactoring Strategy
1. Restore the removed field in the current version
2. Schedule removal for the next major version
3. Add sunset header with the scheduled removal date
4. Track consumer migration using deprecation header analytics
5. Only remove when consumer traffic confirms migration

### Detection Checklist
- [ ] Field removed without major version bump
- [ ] Deprecation was announced but removal was not
- [ ] Clients are accessing the removed field
- [ ] No sunset date was provided
- [ ] Consumer migration not verified before removal

### Related Rules/Skills/Trees
- Rule: API-VERSION-004 (Major Version for Removal)
- Skill: deprecation-header-implementation
- Tree: api-lifecycle
