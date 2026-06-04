# ECC Standardized Knowledge — Semantic Versioning for APIs

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Versioning |
| Knowledge Unit | Semantic Versioning for APIs |
| Difficulty | Advanced |
| Category | Architecture |
| Last Updated | 2026-06-02 |

## Overview

Semantic versioning (SemVer) for APIs applies the MAJOR.MINOR.PATCH convention to API contracts. This KU covers defining what each level means for API consumers, implementing version detection, choosing between URL path major versions and header/sub-version approaches, and tooling for automated version calculation. API SemVer differs from library SemVer in one critical way: an API PATCH changes only the implementation behavior (bug fix), never the contract. Any contract change is at least MINOR.

## Core Concepts

- **MAJOR**: Breaking change — new version required (new URL or header)
- **MINOR**: Backward-compatible addition — new fields, new endpoints, relaxed validation
- **PATCH**: Bug fix — no contract change, transparent to consumers
- **Pre-release identifiers**: `-alpha`, `-beta`, `-rc.1` for preview versions
- **Version Compatibility Declaration**: Documented guarantees per version level
- **Version manifest**: `config('api.version')` with `major`, `minor`, `patch`

## When To Use

- Any API with formal versioning and compatibility promises
- APIs consumed by third-party developers relying on version signals
- Teams using conventional commits to automate version bumps
- APIs with long-term support (LTS) version policies

## When NOT To Use

- Internal-only APIs with single consumer
- Prototypes and experimental APIs
- Date-based versioning (e.g., Stripe's `2023-08-16`) is an alternative

## Best Practices

- **URL version scope is MAJOR only**: `/api/v1` — keeps URL stable within a major.
- **Communicate MINOR via changelog or response header**: Avoid URL clutter.
- **PATCH releases are transparent**: Deployable without any consumer communication.
- **Use automated version detection**: OpenAPI diff in CI determines version bump (breaking → MAJOR, new fields → MINOR, no changes → PATCH).
- **Publish a version compatibility table** in API documentation.
- **Maintain a version changelog** mapping API versions to release dates and changes.

## Architecture Guidelines

- API SemVer applies to the contract, not the implementation — a library patch may be an API MAJOR.
- CI enforces conventional commit prefixes and maps them to version bumps.
- Version compatibility declared in the API root endpoint: `GET /api` returns supported versions and their status.
- LTS versions get extended support windows (24 months recommended).

## Performance Considerations

- OpenAPI diff for version detection runs in CI — zero runtime cost.
- Version header injection adds negligible overhead (~0.01ms).
- `config('api.version')` reads are cached by Laravel config — O(1).

## Security Considerations

- PATCH releases should be deployable without consumer communication but security patches should be announced.
- Ensure LTS versions continue to receive security updates.
- Version ambiguity (misaligned version numbers) can lead to consumers running on unpatched versions.

## Common Mistakes

- Bumping MAJOR for internal refactors that don't change the contract.
- Bumping MINOR for breaking changes to avoid the MAJOR version conversation.
- Inconsistent version bumping across microservices.
- Not documenting what the version numbers mean for your specific API.

## Anti-Patterns

- **Version inflation**: MAJOR bumped too frequently → consumers ignore version signals.
- **Version stagnation**: Fear of MAJOR bumps leads to breaking changes shipped as MINOR.
- **No automated enforcement**: Developers claim to follow SemVer but CI doesn't enforce it.

## Examples

```php
// config/api-version.php
return [
    'current' => ['major' => 2, 'minor' => 3, 'patch' => 1],
    'supported_versions' => ['v1', 'v2'],
    'deprecated_versions' => ['v0' => ['deprecated_at' => '2025-01-01']],
];

// CI version bump rule
// feat!: remove field → MAJOR bump
// feat: add field → MINOR bump
// fix: resolve timeout → PATCH bump
```

## Related Topics

- **Prerequisites**: rest-api-design, crud-architecture, resource-controllers
- **Siblings**: breaking-change-identification, when-to-create-new-version
- **Advanced**: Automated version calculation, API compatibility policies

## AI Agent Notes

- API SemVer differs from library SemVer: an API PATCH changes only implementation behavior, never the contract.
- Stripe's date-based versioning is a notable SemVer adaptation for APIs.
- Laravel has no built-in SemVer for APIs — implement version manifest manually or via dedicated packages.

## Verification

- [ ] MAJOR/MINOR/PATCH definitions documented for the API
- [ ] URL version reflects MAJOR only
- [ ] Automated OpenAPI diff in CI determines version bumps
- [ ] Version manifest maintained and published
- [ ] Changelog maps API versions to release dates and changes
- [ ] LTS version policy defined (if applicable)
