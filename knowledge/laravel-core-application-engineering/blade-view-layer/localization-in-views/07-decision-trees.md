# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Blade / View Layer
**Knowledge Unit:** Localization in Views
**Generated:** 2026-06-03

---

# Decision Inventory

* Translation File Format (PHP Arrays vs JSON)
* Locale Detection Strategy
* Translation Key Structure (Dot-Notation Depth)

---

# Architecture-Level Decision Trees

---

## Decision 1: Translation File Format (PHP Arrays vs JSON)

---

## Decision Context

Whether to store translations using PHP array files (organized by domain with dot-notation keys) or JSON files (string-as-key format).

---

## Decision Criteria

* Number of supported locales
* Organizational needs (domain grouping)
* Whether translation keys are short UI strings or structured messages
* Team preference for IDE autocomplete

---

## Decision Tree

Does the application have more than 500 translation strings across multiple domains?
↓
NO → JSON files are simpler and intuitive for small apps (< 500 strings, 1-2 locales)
YES → Do the translations need to be organized by domain (messages, auth, validation)?
    YES → PHP array files with dot-notation keys (e.g., `messages.welcome`, `auth.login`)
    NO → Are most translation strings short UI text ("Log out", "Settings", "Search")?
        YES → JSON files with English string as key
        NO → PHP array files provide better organization
NO → Does the project use translation extraction tools that expect PHP arrays?
    YES → PHP array files
    NO → JSON files

---

## Rationale

PHP arrays provide domain organization with dot-notation keys, preventing collisions and making the translation file navigable. JSON files use the English string as the key, which is intuitive for simple UI text but lacks organizational structure. PHP arrays enable IDE autocomplete; JSON files do not.

---

## Recommended Default

**Default:** PHP array files for structured translations organized by domain; JSON files for simple apps under 500 strings
**Reason:** PHP arrays scale better — organized by domain with dot-notation keys, support IDE autocomplete, and are compatible with most extraction tools.

---

## Risks Of Wrong Choice

* JSON for 2000+ strings: Single file becomes unmanageable, no organizational structure
* PHP arrays for tiny app: Overhead of multiple files for 20 strings
* Mixing both formats for the same locale: Inconsistent, confusing maintainers

---

## Related Rules

* Use Dot-Notation Keys with Maximum 2 Levels (05-rules.md)

---

## Related Skills

* Skill: Implement Multi-Language Translation in Views

---

## Decision 2: Locale Detection Strategy

---

## Decision Context

How to determine the user's preferred locale — via URL segment, subdomain, session, browser, or user profile.

---

## Decision Criteria

* SEO requirements (Google indexed URLs per locale)
* Whether the app serves authenticated or anonymous users
* Whether the app is multi-region or single-region
* Whether users can change their locale preference

---

## Decision Tree

Does the application need SEO-friendly locale URLs (each locale indexed separately)?
↓
YES → URL segment: `/{locale}/contact` — Google indexes each locale's URLs
NO → Are users authenticated (logged in)?
    YES → User model column: `user->locale` — persists preference across sessions
    NO → Can users select their preferred language?
        YES → Session-based: store `session(['locale' => 'es'])` — persists during session
        NO → Browser Accept-Language header: Auto-detect on first visit
NO → Is the application multi-region (different domain per region)?
    YES → Subdomain: `en.example.com`, `es.example.com` — region-specific SEO
    NO → URL segment with locale middleware

---

## Rationale

URL segments provide SEO benefits (each locale page indexed separately). User model columns persist preferences across devices and sessions. Sessions are suitable for anonymous users. Browser detection is a fallback for first-time visitors.

---

## Recommended Default

**Default:** URL segment for SEO-requiring public apps; user model column for authenticated users; session for anonymous user preference
**Reason:** URL segments are the most SEO-friendly approach. User model column provides the best experience for authenticated users.

---

## Risks Of Wrong Choice

* No locale validation: `App::setLocale($request->input('locale'))` allows arbitrary locale manipulation
* Only browser detection: Users change browsers and lose preference, no SEO
* Only URL segment: User sees wrong locale on bookmarked URLs from friend

---

## Related Rules

* Validate User-Supplied Locale Values (05-rules.md)

---

## Related Skills

* Skill: Implement Multi-Language Translation in Views

---

## Decision 3: Translation Key Structure (Dot-Notation Depth)

---

## Decision Context

How deep to nest translation keys within PHP array files.

---

## Decision Criteria

* Number of translation domains
* Whether keys are easy to type and remember
* Whether keys are grouped logically

---

## Decision Tree

Can the translation string be categorized under a broad domain (messages, auth, validation, navigation)?
↓
YES → Use 2-level dot notation: `domain.key` (e.g., `messages.welcome`, `auth.login`)
NO → Does the string belong to a sub-domain that needs further grouping?
    YES → Flatten to 2 levels with descriptive key names:
        `messages.profile_updated` instead of `messages.user.profile.update.success`
    NO → 2 levels still work — keep it flat
NO → More than 2 levels needed?
    YES → Refactor — use longer key names or split into more files
    NO → 2 levels is the standard

---

## Rationale

Deeply nested keys (`messages.user.profile.update.success`) are hard to type, hard to remember, and easy to mistype with no error feedback. Two-level keys provide sufficient organization by domain and specific string without the complexity of deeper hierarchies.

---

## Recommended Default

**Default:** Maximum 2 levels: `domain.key` (e.g., `messages.welcome`, `profile.updated`)
**Reason:** Two-level keys are easy to remember, type, and maintain. Deeper nesting adds complexity without proportional organizational benefit.

---

## Risks Of Wrong Choice

* Deep nesting (4+ levels): Hard to remember, frequently mistyped, no error on typos
* Single flat file: No organization, key collisions, hard to navigate with 200+ keys

---

## Related Rules

* Use Dot-Notation Keys with Maximum 2 Levels (05-rules.md)

---

## Related Skills

* Skill: Implement Multi-Language Translation in Views
