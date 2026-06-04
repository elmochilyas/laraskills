# ECC Standardized Knowledge — Application Localization

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Application Architecture & Structure |
| **Knowledge Unit** | Application Localization |
| **Difficulty** | Intermediate |
| **Category** | Application Architecture — Internationalization |
| **Last Updated** | 2026-06-02 |

---

## Overview

Laravel's localization system provides a translation layer between application source strings and user-facing output. It supports two file formats (PHP arrays for hierarchical translations, JSON for flat key-value pairs), pluralization across 100+ languages via Symfony's translation component, and locale detection through middleware, URL prefixes, session storage, or browser headers.

The most critical engineering decision is the **locale detection strategy** — how the application determines which language to display. The default approach (`config/app.php` locale) provides a single global locale. Production applications typically implement middleware-based strategies reading from URL prefix, authenticated user preference, session, or browser `Accept-Language` header.

The second critical decision is the **translation storage format** — PHP arrays (structured, namespaced, countable) vs JSON (simple, flat, translation-service-friendly).

---

## Core Concepts

### Locale
ISO 639-1 language identifier (optionally ISO 3166-1 region). Examples: `en`, `fr`, `de`, `zh_CN`. Stored on the Translator instance, config file, or session.

### Translation Files
Stored in `lang/` directory:
- **PHP Format:** `lang/{locale}/{namespace}.php` — returns associative array
- **JSON Format:** `lang/{locale}.json` — flat key-value JSON object

### Translator
`Illuminate\Translation\Translator` loads translations, resolves keys, handles parameter replacement (`:attribute` → `email`), manages pluralization, and falls back to fallback locale.

### Fallback Locale
(`config/app.php` `fallback_locale`) Used when a translation key doesn't exist in the current locale. Default: `en`.

### Pluralization
Handles language-specific plural forms via Symfony's `Translation\PluralizationRules`. Different languages have 2-6 plural forms. Uses `{0}`, `{1}`, `[2,*]` syntax with `:count` parameter.

---

## When To Use

- **Multi-language applications** — any application serving users in multiple languages
- **Internationalization** — preparing for future translation needs
- **Validation messages** — Laravel's built-in validation translations
- **Package translation** — packages providing translated strings
- **API error messages** — locale-aware error responses for international users

---

## When NOT To Use

- **Single-language internal tools** — no translation overhead needed
- **User-generated content** — content itself should be stored in the user's language, not translated
- **Dynamic content with runtime editing** — file-based translations cannot be modified at runtime through a UI
- **Simple key-value without i18n** — for a single language, use plain strings directly

---

## Best Practices

### Use PHP Array Format for Application Translations
Prefer `lang/en/messages.php` over `lang/en.json` for application code.

**Why:** PHP arrays support organization by namespace, enable translation progress counting, support IDE autocompletion with helper packages, and handle pluralization more naturally.

### Set Fallback Locale Properly
Configure `fallback_locale` to the application's most complete translation set.

**Why:** When a translation is missing in the current locale, the fallback prevents displaying raw keys. If English translations are also incomplete, the raw key is still shown.

### Validate Locale from User Input
Always validate user-supplied locale values against the supported locales list.

**Why:** Passing an unsupported locale to `app()->setLocale()` silently falls back, making debugging difficult. Validation catches the error early.

### Always Pass count Parameter for Pluralization
Use `['count' => $n]` for pluralization, not just `$n` or no parameter.

**Why:** The translator specifically looks for the `:count` key to trigger pluralization logic. Without it, the first form is always returned.

### Use Locale in Cache Keys
Include `app()->getLocale()` in cache keys for locale-aware content.

**Why:** Without locale in the cache key, the same cached content is returned for all locales, defeating localization.

---

## Architecture Guidelines

### Locale Detection Flow
```
SetLocale Middleware
  → Determine locale (URL prefix / session / user preference / browser)
  → Validate against allowed locales
  → app()->setLocale($locale)
  → return $next($request)
```

### Detection Strategies
- **URL Prefix** — SEO-friendly, shareable, cacheable. Most recommended for public applications.
- **Session** — Simple, no URL complexity. Not SEO-friendly.
- **User Preference** — Persists across devices. Requires authentication.
- **Browser Header** — Zero configuration. No override without UI.

### Translation File Organization
```
lang/
├── en/
│   ├── messages.php
│   ├── validation.php
│   └── auth.php
├── fr/
│   ├── messages.php
│   └── validation.php
└── fr.json
```

---

## Performance Considerations

### Translation File Loading
PHP files benefit from OpCache after first load. JSON files require `file_get_contents()` + `json_decode()` on first access per locale.

### In-Memory Cache
Translator stores loaded translations in `$loaded` property. File I/O paid once per locale per request, not per translation call.

