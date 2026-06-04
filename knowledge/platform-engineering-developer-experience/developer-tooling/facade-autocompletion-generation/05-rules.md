# Rules: Facade Autocompletion Generation

## Metadata
- **Source KU:** facade-autocompletion-generation
- **Subdomain:** Developer Tooling
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- FACADE-RULE-001: **Run ide-helper:generate** — Produces `_ide_helper.php` with `@method` annotations for all facades and global helpers.
- FACADE-RULE-002: **Dev dependency only** — `require-dev` to avoid production deployment.
- FACADE-RULE-003: **Gitignore output** — `_ide_helper.php` should be in `.gitignore` (regenerated per developer).
- FACADE-RULE-004: **Composer script** — Add to `post-update-cmd` for automatic regeneration.
- FACADE-RULE-005: **Macro detection** — Detects facades extended with macros and includes them in generated stubs.

## Decision Rules
- FACADE-RULE-006: **All Laravel projects** benefit from facade autocompletion generation.
- FACADE-RULE-007: **Use with all IDEs** that support PHPDoc stub files (PhpStorm, VS Code Intelephense).
