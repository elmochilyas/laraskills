# Phase 5: Rules — Documentation CI Validation

## Lint The OpenAPI Spec On Every PR
---
## Category
Testing
---
## Rule
Run `npx @redocly/cli lint` (or equivalent) on the OpenAPI spec for every pull request that modifies routes or schema files.
---
## Reason
Syntax errors, missing required fields, and structural violations silently accumulate without CI enforcement. A 5-second lint check catches YAML indentation bugs, invalid `$ref` targets, and missing required fields before they reach consumers.
---
## Bad Example
No lint step in CI. A PR introduces a spec with tab-indented YAML. The spec fails to parse in production, and docs go down.
---
## Good Example
```yaml
name: Lint OpenAPI Spec
on: pull_request
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx @redocly/cli lint openapi.yaml --ruleset=recommended
```
---
## Exceptions
Prototype APIs with no published spec; add linting before the first external consumer is onboarded.
---
## Consequences Of Violation
Invalid specs are deployed; documentation renderers fail; consumers cannot import the spec into their tooling.
---

## Run Breaking Change Detection Against The Previous Version
---
## Category
Reliability
---
## Rule
On every PR, diff the proposed spec against the latest released spec. Block PRs that introduce breaking changes without a version bump.
---
## Reason
Breaking changes that slip through code review into the spec are discovered by consumers at runtime. Automated breaking change detection catches removed paths, changed response types, and new required fields before deployment.
---
## Bad Example
A PR removes the `name` field from the User response. No diff check. The change deploys and existing consumers break.
---
## Good Example
```yaml
- run: npx @redocly/cli compare openapi-latest.yaml openapi.yaml --format markdown >> breaking-changes.md
- run: |
    if grep -q "breaking" breaking-changes.md; then
      echo "Breaking changes detected without version bump"
      exit 1
    fi
```
---
## Exceptions
Major version branches where breaking changes are expected; validate against the branch's previous release instead.
---
## Consequences Of Violation
Breaking changes deploy silently; consumer integrations break; emergency rollouts or hotfixes required.
---

## Validate Changelog Entry For Route-Modifying PRs
---
## Category
Testing
---
## Rule
Block PRs that modify API route files unless they include a corresponding changelog entry.
---
## Reason
Route modifications are consumer-facing by definition. Without mandatory changelog validation, documentation teams must reverse-engineer what changed at release time, leading to incomplete or inaccurate changelogs.
---
## Bad Example
A PR adds three new endpoints and modifies two existing ones. No changelog entry. The release ships without consumers knowing what changed.
---
## Good Example
```yaml
- run: |
    if git diff --name-only origin/main | grep -q "routes/"; then
      if ! grep -q "CHANGELOG.md" <<< "$(git diff --name-only origin/main)"; then
        echo "Add a changelog entry for route changes"
        exit 1
      fi
    fi
```
---
## Exceptions
Internal route refactors that do not alter URL, method, or schema behavior.
---
## Consequences Of Violation
Changelogs are incomplete; consumers are not notified of new or changed endpoints; documentation trust erodes.
---

## Run Contract Tests On Error Paths Not Just Happy Paths
---
## Category
Testing
---
## Rule
Contract-test error responses (400, 401, 403, 404, 422, 429, 500) in addition to success responses.
---
## Reason
Happy-path-only contract testing gives a false sense of documentation accuracy. The most common cause of consumer integration failure is undocumented or mismatched error schemas. Error path testing catches schema drift for the responses consumers actually encounter first.
---
## Bad Example
```javascript
// Only tests 200 response
dredd.assert.equal(response.statusCode, 200);
```
---
## Good Example
```javascript
// Tests error paths
dredd.assert.equal(response.statusCode, 422);
dredd.assert.jsonSchema(response.body, errorSchema);
```
---
## Exceptions
No common exceptions. Every error status code in the spec should be contract-tested.
---
## Consequences Of Violation
Error response schemas drift from documentation; consumers write error handlers against documented schemas that don't match reality.
---

## Store Validated Spec As A CI Artifact
---
## Category
Reliability
---
## Rule
Archive each build's validated OpenAPI spec as a CI artifact tagged with the build number or version.
---
## Reason
Historical traceability requires access to the exact spec that was deployed at each release. Without archived artifacts, post-mortem analysis and spec diff comparisons rely on re-generation, which may differ from what was actually deployed.
---
## Bad Example
Spec is generated at deploy time and not archived. When a consumer reports a bug about the v1.2 spec, the team cannot reproduce the exact state of the spec that was published.
---
## Good Example
```yaml
- run: openapi-generator-cli validate -i openapi.yaml
- uses: actions/upload-artifact@v4
  with:
    name: openapi-spec-${{ github.sha }}
    path: openapi.yaml
```
---
## Exceptions
No common exceptions. Artifact storage is cheap; the traceability value is high.
---
## Consequences Of Violation
Cannot reproduce past spec states; consumer-reported spec bugs cannot be investigated; audit trail is incomplete.
---

## Split Fast And Slow Validation Checks
---
## Category
Performance
---
## Rule
Run fast checks (lint, completeness, breaking change detection) on every commit. Run slow checks (full contract test suite) nightly or on merge to main.
---
## Reason
A 15-minute CI validation step causes developers to bypass or disable checks. Fast checks catch 90% of issues in seconds. Slow checks catch the remaining 10% without blocking the development workflow.
---
## Bad Example
```yaml
# Single job: lint + contract tests (12 minutes)
# Developers start skipping CI because of wait times
```
---
## Good Example
```yaml
jobs:
  fast-checks:
    runs-on: ubuntu-latest
    steps:
      - run: npx @redocly/cli lint openapi.yaml  # 5 seconds
  slow-checks:
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: npm run contract-tests  # 10 minutes
```
---
## Exceptions
APIs with fewer than 10 endpoints where slow checks still complete in under 30 seconds.
---
## Consequences Of Violation
Developers disable CI validation due to long wait times; documentation quality regresses; slow checks run so rarely they fail due to environment drift.
---
