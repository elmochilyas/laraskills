# Localization — Rules

## Use PHP Array Format for Application Translations

Prefer `lang/{locale}/messages.php` PHP array files over `lang/{locale}.json` JSON files for application-managed translations.

---

## Category

Architecture

---

## Rule

Store application translations in PHP array format (`lang/en/messages.php`). Reserve JSON format for integration with third-party translation services (Crowdin, Lokalise, POEditor).

---

## Reason

PHP arrays support organization by namespace, enable translation progress counting via directory scanning, work with IDE autocompletion packages, and handle pluralization naturally. JSON format uses English source strings as keys, which prevents key renaming without breaking all locale files.

---

## Bad Example

```json
// lang/fr.json
{
    "Welcome to our application": "Bienvenue dans notre application"
}
// Changing "Welcome to our application" breaks the key
```

---

## Good Example

```php
// lang/en/messages.php
return [
    'welcome' => 'Welcome to our application',
];

// lang/fr/messages.php
return [
    'welcome' => 'Bienvenue dans notre application',
];
// Changing the value in English does not break the key
```

---

## Exceptions

JSON format is acceptable when translations are managed through a third-party service that exports in JSON, or for simple applications with fewer than 20 translation strings.

---

## Consequences Of Violation

Translation keys tied to English source text, key changes require updating all locale files, harder to track translation progress.

---

## Always Set and Configure the Fallback Locale

Configure `fallback_locale` in `config/app.php` to the most complete translation set.

---

## Category

Reliability

---

## Rule

Set `'fallback_locale'` in `config/app.php` to the locale with the most comprehensive translation coverage. Never leave it at the default without verifying completeness.

---

## Reason

When a translation key is missing in the current locale, the fallback locale's translation is used. If the fallback locale also lacks the translation, the raw key is displayed to the user. Proper fallback configuration prevents raw key exposure.

---

## Bad Example

```php
// config/app.php
'fallback_locale' => 'en',
// If English translations are incomplete, raw keys are shown
```

---

## Good Example

```php
// config/app.php
'fallback_locale' => 'en',
// Ensure English translations are always complete
// Add CI check: every key in lang/fr must exist in lang/en
```

---

## Exceptions

Single-language applications do not need fallback locale configuration beyond the default.

---

## Consequences Of Violation

Untranslated keys displayed as raw keys (`messages.welcome`) to users, unprofessional appearance, user confusion.

---

## Validate All User-Supplied Locale Values

Always validate user-provided locale values against the allowed locales list before calling `app()->setLocale()`.

---

## Category

Security

---

## Rule

Before setting the application locale from user input (URL segment, form field, API parameter, browser header), validate it against a whitelist of supported locales. Reject unsupported values with a fallback to the default locale or a 404 response.

---

## Reason

Passing an unsupported locale to `app()->setLocale()` silently falls back to the default locale, making debugging difficult. An invalid locale could also be used for locale enumeration attacks or unexpected behavior in locale-dependent code paths.

---

## Bad Example

```php
$locale = $request->segment(1);
app()->setLocale($locale); // no validation — silent fallback
```

---

## Good Example

```php
$locale = $request->segment(1);
$supported = ['en', 'fr', 'de', 'es'];

if (! in_array($locale, $supported)) {
    $locale = config('app.fallback_locale');
}

app()->setLocale($locale);
```

---

## Exceptions

Applications that only support a single locale do not need validation.

---

## Consequences Of Violation

Silent locale fallback, difficulty debugging locale-related issues, potential security enumeration of supported locales.

---

## Always Pass the count Parameter for Pluralization

Use `['count' => $n]` syntax for all pluralized translation calls.

---

## Category

Framework Usage

---

## Rule

Every translation string with pluralization must be called with `['count' => $n]`. Using a bare integer or omitting the parameter causes the singular form to always be returned.

---

## Reason

