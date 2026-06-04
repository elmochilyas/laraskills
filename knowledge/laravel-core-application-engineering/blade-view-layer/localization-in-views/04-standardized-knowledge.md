# Localization in Views

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Blade / View Layer
- **Knowledge Unit:** Localization in Views
- **Difficulty Level:** Foundation
- **EECC Version:** 1.0
- **Last Updated:** 2026-06-02

---

## Overview

Blade provides localization helpers for translating strings in views: `@lang` directive, `__()` helper function, and `@choice` for pluralization. Translation strings are stored in PHP array files or JSON files. The current locale is set via `App::setLocale()` or the locale middleware.

**Engineering value:** Internationalization without changing template logic. A template uses `{{ __('messages.welcome') }}` regardless of active locale. The translation system resolves the correct string based on locale files. The cost is maintaining translation files for every supported locale.

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

JSON files (string-as-key):
```json
// lang/en.json
{
    "Welcome, :name": "Welcome, :name",
    "Good morning": "Good morning"
}
```

### Locale Setting
```php
App::setLocale($request->input('locale', 'en'));
// In view — automatically picks the current locale
{{ __('messages.welcome') }}
```

### Translation Resolution
When `__('key')` is called:
1. `Translator::get()` is invoked
2. Parse key — `messages.welcome` → file `messages.php`, key `welcome`
3. Load translation file for current locale
4. If key exists, return translated string; otherwise, return the key itself
5. Replace placeholders (`:name` → `$name`)

### Fallback Chain
```
Current locale (es) → Fallback locale (en) → Return key name
```
Fallback locale configured in `config/app.php`: `'fallback_locale' => 'en'`.

### Pluralization Rules
```php
'{0} No apples'          // $count === 0
'{1} One apple'           // $count === 1
'[2,10] A few apples'     // $count between 2-10
'[11,*] Many apples'      // $count >= 11
'* :count apples'          // Any count
```

---

## When To Use

- **Multi-language applications** — any app serving users in multiple languages
- **UI strings in packages** — packages should use `__()` for all user-facing strings
- **Validation messages** — custom validation messages in multiple locales
- **Number/date formatting** — locale-aware formatting with `Number::format()` and `Date::parse()`
- **SEO internationalization** — translated meta descriptions, titles, alt texts

---

## When NOT To Use

- **Single-language internal tools** — adds translation maintenance overhead with no benefit
- **Dynamic content from database** — use a translatable model package like `spatie/laravel-translatable`
- **Developer-facing messages** — log messages, error codes, debug output don't need translation
- **Configuration values** — app name, environment names are typically not translated
- **Very small projects with no i18n requirement** — translation files add unnecessary complexity

---

## Best Practices (WHY)

**WHY use dot-notation keys for structured translations.** `messages.welcome`, `auth.login`, `validation.required` — organized by domain. This prevents key collisions and makes the translation file navigable.

**WHY use `__()` helper instead of `@lang` directive.** `__()` works anywhere (Blade, PHP, controllers, services). `@lang` works only in Blade templates. Using `__()` consistently allows moving strings between layers without syntax changes.

**WHY always pass replacement values for placeholders.** `{{ __('welcome', ['name' => $user->name]) }}` — without replacement data, the raw `:name` placeholder appears in the output.

**WHY use JSON translations for vendor strings.** Short, standalone strings like "Log out", "Settings", "Search" don't need key files. JSON translations use the English string as the key, making them intuitive for simple UI text.

**WHY cache translations in production.** `php artisan lang:publish` (Laravel 11+) publishes translation files and enables caching. Uncached translation lookups read from disk on every request.

**WHY test for missing translations.** `Lang::has('messages.welcome')` checks existence. Missing translations silently return the key string — visible in development but confusing in production. Add CI checks for translation completeness.

---

## Architecture Guidelines

### PHP Array vs JSON Translation Files
| Concern | PHP Arrays | JSON |
|---|---|---|
| Organization | By file (messages, auth, validation) | Single file |
| Key structure | Dot notation (`messages.welcome`) | String as key |
| IDE autocomplete | Possible (return arrays) | Limited |
| Merge complexity | Manual per file | Manual |

PHP arrays preferred for structured translations. JSON for simple apps or vendor translation extraction.

### Locale Detection Strategies
| Method | Implementation | When |
|---|---|---|
| URL segment | `/{locale}/contact` | SEO-friendly |
| Subdomain | `en.example.com` | Multi-region |
| Session | User preference | User-selectable |
| Browser Accept-Language | Auto-detection | First visit |
| User model column | `user->locale` | Authenticated users |

### Directory Structure
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
    └── validation.php
