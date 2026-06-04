# Rules: Composer Path Repository Usage

## Metadata
- **Source KU:** composer-path-repository-usage
- **Subdomain:** Monorepo Management
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- PATH-RULE-001: **Use relative paths** — Define path repos with relative paths (`"packages/*"`). Absolute paths break for other developers.
- PATH-RULE-002: **Never commit path repos to production** — Lock files contain local paths that don't exist on production servers. Strip path repo config during build.
- PATH-RULE-003: **Use * version constraint** — In root composer.json, use `"*"` for monorepo packages. Path repo provides actual resolution.
- PATH-RULE-004: **Validate with remote resolution in CI** — Add CI job that resolves without path repos to catch issues early.
- PATH-RULE-005: **Handle lock file portability** — Regenerate lock in CI, use env-specific lock files, or configure `COMPOSER_ROOT_VERSION`.

## Architecture Rules
- PATH-RULE-006: **Repository definition** — Root composer.json: `"repositories": [{"type": "path", "url": "packages/*"}]`.
- PATH-RULE-007: **Replace pattern** — Use `"replace"` to declare local packages replace remote equivalents, preventing download from Packagist.
- PATH-RULE-008: **CI vs production** — Use path repos in CI for speed. Separate CI job for remote resolution validation.

## Security Rules
- PATH-RULE-009: **No secrets in path repos** — Path-referenced packages may expose source code. Ensure no credentials or secrets.
- PATH-RULE-010: **Strip path config for production** — Validate production dependency resolution separately.

## Common Mistakes
- PATH-RULE-011: **Committing path repo lock file to production** — `composer install` fails with "path not found".
- PATH-RULE-012: **Not using path repos in development** — Developers manually symlink or run composer update repeatedly.
- PATH-RULE-013: **Version constraint mismatch** — Path repos override version constraints. Keep local version aligned with expected constraint.

## Anti-Pattern Rules
- PATH-RULE-014: **Avoid production path repos** — Path repository config committed and deployed to production will fail.
- PATH-RULE-015: **Avoid symlink sprawl** — Every package pointing to random directories. Centralize path repos in monorepo root.
- PATH-RULE-016: **Avoid ignored lock file** — Lock files should be committed and managed, not ignored.
