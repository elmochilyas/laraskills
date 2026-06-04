# ECC Anti-Patterns — Backward Compatibility Policy

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | API & CRUD System Engineering |
| **Subdomain** | API Lifecycle & Governance |
| **Knowledge Unit** | Backward Compatibility Policy |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Adding Required Fields to Existing Endpoints
2. Changing Default Values Silently
3. Renaming Fields Instead of Add-and-Deprecate
4. No Automated OpenAPI Diffing in CI
5. Consumer Reliance on Bug Behavior — Bug Fix as Breaking Change

---

## Repository-Wide Anti-Patterns

- Premature Optimization
- Silent Failures
- Golden Hammer

---

## Anti-Pattern 1: Adding Required Fields to Existing Endpoints

### Category
Backward Compatibility

### Description
Adding a new required field to the request body of an existing endpoint, breaking every consumer who does not send the new field.

### Why It Happens
The new field is genuinely necessary for the business logic. The team assumes consumers will update their requests "since it's needed." They do not consider that every existing consumer must simultaneously update to include the new required field — an impossibility for distributed teams.

### Warning Signs
- Existing endpoint adds `'required'` validation rule for a new field
- Consumers suddenly receive 422 errors after deployment
- Validation error mentions a field consumers have never seen
- No deprecation notice was sent about the new field requirement
- Release notes say "added required field X" without migration guidance
- Support tickets spike with "the API started rejecting my requests"

### Why It Is Harmful
Adding a required field to an existing endpoint is an instant-breaking change. Every consumer's next request to that endpoint fails with a 422 validation error. There is no migration path — consumers cannot upgrade incrementally. The change must be rolled back or all consumers must update simultaneously, which is operationally impossible.

### Real-World Consequences
A team adds a `department_id` field as required to `POST /users`. They deploy on Monday at 10 AM. By 10:05 AM, every consumer's user-creation flow is broken. The team's monitoring shows a 500% increase in 422 errors. The CTO pages the team. They roll back at 10:15 AM. The incident post-mortem cites "adding required field to existing endpoint" as the root cause.

### Preferred Alternative
Add new fields as optional with sensible defaults. If the field is needed for new consumers, it can be required in a new major version (v2).

### Refactoring Strategy
1. Change the new field from `required` to `sometimes` or `nullable`
2. Implement a default value or handle the missing field gracefully in the business logic
3. Notify consumers that the field is available and will become required in the next major version
4. Schedule the breaking change for the next major version with proper deprecation

### Detection Checklist
- [ ] Review recent PRs that added validation rules to existing endpoints
- [ ] Check for `required` rules added to fields on existing endpoints
- [ ] Verify all new fields on existing endpoints are optional
- [ ] Test sending a request without the new field — it should succeed
- [ ] Add CI check: flag PRs adding required fields to existing endpoints

### Related Rules
- Never Add Required Fields to Existing Endpoints (05-rules.md)

### Related Skills
- Implement Backward Compatibility Policy (06-skills.md)

### Related Decision Trees
- Change Classification — Additive vs Breaking vs Evolutive (07-decision-trees.md)
- New Field Addition Strategy — Optional vs Required with Default (07-decision-trees.md)

---

## Anti-Pattern 2: Changing Default Values Silently

### Category
Backward Compatibility

### Description
Changing the default value of an existing parameter (e.g., `per_page` from 100 to 20) without notification or version bump, silently altering behavior for consumers relying on the default.

### Why It Happens
The team believes the new default is "better" and the change is trivial. They update the configuration value without considering that consumers who explicitly omitted the parameter relied on the documented default behavior.

### Warning Signs
- Default value in code changes without a version bump
- Release notes mention "updated default for X parameter" as a minor change
- Consumers report unexpected behavior after deployment
- Support tickets reference "my results changed but I didn't change my code"
- Pagination returns fewer/fewer results than expected
- Consumer scripts that relied on default page size break

### Why It Is Harmful
Changing a default is a silent behavior change. Consumers who never specified the parameter get different behavior without any action on their part. They cannot detect the change from their code — their request looks identical. They discover the change only when downstream processing breaks due to different data volumes.

