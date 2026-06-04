# ECC Standardized Knowledge — Breaking Change Identification

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Versioning |
| Knowledge Unit | Breaking Change Identification |
| Difficulty | Advanced |
| Category | Governance |
| Last Updated | 2026-06-02 |

## Overview

Identifying breaking changes is critical to API stability. This KU provides a systematic framework, checklist, and code-level analysis for detecting breaking changes before they reach production. Breaking changes span four categories: field changes (removal, rename, type change), behavior changes (timing, error behavior, side effects), contract changes (endpoint removal, method change, auth requirement changes), and semantic changes (field meaning changes without structure changes). Automated OpenAPI spec diff combined with manual review provides the best detection coverage.

## Core Concepts

- **Field Breaking Changes**: Removal, rename, type change, semantic change, default value change
- **Behavior Breaking Changes**: Timing changes, error behavior changes, side effect modifications
- **Contract Breaking Changes**: Endpoint removal, method change, authentication requirement changes
- **Semantic Breaking Changes**: Field meaning changes without structure changes
- **OpenAPI Spec Diff**: Automated comparison of paths, schemas, parameters, responses between releases
- **Hyrum's Law**: Given enough consumers, all behaviors are depended on by someone

## When To Use

- Every PR that modifies API behavior or response structure
- Pre-release validation before deploying to production
- When evaluating existing APIs for version bump decisions
- CI pipeline as a pre-merge gate

## When NOT To Use

- Internal code refactoring with no consumer-visible changes
- Documentation-only changes
- Changes to non-API code (background jobs, CLI commands)

## Best Practices

- **Run automated OpenAPI spec diff in CI** as a pre-merge gate.
- **Maintain a breaking change checklist** code-reviewed for every PR.
- **Use snapshot testing** of API responses against known-good baselines.
- **Categorize breaking changes** in changelog: `BREAKING`, `feat`, `fix`, `chore` with CI enforcement.
- **Maintain a "known breaking changes" log** for intentional version bumps.
- **Run breaking change detection as a pre-release step**, not just pre-commit.

## Architecture Guidelines

- The most common breaking change is subtle: a behavioral change in a conditional code path that only manifests for specific inputs.
- Automated detection + manual review are both necessary — neither alone is sufficient.
- Use OpenAPI spec as the single source of truth for contract comparison.
- Breaking classification feeds into semantic versioning: breaking → MAJOR, additions → MINOR, fixes → PATCH.

## Performance Considerations

- Automated diff runs in CI, not at runtime — zero production impact.
- Snapshot tests add ~50ms per endpoint in the test suite.
- Response comparison tools run during staging deployment, ~100ms per comparison.

## Security Considerations

- Authentication/authorization changes are breaking — test that security policies don't change unintentionally.
- Breaking changes that affect error responses can hide security-related errors from consumers.
- Ensure breaking change detection includes audit log and security header changes.

## Common Mistakes

- Only checking field structure, not field semantics (e.g., `active: 1` vs `active: true`).
- Missing behavior changes: pagination limit changed, sort order changed.
- Assuming adding an enum value is safe (some clients use exhaustive switch).
- Not checking error response shape changes (error format changes break error handling).

## Anti-Patterns

- **No automated detection**: Relying entirely on manual code review to catch breaking changes.
- **False positive fatigue**: Overly strict automated detection that produces too many false positives, causing developers to ignore warnings.
- **Semantic blindness**: Not catching changes where field name and type are the same but meaning changed (e.g., `price` was including tax, now excluding).

## Examples

```php
// CI breaking change detection (pseudocode)
$diff = OpenApiDiff::compare('openapi-v1.yaml', 'openapi-v2.yaml');
$breakingChanges = $diff->getBreakingChanges();

if ($breakingChanges->isNotEmpty()) {
    echo "Breaking changes detected:";
    foreach ($breakingChanges as $change) {
        echo "- {$change->description()}";
    }
    exit(1); // Block CI
}
```

## Related Topics

- **Prerequisites**: rest-api-design, crud-architecture, resource-controllers
- **Siblings**: backward-compatible-changes, semantic-versioning-for-apis
- **Advanced**: Consumer contract testing, API compatibility radar

## AI Agent Notes

- The most common breaking change is not field removal — it's a subtle behavioral change in a conditional code path that only manifests for specific inputs.
- Hyrum's Law: no matter how carefully you classify "non-breaking" changes, some consumer somewhere depends on the old behavior. The goal is zero surprise breakage.
- Laravel has no built-in breaking change detection — use `openapi-diff` or `oasdiff` in CI.

## Verification

- [ ] Automated OpenAPI spec diff runs in CI for every PR
- [ ] Breaking change checklist reviewed for every API change
- [ ] Snapshot tests exist for critical API responses
- [ ] Breaking changes are categorized and logged in changelog
- [ ] Breaking change registry maintained with rationale and migration path
- [ ] Post-release monitoring in place to detect unexpected consumer breakage
