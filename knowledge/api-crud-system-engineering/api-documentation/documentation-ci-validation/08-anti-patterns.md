# ECC Anti-Patterns — Documentation CI Validation

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | API & CRUD System Engineering |
| **Subdomain** | API Documentation |
| **Knowledge Unit** | Documentation CI Validation |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Stale Contract Test Environment
2. False-Positive Breaking Change Noise
3. Single-Stage Validation Bottleneck
4. Happy-Path-Only Contract Testing
5. Spec-As-Afterthought Pipeline

---

## Repository-Wide Anti-Patterns

- Premature Optimization
- Ticket-Driven Development

---

## Anti-Pattern 1: Stale Contract Test Environment

### Category
Testing

### Description
Running contract tests against a CI environment whose data state diverges from production, causing false negatives or missed real regressions.

### Why It Happens
CI environments are provisioned once and reused across test runs. Database seeds load the same data set regardless of what the PR under test actually changes, so tests pass on stale data while production fails on real data shapes.

### Warning Signs
- Contract tests never fail even when schemas change
- PRs pass CI but break production integration tests
- Test database is seeded identically for every run
- No per-PR database reset with production-like data

### Why It Is Harmful
Passing contract tests create false confidence. Consumers encounter schema mismatches in production because the test environment never exercised the actual edge cases. The CI pipeline becomes a rubber stamp that validates formatting, not correctness.

### Real-World Consequences
A PR changes the `User` response schema from `{name: string}` to `{firstName: string, lastName: string}`. The contract test environment seeds only one user whose `name` fits both schemas. Tests pass. In production, millions of users have names that cannot cleanly split. Consumer integrations break on the first request.

### Preferred Alternative
Provision per-PR test environments with representative data that exercises all schema fields, and include negative test cases that deliberately send invalid data to confirm error handling works.

### Refactoring Strategy
1. Replace static seed data with factory-based data generators that produce realistic field values
2. Add per-PR database refresh that seeds data matching the current schema
3. Include at least one test case that sends invalid payloads to verify error response paths
4. Run a nightly full-suite contract test against a production-shadow environment

### Detection Checklist
- [ ] Check if contract test data is refreshed per PR
- [ ] Verify test data includes edge cases (nulls, long strings, special characters)
- [ ] Confirm error-path contract tests exist alongside happy-path tests
- [ ] Review whether CI environment mirrors production schema exactly

### Related Rules
- Run Contract Tests On Error Paths Not Just Happy Paths (05-rules.md)
- Store Validated Spec As A CI Artifact (05-rules.md)

### Related Skills
- Validate Documentation in CI (06-skills.md)

### Related Decision Trees
- Validation Pipeline Speed — Fast Lint vs Comprehensive Contract Tests (07-decision-trees.md)

---

## Anti-Pattern 2: False-Positive Breaking Change Noise

### Category
Reliability

### Description
Breaking change detection rules that flag cosmetic or irrelevant changes as breaking, causing developers to ignore or disable the entire detection pipeline.

### Why It Happens
Spec diff tools compare raw YAML/JSON structure. Changes like reordering `properties`, adding optional fields, or reformatting descriptions are flagged as breaking because the raw text differs, even though the contract is unchanged.

### Warning Signs
- Developers routinely bypass breaking-change checks with `--force`
- Breaking change CI job is disabled or removed
- Spec diff output contains warnings about description text changes
- Team culture treats breaking change detection as noise
- PRs merge with unresolved but ignored breaking change warnings

### Why It Is Harmful
When false positives dominate the signal, developers train themselves to ignore all breaking change warnings. Real breaking changes — removed fields, changed types, new required parameters — get the same dismissal as noise. The detection system becomes a liability instead of a safeguard.

### Real-World Consequences
A PR removes the `email` field from the User response. The breaking change detector correctly flags it. But the developer has seen 50 false-positive warnings this sprint and dismisses this one without investigation. The breaking change deploys. Hundreds of consuming applications fail on the next request.

### Preferred Alternative
Tune the breaking change detector to ignore cosmetic changes (description updates, property reordering, whitespace) and flag only semantic contract breaks: removed paths, removed/renamed properties, changed types, new required parameters, removed enum values.