### Real-World Consequences
The `per_page` default for `GET /users` is changed from 100 to 20. A consumer's nightly data export script requests all pages (without specifying `per_page`). Previously it made 5 pages for 500 users. Now it makes 25 pages. The script uses a hardcoded page count of 10. It never reaches page 20. It misses half the data every night for two weeks before someone notices the discrepancy.

### Preferred Alternative
Never change default values of existing parameters. If a new default is needed, introduce a new parameter with the desired default and deprecate the old one.

### Refactoring Strategy
1. Revert the default change immediately
2. Introduce a new parameter with the desired default behavior
3. Deprecate the old parameter
4. Notify consumers of the new parameter and timeline for old parameter removal
5. Remove the old parameter only after the deprecation window

### Detection Checklist
- [ ] Review defaults of all parameters — have any changed silently?
- [ ] Check consumer reports of unexpected behavior post-deployment
- [ ] Verify default value documentation matches code
- [ ] Test the endpoint without specifying the parameter — confirm documented default
- [ ] Add CI check: flag PRs that change default values

### Related Rules
- Never Change Default Values (05-rules.md)

### Related Skills
- Implement Backward Compatibility Policy (06-skills.md)

### Related Decision Trees
- Change Classification — Additive vs Breaking vs Evolutive (07-decision-trees.md)

---

## Anti-Pattern 3: Renaming Fields Instead of Add-and-Deprecate

### Category
Backward Compatibility

### Description
Renaming a field in a response or request body (e.g., `username` → `user_name`) without a transition period, breaking every consumer that references the old field name.

### Why It Happens
Renaming feels like a simple refactoring. The team uses an IDE rename function and assumes the consumer impact is small. They underestimate how many consumers access the field by its original name and how many SDKs/models are based on the old name.

### Warning Signs
- Field name changes between releases without deprecation
- Consumers report deserialization errors after deployment
- SDK/models based on old field name fail
- Changelog says "renamed X to Y" under "Changed" (not "Breaking")
- No period where both old and new field names are present
- JSON parsing of response suddenly returns null for expected fields

### Why It Is Harmful
Renaming breaks every consumer that accesses the field by name. Strict deserialization (typed languages, JSON serializers) fails immediately. Loose deserialization silently returns null — causing subtle downstream bugs. There is no graceful transition. Consumers must discover the rename, update their code, test, and deploy — all after the API change breaks their integration.

### Real-World Consequences
The team renames `username` to `user_name` in the User response. A consumer's mobile app deserializes the JSON into a `User` object with a `username` property. After deployment, `user.username` is null on every response. The app displays blank names everywhere. Users of the app see "Hello, !" on every screen. The consumer's developer discovers the rename 4 hours later when they debug the API response.

### Preferred Alternative
Add the new field name alongside the old one. Mark the old field as deprecated. Remove it only after the deprecation window expires.

### Refactoring Strategy
1. Revert the rename immediately
2. Add the new field name alongside the existing one
3. Mark the old field as deprecated in documentation and headers
4. Notify consumers about the new field and deprecation timeline
5. Remove the old field in the next major version

### Detection Checklist
- [ ] Check for field renames in recent releases
- [ ] Verify that renamed fields have a coexistence period with old names
- [ ] Confirm old field names are deprecated, not removed
- [ ] Test responses include both old and new field names during migration
- [ ] Add CI check: flag PRs that remove fields from response schemas

### Related Rules
- Never Rename Fields — Add New and Deprecate Old (05-rules.md)

### Related Skills
- Implement Backward Compatibility Policy (06-skills.md)

### Related Decision Trees
- Change Classification — Additive vs Breaking vs Evolutive (07-decision-trees.md)

---

## Anti-Pattern 4: No Automated OpenAPI Diffing in CI

### Category
Maintainability

### Description
Relying solely on manual code review to detect breaking changes instead of automated OpenAPI spec diffing in CI, allowing accidental breaking changes to reach production.

### Why It Happens
Manual code review is the default process for most teams. Teams may not know that OpenAPI diffing tools exist. Setting up diffing requires generating the spec before and after the change, which adds a new CI step. The effort of adding this step is deferred.

### Warning Signs
- No OpenAPI diffing step exists in CI
- Breaking changes are discovered post-deployment by consumers
- Code review missed a field removal or type change
- "We didn't realize that change was breaking" is a common post-mortem finding
- Spec is generated but never compared against previous versions
- Breaking change detection relies on a specific reviewer's knowledge

