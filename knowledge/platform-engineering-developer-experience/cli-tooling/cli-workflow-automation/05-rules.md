# Rules: CLI Workflow Automation

## Metadata
- **Source KU:** cli-workflow-automation
- **Subdomain:** CLI Tooling
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- CLIWA-RULE-001: **Guard clauses** — Check prerequisites before each step; fail early with clear messages.
- CLIWA-RULE-002: **Fail-fast for CI** — Halt on first failure with non-zero exit code; use `&&` chaining.
- CLIWA-RULE-003: **Idempotency** — Each step should be safe to re-run; check state before acting.
- CLIWA-RULE-004: **Structured logging** — Log every step with timestamp, exit code, output.
- CLIWA-RULE-005: **Environment detection** — Adjust behavior based on environment (verbose locally, quiet in CI).
- CLIWA-RULE-006: **Bulkhead pattern** — Run independent tasks in parallel (static analysis + unit tests).

## Architecture Rules
- CLIWA-RULE-007: **Use `Artisan::call()` for Laravel commands** (shared state, faster); Symfony Process for external tools.
- CLIWA-RULE-008: **Prefer Artisan commands** for Laravel-specific logic; Makefile/shell for cross-language workflows.
- CLIWA-RULE-009: **Set generous timeouts** for Symfony Process to prevent silent hanging.
- CLIWA-RULE-010: **Use cache-based locks** to prevent concurrent execution of deployment or maintenance workflows.

## Decision Rules
- CLIWA-RULE-011: **Use for project setup automation, CI/CD pipelines, and deployment automation.**
- CLIWA-RULE-012: **Don't use for simple single-command operations** — Run the command directly.
