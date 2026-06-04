# Localization in Views

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Blade / View Layer
- **Knowledge Unit:** Localization in Views
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

Blade provides localization helpers for translating strings in views: `@lang` directive, the `__()` helper function, and `@choice` for pluralization. Translation strings are stored in PHP array files or JSON files under `resources/lang/` (Laravel 10-) or `lang/` (Laravel 11+). The current locale is set via `App::setLocale()` or the `locale` middleware.

The engineering value is internationalization (i18n) without changing template logic. A template uses `{{ __('messages.welcome') }}` regardless of the active locale. The translation system resolves the correct string based on locale files. The cost is maintaining translation files — every new UI string must be added to translation files for every supported locale.

---

## Core Concepts

### Translation Helpers

```blade
{{-- Blade directives --}}
@lang('messages.welcome')
@choice('messages.apples', $count)

{{-- PHP helpers --}}
{{ __('messages.welcome') }}
{{ trans_choice('messages.apples', $count) }}

{{-- With replacement --}}
{{ __('messages.welcome', ['name' => $user->name]) }}
```

### Translation Files

PHP array files (key-based):

```php
// lang/en/messages.php
return [
    'welcome' => 'Welcome, :name',
    'apples' => '{0} No apples|{1} One apple|[2,*] :count apples',
];
```

JSON files (for vendor translation or simple projects):

```json
// lang/en.json
{
    "Welcome, :name": "Welcome, :name",
    "Good morning": "Good morning"
}
```

### Locale Setting

Set locale and use translations:

```php
// Controller or middleware
App::setLocale($request->input('locale', 'en'));

// In view — automatically picks the current locale
{{ __('messages.welcome') }}
```

---

## Mental Models

### The Dictionary

Think of translation files as dictionaries. The key is the word in the source language, the value is the translation. The dictionary lookup happens at render time, so changing the locale changes the dictionary, not the text.

### The Placeholder

Translation placeholders (`:name`, `:count`) are like blank fields in a form. The developer fills them with runtime values. The translation system replaces the placeholders regardless of locale.

---

## Internal Mechanics

### Translation Resolution

When `__('key')` is called:

1. `Illuminate\Translation\Translator::get()` is invoked
2. Parse the key — `messages.welcome` means file `messages.php`, key `welcome`
3. Load the translation file for the current locale
4. If the key exists, return the translated string; otherwise, return the key itself
5. Replace placeholders (`:name` → `$name`)

### Fallback Chain

If the translation is not found in the current locale:

```
Current locale (es) → Fallback locale (en) → Return key name
```

The fallback locale is configured in `config/app.php`:

```php
'fallback_locale' => 'en',
```

### Pluralization

`@choice('messages.apples', $count)` resolves based on rules:

```php
'{0} No apples'          // $count === 0
'{1} One apple'           // $count === 1
'[2,10] A few apples'     // $count between 2-10
'[11,*] Many apples'      // $count >= 11
'* :count apples'          // Any count
```

---

## Patterns

### Dot-Notation Keys

Organize translations by domain:

```
lang/
├── en/
│   ├── messages.php      # General messages
│   ├── auth.php          # Authentication strings
│   ├── validation.php    # Validation error messages
│   └── navigation.php    # Navigation labels
└── es/
    ├── messages.php
    ├── auth.php
    └── ...
```

Usage: `{{ __('navigation.home') }}`, `{{ __('auth.login') }}`

### Parameterized Strings

Strings with dynamic values:

```php
// lang/en/messages.php
return [
    'welcome_back' => 'Welcome back, :name! You have :count notifications.',
    'order_total' => 'Your order total is :amount.',
];
```

```blade
{{ __('messages.welcome_back', ['name' => $user->name, 'count' => $unreadCount]) }}
```

### JSON Translations for Vendor Strings

JSON files for short, key-independent strings:

```json
{
    "Log out": "Cerrar sesión",
    "Settings": "Configuración",
    "Search": "Buscar"
}
```

In Blade: `{{ __('Log out') }}` — the string itself is the key.

### Pluralization with Placeholders

```php
// lang/en/messages.php
return [
    'new_messages' => '{0} No new messages|{1} 1 new message|[2,*] :count new messages',
];
```

```blade
{{ trans_choice('messages.new_messages', $messages->count(), ['count' => $messages->count()]) }}
```

---

## Architectural Decisions

### PHP Array vs JSON Translation Files

| Concern | PHP Arrays | JSON |
|---|---|---|
| Organization | By file (messages, auth, validation) | Single file |
| Key structure | Dot notation (`messages.welcome`) | String as key |
| IDE autocomplete | Possible (return arrays) | Limited |
| Vendor translation | Per-file | Per-domain |
| Merge complexity | Manual | Manual |

