# Rules: Local Environment Setup Documentation

## Metadata
- **Source KU:** local-environment-setup-documentation
- **Subdomain:** Onboarding and Standards
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- SETUPDOC-RULE-001: **CI-verify setup instructions** — Run setup steps from fresh checkout in CI on every release.
- SETUPDOC-RULE-002: **Provide automated script alongside manual steps** — Script for speed; manual steps for education.
- SETUPDOC-RULE-003: **Cover all major platforms** — macOS, WSL2, Linux. Use platform tabs or collapsible sections.
- SETUPDOC-RULE-004: **Include troubleshooting before it's needed** — Document common problems with solutions.
- SETUPDOC-RULE-005: **Verification after each major step** — Each step should have a verification command.

## Architecture Rules
- SETUPDOC-RULE-006: **Location:** README.md for small projects; SETUP.md for detailed multi-platform instructions.
- SETUPDOC-RULE-007: **Quick start:** Minimal 5-10 line guide. Detailed instructions in collapsible sections.
- SETUPDOC-RULE-008: **Structure:** Prerequisites → Quick Start → Platform-Specific → Verification → Troubleshooting.
- SETUPDOC-RULE-009: **Avoid screenshots** — Use text descriptions and commands. Screenshots become outdated.

## Decision Rules
- SETUPDOC-RULE-010: **Use for any Laravel project with >1 developer** or open-source.
- SETUPDOC-RULE-011: **Skip for single-developer projects** with trivial setup.
