# Rules: Console Output Formatting

## Metadata
- **Source KU:** console-output-formatting
- **Subdomain:** CLI Tooling
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- OUTPUT-RULE-001: **Support `--json`** — Provide structured output alongside formatted output for programmatic consumers.
- OUTPUT-RULE-002: **Use verbosity levels** — Debug details go to VERBOSE/DEBUG levels, not NORMAL.
- OUTPUT-RULE-003: **Check color support** — Use `$this->output->isDecorated()` before raw ANSI codes.
- OUTPUT-RULE-004: **Always finish progress bars** — Call `$bar->finish()` after completion to clean up display.
- OUTPUT-RULE-005: **Section isolation** — Use `$this->output->section()` for independent output areas (log + progress bar).

## Architecture Rules
- OUTPUT-RULE-006: **Use helper methods** (`$this->info()`) instead of `echo` to ensure formatting and verbosity control.
- OUTPUT-RULE-007: **Detect CI environment** (`CI` env var) to adjust formatting for headless contexts.
- OUTPUT-RULE-008: **Implement `--quiet`** flag that switches to QUIET verbosity for cron/scheduled tasks.
- OUTPUT-RULE-009: **Never output sensitive data** even in DEBUG verbosity.

## Decision Rules
- OUTPUT-RULE-010: **Use styled output for human-readable commands** that explain what happened.
- OUTPUT-RULE-011: **Use plain text or `--json` for piped output** where another program consumes the result.
