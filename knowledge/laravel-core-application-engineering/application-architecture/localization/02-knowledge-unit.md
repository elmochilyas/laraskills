# Laravel Localization & Internationalization

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Application Architecture & Structure
- **Knowledge Unit:** Laravel Localization & Internationalization
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Laravel's localization system provides a translation layer between application source strings and user-facing output. It supports two file formats (PHP arrays for hierarchical translations, JSON for flat key-value pairs), pluralization across 100+ languages via Symfony's translation component, and locale detection/determination through middleware, URL prefixes, session storage, or browser headers.

The system's architectural design reflects a pragmatic tradeoff: translations are stored as PHP files (optimizable, cacheable, countable) or JSON files (simple, package-friendly), and are loaded into a `Translator` instance that wraps the Symfony `Translator` component. The `__()` helper function is the primary access point, with Blade's `@lang` directive as a template-specific alternative.

The most critical engineering decision in Laravel localization is the **locale detection strategy** — how the application determines which language to display. The default approach (reading from `config/app.php`'s `locale` value) provides a single global locale. Production applications typically implement a middleware-based strategy that reads locale from URL prefix, authenticated user preference, session, or browser `Accept-Language` header. Each strategy has different implications for caching, SEO, and URL design.

The second critical decision is the **translation storage format** — PHP array files (organized by domain) vs JSON files (flat key-value). PHP arrays are more structured, support nested namespaces, and are countable for translation progress tracking. JSON files are simpler, require less ceremony for single-key lookups, and are the format used by many third-party translation services.

---

## Core Concepts

### Locale
A locale is a language identifier following the ISO 639-1 (language) and optionally ISO 3166-1 (region) standards. Examples: `en` (English), `fr` (French), `de` (German), `zh_CN` (Chinese, Simplified — China). Laravel uses the locale to determine which set of translation files to load.

The locale is stored in three places:
1. The `Translator` instance's `$locale` property (runtime value)
2. The application configuration (`config/app.php` `locale` key, default fallback)
3. The session or URL (middleware-determined, override of the above)

### Translation Files
Translation files are stored in the `lang/` directory:
- **PHP Format:** `lang/{locale}/{namespace}.php` — returns a PHP array of key-value pairs
- **JSON Format:** `lang/{locale}.json` — flat JSON object of key-value pairs

PHP format organizes translations by namespace/domain:
```
lang/
├── en/
│   ├── messages.php     // ['welcome' => 'Welcome', 'goodbye' => 'Goodbye']
│   └── validation.php   // ['accepted' => 'The :attribute must be accepted.']
├── fr/
│   ├── messages.php
│   └── validation.php
└── en.json
```

JSON format uses the source string as the key:
```json
// lang/fr.json
{
    "Welcome to our application": "Bienvenue dans notre application"
}
```

The JSON format is particularly useful for integrating with third-party translation services (POEditor, Lokalise, Crowdin) that export translations as flat JSON.

### Translator
`Illuminate\Translation\Translator` is the central service for all translation operations. It:
- Loads translation arrays from `FileLoader`
- Resolves translation keys against the current locale
- Handles parameter replacement (`:attribute` → `email`)
- Manages pluralization via Symfony's pluralization rules
- Falls back to the fallback locale when a key is missing in the current locale
- Returns the key itself if no translation exists (silent degradation)

### Fallback Locale
The fallback locale (`config/app.php` `fallback_locale`) is used when a translation key does not exist in the current locale. If the current locale is `fr` and `messages.welcome` doesn't exist in `lang/fr/messages.php`, the translator looks in `lang/en/messages.php` (assuming `en` is the fallback locale).

Fallback behavior is configurable via `$app->setFallbackLocale()`. It can be disabled at the translation level by checking `Translator::has(key)` before retrieving.

### Pluralization
Laravel's pluralization system handles language-specific plural forms via Symfony's `Translation` component. Different languages have different pluralization rules:
- English: 2 forms (singular, plural) — `1 apple`, `5 apples`
- French: 2 forms (singular, plural) — `1 pomme`, `5 pommes` (same count but different rules)
- Russian: 4 forms — singular, few, many, other
- Arabic: 6 forms — singular, dual, few, many, other, zero

The `__()` helper with pluralization:
- `__('messages.apples', ['count' => 1])` → "1 apple"
- `__('messages.apples', ['count' => 5])` → "5 apples"

Translation files define plurals with pipe-delimited or array syntax:
```
// PHP array
'apples' => '{0} No apples|{1} One apple|[2,*] :count apples'
```

---

## Mental Models

### Translation as Transformation Layer
The translation system is a transformation layer between the application's internal language (developer-chosen strings, typically English) and the user-facing output. This layer should be as transparent as possible — the application logic should not need to know which language is being displayed. The `__()` helper is the interface boundary: input is a key string (possibly with parameters), output is a translated string.

### Keys as Contracts
Translation keys are contracts between the application and its translations. `messages.welcome` declares "this string represents a welcome message." The translation for each locale must provide a value for this key. A missing translation is a breached contract — the application shows the raw key instead of a translated string. This is a user-facing defect but not a system failure (no exception is thrown).

### Locale as Request Property
Locale is best modeled as a property of the current request, not the application. The locale should be determined early in the request lifecycle (via middleware), stored on the request or session, and used throughout the request's translation operations. This mental model supports multi-locale applications where different users see different languages simultaneously.

### Pluralization as Language-Aware Abstraction
Pluralization is deceptively complex — it's not just "add an 's' for plural." The Symfony pluralization rules engine maps a count to the correct plural form for each language. This abstraction means the developer writes `__('key', ['count' => $n])` and the framework handles the language-specific plural mapping. The complexity is encapsulated in the translation library, not the application code.

---

## Internal Mechanics

### Translator Key Resolution

```
Translator::get($key, $replace, $locale)
  ├── Determine locale: $locale ?? $this->locale
  ├── Split key into namespace and item:
  │     ├── If key contains '::' (e.g., 'package::messages.welcome'):
  │     │     ├── namespace = 'package' (translation namespace)
  │     │     ├── item = 'messages.welcome'
  │     └── If no '::':
  │           ├── namespace = '*' (application translations)
  │           └── item = key as-is (e.g., 'messages.welcome')
  ├── Load translations:
  │     ├── $this->load($namespace, $locale)
  │     │     ├── If namespace is '*':
  │     │     │     ├── Load PHP files from lang/{locale}/
  │     │     │     └── Load JSON from lang/{locale}.json
  │     │     └── If namespace is a package:
  │     │           ├── Load from package's lang directory
  │     │           └── Merge with published overrides in lang/vendor/{namespace}/{locale}/
  │     └── Return array of all translations for the namespace+locale combination
  ├── Resolve item:
  │     ├── $line = array_get($loaded, $item)
  │     │     ├── 'messages.welcome' → $loaded['messages']['welcome']
  │     ├── If $line exists:
  │     │     ├── Replace :parameter placeholders
  │     │     ├── Handle pluralization if :count is in $replace
  │     │     └── Return translated string
  │     └── If $line does not exist:
  │           ├── If fallback locale is set and different from current:
  │           │     └── Recursive call with $locale = fallback locale
  │           └── Return $key untranslated
```

### FileLoader Loading

```
FileLoader::load($namespace, $locale, $group)
  ├── $namespace = '*':
  │     ├── $this->loadPaths($path = lang/$locale, $group)
  │     │     ├── $file = "$path/$group.php"           // lang/en/messages.php
  │     │     ├── if exists: require and return array
  │     │     └── else: return []
  │     └── $this->loadJson($path)
  │           ├── $jsonPath = "lang/$locale.json"     // lang/en.json
  │           └── if exists: json_decode(file_get_contents), return array
  ├── $namespace = 'package':
  │     ├── Load package namespace paths
  │     ├── Merge with published overrides
  │     └── return merged array
  └── return collected translations
```

The FileLoader caches loaded translations in memory during a single request. Once `lang/en/messages.php` is loaded, subsequent requests for `messages.*` keys from the same locale are served from the in-memory array without additional file I/O.

### Locale Detection Flow

Typical middleware-based locale detection:

```
SetLocale Middleware::handle($request, $next)
  ├── Determine locale:
  │     ├── Option A: $request->segment(1)           // URL prefix: /fr/...
  │     ├── Option B: $request->session()->get('locale')  // Session preference
  │     ├── Option C: $request->user()->locale        // User model preference
  │     ├── Option D: $request->getPreferredLanguage() // Browser Accept-Language
  │     └── Fallback: config('app.locale')           // Default from config
  ├── Validate locale:
  │     ├── Check if locale is in allowed list
  │     └── If invalid, use default or return 404
  ├── Set app locale:
  │     ├── app()->setLocale($locale)
  │     └── // This updates Translator::$locale
  └── return $next($request)
```

### Pluralization Resolution

The Translator delegates pluralization to Symfony's `Translation\PluralizationRules`:
```
$translation contains '{0}' '{1}' '[2,*]' or '|' separators
  ├── Parse count value from $replace[':count'] ?? $replace['count']
  ├── Determine plural form index for the locale:
  │     ├── English: count == 1 → index 0, else → index 1
  │     ├── Russian: count == 1 → 0, count ∈ [2,4] → 1, default → 2
  │     ├── etc. (100+ language rules)
  ├── Select the segment matching the plural form index
  ├── Replace :count and other parameters
  └── Return selected segment
```

The plural form indices are defined by the Unicode CLDR (Common Locale Data Repository) and implemented in Symfony's `PluralizationRules` class.

---

## Patterns

### URL-Prefix Locale Detection
The most SEO-friendly pattern. Locale is the first URL segment:
- `https://example.com/en/products` — English
- `https://example.com/fr/products` — French
- `https://example.com/de/products` — German

This pattern requires:
- A `Route::prefix()` group for locale-specific routes
- A middleware that extracts the locale from the URL and sets it on the application
- A fallback route group for the default locale (or redirect from unprefixed to prefixed)

Advantages: search engines index locale-specific URLs separately, locale is explicit in the URL, bookmarking preserves locale.
Disadvantages: all routes must be wrapped in locale prefix groups, URL structure is more complex, redirect logic needed for non-prefixed URLs.

### Session-Based Locale Detection
Locale is stored in the user's session:
```
session(['locale' => 'fr']);
app()->setLocale(session('locale'));
```

Advantages: simple implementation, no URL complexity, user preference persists across sessions.
Disadvantages: search engines don't index locale-specific content, locale doesn't survive link sharing, session must be maintained.

### User Preference Detection
Locale is stored on the authenticated user model:
```
$request->user()->update(['locale' => 'fr']);
app()->setLocale($request->user()->locale);
```

Advantages: preference persists across devices and sessions, single source of truth for user settings.
Disadvantages: no locale for unauthenticated users (falls back to browser/session detection), requires authenticated routes.

### Browser Detection with Fallback
Detect locale from the browser's `Accept-Language` header:
```
$locale = $request->getPreferredLanguage(['en', 'fr', 'de', 'es']);
app()->setLocale($locale ?? config('app.locale'));
```

Advantages: zero configuration for users, automatic language selection, good UX for first-time visitors.
Disadvantages: browser headers are user-controlled and can mismatch actual preference, limited to the supported locales list, no override mechanism without additional UI.

### Package Translation Override Pattern
Override a package's translations by publishing them to `lang/vendor/{package}/{locale}/`:
```
php artisan vendor:publish --tag=package-translations
```
The FileLoader checks `lang/vendor/` before the package's source `lang/` directory. This allows the application to override specific translations without modifying the package's source files.

---

## Architectural Decisions

### Why PHP Files Instead of Database
Laravel stores translations as PHP/JSON files rather than in the database because:
1. File-based translations are cacheable and optimizable (OpCache, config caching)
2. File-based translations are deployable (part of the codebase, version-controlled)
3. Database translations require a query per page load (or cached, adding cache complexity)
4. File-based translations scale to any number of languages without database schema changes

The tradeoff is that file-based translations cannot be modified at runtime through a UI. Applications that require runtime translation editing (CMS-style multilingual content) implement database-backed translation stores or hybrid approaches (static strings via files, dynamic content via database).

### Why JSON and PHP Formats Coexist
The dual-format decision accommodates two translation workflows:
- **PHP format** is designed for translations organized by namespace/domain (errors, validation, messages, auth). Each file has a logical grouping, making it easier for human translators working with organized files.
- **JSON format** is designed for flat key-value translations where the key IS the English string. This is the format preferred by most commercial translation platforms (Crowdin, Lokalise, POEditor) and is simpler to pass to translators.

The JSON format also enables the "translation as key" pattern where developers write `__('Welcome to our app')` using the English string as the key, eliminating the need for key naming conventions.

### Why Fallback Locale Exists
The fallback locale is an engineering safety net. It prevents: "the French locale is at 90% coverage but page X uses an untranslated string" from being a user-visible defect. Instead of displaying the raw key (confusing) or an empty string (broken UI), it shows the fallback locale's translation.

The decision to silently fall back (rather than throw) is deliberate: a missing translation is a content gap, not a system failure. The application serves the fallback content and logs the missing key for developer attention.

### Why Singleton Translator
The Translator is registered as a container singleton to ensure consistent locale state throughout a single request. All `__()` calls within a request use the same locale because they resolve through the same Translator instance. Changing the locale mid-request (via middleware) affects all subsequent translation calls.

---

## Tradeoffs

### PHP Array vs JSON Translation Files
| Aspect | PHP Arrays | JSON |
|--------|-----------|------|
| Organization | Namespaced by domain | Flat key-value |
| Key naming | `messages.welcome` | `"Welcome"` |
| Pluralization | Native support | Requires array syntax |
| Countable | Yes (array_count) | Yes (json_decode + count) |
| IDE autocompletion | Possible with helper | Not possible |
| Translation service export | Needs conversion | Native format |
| Nested keys | Supported | Flat only |

### URL Prefix vs Session Locale
| Aspect | URL Prefix | Session |
|--------|-----------|---------|
| SEO | Excellent (separate indexed URLs) | Poor (same URL, different content) |
| Shareable | Yes (URL contains locale) | No (locale is server-side) |
| Implementation | Complex (route groups, redirects) | Simple (single middleware) |
| Cache-friendly | Yes (URL varies by locale) | No (cache key must include locale) |
| User effort | None (automatic from URL) | Requires explicit UI switch |

### File vs Database Translations
| Aspect | File | Database |
|--------|------|----------|
| Performance | Fast (file read + OpCache) | Slower (query + cache) |
| Deployability | Version-controlled, deployable | Requires migration or seed |
| Runtime editing | Not possible (file change = deploy) | Possible (admin UI) |
| Translation service | Import/export workflow | Direct sync or API |
| Complexity | Simple (standard file I/O) | Complex (cache invalidation, fallback logic) |

---

## Performance Considerations

### Translation File Loading Cost
Each PHP translation file requires a `require` (or `include`) on first access. For an application with 10 locales and 5 translation namespaces per locale (50 files total), only the files for the current locale are loaded per request. The loaded files are cached in PHP's OpCache after first load, making subsequent requests faster.

JSON files are loaded via `file_get_contents()` + `json_decode()` on first access per locale. This is slightly slower than PHP files (which benefit from OpCache) but the difference is negligible for typical file sizes (<100KB).

### Translation Memory Cache
The Translator stores loaded translations in `$loaded` property during a request. Once `lang/en/messages.php` is loaded, all `__('messages.*')` calls for that locale use the in-memory array. This means the file I/O cost is paid once per locale per request, not once per translation call.

### Pluralization Performance
Pluralization requires:
1. Parsing the plural rules string (Symfony format)
2. Determining the plural form index for the locale
3. Selecting the correct segment
4. Replacing parameters

This adds approximately 0.01-0.05ms per pluralized call, which is negligible for typical usage. Applications with hundreds of pluralized calls per page should consider caching the parsed plural rules.

### Locale-Specific Cache Keys
When using locale-aware caching, cache keys must include the locale:
```
Cache::remember('products.' . app()->getLocale() . '.list', 3600, function() {
    return Product::all();
});
```

Without locale in the cache key, the same cached content is returned for all locales, defeating the purpose of localization. Locale-aware caching doubles or triples cache storage requirements proportionally to the number of active locales.

---

## Production Considerations

### Translation Coverage Monitoring
Production applications should monitor translation coverage. A missing translation silently falls back to either the raw key or the fallback locale. Neither produces an error. Monitoring approaches:
- Log all missing translation keys via a custom `Translator` wrapper
- Use a middleware that checks for untranslated strings in the response
- Periodically run a coverage script that iterates all keys against all supported locales

### Locale Validation Middleware
User-supplied locale values (from URL, session, or form input) must be validated against the supported locales list. Passing an unsupported locale to `app()->setLocale()` sets the locale to an unsupported value, and translation lookups silently fall back to the fallback locale. This masks the error and makes debugging difficult.

Production middleware pattern:
```
$locales = ['en', 'fr', 'de', 'es'];
$locale = $request->segment(1);
if (!in_array($locale, $locales)) {
    $locale = config('app.fallback_locale');
}
app()->setLocale($locale);
```

### Translation File Deployment
Translation files are part of the application codebase and are deployed with the application. Two deployment considerations:
1. **Translation additions:** Adding a new locale or key requires a full deployment (similar to any code change)
2. **Translation updates:** Updated translation text requires a deployment for existing keys

For applications requiring translation updates without deployment, a hybrid approach stores high-change translations in the database while keeping stable translations in files.

### Regional Format Handling
Locale affects more than translation strings — it affects date formatting, number formatting, currency formatting, and collation (sorting order). Laravel's localization system handles only string translation. Number/date/currency formatting must be handled separately:
- Carbon dates: `$date->isoFormat('LLLL')` supports locale-aware formatting
- Number formatting: PHP's `NumberFormatter` class
- Currency: Third-party packages or `NumberFormatter`

Production applications should ensure consistent locale-aware formatting across all user-facing numbers and dates, not just translated strings.

---

## Common Mistakes

### Not Setting Fallback Locale
The default `fallback_locale` in `config/app.php` is `en`. If the application's primary language is not English and translations are not complete for all keys, untranslated keys fall back to English. If English translations are also incomplete, the raw key is displayed. Best practice: set `fallback_locale` to the application's most complete translation set.

### Using Translation Strings as Keys
The JSON format allows using English strings as keys (`__('Welcome')`). This is convenient but couples the key to the English translation. If the English text needs to change (e.g., "Welcome" → "Welcome to our app"), all JSON files need updating because the key has changed. The PHP array format separates keys from values, avoiding this coupling.

### Forgetting the "Count" Parameter for Pluralization
Calling `__('messages.apples', ['count' => $n])` triggers pluralization. Calling `__('messages.apples')` or `__('messages.apples', [$n])` without the `count` key does NOT pluralize — it returns the raw first form. Always pass `['count' => $n]` as the parameter array.

### Not Publishing Package Translations
When a package includes translations, they are loaded from the package's `lang/` directory. To customize them, the application must run `php artisan vendor:publish --tag=package-translations` to copy the files to `lang/vendor/{package}/{locale}/`. Without this step, the application cannot override package translations.

### Locale-Specific Route Caching
Route caching (`php artisan route:cache`) serializes all routes including locale-prefixed groups. If routes are cached without locale-specific URL generation, `route('named.route')` may generate URLs with the wrong locale prefix. Solution: ensure `php artisan route:cache` runs with a representative locale, or implement locale-aware URL generation that handles locale prefixing.

### Ignoring RTL Language Support
Applications that support Arabic, Hebrew, Persian, or Urdu must handle right-to-left text direction. Laravel's translation system does not handle RTL — the application must:
- Set the `dir` attribute on `<html>` based on locale
- Use CSS logical properties for layout
- Adjust form input alignment
- Handle mixed RTL/LTR content (numbers in RTL text)

This is often missed in initial localization implementations and requires significant retrofitting.

---

## Failure Modes

### Missing Translation File
If `lang/fr/messages.php` doesn't exist and `__('messages.welcome')` is called while the locale is `fr`, the translator:
1. Tries to load `lang/fr/messages.php` — file not found
2. Falls back to `lang/en/messages.php` (fallback locale)
3. If `en` has the key, returns the English translation
4. If `en` doesn't have the key, returns `messages.welcome` as-is

No error is raised. The user sees either an English string or a raw key. This silent degradation is by design but makes missing translation files hard to detect.

### Corrupted JSON Translation File
If `lang/fr.json` has invalid JSON (missing comma, trailing comma, syntax error), `json_decode()` returns `null` and the translator loads no JSON translations for that locale. All JSON-sourced translations silently fall back. The error is logged as a PHP warning but not as an application exception.

### Circular Fallback Locale
If `config/app.php` has `locale` = `fr` and `fallback_locale` = `fr` (same locale), the translator still works (no recursion) but the fallback is meaningless — it's the same translation set. This is a misconfiguration but not a failure.

### Unsupported Pluralization Locale
If the locale is set to a value that Symfony's PluralizationRules doesn't recognize, pluralization defaults to English rules. The count parameter still works, but the plural forms may not match the language's rules. This is rare (Symfony supports 100+ languages) but occurs with niche or custom locale codes.

---

## Ecosystem Usage

### First-Party Packages
Laravel's first-party packages use translation namespaces:
- `Illuminate\Validation` uses `validation.*` keys (e.g., `validation.accepted`, `validation.required`)
- `Illuminate\Auth` uses `auth.*` keys (e.g., `auth.failed`, `auth.throttle`)
- `Illuminate\Pagination` uses `pagination.*` keys

These are loaded via the namespace syntax: `__('validation.accepted')`. The files are in each package's `lang/` directory and can be overridden by publishing.

### Spatie Packages
Spatie packages consistently use PHP array translation files with namespace loading. For example, `spatie/laravel-permission` publishes `lang/` files that translate permission-related strings. The translations use `:parameter` substitution and follow Laravel's standard format.

### Community Localization Packages
Several community packages extend Laravel's localization:
- **mcamara/laravel-localization:** URL-prefixed locale routes, multi-language route generation, locale cookies
- **Laravel Localization (ckaloev/laravel-localization):** Database-backed translations with admin UI
- **Laravel Translate (JoeDixon/laravel-localization):** Command-line translation management, scan for `__()` calls and generate translation files

These packages extend rather than replace Laravel's native Translator and FileLoader.

### Crowdin/Lokalise Integration
Commercial translation services integrate with Laravel via the JSON file format. The workflow:
1. Export source English strings as `en.json`
2. Import to translation platform
3. Translators provide translated `{locale}.json` files
4. Download translated files back to `lang/{locale}.json`
5. Deploy the new translation files

This workflow works because JSON files are self-contained — no structural differences between source and target languages.

---

## Related Knowledge Units

- **Configuration Management** — Locale and fallback locale are stored in config files; environment-based locale configuration
- **Directory Conventions** — The `lang/` directory structure and its organization
- **Bootstrapping Lifecycle** — Translation loading during bootstrap is deferred; the Translator is not initialized until first `__()` call
- **Service Provider Strategies** — Package translation service providers register translation namespaces
- **Blade / View Layer** — `@lang` directive usage, locale-aware view rendering

---

## Research Notes

### Source Analysis
- `Illuminate\Translation\Translator` — key resolution, pluralization, fallback logic
- `Illuminate\Translation\FileLoader` — PHP file and JSON file loading, namespace resolution
- `Illuminate\Translation\TranslationServiceProvider` — Translator registration as singleton
- Symfony `Translation\PluralizationRules` — plural form determination across 100+ languages
- Default `lang/en/validation.php` — comprehensive translation file with 80+ validation keys

### Key Insight
The most underutilized feature in Laravel localization is the fallback locale cascade. Most applications either don't set a fallback (relying on the default) or misuse it as a global default. The cascade capability (current locale → fallback locale → raw key) can be leveraged to implement a "progressive translation" strategy where high-traffic pages are translated first and others fall back to the fallback locale, with new translations being added incrementally.

### Community Recommendations
- Spatie recommends always using PHP array format for application translations (better organization, countability, and parameter handling)
- Tighten recommends JSON format for projects integrating with external translation services
- Both agree that the `__()` helper should be the ONLY translation access point — avoid `@lang` in Blade outside of simple cases, avoid `trans()` and `trans_choice()` methods
- Locale detection via URL prefix is universally recommended for public-facing applications (SEO, shareability, cacheability)

### Version-Specific Notes
- Translation system behavior is consistent across Laravel 10-13
- The `lang/` directory replaced `resources/lang/` in Laravel 9 — Laravel 11+ uses `lang/` exclusively
- Laravel 12+ added improved pluralization formatting but the underlying system is unchanged
- The `@lang` Blade directive is the same across all supported versions
