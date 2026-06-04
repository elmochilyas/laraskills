# Knowledge Unit: Translation File Loading in Packages

## Metadata
- **Subdomain:** Package Development & Shared Libraries
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** package-development-shared-libraries/translation-file-loading-packages
- **Maturity:** Mature
- **Related Technologies:** Laravel Localization, Spatie Package Tools, JSON Translation Files, PHP Array Translation Files

## Executive Summary

Laravel packages load translation strings through `loadTranslationsFrom()` or Spatie tools' `->hasTranslations()`, registering a namespace-prefixed directory where Laravel looks for language files. Package translations are accessed using the `__('package-name::file.key')` syntax in Blade views and PHP code. The package provides default translations (typically English) in a `resources/lang/` directory with subdirectories for each locale (`en/`, `es/`, `fr/`). Consumers can override translations by publishing them to `resources/lang/vendor/package-name/`. The pattern supports both PHP array files (`en/messages.php`) and JSON translation files (`en.json`), with JSON being the preferred format for packages with fewer than 50 translation strings.

## Core Concepts

- **Namespace Translation Loading:** `loadTranslationsFrom()` registers a namespace so translations resolve as `__('namespace::file.key')`; the namespace is typically the package name
- **Vendor Translation Override:** Published translations in `resources/lang/vendor/package-name/{locale}/` override the package's default translations, allowing consumers to customize strings without modifying vendor files
- **Php Array vs JSON Translations:** PHP array files (`en/messages.php` returning `['key' => 'value']`) provide key-value mapping; JSON files (`en.json` with `{"key": "value"}`) use the string itself as the key
- **Translation Publishing:** `$this->publishes()` with tag `package-name-translations` or Spatie's `->hasTranslations()` makes translation files publishable for consumer customization

## Mental Models

- **Namespace as Translation Scope:** The namespace prefix prevents key collisions between packages; `__('package-a.welcome')` and `__('package-b.welcome')` are distinct keys
- **Translation as Interface Text:** Package translations are all strings that appear in the package's UI—labels, messages, errors, buttons, and placeholders
- **Override as Consumer Customization:** Consumers don't modify the original translation files; they publish and edit their copies, preserving originals for future updates
- **Locale Directory as Language Folder:** Each locale is a directory (`en/`, `es/`, `fr/`) containing array files, or a single `{locale}.json` file; Laravel resolves the correct locale based on the application's current locale setting

## Internal Mechanics

1. **Translation Registration:** `$this->loadTranslationsFrom(__DIR__.'/../resources/lang', 'package-name')` registers the namespace; `__('package-name::messages.welcome')` resolves to `resources/lang/en/messages.php` (key `welcome`) in the package.
2. **File Resolution Priority:** Laravel checks `resources/lang/vendor/package-name/{locale}/` (published overrides) first, then the package's `resources/lang/{locale}/` directory. If a key exists in the override, it's used; otherwise falls back to the package default.
3. **JSON Translation Fallback:** For JSON files, Laravel loads `{locale}.json` from the registered path; string-based keys (e.g., `__('Welcome to our package')`) are translated by matching the full string.
4. **Translation Publishing Flow:** `php artisan vendor:publish --tag=package-name-translations` copies the package's `resources/lang/` to `resources/lang/vendor/package-name/`; existing files are not overwritten without `--force`.

## Patterns

- **Single Directory Pattern:** Store all translation files in `resources/lang/` with locale subdirectories; this is the simplest and most compatible approach.
- **JSON for Short Strings Pattern:** Use `en.json` for short, self-contained strings that don't need key-based organization; use PHP array files for organized, categorized strings.
- **Fallback Key Pattern:** Use meaningful English strings as keys for JSON translations (e.g., `"Save changes"` as the key); when a translation for the current locale is missing, the English key is displayed as fallback.
- **Override Documentation Pattern:** In the package README, document which translation keys exist and their default values so consumers can easily create custom translations.
- **Spatie Tools Pattern:** Use `->hasTranslations()` in `configurePackage()` to register the translation namespace; Spatie tools expects translations in `resources/lang/` with locale subdirectories.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Translation format | PHP arrays vs JSON files | JSON for simple packages (<50 strings); PHP arrays for organized translations |
| Key naming | Dot notation (messages.welcome) vs string keys | Dot notation for organized, hierarchical keys |
| Default locale | English (en) vs multiple languages | English (en) plus accept community contributions for other locales |
| Translation publishing | Spatie auto-publish vs manual | Spatie for consistency; manual for packages with complex translation structures |

## Tradeoffs

