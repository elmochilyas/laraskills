# Rules: Code Review Standards

## Metadata
- **Source KU:** code-review-standards
- **Subdomain:** Workflow Automation
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- CR-RULE-001: **Focus human review on logic, architecture, correctness** — Automate style (Pint) and types (PHPStan) in CI.
- CR-RULE-002: **Use Issue + Suggestion + Why format** — Describe what's wrong, suggest how to fix, explain why.
- CR-RULE-003: **Enforce PR size limit (400 lines)** — PRs over 400 lines have higher defect rates.
- CR-RULE-004: **Target <4 hour review turnaround** — Fast review teams ship 50% more features.
- CR-RULE-005: **Prefix non-blocking nits with "nit:"** — Distinguishes from blocking issues.
- CR-RULE-006: **Assign 1-2 reviewers max per PR** — Too many reviewers = no one feels responsible.

## Architecture Rules
- CR-RULE-007: **Review depth levels:** Bug fix (Light, 5-10min), Feature (Standard, 20-30min), Architecture (Deep, 30-60min).
- CR-RULE-008: **CODEOWNERS pattern** — Auto-assigns domain experts based on file paths.
- CR-RULE-009: **1 approval for standard PRs; 2 for architectural changes.**
- CR-RULE-010: **Squash merge** for clean main branch history (one commit per PR).

## Decision Rules
- CR-RULE-011: **Use for every team with 2+ developers** — Essential for knowledge sharing and quality.
- CR-RULE-012: **Skip for solo projects** where self-review replaces formal process.
- CR-RULE-013: **Every PR deserves genuine review** regardless of author seniority.
