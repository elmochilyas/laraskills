# Rules: Interactive Commands

## Metadata
- **Source KU:** interactive-commands
- **Subdomain:** CLI Tooling
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- INT-RULE-001: **Always provide defaults** — `$this->ask('Name', 'default')` prevents crashes in `--no-interaction`.
- INT-RULE-002: **Detect interactivity early** — Check `$this->input->isInteractive()` to fail fast with clear message.
- INT-RULE-003: **Limit prompts to 5-7** — Too many overwhelm users; use config files for complex input.
- INT-RULE-004: **Choice for bounded options** — `choice()` prevents invalid input for known options.
- INT-RULE-005: **Confirmation before destruction** — Always `confirm()` before irreversible operations.
- INT-RULE-006: **Summary before execution** — Display collected input in a table and ask "Proceed?" before acting.

## Architecture Rules
- INT-RULE-007: **All interactive input must be expressible via arguments/options** for non-interactive use.
- INT-RULE-008: **Use `secret()`** for passwords, tokens, and sensitive data.
- INT-RULE-009: **Extract prompting logic** into methods that accept `InputInterface` for testability.

## Decision Rules
- INT-RULE-010: **Use for setup commands, configuration wizards, and confirmation dialogs.**
- INT-RULE-011: **Don't use for commands run by scheduler, CI, or deployment scripts.**
- INT-RULE-012: **Provide argument-driven mode alongside interactivity** for automated batch processing.
