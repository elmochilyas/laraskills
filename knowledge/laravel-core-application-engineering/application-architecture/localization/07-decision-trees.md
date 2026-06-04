# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Application Architecture & Structure
**Knowledge Unit:** Application Localization
**Generated:** 2026-06-03

---

# Decision Inventory

* URL Prefix Locale Detection vs Session/Browser/User Preference Detection
* PHP Array Translation Files vs JSON Translation Files
* __() in Business Logic vs Translation in View Layer Only
* Application Translations vs Package Translation Publishing

---

# Architecture-Level Decision Trees

---

## Decision 1: URL Prefix Locale Detection vs Session/Browser/User Preference Detection

---

## Decision Context

How the application determines the current locale — from the URL prefix, session, user preference, or browser Accept-Language header.

---

## Decision Criteria

* Whether the application needs SEO-friendly URLs (search engine indexed per-locale)
* Whether the application requires shareable links across locales
* Whether the user needs to persist locale preference across sessions

---

## Decision Tree

Does the application need SEO-friendly URLs with per-locale indexing?
↓
YES → URL prefix — `example.com/fr/products`; search engines index each locale separately
NO → Does the application need shareable links that preserve locale?
    ↓
    YES → URL prefix — `example.com/de/page` preserves locale when shared; session-based does not
    NO → Is the user authenticated and has a saved locale preference?
        ↓
        YES → User preference detection — saved locale applies across devices and sessions
        NO → Session-based detection — simple and stateless; no URL complexity
NO → Does the application need locale detection without user interaction?
    ↓
    YES → Browser header (Accept-Language) — automatic detection; no URL prefix needed
    NO → Can the user choose their locale?
        ↓
        YES → URL prefix — user selects locale; URL reflects the choice
        NO → Session/browser — no user-facing locale control; application decides

---

## Rationale

URL prefix is the most universal recommendation: it's SEO-friendly, preserves locale in shared links, works with HTTP caching, and is the most transparent to users. Session detection is simpler but breaks link sharing. Browser header detection provides no user-facing override without additional UI. User preference requires authentication and persists across devices.

---

## Recommended Default

**Default:** URL prefix (`{locale}/route`) for public applications. Session or user preference for authenticated/internal applications.
**Reason:** URL prefix is SEO-friendly, cacheable, and shareable. Session/user preference is simpler but less universal.

---

## Risks Of Wrong Choice

* Session-only detection: Shared link always shows default locale; user must re-select
* Browser header only: No way for user to override; cached content wrong locale for some users
* URL prefix with middleware: Must strip prefix from route matching; all routes need `{locale}` prefix or be in a group
* User preference without authentication: Cannot persist; falls back to session or browser detection

---

## Related Rules

* Enforce __() as the Only Translation Access Point
* Enforce Locale Validation for All User-Supplied Locale Values

---

## Related Skills

* Implement URL Prefix Locale Detection Middleware
* Use PHP Array Format for Application Translations

---

---

## Decision 2: PHP Array Translation Files vs JSON Translation Files

---

## Decision Context

Whether to store translations in PHP array files (`lang/en/messages.php`) or JSON files (`lang/en.json`).

---

## Decision Criteria

* Whether translations need to be organized by namespace
* Whether translations are managed through a translation service (Crowdin, Lokalise)
* Whether the application needs translation progress counting

---

## Decision Tree

Are translations managed through a third-party translation service?
↓
YES → JSON format — translation services commonly export flat key-value JSON
NO → Does the application need structured, namespaced translations?
    ↓
    YES → PHP array format — `messages.welcome`, `auth.failed`, `validation.required` — organized by namespace
    NO → Are translations small and flat (<50 keys)?
        ↓
        YES → Either format — both work; JSON is simpler for small sets
        NO → PHP array format — organization matters for maintainability
YES → Does the application need to count translation progress (how many keys translated per locale)?
    ↓
    YES → PHP array format — easier to programmatically count; each file is countable
    NO → JSON format — flexible and simple
NO → Does the application use the same key in multiple contexts?
    ↓
    YES → PHP array format — namespace-based disambiguation; `messages.welcome` vs `emails.welcome`
    NO → JSON format — flat keys are sufficient for single-context translations

---

## Rationale

PHP array format supports hierarchical organization (`messages.welcome`, `auth.failed`), enabling namespace-based grouping and progress counting. JSON format is flat — keys cannot be namespaced beyond a flat prefix convention. JSON is preferred when integrating with translation services; PHP arrays are preferred for manual translation management.

---

## Recommended Default

**Default:** PHP array format for all application translations. JSON format only when integrating with a translation service.
**Reason:** PHP arrays support organization, progress counting, and IDE autocompletion. JSON is flat and harder to maintain at scale.

---

## Risks Of Wrong Choice

* PHP arrays for translation service: Translation service exports JSON — must convert between formats
* JSON for large translation set: 500 flat keys in a single JSON file — impossible to navigate or organize
* PHP arrays without namespace keys: `messages.php` returns `['welcome' => '...']` — fine for small sets; grows unruly at 50+ keys
* JSON with English keys: `{"Welcome": "Bienvenue"}` — changing English text breaks all translations; use abstract keys

