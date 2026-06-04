# Rules: Private Packagist / Satis Setup

## Metadata
- **Source KU:** private-packagist-satis-setup
- **Subdomain:** Package Development
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- PRIVATE-RULE-001: **List private registry first** — In `composer.json` `repositories` array, list private registry before Packagist.org to prevent resolution conflicts.
- PRIVATE-RULE-002: **auth.json outside version control** — Add to `.gitignore`. Use `COMPOSER_AUTH` environment variable in CI.
- PRIVATE-RULE-003: **Organizational package prefix** — Use vendor prefix (e.g., `org-name/package-name`) to distinguish from public packages.
- PRIVATE-RULE-004: **Automate Satis builds** — Run `satis build` via CI on each push to package repos. Stale builds serve outdated versions.

## Architecture Rules
- PRIVATE-RULE-005: **Private Packagist for features** — SaaS with team management, webhooks, security scanning. Recommended over self-hosted Satis for most teams.
- PRIVATE-RULE-006: **Satis for air-gapped** — Open-source static generator. Self-hosted. Archive generation required for fast installs.
- PRIVATE-RULE-007: **Archive generation** — Configure archive generation in `satis.json`. Pre-built archives dramatically reduce install time vs Git cloning.
- PRIVATE-RULE-008: **Composite repository pattern** — Use `type: composit` for multiple repository URLs enabling gradual migration.

## Security Rules
- PRIVATE-RULE-009: **Auth in CI securely** — Use `COMPOSER_AUTH` as CI secret. Dedicated CI users with minimum permissions.
- PRIVATE-RULE-010: **Rotate API tokens regularly** — Separate tokens for CI and development. Monitor expiry dates.
- PRIVATE-RULE-011: **Restrict Satis web server** — Add authentication to Satis output. Don't expose internal packages publicly.

## Common Mistakes
- PRIVATE-RULE-012: **Private registry after Packagist.org** — Composer finds public packages first. Wrong version installed if names conflict.
- PRIVATE-RULE-013: **Committing auth.json** — Credentials exposed to all repo users and present in Git history.
- PRIVATE-RULE-014: **Not building Satis on schedule** — Registry serves stale package versions. Consumers install outdated packages.
- PRIVATE-RULE-015: **Missing archive config** — Composer clones Git repos on each install. Slows CI/CD significantly.

## Anti-Pattern Rules
- PRIVATE-RULE-016: **Avoid path repos for distribution** — Only work locally and require same filesystem. Not for team distribution.
- PRIVATE-RULE-017: **Avoid no auth for Satis** — Anyone can access internal packages. Always add authentication to web server.
- PRIVATE-RULE-018: **Avoid publishing internal packages publicly** — Just for convenience? Exposes proprietary code.