- **PHP Array vs JSON Format:** PHP arrays provide organization (by file, by category) but require developers to know the key path. JSON format is simpler (the string is the key) but makes bulk changes harder and doesn't support file-based organization.
- **Many Small Translation Files vs One Large File:** Multiple files (`messages.php`, `validation.php`, `errors.php`) organized by category vs a single `package-name.php` with all translations. Multiple files are more organized but increase file count.
- **Namespace vs Global Translations:** Namespace-prefixed translations (`package-name::file.key`) prevent collisions but are more verbose. Non-namespaced translations are shorter but risk collisions with other packages or the application.
- **Overridable vs Non-Overridable:** Making translations publishable gives consumers customization control but adds a publishing step. Non-publishable translations (loaded from vendor only) are simpler but don't allow customization without direct vendor modification.

## Performance Considerations

- **Translation File Loading Cost:** Laravel loads all translation files for the current locale on the first `__()` or `@lang()` call. Adding package translation files doesn't significantly impact performance (array merge operation, negligible time).
- **Number of Translation Strings:** Having 500+ translation strings in a package has no measurable performance impact; translations are stored as PHP arrays (in-memory) after first load.
- **Translation Cache:** Laravel does not cache translations by default; for high-traffic applications, consider using translation caching packages or optimizing translation file loading.
- **JSON Translation Parsing:** JSON translation files are parsed once per locale per request (without cache); parsing is fast (<1ms) but can add up with 50+ translation files.

## Production Considerations

- **Missing Translation Keys:** If a translation key doesn't exist, Laravel returns the key itself (e.g., `__('package-name::messages.welcome')` returns `package-name::messages.welcome`). Test that all strings have translations for the default locale.
- **Locale Detection:** Package translations respect the application's current locale; they automatically switch language when the application locale changes via `App::setLocale()`.
- **Translation Updating:** When a package updates and adds new translation strings, consumers must re-publish translations or add the new keys manually. Document new translation strings in the package changelog.
- **RTL Language Support:** For packages supporting right-to-left languages (Arabic, Hebrew), ensure Blade templates use `@lang()` and CSS supports RTL layouts; test translations with RTL sample data.

## Common Mistakes

- **Not registering translations in the service provider:** `__('package::file.key')` returns the key string because no namespace is registered; always call `loadTranslationsFrom()` or use Spatie tools
- **Using hardcoded strings in Blade views:** Writing "Save" instead of `{{ __('package::messages.save') }}` in package views makes the package untranslatable; use `__()` or `@lang()` for all user-facing strings
- **Conflicting namespace with another package:** Using a common namespace like `messages` or `errors` that another package also uses; always use the full package name as the translation namespace
- **Not publishing translations:** Package has translations but consumers can't customize them because publishing wasn't registered; always include `publishes()` or use Spatie's `hasTranslations()`
- **Forgetting to pluralize:** Using `__('package.item')` for counts that may be >1; use `trans_choice('package.items', $count)` or `__('package.items', ['count' => $count])` for pluralization

## Failure Modes

- **Translation Key Collision:** Package A and Package B both register `loadTranslationsFrom()` with namespace `common`; translations from the last-loaded package silently override the first. Mitigate: always use unique package names as namespaces.
- **Missing Fallback Locale:** Application locale is set to `de` but the package only has `en` translations; all translation keys return the raw key string. Mitigate: always provide `en` as a complete locale; set `config('app.fallback_locale', 'en')` for missing locales.
- **Stale Published Translations:** Package updates translation strings, but consumer's published translations in `resources/lang/vendor/` still have the old strings. Mitigate: use `vendor:publish --force` after package updates, or document that consumers should diff their published translations.
- **Encoding Issues:** Translation files saved with wrong encoding (UTF-8 BOM, Windows-1252) cause characters to display incorrectly. Mitigate: enforce UTF-8 without BOM in the package coding standards.

## Ecosystem Usage

- **Spatie Packages:** All Spatie packages with UI components use `->hasTranslations()` for translation registration and publishing
- **Filament Admin:** Comprehensive translation system with 30+ locale files; demonstrates large-scale translation management in packages
- **Laravel Nova:** Translation files in the Nova package follow the standard namespace pattern; includes translations for UI components, validation messages, and tooltips
- **Laravel Cashier:** Subscription management package with customer-facing translations for invoices, receipts, and subscription status messages

## Related Knowledge Units

- package-service-provider-patterns
- spatie-laravel-package-tools
- blade-component-namespacing
- view-component-registration-packages

## Research Notes

- Laravel's translation system for packages has been stable since Laravel 5.0 (2015); the API is unchanged across major versions
- JSON translation files have become the preferred format for new packages due to simplicity (no key naming required, string itself is the key)
- The namespace-prefixed translation pattern (`package-name::file.key`) is unique to Laravel and considered a best practice
- Community translation contributions are a significant factor in package adoption for non-English-speaking Laravel developers; packages with 5+ locales see higher adoption in EU, LATAM, and Asia markets
