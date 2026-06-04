# Breaking Change Identification: Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Versioning |
| Knowledge Unit | Breaking Change Identification |
| Phase | 8-anti-patterns |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. **No Automated Detection** — Relying entirely on manual code review to catch breaking changes
2. **False Positive Fatigue** — Overly strict detection that produces too many warnings, causing developers to ignore them
3. **Semantic Blindness** — Not catching changes where field name and type stay the same but meaning changes
4. **Ignoring Behavior Changes** — Only checking API contract structure, not behavioral changes
5. **No Pre-Release Gate** — Running breaking change detection only during development, not as a pre-release gate

## Repository-Wide Anti-Patterns

- Not maintaining an OpenAPI spec as the single source of truth for contract comparison
- Relying solely on developer discipline to identify breaking changes
- Not categorizing breaking changes in the changelog with clear markers
- Skipping breaking change analysis for "minor" or "internal" changes

---

## 1. No Automated Detection

### Category
Process Gap

### Description
Relying entirely on manual code review to identify breaking changes. Developers are expected to mentally compare the current response against the previous version to detect contract violations.

### Why It Happens
"I know the API, I'll catch any breaking changes in review." Manual review seems sufficient for small teams. Breaking change tools are seen as expensive or unnecessary.

### Warning Signs
- Breaking changes discovered after deployment (production incidents)
- Code review comments never mention "this is a breaking change"
- No OpenAPI diff tool in CI pipeline
- Developers say "I didn't realize this would break clients"
- No automated check between deployed spec and new spec

### Why Harmful
Human reviewers miss subtle breaking changes — field renames, type changes in conditional paths, error format changes. A single missed breaking change can cause production incidents affecting all consumers.

### Real-World Consequences
A developer changes a response field from `int` to `string` (`id` was returned as integer, now as string). The PR is reviewed and approved. The deployed change breaks all clients that use strict type comparison. No automated diff caught the type change.

