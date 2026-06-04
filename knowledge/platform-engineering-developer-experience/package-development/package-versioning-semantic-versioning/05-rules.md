# Rules: Package Versioning & Semantic Versioning

## Metadata
- **Source KU:** package-versioning-semantic-versioning
- **Subdomain:** Package Development
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- SEMVER-RULE-001: **Strict SemVer discipline** — Breaking changes in MINOR/PATCH silently break consumer code and erode trust. MAJOR only for breaking changes.
- SEMVER-RULE-002: **Specify Laravel/PHP constraints** — Always declare `require` constraints for Laravel and PHP in composer.json. Without them, incompatible versions may be installed.
- SEMVER-RULE-003: **Git tag every release** — `git tag v1.2.3` for every release. Without tags, Composer can't resolve versions.
- SEMVER-RULE-004: **Changelog-driven versioning** — Update CHANGELOG.md before each release. Version number emerges from changelog content.
- SEMVER-RULE-005: **Deprecate before removal** — Deprecate APIs for one full MAJOR cycle. Use `@deprecated` annotations in MINOR versions, remove in next MAJOR.

## Architecture Rules
- SEMVER-RULE-006: **Laravel version alignment** — Consider aligning package MAJOR with Laravel's MAJOR when tightly coupled.
- SEMVER-RULE-007: **LTS alignment** — Align version support with Laravel's LTS releases. Backport security fixes to LTS-compatible versions.
- SEMVER-RULE-008: **Tag convention** — Use `v` prefix for Git tags (e.g., `v1.2.3`). Composer strips the prefix and parses SemVer.
- SEMVER-RULE-009: **Commit composer.lock** — Ensures consistent dev and CI environments for package development.

## Security Rules
- SEMVER-RULE-010: **Security releases are PATCH** — Release PATCH with only the security fix. Delay detailed disclosure per responsible disclosure (30-90 days).
- SEMVER-RULE-011: **YANK vulnerable versions** — Mark versions as abandoned if critical security issue. New installs prevented.

## Common Mistakes
- SEMVER-RULE-012: **^ constraint with pre-1.0** — `^0.3` resolves as `<0.4`, not `<1.0`. Pre-1.0 SemVer differs from post-1.0.
- SEMVER-RULE-013: **Breaking changes in MINOR/PATCH** — Most common complaint in Laravel package ecosystem. Erodes trust.
- SEMVER-RULE-014: **Not tagging releases** — Composer can't resolve version. Stale or wrong versions installed.

## Anti-Pattern Rules
- SEMVER-RULE-015: **Avoid SemVer as marketing** — Using MAJOR as "market position" indicator rather than reflecting breaking changes.
- SEMVER-RULE-016: **Avoid major version churn** — Releasing MAJOR every month. Consumers stop updating.
- SEMVER-RULE-017: **Avoid silent breaking changes** — Changing public API without MAJOR bump because "no one uses that method."