### Refactoring Strategy
1. Configure the diff tool to ignore `summary` and `description` changes unless they alter documented behavior
2. Use a custom ruleset that filters out known false-positive patterns
3. Generate a human-readable breaking change summary that separates "breaking" from "info" categories
4. Enforce mandatory manual review for flagged breaking changes — no automated bypass
5. Require a brief written justification in the PR description for each flagged breaking change

### Detection Checklist
- [ ] Review recent PRs that bypassed breaking change detection
- [ ] Check spec diff output for irrelevant warnings (description changes, property reordering)
- [ ] Verify custom rulesets filter common false positives
- [ ] Confirm breaking change policy requires human review, not automated bypass

### Related Rules
- Run Breaking Change Detection Against The Previous Version (05-rules.md)

### Related Skills
- Validate Documentation in CI (06-skills.md)

### Related Decision Trees
- Breaking Change Detection Timing — PR vs Deployment (07-decision-trees.md)

---

## Anti-Pattern 3: Single-Stage Validation Bottleneck

### Category
Performance

### Description
Running all documentation validation checks — lint, breaking change detection, completeness, and contract tests — in a single CI job that takes 10+ minutes, causing developers to skip or disable validation.

### Why It Happens
CI pipelines are often built incrementally. One validation tool is added, then another, and another, all to the same job. Nobody considers the cumulative runtime until the pipeline becomes the team's bottleneck.

### Warning Signs
- CI documentation validation takes more than 5 minutes
- Developers frequently comment "skip-ci" on documentation PRs
- PR merge times correlate with developers bypassing validation
- Validation job includes both lint (fast) and contract tests (slow) in one step
- Multiple validation tools chained sequentially in the same job

### Why It Is Harmful
Slow CI validation encourages rule-breaking. Developers add `[skip ci]` commitments, merge without waiting for checks, or disable the validation step outright. The comprehensive suite that was supposed to protect documentation quality becomes the reason documentation quality degrades.

### Real-World Consequences
The documentation team adds contract tests for all 80 endpoints. The CI job goes from 30 seconds to 12 minutes. Developers start merging PRs before checks complete. Three weeks later, the lint check finds an invalid OpenAPI spec in production because it was also in the slow job that everyone skipped.

### Preferred Alternative
Split validation into fast checks (lint, breaking change detection, completeness) that run on every commit, and slow checks (full contract test suite) that run nightly or on merge to main.

### Refactoring Strategy
1. Identify all current validation steps and measure their runtime
2. Classify each step as fast (<30s) or slow (>30s)
3. Create two CI jobs: `docs-fast` (on every PR commit) and `docs-slow` (nightly or on merge to main)
4. Make the fast job a required check for merging; make the slow job informational
5. Set monitoring alerts if the slow job fails, so failures are investigated promptly

### Detection Checklist
- [ ] Measure total documentation CI runtime
- [ ] Identify which steps are fast vs slow
- [ ] Verify fast checks are required for PR merge
- [ ] Confirm slow checks run at least nightly
- [ ] Check developer sentiment about CI wait times

### Related Rules
- Split Fast And Slow Validation Checks (05-rules.md)

### Related Skills
- Validate Documentation in CI (06-skills.md)

### Related Decision Trees
- Validation Pipeline Speed — Fast Lint vs Comprehensive Contract Tests (07-decision-trees.md)

---

## Anti-Pattern 4: Happy-Path-Only Contract Testing

### Category
Testing

### Description
Writing contract tests only for success responses (200/201) while ignoring all error responses (400, 401, 403, 404, 422, 429, 500), creating a false sense of documentation accuracy.

### Why It Happens
Success responses are easier to test — they return predictable data. Error responses require additional setup to trigger each error condition, which takes more test code. Teams prioritize happy-path coverage because it has higher "test count" metrics without the effort.

### Warning Signs
- Contract tests exist only for 200/201 responses
- Error status codes in the spec have no corresponding test
- Developers cannot tell you which error schemas are tested
- Error-handling bugs in production are discovered by consumers, not by tests
- Test count includes only success-path assertions

