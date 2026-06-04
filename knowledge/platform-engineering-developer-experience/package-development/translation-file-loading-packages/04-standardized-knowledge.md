# Experience Curation: Translation File Loading in Packages

## Metadata
- **Subdomain:** Package Development & Shared Libraries
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** package-development-shared-libraries/translation-file-loading-packages
- **Maturity:** Mature
- **Related Technologies:** Laravel Localization, Spatie Package Tools, JSON Translation Files, PHP Array Translation Files
- **Difficulty:** Foundation
- **Decomposition:** Atomic

## Overview
Laravel packages load translation strings through `loadTranslationsFrom()` or Spatie tools' `->hasTranslations()`, registering a namespace-prefixed directory where Laravel looks for language files. Package translations are accessed using the `__('package-name::file.key')` syntax in Blade views and PHP code. The package provides default translations (typically English) in a `resources/lang/` directory with subdirectories for each locale (`en/`, `es/`, `fr/`). Consumers can override translations by publishing them to `resources/lang/vendor/package-name/`. The pattern supports both PHP array files (`en/messages.php`) and JSON translation files (`en.json`), with JSON being the preferred format for packages with fewer than 50 translation strings.

## Core Concepts
- **Namespace Translation Loading:** `loadTranslationsFrom()` registers a namespace so translations resolve as `__('namespace::file.key')`; the namespace is typically the package name
- **Vendor Translation Override:** Published translations in `resources/lang/vendor/package-name/{locale}/` override the package's default translations, allowing consumers to customize strings
- **PHP Array vs JSON Translations:** PHP array files (`en/messages.php` returning `['key' => 'value']`) provide key-value mapping; JSON files (`en.json` with `{"key": "value"}`) use the string itself as the key
- **Translation Publishing:** `$this->publishes()` with tag `package-name-translations` or Spatie's `->hasTranslations()` makes translation files publishable for consumer customization
- **Namespace as Translation Scope:** The namespace prefix prevents key collisions between packages; `__('package-a.welcome')` and `__('package-b.welcome')` are distinct keys
- **Override as Consumer Customization:** Consumers don't modify original translation files; they publish and edit their copies, preserving originals for future updates

## When To Use
- Any package with UI components that display user-facing text (labels, messages, errors, buttons, placeholders)
- Packages distributed to an international audience where multiple languages may be needed
- Packages where consumers may need to customize the wording of displayed messages
- Packages with validation messages, notification text, or email content

## When NOT To Use
- API-only packages that return data rather than rendering UI text
- Internal packages with a single-language audience where translation overhead isn't justified
- Packages where all UI text is defined by the consumer's configuration or database
- Utility packages with no user-facing strings

## Best Practices
- **WHY:** Register translations in the service provider via `loadTranslationsFrom()` or Spatie's `->hasTranslations()`; without registration, `__('package::file.key')` returns the raw key string
- **WHY:** Use `__()` or `@lang()` for all user-facing strings in package views; hardcoded strings make the package untranslatable and create technical debt for internationalization
- **WHY:** Use JSON translation format for packages with fewer than 50 strings (string itself is the key, simpler to manage); use PHP array files for larger translation sets that benefit from category organization
- **WHY:** Make translations publishable so consumers can customize strings without modifying vendor files; tag publishing as `--tag=package-name-translations` for selective publishing
- **WHY:** Use a unique namespace prefix based on the package name to prevent collisions with other packages; `__('package-a.messages.save')` and `__('package-b.messages.save')` are distinct

## Architecture Guidelines
- **Single Directory Pattern:** Store all translation files in `resources/lang/` with locale subdirectories; simplest and most compatible approach
- **JSON for Short Strings Pattern:** Use `en.json` for short, self-contained strings that don't need key-based organization; PHP array files for organized, categorized strings
- **Fallback Key Pattern:** Use meaningful English strings as keys for JSON translations (e.g., `"Save changes"` as the key); when a translation for the current locale is missing, the English key is displayed as fallback
- **Override Documentation Pattern:** In the package README, document which translation keys exist and their default values so consumers can easily create custom translations
- **Spatie Tools Pattern:** Use `->hasTranslations()` in `configurePackage()` to register the translation namespace; Spatie tools expects translations in `resources/lang/` with locale subdirectories
- **Default Locale:** Provide English (`en`) as the complete default locale; accept community contributions for other locales
- **Key Naming:** Use dot notation for hierarchical keys (`messages.welcome`, `errors.not_found`, `buttons.save`)