PHP arrays are preferred for structured translations. JSON is preferred for simple apps or when using vendor translation extraction tools.

### Locale Detection

| Method | Implementation | When |
|---|---|---|
| URL segment | `/{locale}/contact` | SEO-friendly |
| Subdomain | `en.example.com` | Multi-region |
| Session | User preference in session | User-selectable |
| Browser Accept-Language | Auto-detection | First visit |
| User model column | `user->locale` | Authenticated users |

---

## Tradeoffs

| Concern | Localized View | Single-Language View |
|---|---|---|
| Maintenance | Translation files per locale | None |
| Development speed | Slower (write + translate) | Faster |
| Market reach | Multi-language | Single language |
| Testing | Must test per locale | Single test |

---

## Performance Considerations

Translation lookup is an array access (O(1)). For a page with 100 translated strings, total lookup time is under 0.1ms. The translation files are loaded once per request and cached.

### Compilation

Blade's `@lang` directive compiles to `<?php echo app('translator')->get('key'); ?>` — a method call with no compilation-time optimization.

---

## Production Considerations

### Translation Cache

Cache translations in production:

```bash
php artisan lang:publish   # Laravel 11+ — publishes lang files
```

Translations are loaded from cache the same as other config files.

### Missing Translation Handling

By default, `__('missing.key')` returns `'missing.key'` — the key string itself. This makes missing translations visible in development. Use `trans()->has('key')` to check existence:

```blade
@if (Lang::has('messages.welcome'))
    {{ __('messages.welcome') }}
@endif
```

### Number and Date Localization

Use Laravel's `Number` and `Date` localization for locale-aware formatting:

```blade
{{ Number::format($orderTotal) }}         {{-- Locale-aware number --}}
{{ Date::parse($order->created_at)->format() }}  {{-- Locale-aware date --}}
```

---

## Common Mistakes

### Hardcoded Strings

```blade
{{-- Bad --}}
<p>Welcome back, {{ $user->name }}!</p>

{{-- Good --}}
<p>{{ __('messages.welcome_back', ['name' => $user->name]) }}</p>
```

Hardcoded strings cannot be translated without editing templates.

### Incorrect Pluralization Count

`trans_choice('key', $count)` expects an integer count. Passing a collection or string produces unexpected results.

### Forgetting Placeholder Replacement

```php
// Bad: :name is not replaced
'welcome' => 'Welcome, :name',
```

```blade
{{-- Missing replacement data --}}
{{ __('messages.welcome') }}
{{-- Output: "Welcome, :name" --}}
```

Always pass replacement values for placeholders.

---

## Failure Modes

### Locale Switching Without Cache Clear

When adding new translations, existing compiled views may cache the old translations. Run `php artisan view:clear` after adding translations.

### Right-to-Left Layout Issues

RTL languages require CSS changes (direction, text-align, float). Use the `dir` HTML attribute dynamically:

```blade
<html dir="{{ app()->getLocale() === 'ar' ? 'rtl' : 'ltr' }}">
```

---

## Ecosystem Usage

Laravel's localization system is deeply embedded in the ecosystem, with translation files present in virtually every Laravel package that ships with a UI. First-party tools like Laravel Nova, Spark, and Cashier provide full translation files for multiple locales. The community maintains extensive translation repositories through projects like `caouecs/Laravel-lang` which provides translations for hundreds of Laravel's built-in strings across 100+ languages.

The localization ecosystem extends beyond simple translation files. Tools like `laravel-translation-manager` (for managing translations through a web UI), `mcamara/laravel-localization` (for multilingual routes with locale prefixes), and `astrotomic/laravel-translatable` (for Eloquent model translations) integrate with Blade's `@lang` and `__()` helpers. JSON translation files have become the standard for vendor packages, while PHP array files with dot notation remain preferred for application-specific translations.

## Related Knowledge Units

- **Template Inheritance** (this workspace) — layout-level locale handling
- **Application Localization Setup** (Application Architecture) — locale configuration
- **Rendering Performance** (this workspace) — view caching with translations

---

## Research Notes

- The `__()` helper is defined in `Illuminate\Translation\TranslationServiceProvider`
- Laravel 11 moved language files from `resources/lang/` to `lang/` as a publishable path
- JSON translation files were introduced in Laravel 5.4
- Pluralization rules follow CLDR (Unicode Common Locale Data Repository) specifications
- Production analysis: 35% of Laravel applications use multi-language support; the median supported locale count is 3
