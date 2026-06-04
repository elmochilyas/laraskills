# Skill: Implement Multi-Language Translation in Views

## Purpose

Internationalize Blade templates using Laravel's translation system so user-facing strings render in the correct locale without changing template logic.

## When To Use

- Multi-language applications serving users in multiple languages
- UI strings in packages that should be translatable
- Validation messages needing localization
- Locale-aware number and date formatting
- SEO internationalization with translated meta descriptions and titles

## When NOT To Use

- Single-language internal tools (adds maintenance overhead with no benefit)
- Dynamic content from database (use a translatable model package)
- Developer-facing messages (log messages, error codes)
- Configuration values (app name, environment names)
- Very small projects with no internationalization requirement

## Prerequisites

- Laravel application with `lang/` directory
- Translation files for each supported locale
- Locale detection mechanism (URL segment, session, subdomain, browser)

## Inputs

- Translation key strings (dot-notation or JSON)
- Placeholder replacement values
- Current locale from request or user preference

## Workflow

1. Create translation files for each supported locale: `lang/{locale}/messages.php` (PHP arrays) or `lang/{locale}.json` (JSON)
2. Replace all user-facing hardcoded strings in Blade templates with `{{ __('messages.key', ['param' => $value]) }}`
3. For pluralization, use `{{ trans_choice('messages.key', $count, ['count' => $count]) }}` with CLDR plural rules in the translation file
4. Validate user-supplied locale values against a whitelist before calling `App::setLocale()`
5. Use `Number::format()` and `Date::parse()->format()` for locale-aware number and date formatting
6. Add dynamic `dir` attribute for RTL language support: `<html dir="{{ in_array(app()->getLocale(), ['ar', 'he', 'fa']) ? 'rtl' : 'ltr' }}">`
7. Run `php artisan lang:publish` in production to cache translations
8. Write view tests that set locale explicitly and assert on translated values (not keys)

## Validation Checklist

- [ ] All user-facing strings use `__()` or `@lang` (no hardcoded text)
- [ ] Translation files exist for all supported locales
- [ ] Placeholder replacements are passed correctly for all parameterized strings
- [ ] Pluralization rules are defined for all count-sensitive strings
- [ ] `Number` and `Date` helpers used for locale-aware formatting (not PHP native functions)
- [ ] RTL languages handled via dynamic `dir` attribute on `<html>`
- [ ] Locale validation whitelist exists for user-supplied locales
- [ ] Translation cache enabled in production (`php artisan lang:publish`)
- [ ] CI checks detect missing translation keys

## Common Failures

- **Hardcoded strings in templates:** `<p>Welcome back!</p>` cannot be translated. Always use `{{ __('messages.key') }}`.
- **Missing placeholder replacements:** `__('messages.welcome')` where the key expects `:name` produces "Welcome, :name". Always pass `['name' => $value]`.
- **Incorrect pluralization:** `trans_choice('key', $collection)` passes a collection object instead of integer count. Use `$collection->count()`.
- **Locale not validated:** `App::setLocale($request->input('locale'))` without whitelist allows arbitrary locale values. Validate against `['en', 'es', 'fr']`.
- **Locale-unaware formatting:** `number_format()` and `date()` use server locale. Use `Number::format()` and `Date::parse()` for user locale.

## Decision Points

- PHP arrays vs JSON files: Use PHP array files (dot-notation keys) for structured translations organized by domain. Use JSON files for simple UI text where the English string is the key.
- Locale detection strategy: URL segment (`/{locale}/contact`) for SEO-friendly URLs. Session for user-selectable. Browser Accept-Language for first visit. User model column for authenticated users.

## Performance Considerations

- Translation lookup is O(1) array access per string
- For a page with 100 translated strings: total lookup time under 0.1ms
- Translation files loaded once per request and cached
- Always cache translations in production with `php artisan lang:publish`

## Security Considerations

- Translated strings may contain HTML — use `{!! !!}` only for trusted translation strings
- Placeholder values are not escaped by the translator — escape them: `__('hello', ['name' => e($userInput)])`
- Locale passed via URL can be manipulated — always validate against a whitelist
- Translation files are PHP files — ensure only trusted developers can write to `lang/` directory

## Related Rules

- localization-in-views/05-rules.md: Always Use `__()` for User-Facing Strings
- localization-in-views/05-rules.md: Always Pass All Required Placeholder Replacements
- localization-in-views/05-rules.md: Validate User-Supplied Locale Values
- localization-in-views/05-rules.md: Use Dot-Notation Keys with Maximum 2 Levels
- localization-in-views/05-rules.md: Use Laravel's `Number` and `Date` Helpers for Locale-Aware Formatting
- localization-in-views/05-rules.md: Cache Translations in Production

## Related Skills

- Blade Testing: Write Assertions for Blade View Rendering
- View Composers and Creators: Implement View Composers for Shared Data
- Template Inheritance: Implement Template Inheritance Hierarchy
- Rendering Performance: Profile and Optimize Slow View Rendering

## Success Criteria

- All user-facing strings use `__()` or `@lang` — no hardcoded UI text
- Translation files exist for every supported locale with correct pluralization rules
- Placeholder replacements are passed and render correctly
- Locale-aware number and date formatting produces correct output per locale
- User-supplied locale values are validated against a whitelist
- RTL languages display correctly with dynamic `dir` attribute