### Why It Is Harmful
Manual review cannot reliably detect all breaking changes in a large OpenAPI spec. A reviewer may miss a removed field among dozens of schema changes, a type change in a deeply nested property, or a new required parameter. Automated diffing catches these with perfect consistency.

### Real-World Consequences
A PR removes the `middle_name` field from the User response schema. The code change is clear — the field is no longer in the API Resource. The reviewer scans the diff but focuses on the new fields added. The removal goes unnoticed. The PR merges. After deployment, 15 consumer integrations break because they relied on the `middle_name` field.

### Preferred Alternative
Run automated OpenAPI specification diffing in CI on every PR that changes the API. Reject PRs with breaking changes that lack a deprecation plan.

### Refactoring Strategy
1. Add spec generation (or regeneration) to the CI pipeline
2. Store the previous version's spec as a CI artifact
3. Run `oas-diff` or equivalent on every PR comparing old vs new spec
4. Fail CI on breaking changes that lack a documented deprecation plan
5. Require a human review of the diff output before merging

### Detection Checklist
- [ ] Check CI pipeline for OpenAPI diffing step
- [ ] Verify the diff tool catches known breaking changes
- [ ] Test that a PR adding a required field to an existing endpoint fails CI
- [ ] Confirm diff output is visible in PR checks
- [ ] Review recent breaking changes — would diffing have caught them?

### Related Rules
- Run Automated OpenAPI Diffing in CI (05-rules.md)

### Related Skills
- Implement Backward Compatibility Policy (06-skills.md)

### Related Decision Trees
- Change Classification — Additive vs Breaking vs Evolutive (07-decision-trees.md)

---

## Anti-Pattern 5: Consumer Reliance on Bug Behavior — Bug Fix as Breaking Change

### Category
Backward Compatibility

### Description
Fixing a bug that changes observable output, breaking consumers who unknowingly depended on the incorrect behavior.

### Why It Happens
The team fixes the bug "correctly" without realizing that consumers built workarounds or relied on the buggy behavior. The bug has been in production long enough that consumers have built logic around it. The team treats it as a bug fix (PATCH) but consumers experience it as a breaking change.

### Warning Signs
- Bug fix changes response format, field values, or ordering
- Consumer reports "it was working before the last update"
- The fix addresses a behavior that existed for 6+ months
- Consumers explicitly test for the buggy behavior in their code
- No deprecation period for the bug fix — deployed as a patch
- Post-mortem discovers consumer code handling the bug scenario

### Why It Is Harmful
Consumers depend on observable behavior, not documented intent. If a bug has been in production long enough that consumers built logic around it, the bug is effectively a feature. Fixing it without consumer notification or migration breaks integrations that were relying on the (buggy but consistent) output.

### Real-World Consequences
An API endpoint has a bug where `GET /users?status=active` also returns inactive users. A consumer builds a dashboard that filters inactive users client-side as a workaround. Their code relies on the fact that the buggy response may contain inactive users — they always filter them out. The team fixes the bug. The endpoint now returns only active users. The consumer's client-side filter now double-filters, accidentally removing some active users from the dashboard.

### Preferred Alternative
Treat bug fixes that change observable output as breaking changes when consumers likely depend on the buggy behavior. Apply deprecation, notification, and migration processes.

### Refactoring Strategy
1. Assess the bug's longevity — has it been in production for 6+ months?
2. Check access logs for consumers who may rely on the buggy behavior
3. If consumers likely depend on the bug, treat the fix as a breaking change
4. Deploy the fix behind a feature flag with opt-in for early adopters
5. Announce the fix with migration window before making it the default

### Detection Checklist
- [ ] Check bug fix impact on response/request behavior — does it change observable output?
- [ ] Assess how long the bug has been in production
- [ ] Verify if consumers have code handling the buggy behavior
- [ ] Confirm bug fixes that change observable output have migration plan
- [ ] Add process: bug fixes affecting observable output require compatibility review

### Related Rules
- Tolerant Reader — Ignore Unknown Fields (05-rules.md)

### Related Skills
- Implement Backward Compatibility Policy (06-skills.md)

### Related Decision Trees
- Change Classification — Additive vs Breaking vs Evolutive (07-decision-trees.md)

---