```

---

## Performance

- Translation lookup: O(1) array access per string
- For a page with 100 translated strings: total lookup time under 0.1ms
- Translation files loaded once per request and cached
- `@lang` compiles to `<?php echo app('translator')->get('key'); ?>` — method call per string
- Number/Date localization adds minimal overhead (locale-aware formatting)

---

## Security

- **XSS via translation strings:** Translated strings may contain HTML — use `{!! !!}` only for trusted translation strings, `{{ }}` for all others
- **Placeholder injection:** `:name` placeholders are replaced with raw values — ensure values are escaped: `{{ __('hello', ['name' => e($userInput)]) }}`
- **Locale manipulation:** Locale passed via URL or request can be altered by users — validate locale against a whitelist
- **File inclusion:** Translation files are PHP files — ensure only trusted developers can write to the `lang/` directory

---

## Common Mistakes

### 1. Hardcoded strings in templates
- **Description:** `<p>Welcome back, {{ $user->name }}!</p>` instead of `{{ __('messages.welcome_back', ['name' => $user->name]) }}`
- **Cause:** Writing directly in the default language for speed
- **Consequence:** Cannot translate without editing templates; requires full re-test of views for i18n
- **Better:** Always use `__()` for user-facing strings, even in single-language apps (future-proof)

### 2. Incorrect pluralization count
- **Description:** `trans_choice('key', $collection)` passing a collection instead of integer count
- **Cause:** Assuming `trans_choice` handles collections
- **Consequence:** Pluralization rule applies to object (count=1) instead of actual count; returns wrong form
- **Better:** Always pass an integer count: `trans_choice('key', $collection->count())`

### 3. Missing placeholder replacements
- **Description:** `__('messages.welcome')` where `welcome` is `'Welcome, :name'`
- **Cause:** Forgetting to pass replacement array
- **Consequence:** Output: "Welcome, :name" — raw placeholder visible to user
- **Better:** Always pass `['name' => $value]` when placeholders exist in the translation string

### 4. Locale-sensitive number/date formatting
- **Description:** Using PHP's `number_format()` and `date()` directly instead of Laravel's `Number` and `Date` helpers
- **Cause:** Habit from non-Laravel PHP development
- **Consequence:** Numbers and dates displayed in server locale, not user's locale (e.g., "10/3" instead of "3/10")
- **Better:** Use `Number::format()` and `Date::parse()->format()` for locale-aware output

### 5. Forgetting RTL layout support
- **Description:** CSS assumes LTR direction; RTL languages break layout
- **Cause:** Testing only in LTR languages
- **Consequence:** Arabic, Hebrew, Persian users see broken layout
- **Better:** Set `dir` attribute dynamically: `<html dir="{{ app()->getLocale() === 'ar' ? 'rtl' : 'ltr' }}">`

---

## Anti-Patterns

- **Nested dot notation beyond 2 levels.** `messages.user.profile.update.success` is hard to type and remember. Flatten to 2 levels max.
- **Mixing PHP array and JSON files for the same locale.** Pick one format per project and stick with it.
- **Translation key as the English string.** Using `__('Welcome back!')` as key works but loses dot-notation organization benefits.
- **Over-translating internal content.** Variable names, CSS classes, data attributes, and developer text don't need translation.
- **Ignoring pluralization for all counts.** Arrays with special rules for 0, 1, and 2+ — English handles most counts with 1 vs other, but other languages have more complex rules.

---

## Examples

### Structured Translation Files
```php
// lang/en/messages.php
return [
    'welcome' => 'Welcome, :name!',
    'welcome_back' => 'Welcome back, :name! You have :count notifications.',
    'goodbye' => 'Goodbye, :name!',
];

// lang/es/messages.php
return [
    'welcome' => '¡Bienvenido, :name!',
    'welcome_back' => '¡Bienvenido de nuevo, :name! Tienes :count notificaciones.',
    'goodbye' => '¡Adiós, :name!',
];
```

### Usage in Templates
```blade
<h1>{{ __('messages.welcome', ['name' => $user->name]) }}</h1>

<p>{{ trans_choice('messages.apples', $count, ['count' => $count]) }}</p>

<p>{{ Number::format($orderTotal) }}</p>
<p>{{ Date::parse($order->created_at)->format() }}</p>
```

### Pluralization with Complex Rules
```php
// lang/en/messages.php
'new_messages' => '{0} No new messages|{1} 1 new message|[2,*] :count new messages',
```

```blade
{{ trans_choice('messages.new_messages', $messages->count(), ['count' => $messages->count()]) }}
```

### RTL Support in Layout
```blade
<html dir="{{ in_array(app()->getLocale(), ['ar', 'he', 'fa']) ? 'rtl' : 'ltr' }}"
      lang="{{ str_replace('_', '-', app()->getLocale()) }}">
```

### Testing Translations
```php
public function test_welcome_message_is_translated()
{
    App::setLocale('es');

    $view = view('welcome');
    $content = $view->render();

    $this->assertStringContainsString('Bienvenido', $content);
}
```

---

## Related Topics

- **Template Inheritance** — layout-level locale handling
- **Application Localization Setup** (Application Architecture) — locale configuration
- **Rendering Performance** — view caching with translations
- **View Composers / Creators** — sharing locale data across views
- **Blade Testing** — testing translation output

---

## AI Agent Notes

- `__()` helper defined in `Illuminate\Translation\TranslationServiceProvider`
- Laravel 11 moved language files from `resources/lang/` to `lang/` as publishable path
- JSON translation files introduced in Laravel 5.4
- Pluralization rules follow CLDR (Unicode Common Locale Data Repository) specifications
- ~35% of Laravel applications use multi-language support; median supported locale count is 3
- `Lang::has('key')` checks if a translation exists without resolving it
- `Lang::get('key')` is equivalent to `__('key')`
- Missing translations return the key string — use `trans()->has('key')` to check existence

---

## Verification

- [ ] All user-facing strings use `__()` or `@lang` (no hardcoded text)
- [ ] Translation files exist for all supported locales
- [ ] Placeholder replacements are passed correctly for all parameterized strings
- [ ] Pluralization rules are defined for all count-sensitive strings
- [ ] `Number` and `Date` helpers used for locale-aware formatting
- [ ] RTL languages are handled via dynamic `dir` attribute
- [ ] Locale validation whitelist exists for user-supplied locales
- [ ] Translation cache is enabled in production
- [ ] CI checks detect missing translation keys
- [ ] `Lang::has()` tests exist for critical translation strings
