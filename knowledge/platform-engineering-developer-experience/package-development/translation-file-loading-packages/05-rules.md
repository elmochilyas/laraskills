# Rules: Translation File Loading in Packages

## Metadata
- **Source KU:** translation-file-loading-packages
- **Subdomain:** Package Development
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- TRANS-RULE-001: **Register translations in service provider** — Call `loadTranslationsFrom()` or Spatie's `->hasTranslations()`. Without registration, `__()` returns raw key.
- TRANS-RULE-002: **Use __() for all user-facing strings** — Hardcoded strings make package untranslatable. Technical debt for i18n.
- TRANS-RULE-003: **JSON format for < 50 strings** — Self-contained, simpler. PHP arrays for larger sets with category organization.
- TRANS-RULE-004: **Unique namespace prefix** — Must use package name as namespace to prevent collisions: `__('package-a.messages.save')`.
- TRANS-RULE-005: **Make translations publishable** — So consumers can customize strings. Tag as `--tag=package-name-translations`.

## Architecture Rules
- TRANS-RULE-006: **Single directory pattern** — Store in `resources/lang/` with locale subdirectories. Simplest approach.
- TRANS-RULE-007: **JSON meaningful keys** — Use meaningful English strings as JSON keys (e.g., `"Save changes"`). Falls back when translation missing.
- TRANS-RULE-008: **Spatie tools pattern** — `->hasTranslations()` in `configurePackage()`. Expects `resources/lang/` with locale subdirectories.
- TRANS-RULE-009: **Default locale en** — Provide complete English translations. Accept community contributions for other locales.

## Security Rules
- TRANS-RULE-010: **No sensitive info in translations** — Translations are user-facing strings. No API keys, internal URLs, or credentials.
- TRANS-RULE-011: **Escape translation output** — `__()` returns raw strings. Must escape in view context with `{{ }}`.

## Common Mistakes
- TRANS-RULE-012: **Not registering translations** — Most common bug. `__()` just returns the key string.
- TRANS-RULE-013: **Hardcoded strings in Blade** — Writing "Save" instead of `{{ __('package::messages.save') }}`. Untranslatable.
- TRANS-RULE-014: **Conflicting namespace** — Using common namespace like `messages` that another package also uses. Use full package name.
- TRANS-RULE-015: **Not handling pluralization** — Using `__()` for counts > 1. Use `trans_choice('package.items', $count)`.

## Anti-Pattern Rules
- TRANS-RULE-016: **Avoid no translation support** — Hardcoding all UI strings without translation infrastructure.
- TRANS-RULE-017: **Avoid global namespace translations** — No namespace prefix risks collisions with app or other packages.
- TRANS-RULE-018: **Avoid translation as configuration** — Translations are for user-facing strings, not application settings.