### Pluralization Cost
0.01-0.05ms per pluralized call. Negligible for typical usage.

### Locale-Specific Cache Keys
Doubles or triples cache storage proportionally to active locale count. Each locale needs separate cached content.

---

## Security Considerations

### Unvalidated Locale Injection
User-supplied locale values from URL, session, or form input must be validated. An attacker could set the locale to an unsupported value, causing silent fallback or misbehavior.

### XSS via Translation Strings
If translation strings contain user-controlled content (e.g., `:name` parameters), ensure output is escaped. Blade's `{{ }}` auto-escapes, but raw echo may not.

### Translation File Integrity
If `lang/` files are corrupted or maliciously modified, translated output is affected. Protect with filesystem permissions.

---

## Common Mistakes

### Not Setting Fallback Locale
Desc: Relying on default `fallback_locale = 'en'` when English translations are incomplete.
Cause: Not configuring fallback after adding translations.
Consequence: Untranslated keys displayed as raw keys.
Better: Set `fallback_locale` to the most complete translation set.

### Using Translation Strings as Keys
Desc: Using English strings as keys in JSON format (`__('Welcome')`).
Cause: Convenience — no need to invent key names.
Consequence: Changing English text changes the key, requiring all other locale files to update.
Better: Use PHP array format with abstract keys (`messages.welcome`).

### Forgetting count Parameter for Pluralization
Desc: `__('messages.apples', [$n])` without `'count'` key.
Cause: Not understanding that pluralization requires the specific `count` key.
Consequence: Always returns the singular form.
Better: Always use `['count' => $n]`.

### Not Publishing Package Translations
Desc: Unable to customize package translations.
Cause: Not running `vendor:publish --tag=package-translations`.
Consequence: Package translations cannot be overridden.
Better: Publish translations to customize.

---

## Anti-Patterns

### Using Locale as Global State
Setting locale globally without considering that different parts of an application might need different locales (e.g., admin panel in English, user-facing content in French). Use request-scoped locale determination.

### Translation in Business Logic
Calling `__()` inside services or actions. Translation is a presentation concern. Pass translated strings to the view, or pass data and translate in the view layer.

### Over-Translation of Technical Messages
Translating log messages, exception messages, and debug output. Technical messages should remain in the development language for consistency in logs and error tracking.

---

## Examples

### PHP Array Translation
```php
// lang/en/messages.php
return [
    'welcome' => 'Welcome to our application',
    'apples' => '{0} No apples|{1} One apple|[2,*] :count apples',
];
```

### JSON Translation
```json
// lang/fr.json
{
    "Welcome to our application": "Bienvenue dans notre application"
}
```

### URL Prefix Middleware
```php
class SetLocaleMiddleware
{
    public function handle($request, $next)
    {
        $locale = $request->segment(1);
        $supported = ['en', 'fr', 'de'];

        if (!in_array($locale, $supported)) {
            $locale = config('app.fallback_locale');
        }

        app()->setLocale($locale);
        return $next($request);
    }
}
```

---

## Related Topics

### Prerequisites
- **Configuration Management** — Locale and fallback locale config
- **Directory Conventions** — `lang/` directory structure

### Closely Related
- **Bootstrapping Lifecycle** — Translation loading is deferred
- **Service Provider Strategies** — Package translation namespace registration
- **Blade / View Layer** — `@lang` directive and locale-aware views

### Advanced
- **Database-Backed Translations** — Runtime-editable translation stores
- **RTL Language Support** — Handling right-to-left text direction

### Cross-Domain
- **API & CRUD System Engineering** — Locale-aware API responses

---

## AI Agent Notes

### Important Decisions
- The `lang/` directory replaced `resources/lang/` in Laravel 9
- JSON format enables integration with translation services (Crowdin, Lokalise, POEditor)
- PHP array format enables structured, namespaced, countable translations
- Locale detection via URL prefix is universally recommended for public applications

### Important Constraints
- Translations are file-based — they cannot be modified at runtime through a UI
- The Translator is a singleton — consistent locale throughout a single request
- Missing translations silently fall back (no exception thrown)
- RTL language support is NOT handled by the translation system — separate implementation required

### Rules Generation Hints
- Enforce `__()` as the only translation access point
- Enforce locale validation for all user-supplied locale values
- Enforce `count` parameter for all pluralized translations

---

## Verification

This document has been validated against:
- `Illuminate\Translation\Translator` — key resolution, pluralization, fallback logic
- `Illuminate\Translation\FileLoader` — PHP and JSON file loading
- `Illuminate\Translation\TranslationServiceProvider` — Translator singleton registration
- Symfony `Translation\PluralizationRules` — 100+ language plural forms
