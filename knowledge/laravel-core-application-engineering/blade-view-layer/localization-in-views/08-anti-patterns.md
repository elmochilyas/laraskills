# ECC Anti-Patterns — Localization in Views

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Blade / View Layer |
| **Knowledge Unit** | Localization in Views |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Hardcoded User-Facing Strings (Not Using `__()`)
2. Missing Placeholder Replacements (Raw `:name` in Output)
3. Unvalidated User-Supplied Locale (Locale Manipulation)
4. Deeply Nested Translation Keys (Beyond 2 Levels)
5. PHP `number_format()` and `date()` Instead of `Number::format()` and `Date::parse()`

---

## Repository-Wide Anti-Patterns

- Mixing PHP Array and JSON Translation Files for Same Locale
- Translation Key as the English String (Losing Dot-Notation)
- Ignoring RTL Layout Support for Arabic/Hebrew Locales
- No Translation Cache in Production
- Incorrect Pluralization Count (Passing Collections Instead of Integers)

---

## Anti-Pattern 1: Hardcoded User-Facing Strings

### Category
Framework Usage | Scalability

### Description
Writing user-facing text directly in Blade templates instead of using `__()` or `@lang`, making future internationalization require template edits.

### Why It Happens
Developers write in their native language directly for speed, planning to "add translations later" — which rarely happens systematically.

### Warning Signs
- Template contains `<h1>Welcome back!</h1>` — not wrapped in `__()`
- Adding a new language requires editing every template file
- Translation proof-of-concept blocked by 50+ template edits
- No translation files exist because no `__()` calls exist to populate

### Preferred Alternative
Always use `__()` for every user-facing string from day one, even in single-language apps. Future-proofing costs nothing at the point of writing.

### Related Rules
- Rule: Always Use `__()` for User-Facing Strings

---

## Anti-Pattern 2: Missing Placeholder Replacements

### Category
Reliability

### Description
Calling `__('messages.welcome')` where the translation string contains `:name` placeholders, but the replacement array is not passed.

### Why It Happens
Developers call `__()` without checking whether the translation string has placeholders.

### Warning Signs
- Output shows "Welcome, :name" — raw placeholder visible to user
- Translation strings have `:param` markers but `__('key')` is called without second argument
- No test verifies that placeholder replacements produce correct output

### Preferred Alternative
Always verify the translation string for placeholders and pass the replacement array: `__('messages.welcome', ['name' => $user->name])`.

### Related Rules
- Rule: Always Pass All Required Placeholder Replacements

---

## Anti-Pattern 3: Unvalidated User-Supplied Locale

### Category
Security

### Description
Setting the application locale directly from user input without validating against a whitelist of supported locales.

### Why It Happens
Developers trust URL segments or query parameters without considering that locale values can be manipulated.

### Warning Signs
- `App::setLocale($request->input('locale'))` — no validation
- User passes `locale=xyz` and gets untranslated content (key strings displayed)
- No whitelist of supported locales exists in configuration
- Locale parameter used in file path generation without validation

### Preferred Alternative
Always validate user-supplied locales against a whitelist: `in_array($locale, $supported, true)`.

### Related Rules
- Rule: Validate User-Supplied Locale Values

---

## Anti-Pattern 4: Deeply Nested Translation Keys

### Category
Code Organization | Maintainability

### Description
Using translation keys with 4+ levels of dot-notation nesting like `messages.user.profile.update.success`.

### Why It Happens
Developers mirror the application's directory structure or class hierarchy in translation keys.

### Warning Signs
- Translation keys are longer than 40 characters
- Keys require looking up a reference to remember: `messages.admin.users.roles.edit.title`
- Typos in deep keys produce no error (the key itself is returned)
- New team members cannot guess key names

### Preferred Alternative
Flatten to 2 levels maximum: `file.key`. Use descriptive key names like `profile_updated` instead of deep nesting.

### Related Rules
- Rule: Use Dot-Notation Keys with Maximum 2 Levels

---

## Anti-Pattern 5: PHP Native Formatting Instead of Laravel Helpers

### Category
Reliability

### Description
Using `number_format()`, `date()`, or `strftime()` in templates instead of Laravel's `Number::format()` and `Date::parse()`.

### Why It Happens
Habit — PHP developers have used native formatting functions for years and default to them.

### Warning Signs
- `{{ number_format($order->total / 100, 2) }}` in templates
- `{{ $post->created_at->format('m/d/Y') }}` — hardcoded US date format
- Arabic, French, or German users see dates in server-locale format
- No `Number` facade usage in views

### Preferred Alternative
Use `Number::format()`, `Number::currency()`, and `Date::parse()->format()` for locale-aware output that respects the user's selected locale.

### Related Rules
- Rule: Use Laravel's `Number` and `Date` Helpers for Locale-Aware Formatting
