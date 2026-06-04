# Skill: Set Up Translation File Loading in Laravel Packages

## Purpose
Register and publish translation files for a Laravel package, loading user-facing strings with namespace-prefixed keys and allowing consumer customization via publishing.

## When To Use
- Package has UI components displaying user-facing text (labels, messages, errors, buttons)
- Package distributed to international audience needing multiple languages
- Package where consumers may customize wording of displayed messages

## When NOT To Use
- API-only packages returning data rather than rendering UI text
- Internal single-language packages where translation overhead isn't justified
- Utility packages with no user-facing strings

## Prerequisites
- Package service provider
- Translation files in `resources/lang/` with locale subdirectories
- Complete English locale as default

## Inputs
- Translation strings organized by locale and category
- Package namespace prefix for key uniqueness

## Workflow (numbered)
1. **Create translation files** — Store in `resources/lang/{locale}/` ; use JSON format for < 50 strings, PHP arrays for larger sets
2. **Register translations** — `$this->loadTranslationsFrom(__DIR__.'/../resources/lang/', 'package-name')` or Spatie's `->hasTranslations()`
3. **Set up publishing** — `$this->publishes([...], 'package-name-translations')` for consumer customization
4. **Use __() for all strings** — `{{ __('package-name::messages.save') }}` in all package views; never hardcode
5. **Handle pluralization** — Use `trans_choice('package-name::items', $count)` for count-dependent strings
6. **Document translation keys** — In README, list available keys and default values for consumer reference

## Validation Checklist
- [ ] `loadTranslationsFrom()` called in service provider
- [ ] Translation namespace unique, matches package name
- [ ] All user-facing strings use `__()` or `@lang()`
- [ ] Default locale (English) has complete translations
- [ ] Translations publishable via tagged command
- [ ] Pluralization handled with `trans_choice()`
- [ ] No sensitive info in translation files
- [ ] Test verifies `__()` resolves correctly

## Common Failures
- **Not registering translations** — `__()` returns raw key string
- **Hardcoded strings in Blade views** — package untranslatable; non-English users see English
- **Conflicting namespace** — two packages using same namespace; translations silently override
- **Not handling pluralization** — counts always show singular form

## Decision Points
- JSON vs PHP array format: JSON for < 50 strings (self-contained); PHP arrays for larger categorized sets
- Publishable vs default-only: publishable for consumer customization; default-only for simple packages
- Namespace: full package name (unique) vs shorter prefix (convenient but may conflict)

## Performance/Security Considerations
- Translation loading is an array merge operation; negligible impact even with 500+ strings
- Laravel doesn't cache translations by default; consider caching for high-traffic apps
- Never include API keys, internal URLs, or credentials in translation files
- `__()` returns raw strings; escape with `{{ }}` in views
- Translation files can be published and modified; don't rely on them for security-critical logic

## Related Rules (from 05-rules.md)
- TRANS-RULE-001: Register translations in service provider
- TRANS-RULE-002: Use __() for all user-facing strings
- TRANS-RULE-003: JSON format for < 50 strings
- TRANS-RULE-004: Unique namespace prefix
- TRANS-RULE-005: Make translations publishable
- TRANS-RULE-015: Not handling pluralization

## Related Skills
- Set Up a Package Service Provider with Spatie Tools
- Register View Components in Laravel Packages
- Register Blade Component Namespacing for Laravel Packages

## Success Criteria
- `__('package-name::file.key')` resolves correctly in any Laravel app
- All user-facing strings translatable via translation files
- Consumers can publish and customize translations
- No namespace collisions with other packages
- Pluralization works correctly for all count values
