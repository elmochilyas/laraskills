# Rules: PHP Version Management

## Metadata
- **Source KU:** php-version-management
- **Subdomain:** Development Environments
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- PHPVER-RULE-001: **Match production exactly** — Prevents version-dependent bugs from reaching production.
- PHPVER-RULE-002: **CI matrix testing** — Test against multiple PHP versions even if dev uses one.
- PHPVER-RULE-003: **Use Sail for version isolation** — Each project gets its own PHP version via Docker.
- PHPVER-RULE-004: **Rebuild after version change** — `sail build --no-cache` after changing `PHP_VERSION`.
- PHPVER-RULE-005: **Check Laravel compatibility** — L11 requires 8.2+, L10 requires 8.1+.
- PHPVER-RULE-006: **Monitor EOL dates** — PHP 8.1 EOL Dec 2025; plan upgrades before EOL.

## Decision Rules
- PHPVER-RULE-007: **Default to PHP 8.3 for new Laravel projects** (current stable).
- PHPVER-RULE-008: **Use latest PHP only if production supports it** — New features cause deployment issues if prod is behind.
