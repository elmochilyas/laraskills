# Rules: Pint Presets

## Metadata
- **Source KU:** pint-presets
- **Subdomain:** Code Quality
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- PPRES-RULE-001: **Use laravel preset for Laravel projects** — Code looks like it belongs in the ecosystem.
- PPRES-RULE-002: **Use PSR-12 for framework-agnostic libraries** — Strict PHP-FIG compliance.
- PPRES-RULE-003: **Use PER for modern PHP projects** — Evolution of PSR-12 with latest conventions.
- PPRES-RULE-004: **Use Symfony for Symfony projects** — Symfony framework coding standards.
- PPRES-RULE-005: **Start with preset, add minimal overrides** — 3-5 custom rules for strong team preferences.
- PPRES-RULE-006: **Full format on preset change** — Run `pint` on whole codebase after switching presets.

## Decision Rules
- PPRES-RULE-007: **Always set preset explicitly** — Never rely on implicit default (`laravel`).
- PPRES-RULE-008: **Cross-project consistency** — Use same preset across all organization Laravel projects.
- PPRES-RULE-009: **Avoid full custom rulesets** — Use preset + minimal overrides instead of defining rules from scratch.
