# Rules: Package Auto-Discovery

## Metadata
- **Source KU:** package-auto-discovery
- **Subdomain:** Package Development
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- DISCOVERY-RULE-001: **Always include extra.laravel.providers** — Distribution packages must include auto-discovery config in `composer.json`. It's the standard and expected behavior.
- DISCOVERY-RULE-002: **Use dont-discover sparingly** — Opt-out only specific packages with boot order conflicts. Avoid blanket `*` opt-out.
- DISCOVERY-RULE-003: **Environment-guarded boot** — Use boot logic guards rather than opting out of auto-discovery for conditional loading.
- DISCOVERY-RULE-004: **Run optimize after package changes** — Run `php artisan optimize` or `composer dump-autoload` after adding packages. Include in deploy scripts.

## Architecture Rules
- DISCOVERY-RULE-005: **Standard discovery config** — `"extra": {"laravel": {"providers": ["Vendor\\Package\\ServiceProvider"], "aliases": [...]}}` in composer.json.
- DISCOVERY-RULE-006: **Single provider per package** — For simplicity. Multiple providers increase boot time.
- DISCOVERY-RULE-007: **Facade registration** — Include facades in `extra.laravel.aliases` for auto-discovery.

## Performance Rules
- DISCOVERY-RULE-008: **Zero runtime overhead in production** — `packages.php` is cached. Discovery is a simple PHP array include.
- DISCOVERY-RULE-009: **100+ packages adds ~5-10ms** during cache rebuild only. Negligible impact.

## Common Mistakes
- DISCOVERY-RULE-010: **Wrong namespace in providers array** — Typo in class name prevents provider registration. Use fully qualified names with leading backslash.
- DISCOVERY-RULE-011: **Not clearing cache after adding packages** — Stale `packages.php` means newly added providers aren't registered.
- DISCOVERY-RULE-012: **Using autoload instead of extra.laravel** — PSR-4 makes class autoloadable but doesn't register as provider.

## Anti-Pattern Rules
- DISCOVERY-RULE-013: **Avoid disabling auto-discovery globally** — Eliminates convenience and forces manual registration for every package.
- DISCOVERY-RULE-014: **Avoid manual registration for every package** — Duplicates effort and is error-prone when auto-discovery works.
- DISCOVERY-RULE-015: **Avoid dev-only packages without environment guards** — Always wrap boot logic in environment checks.
