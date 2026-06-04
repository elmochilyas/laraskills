# Rules: Pint in CI

## Metadata
- **Source KU:** pint-in-ci
- **Subdomain:** Workflow Automation
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- PINTICI-RULE-001: **Use `--test` mode** for internal team projects; auto-fix mode for open-source with external contributors.
- PINTICI-RULE-002: **Run Pint as separate job before slower test jobs** — Catches style issues in 1-5s before 10min test wait.
- PINTICI-RULE-003: **Commit pint.json** — Without it, CI and local Pint may use different configurations.
- PINTICI-RULE-004: **Pin Pint version** in composer.json — Different versions have different default rules.
- PINTICI-RULE-005: **Use "laravel" preset as default** — Matches Laravel framework's own coding style.

## Architecture Rules
- PINTICI-RULE-006: **GitHub Actions check pattern:** Separate job running `./vendor/bin/pint --test` after composer install.
- PINTICI-RULE-007: **Early exit pattern:** Pint job runs before test jobs via `needs:`; catches issues in 1-5s.
- PINTICI-RULE-008: **Branch protection** must require Pint check to pass before merging.

## Decision Rules
- PINTICI-RULE-009: **Use for every Laravel project with multiple contributors** — Eliminates style inconsistency.
- PINTICI-RULE-010: **Use for open-source projects** where external contributors may have different IDE configs.
- PINTICI-RULE-011: **Skip for solo projects** where single developer controls their own formatting.