## Performance
- Laravel loads all translation files for the current locale on the first `__()` or `@lang()` call; adding package translation files doesn't significantly impact performance (array merge operation, negligible time)
- Having 500+ translation strings in a package has no measurable performance impact; translations are stored as PHP arrays in-memory after first load
- Laravel does not cache translations by default; for high-traffic applications, consider using translation caching packages
- JSON translation files are parsed once per locale per request (without cache); parsing is fast (<1ms) but can add up with 50+ translation files

## Security
- Never include sensitive information (API keys, credentials, internal URLs) in translation files; translations are user-facing strings
- Translation files can be published and modified by consumers; don't rely on translation content for security-critical logic
- User input displayed through translations should still be escaped; `__()` returns raw strings that need proper escaping in the view context
- RTL language support requires testing with RTL sample data to ensure proper rendering of package UI

## Common Mistakes

### Not registering translations in the service provider
- **Description:** Using `__('package::file.key')` without calling `loadTranslationsFrom()` or Spatie's `->hasTranslations()`
- **Consequence:** The translation key string is returned as-is; no translations are loaded
- **Better Approach:** Always register translations in the service provider; verify with a simple test that `__()` resolves correctly

### Using hardcoded strings in Blade views
- **Description:** Writing "Save" instead of `{{ __('package::messages.save') }}` in package views
- **Consequence:** The string is untranslatable; consumers with non-English locales see hardcoded English
- **Better Approach:** Use `__()` or `@lang()` for all user-facing strings; create a translation file with all default strings

### Conflicting namespace with another package
- **Description:** Using a common namespace like `messages` or `errors` that another package also uses
- **Consequence:** Translations from the last-loaded package silently override the first; keys may resolve to wrong values
- **Better Approach:** Always use the full package name as the translation namespace

### Not publishing translations
- **Description:** Package has translations but consumers can't customize them because publishing wasn't registered
- **Consequence:** Consumers cannot override strings without directly modifying vendor files (lost on update)
- **Better Approach:** Always include `publishes()` or use Spatie's `hasTranslations()` which handles publishing

### Forgetting to pluralize
- **Description:** Using `__('package.item')` for counts that may be >1
- **Consequence:** Plural forms are not handled; counts always show singular form
- **Better Approach:** Use `trans_choice('package.items', $count)` or `__('package.items', ['count' => $count])` for pluralization

## Anti-Patterns
- **No translation support:** Hardcoding all UI strings without any translation infrastructure; makes internationalization impossible without rewriting the package
- **Global namespace translations:** Registering translations without a namespace prefix (non-namespaced); risks collisions with application or other package translations
- **One giant translation file:** Putting all translations in a single file without category organization; hard to navigate and maintain
- **Translation as configuration:** Using translation files to store configuration values; translations are for user-facing strings, not application settings
- **Skipping fallback locale:** Not providing English (`en`) as a complete locale; non-English applications see raw key strings for missing translations

## Examples
- **Spatie/laravel-backup:** Uses `->hasTranslations()` for all UI strings; translations in `resources/lang/` with locale subdirectories
- **Filament Admin:** Comprehensive translation system with 30+ locale files; demonstrates large-scale translation management with both PHP arrays and JSON
- **Laravel Nova:** Standard namespace translation pattern for UI components, validation messages, and tooltips
- **Laravel Cashier:** Customer-facing translations for invoices, receipts, and subscription status messages

## Related Topics
- package-service-provider-patterns (translation registration happens in the service provider)
- spatie-laravel-package-tools (provides `hasTranslations()` for declarative translation registration)
- blade-component-namespacing (translation namespace convention mirrors view namespace convention)
- laravel-localization (broader context for how Laravel handles locale resolution)
- view-component-registration-packages (component views need translation support)

## AI Agent Notes
- The translation namespace must match exactly between `loadTranslationsFrom()` and the `__()` calls; this is a common source of bugs
- JSON translation format is simpler and preferred for new packages with <50 strings
- When a user reports translations not working, first verify `loadTranslationsFrom()` is called and the namespace matches
- Translation publishing should be registered but documented as optional; the package should work with just the default locale
- Community translation contributions significantly impact adoption in non-English-speaking markets

## Verification
- [ ] `loadTranslationsFrom()` or Spatie's `->hasTranslations()` is called in the service provider
- [ ] Translation namespace is unique and matches the package name
- [ ] All user-facing strings in package views use `__()` or `@lang()`
- [ ] Default locale (English) has complete translations for all strings
- [ ] Translations are publishable via tagged publishing (`--tag=package-name-translations`)
- [ ] Pluralization is handled correctly with `trans_choice()` or count parameters
- [ ] Translation files use UTF-8 without BOM encoding
- [ ] README documents available translation keys and default values
- [ ] Fallback locale (`config('app.fallback_locale', 'en')`) is configured for missing translations
- [ ] Package test verifies `__()` resolves correctly for the default locale
