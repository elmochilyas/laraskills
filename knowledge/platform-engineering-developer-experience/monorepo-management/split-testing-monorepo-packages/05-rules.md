# Rules: Split Testing for Monorepo Packages

## Metadata
- **Source KU:** split-testing-monorepo-packages
- **Subdomain:** Monorepo Management
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- SPLIT-RULE-001: **Split on tags, not commits** — Tag-based splits keep operations intentional and infrequent. Use `{package-name}/{semver}` convention.
- SPLIT-RULE-002: **Validate before splitting** — Only split after monorepo CI passes. Splitting a broken package pushes failure to consumers.
- SPLIT-RULE-003: **Protect split repository branches** — Force-pushes from split tool should be the only changes. Direct commits will be overwritten.
- SPLIT-RULE-004: **Design for per-package resilience** — If one split fails (network/auth issue), remaining packages should still split successfully.
- SPLIT-RULE-005: **Validate split output** — Verify split repo has expected files, valid composer.json, complete package structure.

## Architecture Rules
- SPLIT-RULE-006: **Split configuration** — `monorepo-builder.php` defines directory → repository mappings.
- SPLIT-RULE-007: **Tag convention** — `{package-name}/{version}` (e.g., `laravel-api/1.2.0`). Split tool detects tag prefix.
- SPLIT-RULE-008: **Split trigger** — Tag push → CI workflow runs split → pushes to all target repositories.
- SPLIT-RULE-009: **CI chain** — Monorepo tag → split → split repo push → split repo CI → Packagist publication.
- SPLIT-RULE-010: **History preservation** — Use `git subtree split --rejoin` for squashed history preserving meaningful commits.

## Security Rules
- SPLIT-RULE-011: **Authentication** — SSH key or GitHub token with push access to all split repos. Deploy keys per repo or machine user.
- SPLIT-RULE-012: **Branch protection** — Protect split repo main branches. Only force-pushes from split tool. Disable direct pushes and PR merges.
- SPLIT-RULE-013: **Split audit** — Log all split operations with timestamp, package, result. Monitor for unauthorized splits.

## Performance Rules
- SPLIT-RULE-014: **Split duration: 5-30 min** — For large repos with 5000+ commits and 10 packages. Primary bottleneck is `git subtree split`.
- SPLIT-RULE-015: **Run split once per successful release** — Not per commit. For weekly releases, split runs once per week.

## Common Mistakes
- SPLIT-RULE-016: **Splitting on every commit** — Wasted CI resources, split repository churn, frequent timeout failures.
- SPLIT-RULE-017: **No split validation** — Package missing files or broken autoloading goes unnoticed.
- SPLIT-RULE-018: **Conflicting tag names** — Two packages with same version string (`v1.0.0`). Use prefix convention.
- SPLIT-RULE-019: **Splitting without CI pass** — Breaking change pushed to package repos.
- SPLIT-RULE-020: **Manual changes to split repos** — Next split overwrites or conflicts. Monorepo is single source of truth.

## Anti-Pattern Rules
- SPLIT-RULE-021: **Avoid split-on-push pipeline** — Every push triggers full split. CI costs explode. Use tag-based triggers.
- SPLIT-RULE-022: **Avoid untested split** — Split immediately after merge without CI. Broken packages published.
- SPLIT-RULE-023: **Avoid snowflake split repo** — Accumulated custom branches and direct commits. Next split overwrites.
- SPLIT-RULE-024: **Avoid manual split process** — Engineer runs split locally and manually pushes. Not repeatable, not auditable.
- SPLIT-RULE-025: **Avoid split-and-forget** — Split succeeds but no one monitors. Packages may be broken. Add post-split validation.