### Why It Is Harmful
The most common cause of consumer integration failure is undocumented or mismatched error schemas. Consumers encounter 422 or 429 on their very first request. If the error shape is wrong, every consumer's error-handling code breaks. Happy-path-only testing creates a documented API that works only when nothing goes wrong — which is never in production.

### Real-World Consequences
The spec documents error responses as `{message: string, code: string}` but the actual API returns `{error: string, status: number}` for 422 errors. The team's contract tests only check the 200 response, so the mismatch is never caught. Every new consumer integration fails on the first validation error, generating support tickets for weeks until the documentation is updated.

### Preferred Alternative
Write contract tests for every error status code documented in the spec, covering at least one failure scenario per status code per endpoint.

### Refactoring Strategy
1. List every error status code documented in the spec per endpoint
2. Write one contract test per status code that triggers that error condition
3. Verify the response body matches the documented error schema exactly
4. Include tests for both validation errors and rate-limit errors (429)
5. Add these error contract tests to the slow-check CI job

### Detection Checklist
- [ ] Count contract tests by status code — verify every documented error status is tested
- [ ] Confirm error response schemas in tests match documented schemas
- [ ] Check that rate-limit (429) and server-error (500) shapes are tested
- [ ] Verify error contract tests actually fail on schema mismatch

### Related Rules
- Run Contract Tests On Error Paths Not Just Happy Paths (05-rules.md)
- Validate Error Response Schemas With Contract Tests (05-rules.md, error-response-documentation)

### Related Skills
- Validate Documentation in CI (06-skills.md)

### Related Decision Trees
- Validation Pipeline Speed — Fast Lint vs Comprehensive Contract Tests (07-decision-trees.md)

---

## Anti-Pattern 5: Spec-As-Afterthought Pipeline

### Category
Code Organization

### Description
Treating the OpenAPI spec as a deploy-time artifact generated once and discarded, with no archival, version traceability, or PR-level validation — making historical debugging and consumer support impossible.

### Why It Happens
Spec generation is often added late in the project lifecycle. The initial mindset is "generate the docs and serve them." No pipeline considers that the spec itself is a deliverable that must be versioned, archived, and traced across releases.

### Warning Signs
- Spec is generated at deploy time and not committed or archived
- No way to retrieve the spec that was active for version v1.3.2
- Consumer reports a bug about the v1.2 spec, team cannot reproduce it
- No CI validation exists for the spec — whatever the generator produces goes to production
- Spec changes between test and production because generation context differs

### Why It Is Harmful
Without archived specs, every consumer bug report about documentation becomes a forensic investigation. The team must re-generate a spec for the old version, hoping the generator state matches what was deployed. Spec reproducibility degrades as dependencies update, making historical diffs impossible.

### Real-World Consequences
A consumer reports that the v1.3 spec's User schema is missing the `phone` field that v1.2 had. The team's generator has changed three times since v1.3 deployed. Regenerating the v1.3 spec today produces a different result. The team cannot determine whether the field was intentionally removed, accidentally dropped by a generator update, or never existed in v1.3 at all.

### Preferred Alternative
Archive every validated spec as a CI artifact tagged with version and build number, and store specs in version control for traceability.

### Refactoring Strategy
1. Add a CI step that uploads the validated spec as an artifact tagged with build number
2. Optionally commit the generated spec to a `specs/` directory alongside the code
3. Tag archival spec paths with release version (e.g., `specs/v1.3.0/openapi.yaml`)
4. Create a spec index file that maps version numbers to artifact locations
5. Document the archival process so support teams know where to find historical specs

### Detection Checklist
- [ ] Check whether the current spec build archives its output
- [ ] Verify specs from past releases are retrievable
- [ ] Confirm spec archival is part of the deployment pipeline
- [ ] Test that regenerating an old version's spec produces the same output as the archived original

### Related Rules
- Store Validated Spec As A CI Artifact (05-rules.md)

### Related Skills
- Validate Documentation in CI (06-skills.md)

### Related Decision Trees
- (No directly related decision tree)

---

