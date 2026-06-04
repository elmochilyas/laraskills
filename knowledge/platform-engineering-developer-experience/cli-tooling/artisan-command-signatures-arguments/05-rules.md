# Rules: Artisan Command Signatures and Arguments

## Metadata
- **Source KU:** artisan-command-signatures-arguments
- **Subdomain:** CLI Tooling
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- SIG-RULE-001: **Always include descriptions** — Each argument and option needs a description so `--help` is self-documenting.
- SIG-RULE-002: **Required before optional** — Required arguments must precede optional ones to avoid positional ambiguity.
- SIG-RULE-003: **Array arguments last** — `{item*}` consumes all remaining positional tokens; place as final argument.
- SIG-RULE-004: **Options for modifiers, arguments for targets** — Positional = "what", named = "how".
- SIG-RULE-005: **Regex for format, PHP for business logic** — Signature regex validates structure; command body validates semantics.
- SIG-RULE-006: **Use `--force` and `--dry-run` conventions** — Standard boolean flags matching Laravel ecosystem patterns.

## Architecture Rules
- SIG-RULE-007: **Keep signatures concise** — More than 5 arguments/options suggests splitting the command.
- SIG-RULE-008: **Use `configure()` method** when signature string cannot express the needed logic.
- SIG-RULE-009: **Sensitive values** (passwords) should use `$this->secret()`, not arguments.

## Decision Rules
- SIG-RULE-010: **Use for every custom Artisan command** — Enables `--help` and `php artisan list` documentation automatically.
- SIG-RULE-011: **Use `configure()` for dynamic signatures** that change based on runtime state.
