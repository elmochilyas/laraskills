# ECC Anti-Patterns — Application Localization

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Application Architecture & Structure |
| **Knowledge Unit** | Application Localization |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Translation in Business Logic (`__()` in Services/Actions)
2. JSON Format for Application Translations (English Strings as Keys)
3. Missing Locale in Cache Keys (All Users Get Same Language)
4. Unvalidated User-Supplied Locale Values

---

## Repository-Wide Anti-Patterns

- Over-Translation of Technical Messages (log messages, exceptions translated per locale)
- Locale as Global State (setting locale globally without considering per-request contexts)
- Missing `count` Parameter for Pluralization

---

## Anti-Pattern 1: Translation in Business Logic

### Category
Architecture

### Description
Calling `__('order.processed')` or `trans()` inside services, actions, or domain objects instead of the presentation layer.

### Why It Happens
Developers think of localized messages as "return values" from business logic. They want the service to return a ready-to-display string.

### Warning Signs
- Service methods return translated strings: `return __('order.processed')`
- Unit tests for services require translation file setup
- Service cannot be reused in non-HTTP contexts (CLI, queue) because it assumes locale context

### Preferred Alternative
Return structured identifiers or status codes from business logic. Translate at the presentation boundary (controllers, views).

### Related Rules
- Rule: Never Call __() in Business Logic Classes

---

## Anti-Pattern 2: JSON Format for Application Translations

### Category
Maintainability

### Description
Using `lang/en.json` with English source strings as translation keys for application-managed translations.

### Why It Happens
JSON format is simpler — no separate files per namespace. Developers copy the pattern from translation services.

### Warning Signs
- All translations in `lang/en.json` as flat key-value pairs
- Changing an English source string (e.g., "Welcome" to "Hello") breaks all locale files
- Translation files are large (500+ flat keys) with no namespace organization
- Tracking translation progress requires manual comparison

### Preferred Alternative
Use PHP array format for application translations: `lang/en/messages.php` with namespaced keys.

### Related Rules
- Rule: Use PHP Array Format for Application Translations

---

## Anti-Pattern 3: Missing Locale in Cache Keys

### Category
Reliability

### Description
Caching localized content without including the locale in the cache key: `Cache::remember('posts.all', ...)`.

### Why It Happens
The cache key doesn't account for locale because the developer only tested in one language.

### Warning Signs
- Cache keys for user-facing content do not include `app()->getLocale()`
- French-speaking users see English cached content
- Locale switch doesn't change cached content until cache is cleared

### Preferred Alternative
Always append locale to cache keys for localized content: `Cache::remember("posts.all.{$locale}", ...)`.

### Related Rules
- Rule: Include Locale in Cache Keys for Localized Content

---

## Anti-Pattern 4: Unvalidated User-Supplied Locale Values

### Category
Security

### Description
Passing user-supplied locale values (from URL, session, form input) directly to `app()->setLocale()` without validation.

### Why It Happens
Developers trust user input or assume the locale system validates internally.

### Warning Signs
- `$locale = $request->segment(1); app()->setLocale($locale);` — no whitelist check
- Unsupported locale silently falls back to default with no logging
- Debugging locale issues is difficult because the fallback is silent

### Preferred Alternative
Validate user-supplied locale against a supported locales whitelist before setting.

### Related Rules
- Rule: Validate All User-Supplied Locale Values
