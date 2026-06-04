# Rules: PhpStorm Meta File Generation

## Metadata
- **Source KU:** phpstorm-meta-file-generation
- **Subdomain:** Developer Tooling
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- META-RULE-001: **Run ide-helper:meta** — Produces `.phpstorm.meta.php` for advanced PhpStorm type inference.
- META-RULE-002: **Dev dependency only** — No runtime effect. PhpStorm-specific file.
- META-RULE-003: **Gitignore output** — `.phpstorm.meta.php` regenerated per developer. Add to `.gitignore`.
- META-RULE-004: **Composer script** — Add to `post-update-cmd` for automatic regeneration.

## Architecture Rules
- META-RULE-005: **Container resolution mapping** — Maps abstract names to concrete implementations for `app()->make()`.
- META-RULE-006: **Collection generics** — Types collection items for `first()`, `filter()`, `map()` return types.
- META-RULE-007: **Query builder return types** — Maps `find()`, `first()`, `get()` to model types.
- META-RULE-008: **Factory return types** — `User::factory()->create()` returns `User`.

## Decision Rules
- META-RULE-009: **Use for PhpStorm users** — Meta file is PhpStorm-specific. VS Code/Sublime users don't benefit.
- META-RULE-010: **Projects using service container heavily** benefit most from meta generation.
