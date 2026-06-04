# Breaking Change Identification — Phase 2: Implementation

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Versioning
- **Last Updated:** 2026-06-02

## Executive Summary
Identifying breaking changes is critical to API stability. Phase 2 provides a systematic framework, checklist, and code-level analysis for detecting breaking changes before they reach production, covering field changes, type changes, behavior changes, and contract modifications.

## Core Concepts
- **Field Breaking Changes:** Removal, rename, type change, semantic change, default value change.
- **Behavior Breaking Changes:** Timing changes, error behavior changes, side effect modifications.
- **Contract Breaking Changes:** Endpoint removal, method change, authentication requirement changes.
- **Semantic Breaking Changes:** Field meaning changes without structure changes.

## Mental Models
- **Jenga Tower:** Each breaking change is pulling a piece from a Jenga tower. The tower might not fall immediately, but eventually it will. Multiple non-breaking changes can accumulate into a breaking situation.
- **Contract Law:** The API is a contract. Breaking changes are contract violations. Some violations are obvious (removing a clause), some are subtle (redefining terms).

## Internal Mechanics
- OpenAPI spec comparison: diff `paths`, `schemas`, `parameters`, `responses` between releases.
- Type checker: PHP type hints change → breaking. Nullable added → not breaking. Nullable removed → breaking.
- Response comparison tool: hit V1 and candidate endpoints, JSON-diff the response.
- Enum diff: values added → non-breaking, values removed → breaking, values reordered → potentially breaking.

## Patterns
- Breaking change checklist code-reviewed for every PR.
- Automated OpenAPI spec diff in CI.
- Snapshot testing of API responses against known-good baselines.
- Changelog categories: `BREAKING`, `feat`, `fix`, `chore` with CI enforcement.

## Architectural Decisions

| Decision | Option | Rationale |
|----------|--------|-----------|
| Detection method | Automated diff + manual review | Both are necessary |
| Enforcement timing | CI gate for pre-merge | Catches before release |
| Spec source | OpenAPI as source of truth | Single contract reference |
| Breaking classification | Major vs minor in commit messages | Feeds semantic versioning |

## Tradeoffs

| Aspect | Pros | Cons |
|--------|------|------|
| Strict automated detection | No surprises | False positives on safe changes |
| Relaxed manual review | Context-aware | Human error, missed breaks |
| Snapshot testing | High confidence | Fragile tests |
| Spec-only diff | Fast | Misses behavior changes |

## Performance Considerations
- Automated diff runs in CI, not at runtime.
- Snapshot tests run in test suite, add ~50ms per endpoint.
- Response comparison tool runs during staging deployment, ~100ms per comparison.

## Production Considerations
- Run breaking change detection as a pre-release step, not pre-commit.
- Maintain a "known breaking changes" log for intentional version bumps.
- Categorize breaking changes: consumer-visible vs internal-only.
- Use a PR label `breaking` to trigger special CI workflow.

## Common Mistakes
- Only checking field structure, not field semantics (e.g., `active: 1` vs `active: true`).
- Missing behavior changes: pagination limit changed, sort order changed.
- Assuming adding an enum value is safe (some clients use exhaustive switch).
- Not checking error response shape changes (error format changes break error handling).

## Failure Modes
- **False negative:** Breaking change that isn't caught by automated tools.
- **False positive:** Non-breaking change flagged as breaking, slowing releases.
- **Semantic break:** Field name and type unchanged, but meaning changed (e.g., `price` was including tax, now excluding).
- **Conditional break:** New code path throws a different exception type for edge cases.

## Ecosystem Usage
- **Stripe:** Uses OpenAPI spec diff as a CI gate before any release.
- **GitHub:** Publishes breaking changes in a dedicated changelog section with migration guides.
- **Shopify:** Automated breaking change detection with manual approval gate.

## Related Knowledge Units

### Prerequisites
- rest-api-design
- crud-architecture
- resource-controllers

### Related Topics
- Backward-compatible changes
- Semantic versioning for APIs

### Advanced Follow-up Topics
- Consumer contract testing
- API compatibility radar

## Research Notes
### Source Analysis
Stripe's "API Upgrades" guide (2023) and GitHub's "Breaking Changes" policy (2022) are primary references. The JSON Schema specification (2020-12) provides the structural analysis framework.

### Key Insight
The most common breaking change is not field removal — it's a subtle behavioral change in a conditional code path that only manifests for specific inputs.

### Version-Specific Notes
PHP 8.3+ type system changes (e.g., `true` type, `false` type) can introduce subtle breaking changes in resource responses. Test type coercion explicitly.