---

## Related Rules

* Enforce __() as the Only Translation Access Point
* Enforce Locale Validation for All User-Supplied Locale Values

---

## Related Skills

* Implement URL Prefix Locale Detection Middleware
* Use PHP Array Format for Application Translations

---

---

## Decision 3: __() in Business Logic vs Translation in View Layer Only

---

## Decision Context

Whether to call `__()` (translation helper) in services/actions or limit translations to the view/presentation layer.

---

## Decision Criteria

* Whether the code is in the business logic layer (services, actions, domain objects)
* Whether the translated string is part of the presentational output
* Whether the business logic needs locale-aware comparisons

---

## Decision Tree

Is the code in a view, Blade component, or controller (presentation layer)?
↓
YES → `__()` is appropriate — presentation layer renders localized output
NO → Is the code in a service, action, or domain object (business logic)?
    ↓
    YES → WRONG — translation is presentation; business logic should not know about localization
    NO → Is the code in a notification, mail, or queued job?
        ↓
        YES → Acceptable to call `__()` at the point of content generation — notifications are user-facing output
        NO → Is the code emitting error messages or status strings?
            ↓
            YES → Use exception codes or status identifiers — translate at the presentation layer
            NO → Don't use `__()` — keep translation at presentation boundary
NO → Does the business logic need locale-aware comparisons (language-specific sorting)?
    ↓
    YES → Pass the locale to the business logic as a parameter — don't call `__()`; use locale-aware comparison functions
    NO → Translation has no place in business logic

---

## Rationale

Translation is a presentation concern. Business logic (services, actions, domain objects) should not know about locales or translation files. Calling `__()` inside a service couples business logic to the translation system, making it harder to test (need to set locale) and harder to reuse in non-HTTP contexts. Exceptions should use machine-readable codes; controllers translate them.

---

## Recommended Default

**Default:** `__()` ONLY in views, controllers, and mailables. NEVER in services, actions, or domain objects.
**Reason:** Translation is presentation. Business logic should be locale-agnostic.

---

## Risks Of Wrong Choice

* `__()` in service: Service needs locale context; test must set locale; service can't be reused for non-translated contexts
* Translation in exception: Exception message is translated; log aggregation shows different messages per locale — hard to search logs
* No translation at presentation boundary: `$exception->getMessage()` passed straight to view — not translated
* Locale-aware sorting in service: Wrong approach — pass locale as parameter; don't call `__()` for sorting

---

## Related Rules
* Enforce __() as the Only Translation Access Point
* Enforce Locale Validation for All User-Supplied Locale Values

---

## Related Skills

* Implement URL Prefix Locale Detection Middleware
* Use PHP Array Format for Application Translations

---

---

## Decision 4: Application Translations vs Package Translation Publishing

---

## Decision Context

Whether to translate strings directly in application `lang/` files or publish and override package translations.

---

## Decision Criteria

* Whether a package provides translation files that need customization
* Whether the package translations are complete or partial
* Whether the package uses Laravel's translation namespace

---

## Decision Tree

Does a package (Laravel Nova, Spatie packages, etc.) provide user-facing strings?
↓
YES → Check if translations are complete and correct for the application's needs
    ↓
    YES → Can use directly — no publishing needed
    NO → PUBLISH the package translation via `php artisan vendor:publish --tag=package-translations`
NO → Are package translations in the vendor directory (not publishable)?
    ↓
    YES → Must publish — vendor files are overwritten on `composer update`
    NO → Application translations only — no package customization needed
YES → Does the package use Laravel's `__()` namespace resolution (`package::file.key`)?
    ↓
    YES → Published translations in `lang/vendor/{package}/{locale}/{file}.php` override vendor originals
    NO → Package may use custom translation loading — check package documentation
NO → Is the package translation incomplete in the application's locale?
    ↓
    YES → Publish and add missing translations — DO NOT modify vendor files
    NO → Application translations only — no customization needed

---

## Rationale

Package translation files in `vendor/` are overwritten on every `composer update`. Publishing them to `lang/vendor/{package}/` makes them part of the application codebase and safe from composer updates. The published files are loaded by Laravel's namespace translation resolution, overriding the vendor originals.

---

## Recommended Default

**Default:** Publish all package translations before customization. Never modify vendor translation files directly.
**Reason:** Vendor files are overwritten on `composer update`. Published files are persistent application code.

---

## Risks Of Wrong Choice

* Editing vendor translations: Lost on next `composer update` — translations revert to originals; production deployment shows wrong strings
* Not publishing when needed: Customizations not applied; users see package defaults
* Publishing without need: Extra files with no customizations — unnecessary clutter
* Wrong tag name: `vendor:publish --tag=package-translations` fails if the correct tag is different — check vendor:publish list

---

## Related Rules

* Enforce __() as the Only Translation Access Point
* Enforce Locale Validation for All User-Supplied Locale Values

---

## Related Skills

* Implement URL Prefix Locale Detection Middleware
* Use PHP Array Format for Application Translations