The translator explicitly looks for the `count` key in the replacement parameters to trigger pluralization logic. Without it, the first plural form is always returned, regardless of the actual count.

---

## Bad Example

```php
// Translation: '{0} No apples|{1} One apple|[2,*] :count apples'
__('messages.apples', $count);        // wrong
__('messages.apples', [$count]);       // wrong
__('messages.apples', ['n' => $count]); // wrong
// All return singular form
```

---

## Good Example

```php
__('messages.apples', ['count' => $count]);
// Correctly returns: "No apples" (0), "One apple" (1), "5 apples" (5)
```

---

## Exceptions

Non-pluralized translation calls are unaffected and do not need the `count` parameter.

---

## Consequences Of Violation

Pluralization silently fails, always showing singular form, incorrect user-facing messages.

---

## Include Locale in Cache Keys for Localized Content

Append the current locale to cache keys when caching locale-dependent content.

---

## Category

Reliability

---

## Rule

All cache keys that store locale-aware data must include `app()->getLocale()` as part of the key. Never cache localized content with a locale-independent key.

---

## Reason

Without locale in the cache key, the same cached content is returned for all locales. A user requesting `fr` receives the `en` cached version, defeating localization.

---

## Bad Example

```php
$posts = Cache::remember('posts.all', 3600, fn() => Post::all());
// All locales share the same cached posts
```

---

## Good Example

```php
$locale = app()->getLocale();
$posts = Cache::remember("posts.all.{$locale}", 3600, fn() => Post::all());
// Each locale has its own cached version
```

---

## Exceptions

Content that is identical across all locales (e.g., system configuration) does not need locale-specific caching.

---

## Consequences Of Violation

Users receive content in the wrong language from cache, inconsistent localized presentation.

---

## Never Call __() in Business Logic Classes

Restrict `__()` and `trans()` calls to views, controllers, and Blade templates. Business logic must not handle translation.

---

## Category

Architecture

---

## Rule

Services, actions, domain objects, and repositories must not call translation helpers. Return translatable identifiers or structured data and let the presentation layer handle translation.

---

## Reason

Translation is a presentation concern. Calling `__()` in business logic couples domain code to the localization system, makes testing require translation setup, and violates the separation of concerns between business logic and presentation.

---

## Bad Example

```php
class OrderService
{
    public function process(int $id): string
    {
        // ...
        return __('order.processed'); // translation in business logic
    }
}
```

---

## Good Example

```php
class OrderService
{
    public function process(int $id): array
    {
        // ...
        return [
            'status' => 'processed',
            'message_key' => 'order.processed',
        ];
    }
}

// Controller handles translation
$result = $service->process($id);
return __('order.processed');
```

---

## Exceptions

Validation error messages returned from form request classes may use `__()` as they are part of the HTTP layer.

---

## Consequences Of Violation

Business logic coupled to the localization system, unit tests require translation file setup, domain code mixed with presentation concern.

---

## Do Not Translate Technical Messages

Keep log messages, exception messages, and debug output in the development language. Do not pass them through the translation system.

---

## Category

Maintainability

---

## Rule

Log messages, exception messages, debug output, and internal error codes must not be translated. They must remain in the application's primary development language (typically English).

---

## Reason

Technical messages are consumed by developers and operators, not end users. Translating them makes log analysis inconsistent, error tracking harder to aggregate, and debugging more difficult when team members speak different languages.

---

## Bad Example

```php
Log::error(__('logs.payment_failed', ['id' => $orderId]));
// Log message depends on current locale
```

---

## Good Example

```php
Log::error('Payment processing failed', ['order_id' => $orderId]);
// Consistent log messages regardless of locale
```

---

## Exceptions

User-facing exception pages and error views may translate messages for display, but the underlying log and exception message must remain untranslated.

---

## Consequences Of Violation

Inconsistent log entries across locales, error aggregation systems cannot group similar errors, difficult debugging in multilingual teams.
