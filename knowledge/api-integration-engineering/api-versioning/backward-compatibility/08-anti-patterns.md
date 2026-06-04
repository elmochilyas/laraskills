# Anti-Patterns: Backward Compatibility

## Metadata

| Attribute | Value |
|-----------|-------|
| **ID** | ku-02 |
| **Domain** | API Integration Engineering |
| **Subdomain** | API Versioning |
| **Type** | Implementation |
| **Version** | 1.0 |
| **Status** | Standardized |

## Anti-Pattern Inventory

1. [Breaking with Semantics](#1-breaking-with-semantics)
2. [Covert Breakage via Bug Fixes](#2-covert-breakage-via-bug-fixes)
3. [Versionless Evolution](#3-versionless-evolution)
4. [Consumer-Specific Compatibility](#4-consumer-specific-compatibility)

---

## 1. Breaking with Semantics

### Category
Contract Violation

### Description
Changing the meaning or behavior of an API field or endpoint without changing its format or version number. For example, a field `status` changes from meaning "order status" to "payment status," or an endpoint that returned "all items" now returns "only active items." The JSON structure is identical, but the semantics are different—existing consumers silently produce incorrect results.

### Why It Happens
- "It's the same field name, so it's backward compatible" misconception
- No formal API contract documentation to detect semantic shifts
- Internal team understands the change but external consumers don't
- No consumer-driven contract tests
- Semantic changes are harder to detect than structural changes

### Warning Signs
- API behavior changes without field additions or removals
- Documentation updates without version bumps
- Consumers report "different results than before" with no format change
- Business logic changes in shared code paths between versions
- No consumer notification about behavioral changes
- "It's just a bug fix" that changes outputs

### Why Harmful
- Consumers silently produce incorrect results based on old semantics
- Data integrity issues: consumers make decisions based on misunderstood values
- Debugging is extremely difficult (data looks correct, meaning is wrong)
- No automated detection (format diff tools pass)
- Trust is damaged when consumers discover the semantic shift

### Real-World Consequences
- E-commerce platform's "order status" field now shows "payment status" — fulfillment decisions are wrong
- API endpoint that returned "10 most recent" now returns "10 most relevant" — pagination breaks
- Geolocation API's coordinates change from "approximate" to "precise" — consumer's distance calculations are wrong

### Preferred Alternative
Semantic changes are breaking changes. If the meaning of a field or endpoint changes, it requires a new API version. Document the semantic contract clearly.

### Refactoring Strategy
1. Identify all semantic changes that were made without version bumps
2. Revert semantic changes if possible; otherwise, document as known migration
3. Add semantic contract documentation to the API spec
4. Add consumer contract tests that validate behavior, not just format
5. Establish a "semantic change = breaking change" policy

### Detection Checklist
- [ ] API contract documents semantics, not just format
- [ ] Semantic changes trigger version bumps
- [ ] Consumer contract tests validate behavior
- [ ] No silent semantic shifts in active versions

### Related Rules/Skills/Trees
- Skill: Implement Backward Compatibility

---

## 2. Covert Breakage via Bug Fixes

### Category
Change Management Failure

### Description
Deploying a bug fix that changes documented (or undocumented but relied-upon) API behavior. What the team considers a bug may be a feature that consumers depend on. Fixing the "bug" breaks consumers who have built around the existing behavior.

### Why It Happens
- "Bug fix" label applied to any behavior change without considering consumer impact
- No telemetry on how consumers use the API
- Developer doesn't know about existing usage patterns
- No feature flag or staged rollout for behavior changes
- "It's clearly a bug" justification without consumer awareness

### Warning Signs
- Bug fix labeled as "internal" but changes external API behavior
- No consumer notification about behavior changes
- Bug fix changes responses for existing requests
- Support tickets spike after "bug fix" deployments
- Regression tests fail for consumers using "buggy" behavior

### Why Harmful
- Production integrations break without any version signal
- Consumers cannot predict whether the API will change behaviors arbitrarily
- Bug fix deployments are riskier than feature deployments
- Team becomes afraid to fix real bugs
- "Bug vs. feature" ambiguity creates distrust

### Real-World Consequences
- Payment API "bug fix" changes rounding that existing consumers rely on
- Search API fixes relevance algorithm; consumer's result ordering changes drastically
- Validation "bug fix" rejects inputs that previously worked; consumer integration fails

### Preferred Alternative
Distinguish between internal bugs (no consumer-facing impact) and external behavior changes (need versioning or deprecation). If a fix changes observable consumer behavior, treat it as a breaking change.

### Refactoring Strategy
1. Audit past "bug fixes" for consumer-facing behavior changes
2. Add consumer impact assessment to the bug fix workflow
3. Document which behaviors are considered "contract" and which are "implementation detail"
4. Use feature flags for behavior changes with consumer impact
5. Notify consumers of behavior changes before deploying

### Detection Checklist
- [ ] Bug fixes are assessed for consumer-facing impact
- [ ] Behavior changes follow versioning or deprecation process
- [ ] Consumer contract tests catch "bug fix" breaks
- [ ] Bug fixes with consumer impact are communicated in changelog

### Related Rules/Skills/Trees
- Skill: Implement Backward Compatibility

---

## 3. Versionless Evolution

### Category
Drift Without Contract

### Description
Adding new fields and endpoints while also silently removing, rearranging, or changing undocumented parts of the API within the same version. The team may be adding forward-compatible changes, but without versioning discipline, undocumented "cleanup" changes break consumers who relied on undocumented behavior.

### Why It Happens
- Focus on additive changes without awareness of undocumented changes
- "We cleaned up the response structure" without consumer impact analysis
- No contract specification that defines what consumers can rely on
- Undocumented features changed without notice (they weren't documented!)
- Team doesn't maintain a formal OpenAPI specification

### Warning Signs
- Responses change structure between releases without version bumps
- Field ordering changes (consumers parsing by position break)
- Previously returned null fields may now be absent
- Array response ordering changes without notice
- No OpenAPI spec; no contract definition

### Why Harmful
- Consumers relying on undocumented behavior break unpredictably
- Makes consumers afraid to use "undocumented" features
- Contract is defined by code, not by documentation
- New API consumers cannot learn from stable documentation
- No source of truth for what the API guarantees

### Real-World Consequences
- Consumer parsing JSON array by position breaks when field order changes
- App crashes when previously null field is absent in response
- Integration breaks when undocumented but widely used field is removed
- New developer cannot understand API contract without reading source code

### Preferred Alternative
Document the API contract explicitly (OpenAPI spec). All changes, including undocumented fields, must follow the versioning strategy. Never remove or change behavior within a version, even if undocumented.

### Refactoring Strategy
1. Create or update the OpenAPI specification for the current API
2. Identify undocumented fields that consumers rely on
3. Define which parts of the response are "contract" and which are "informational"
4. Freeze current behavior as the documented contract
5. Add CI validation that compares responses to spec

### Detection Checklist
- [ ] OpenAPI spec defines the full API contract
- [ ] Undocumented fields are treated as contract
- [ ] No silent changes within a version
- [ ] CI validates API responses against spec

### Related Rules/Skills/Trees
- Skill: Implement Backward Compatibility
- OpenAPI spec generation

---

## 4. Consumer-Specific Compatibility

### Category
Inconsistent Contract

### Description
Maintaining backward compatibility for some consumers but not others—changing API behavior for "most consumers" while keeping old behavior for specific, known consumers. This creates an inconsistent API where the same endpoint behaves differently depending on who calls it, and new consumers get a different API than existing documentation describes.

### Why It Happens
- Enterprise customer demands: specific consumers negotiate custom contracts
- "We can't break BigClient, but everyone else can update"
- No centralized API governance
- Ad-hoc compatibility maintained per consumer via feature flags
- Team treats API as a per-customer integration rather than a product

### Warning Signs
- Same API endpoint has different behavior for different consumers
- Feature flags control per-consumer API behavior
- No documentation of per-consumer API differences
- New consumers get different API than existing ones
- Consumer-specific code branches in controllers or services
- Onboarding new consumer requires special configuration

### Why Harmful
- API contract becomes inconsistent and unpredictable
- Documentation cannot accurately describe the API
- New consumers get an inferior or different experience
- Code complexity grows with each consumer-specific branch
- Cannot evolve API cohesively—every change must check all consumers
- Testing becomes exponentially harder (every consumer variant)

### Real-World Consequences
- New consumer follows documentation, gets different response than expected
- Controller has 5 consumer-specific branches, each returning slightly different JSON
- Bug fix for one consumer breaks another (different behavior expected)
- Documentation outdated immediately because API varies per consumer

### Preferred Alternative
Provide the same API contract to all consumers of the same version. If specific consumers need different behavior, direct them to a different API version or a dedicated integration endpoint. Use standard versioning, not per-consumer customization.

### Refactoring Strategy
1. Audit all consumer-specific API behavior variations
2. Consolidate variations into standard versioned API
3. Migrate custom-consumer behavior to explicit version differences
4. Remove consumer-specific branches from shared code
5. Document all active API versions and their differences

### Detection Checklist
- [ ] Same API version has same behavior for all consumers
- [ ] No consumer-specific code branches in controllers
- [ ] API documentation accurately describes behavior for all consumers
- [ ] New consumers get same API as existing ones (same version)
