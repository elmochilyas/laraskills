# Rule Card: K090 — `make:job-middleware` Artisan Command

---

## Rule 1

**Rule Name:** use-command-for-new-middleware

**Category:** Always

**Rule:** Always use `php artisan make:job-middleware` for all new job middleware.

**Reason:** The command enforces the correct namespace, interface signature, and directory structure — manual creation risks interface mismatches.

**Bad Example:**
```php
// Manually created — wrong namespace or missing handle() signature
class MyMiddleware { ... }
```

**Good Example:**
```bash
php artisan make:job-middleware MyMiddleware
# Creates app/Queue/Middleware/MyMiddleware.php with correct structure
```

**Exceptions:** Existing middleware being refactored may need manual edits rather than regeneration.

**Consequences Of Violation:** Interface contract mismatches cause runtime errors — middleware silently not applied or pipeline breaks with cryptic errors.

---

## Rule 2

**Rule Name:** keep-middleware-in-standard-location

**Category:** Always

**Rule:** Always keep job middleware in `app/Queue/Middleware/`.

**Reason:** The command creates middleware there automatically — keeping them in the standard location ensures discoverability during code reviews and onboarding.

**Bad Example:**
```php
// Middleware placed in app/Http/Middleware/ — mixed with HTTP middleware
app/Http/Middleware/RateLimitedMiddleware.php
```

**Good Example:**
```php
// Standard location — clearly job middleware
app/Queue/Middleware/RateLimitedMiddleware.php
```

**Exceptions:** None — the standard location is well-established in Laravel conventions.

**Consequences Of Violation:** New team members struggle to find middleware; code reviews miss job middleware files; namespace auto-discovery may break.
