## Rule: Always Use `__()` for User-Facing Strings

---

## Category

Framework Usage

---

## Rule

Wrap every user-facing string in `__()` or `@lang`, even in single-language applications. Never hardcode UI text directly in Blade templates.

---

## Reason

Hardcoded strings require editing every template to add a new language. Using `__()` from the start makes internationalization a configuration change, not a code change. It also enables string management tools, translation extraction, and future-proofs the application for multi-language support without retrofitting every template.

---

## Bad Example

```blade
<h1>Welcome back, {{ $user->name }}!</h1>
<p>You have {{ $count }} notifications.</p>
```

---

## Good Example

```blade
<h1>{{ __('messages.welcome_back', ['name' => $user->name]) }}</h1>
<p>{{ trans_choice('messages.notifications', $count, ['count' => $count]) }}</p>
```

---

## Exceptions

Developer-facing output (log messages, debug variables, error codes displayed only in development) does not need translation. Variable names and data attribute values also do not need translation.

---

## Consequences Of Violation

Scalability risks: Adding a new language requires editing every template instead of adding translation files. Maintenance risks: Hardcoded strings are inconsistently phrased across templates.

---

## Rule: Always Pass All Required Placeholder Replacements

---

## Category

Reliability

---

## Rule

When a translation string contains `:placeholder` variables, always pass the replacement values as the second argument to `__()`. Never call `__('key')` without replacements when placeholders exist.

---

## Reason

Missing placeholder replacements result in raw `:name` text appearing in the rendered output — a confusing and unprofessional user experience. The translation system does not warn about missing replacements; it simply outputs the template string with unsubstituted placeholders.

---

## Bad Example

```php
// Translation: 'welcome' => 'Welcome, :name!'
__('messages.welcome');
// Output: "Welcome, :name!" — raw placeholder visible to user
```

---

## Good Example

```php
__('messages.welcome', ['name' => $user->name]);
// Output: "Welcome, John!"
```

---

## Exceptions

Translation strings that genuinely contain no placeholders do not need a replacement array. Always verify by checking the translation file.

---

## Consequences Of Violation

Reliability risks: Raw placeholders displayed to users. Maintenance risks: Placeholder omissions are invisible during development and only noticed in production.

---

## Rule: Validate User-Supplied Locale Values

---

## Category

Security

---

## Rule

Whitelist accepted locale values when the locale is supplied via URL segment, query parameter, or user input. Never pass unvalidated user input directly to `App::setLocale()`.

---

## Reason

Locale values can be manipulated to cause unexpected behavior. An attacker passing `App::setLocale($request->input('locale'))` with a non-existent locale bypasses the fallback chain. More critically, if your locale detection logic is used in file path generation, an attacker could manipulate it for path traversal. Always validate against a whitelist of supported locales.

---

## Bad Example

```php
public function setLanguage(Request $request)
{
    App::setLocale($request->input('locale')); // No validation
    return back();
}
```

---

## Good Example

```php
public function setLanguage(Request $request)
{
    $locale = $request->input('locale');
    $supported = ['en', 'es', 'fr', 'de'];

    if (in_array($locale, $supported, true)) {
        App::setLocale($locale);
        session(['locale' => $locale]);
    }

    return back();
}
```

---

## Exceptions

Locales set from the authenticated user's profile (where the value was already validated on save) do not need re-validation on every request.

---

## Consequences Of Violation

Security risks: Locale manipulation can bypass fallback logic or, in misconfigured systems, enable path traversal. Reliability risks: Non-existent locales produce untranslated content (key strings shown).

---

## Rule: Use Dot-Notation Keys with Maximum 2 Levels

---

## Category

Code Organization

---

## Rule

Structure translation keys using dot notation with a maximum of two levels (e.g., `messages.welcome`, `auth.login`, `validation.required`). Do not use deeper nesting.

---

## Reason

Deeply nested keys (`messages.user.profile.update.success`) are hard to type, hard to remember, and easy to mistype with no error feedback (the key just returns itself). Two-level keys provide sufficient organization by domain (file) and specific string (key) without the complexity of deeper hierarchies.

---

## Bad Example

```php
// lang/en/messages.php
return [
    'user' => [
        'profile' => [
            'update' => [
                'success' => 'Profile updated successfully',
            ],
        ],
    ],
];
// Usage: __('messages.user.profile.update.success')
```

---

## Good Example

```php
// lang/en/messages.php
return [
    'profile_updated' => 'Profile updated successfully',
];

// Or with sub-files:
// lang/en/profile.php
return [
    'updated' => 'Profile updated successfully',
];
// Usage: __('profile.updated')
```

---

## Exceptions

Validation messages generated by Laravel's built-in validation system use 2-level nesting by convention (`validation.accepted`, `validation.min.string`) — do not restructure these. Custom validation messages should follow the same flat 2-level pattern.

---

## Consequences Of Violation

Maintenance risks: Keys are hard to remember and frequently mistyped. Scalability risks: Deep nesting makes translation files harder to navigate and maintain.

---

## Rule: Use Laravel's `Number` and `Date` Helpers for Locale-Aware Formatting

---

## Category

Framework Usage

---

## Rule

Format numbers and dates in views using `Number::format()`, `Number::currency()`, `Date::parse()->format()`, and similar Laravel helpers. Do not use PHP's native `number_format()`, `date()`, or `strftime()`.

---

## Reason

PHP's native formatting functions use the server's locale, which may differ from the user's selected application locale. Laravel's `Number` and `Date` helpers use the application locale, automatically formatting numbers with the correct decimal and thousands separators, and formatting dates according to the user's locale conventions (e.g., `3/10` vs `10/3`).

---

## Bad Example

```blade
<p>{{ number_format($order->total / 100, 2) }}</p>
<p>{{ $order->created_at->format('m/d/Y') }}</p>
{{-- Uses server locale, not user locale --}}
```

---

## Good Example

```blade
<p>{{ Number::format($order->total / 100) }}</p>
<p>{{ Number::currency($order->total / 100, 'USD') }}</p>
<p>{{ Date::parse($order->created_at)->format() }}</p>
{{-- Uses app locale — correct for current user --}}
```

---

## Exceptions

When explicitly needing the server locale (e.g., log file date formatting, internal system dates not displayed to users), native PHP functions are acceptable.

---

## Consequences Of Violation

Reliability risks: Users see dates and numbers formatted in a locale they did not choose. Scalability risks: Adding locale-aware formatting later requires editing every template.

---

## Rule: Cache Translations in Production

---

## Category

Performance

---

## Rule

Run `php artisan lang:publish` (Laravel 11+) or configure translation caching in production. Never serve translation files from disk on every request without caching.

---

## Reason

Uncached translations read PHP/JSON files from disk on every request, parsing and loading them into memory for each locale. Translation lookup is O(1) array access once loaded, but the initial file read and parse cost adds up across many translations per page. Caching collapses this to a single memory read per locale.

---

## Bad Example

```php
// No translation cache — every page reads from disk
// config/app.php does not publish lang files
```

---

## Good Example

```bash
# Laravel 11+ — publish and cache translations
php artisan lang:publish

# Ensure lang directory is in the cached paths
# Or use a deployment script that runs lang:publish
```

---

## Exceptions

Development environments benefit from uncached translations (immediate visibility of changes). Only production deployments should cache.

---

## Consequences Of Violation

Performance risks: Disk I/O on every request for translation file loading; measurable latency on pages with many translated strings.