### Preferred Alternative
Run automated OpenAPI spec diff in CI for every PR. Compare against the currently deployed spec (not the branch's own spec).

### Refactoring Strategy
1. Generate OpenAPI spec as a CI artifact from the main branch
2. Compare PR's generated spec against the main branch spec
3. Fail the build on breaking changes with clear output
4. Create a breaking change tracking dashboard
5. Train developers to read diff output

### Detection Checklist
- [ ] No OpenAPI spec diff in CI
- [ ] Breaking changes discovered post-deployment
- [ ] No baseline spec for comparison
- [ ] Developers unaware of breaking change classification

### Related Rules/Skills/Trees
- Rule: API-BREAK-001 (Automated Breaking Change Detection)
- Skill: semantic-versioning-for-apis
- Tree: api-governance

---

## 2. False Positive Fatigue

### Category
Process Failure

### Description
Breaking change detection is too strict, flagging trivial differences (whitespace, field ordering, non-contractual metadata) as breaking changes. Developers see warnings on every PR and learn to ignore them.

### Why It Happens
Tools are configured with maximum sensitivity to "catch everything." No time is invested in tuning the detection rules. Warnings that should be blocking become noise.

### Warning Signs
- Breaking change warnings on every PR (~90% false positives)
- Developers routinely skip CI breaking change checks
- "Breaking change detected" comments are ignored in PR review
- Team has disabled the breaking change gate due to noise
- No one can describe what constitutes a true positive

### Why Harmful
When real breaking changes occur, the warnings are ignored because they're indistinguishable from false positives. The detection system becomes theater — it runs but produces no actionable information.

### Real-World Consequences
The CI pipeline reports "breaking change" for every PR because of field ordering differences. Developers learn to click "Approve anyway" without reading. A real breaking change (field removal) is flagged identically and shipped to production.

### Preferred Alternative
Tune detection rules to reduce false positives. Distinguish between structural, semantic, and cosmetic changes. Only fail the build for true breaking changes.

### Refactoring Strategy
1. Analyze the current false positive rate (target <10%)
2. Configure the diff tool to ignore ordering, naming, and metadata changes
3. Create a categorized report: breaking, additive, cosmetic
4. Only block CI for confirmed breaking changes
5. Add a manual override process for disputed classifications

### Detection Checklist
- [ ] High false positive rate (>50%)
- [ ] Developers ignore breaking change warnings
- [ ] CI gate is routinely bypassed
- [ ] No categorization of change types

### Related Rules/Skills/Trees
- Rule: API-BREAK-002 (Low-Noise Detection)
- Skill: backward-compatible-changes
- Tree: ci-pipeline

---

## 3. Semantic Blindness

### Category
Detection Gap

### Description
Only detecting structural breaking changes (field removal, type change, endpoint removal) while missing semantic changes where field name and type are identical but the meaning changed.

### Why It Happens
Automated tools compare schema structure, not semantics. A field that was "price excluding tax" changed to "price including tax" has the same type (`number`) and name (`price`) — no tool can catch this without human context.

### Warning Signs
- Field name and type unchanged but business rules changed
- Default value interpretation changed (e.g., `null` used to mean "not set," now means "not applicable")
- Enum values reordered or renamed
- Pagination semantics changed (offset 0-based vs 1-based)
- Sorting order changed silently
- Units changed (meters to feet, USD to cents)

### Why Harmful
Semantic changes are the hardest to detect and cause the most damage. Clients parse the data correctly but interpret it incorrectly. Data processing errors propagate silently through downstream systems.

### Real-World Consequences
An API changes `price` from "price excluding tax" to "price including tax" without changing the field name or type. A client's invoicing system calculates tax based on the price field. Now tax is calculated on the tax-inclusive amount, resulting in double-taxation and incorrectly high invoices.

### Preferred Alternative
Require a human change review for ALL field changes, even if the structure is identical. Document semantic contracts for critical fields. Use property-based testing to verify semantic invariants.

### Refactoring Strategy
1. Add semantic contract documentation to OpenAPI descriptions
2. Maintain a "semantic changelog" for critical fields
3. Add test assertions for semantic invariants (e.g., `price` is always exclusive of tax)
4. Require ADR for any semantic change to existing fields
5. Create field ownership documentation

### Detection Checklist
- [ ] Automated detection only covers structural changes
- [ ] Semantic changes discovered through production incidents
- [ ] Field meaning not documented in OpenAPI descriptions
- [ ] No semantic invariance tests exist

### Related Rules/Skills/Trees
- Rule: API-BREAK-003 (Semantic Change Detection)
- Skill: backward-compatible-changes
- Tree: api-governance

---

## 4. Ignoring Behavior Changes

### Category
Oversight

### Description
Only checking response structure for breaking changes while ignoring behavioral changes — response time degradation, new error conditions, different side effects, or changed authorization requirements.

### Why It Happens
Behavioral changes are harder to detect than structural ones. There's no automated tool that can verify "this endpoint used to succeed for role X and now returns 403."

### Warning Signs
- Response structure unchanged but error rate increased
- Endpoint now requires previously optional auth scope
- Response time degraded significantly for specific inputs
- Previously successful edge cases now fail
- Side effects (emails, webhooks) now fire under different conditions

### Why Harmful
Behavioral breaking changes are invisible to contract-checking tools. Clients see the same response structure but different behavior, leading to logic errors, performance issues, or security failures.

### Real-World Consequences
An API endpoint previously returned 200 for any authenticated user. After a security update, it returns 403 for users without a specific role. The response structure is identical. The client interprets 403 as a transient error and retries, never understanding they're not authorized.

### Preferred Alternative
Add behavioral contract tests alongside structural tests. Monitor error rates, response times, and auth failures as signals of behavioral breaking changes.

### Refactoring Strategy
1. Identify all behavioral contracts for each endpoint (auth, rate limits, side effects)
2. Add behavioral integration tests that run in CI
3. Monitor error rate changes as a deployment safety check
4. Create a behavioral change review checklist for PRs

### Detection Checklist
- [ ] Behavioral contracts undocumented
- [ ] No integration tests for endpoint behavior
- [ ] Error rate monitoring doesn't compare against baseline
- [ ] Side effects not documented

### Related Rules/Skills/Trees
- Rule: API-BREAK-004 (Behavioral Contract Testing)
- Skill: contract-testing-with-openapi
- Tree: api-testing

---

## 5. No Pre-Release Gate

### Category
Process Gap

### Description
Running breaking change detection only during development or PR review but not as a pre-release gate. Changes can still be merged to main and released without a final breaking change check.

### Why It Happens
CI runs on branches but not as a release pipeline step. Multiple changes can merge and create a combined breaking effect that individual PR checks didn't catch.

### Warning Signs
- Breaking change detection only runs on PRs
- Release pipeline has no contract validation step
- Breaking changes are discovered after deployment to production
- Combination of multiple non-breaking PRs creates a breaking effect
- Release notes don't include breaking change classification

### Why Harmful
The most expensive time to discover a breaking change is after it's deployed. Without a pre-release gate, even teams with good PR detection can accidentally release a breaking change.

### Real-World Consequences
Two non-breaking changes merge independently: one renames an internal method, the other changes the data transformation. Together, they produce a different response format. Neither PR detected a problem, but the combined release breaks clients.

### Preferred Alternative
Add breaking change detection as a mandatory step in the deployment pipeline. Compare the release candidate's spec against the production spec before promoting.

### Refactoring Strategy
1. Add spec comparison to the release pipeline
2. Compare release candidate spec against production spec
3. Block release if breaking changes are detected
4. Require explicit breaking change approval for releases with intentional breaking changes
5. Generate a changelog entry for every release

### Detection Checklist
- [ ] No pre-release spec comparison
- [ ] Releases can proceed without breaking change check
- [ ] Combined PR effects not evaluated
- [ ] Changelog doesn't include breaking changes

### Related Rules/Skills/Trees
- Rule: API-BREAK-005 (Pre-Release Validation)
- Skill: api-lifecycle-governance
- Tree: ci-cd
