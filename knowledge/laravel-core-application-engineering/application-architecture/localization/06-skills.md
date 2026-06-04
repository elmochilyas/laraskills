# Skill: Implement Locale Detection Middleware

## Purpose
Create middleware that detects and sets the application locale based on URL prefix, session, user preference, or browser header, with proper validation against supported locales.

## When To Use
- Multi-language application requiring automatic locale detection
- Implementing locale-based URL prefixes for SEO
- Persisting user language preference across sessions
- Setting locale from browser Accept-Language header

## When NOT To Use
- Single-language applications (no locale detection needed)
- When translations are managed entirely by a third-party service (use their SDK)
- For API-only applications that accept locale as a request parameter (simpler approach)

## Prerequisites
- Translation files exist in `lang/{locale}/` directories
- Supported locales list is defined (e.g., `config/app.php` `supported_locales`)
- Fallback locale is configured in `config/app.php`

## Inputs
- Detection strategy (URL prefix, session, user preference, browser header)
- Supported locales list
- Fallback locale
- Route groups that should be locale-aware

## Workflow
1. Define supported locales in `config/app.php`:
```php
'supported_locales' => ['en', 'fr', 'de', 'es'],
'fallback_locale' => 'en',
```

2. Create `SetLocaleMiddleware`:

```php
class SetLocaleMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // Detection strategy based on project needs
        $locale = $this->detectLocale($request);

        // Validate against supported locales
        $supported = config('app.supported_locales');
        if (! in_array($locale, $supported)) {
            $locale = config('app.fallback_locale');
        }

        app()->setLocale($locale);
        return $next($request);
    }

    private function detectLocale(Request $request): string
    {
        // Strategy: URL prefix / session / user / browser
    }
}
```

3. Register middleware in the appropriate group (web, api, or custom):
   - **Laravel 11+**: `->withMiddleware(function (Middleware $middleware) { $middleware->web(append: [SetLocaleMiddleware::class]); })`
   - **Laravel 10-**: add to `$middlewareGroups['web']` in `app/Http/Kernel.php`

4. For URL prefix strategy: wrap routes in a locale-prefixed group:
```php
Route::prefix('{locale}')->middleware(SetLocaleMiddleware::class)->group(function () {
    Route::get('/', [HomeController::class, 'index']);
});
```

5. Test with each supported locale — verify `app()->getLocale()` returns the expected value
6. Test with unsupported locale — verify fallback to default locale
7. Ensure cache keys include locale: `Cache::remember("posts.all.{locale}", ...)`

## Validation Checklist
- [ ] Supported locales list is defined and includes all available translation directories
- [ ] Fallback locale is configured to the most complete translation set
- [ ] All user-supplied locale values are validated against the supported list
- [ ] Middleware is registered in the correct group for locale-aware routes
- [ ] Cache keys for localized content include the locale
- [ ] `app()->getLocale()` returns the expected value after middleware runs
- [ ] Unsupported locale values gracefully fall back to the default locale
- [ ] Translation calls use `__('namespace.key')` syntax (PHP array format preferred)
- [ ] No `__()` calls exist in business logic classes

## Common Failures
- Not validating user-supplied locale — unsupported values cause silent fallback and debugging difficulty
- Missing locale in cache keys — all users receive the same cached content regardless of language
- Using JSON translation format for application code — key tied to English source string
- Registering middleware in the wrong group — locale not set for intended routes

## Decision Points
- URL prefix vs session vs browser detection? URL prefix for public SEO-friendly apps; session for authenticated apps; browser header for zero-configuration
- PHP array vs JSON translation format? PHP arrays for application-managed translations (structured, refactorable); JSON for third-party service integration

## Performance Considerations
- Translation files are loaded once per locale per request and cached in memory
- PHP array translations benefit from OpCode caching
- Locale detection middleware adds ~0.01-0.05ms per request (negligible)
- Locale-specific cache keys multiply cache storage by the number of active locales

## Security Considerations
- Validate locale values against a whitelist — unvalidated locale input can cause silent fallback
- Translation output using user-controlled parameters must be escaped (Blade `{{ }}` handles this automatically)
- Protect `lang/` directory with filesystem permissions — corrupted translation files affect all output

## Related Rules
- Use PHP Array Format for Application Translations (05-rules.md)
- Always Set and Configure the Fallback Locale (05-rules.md)
- Validate All User-Supplied Locale Values (05-rules.md)
- Always Pass the count Parameter for Pluralization (05-rules.md)
- Include Locale in Cache Keys for Localized Content (05-rules.md)
- Never Call __() in Business Logic Classes (05-rules.md)
- Do Not Translate Technical Messages (05-rules.md)

## Related Skills
- Skill: Configure Middleware Pipeline via Kernel
- Skill: Configure Application via Fluent API

## Success Criteria
- Locale middleware correctly detects and validates the locale on every request
- Supported locales whitelist prevents invalid locale values from being applied
- Cache keys include locale for all localized content
- Translation calls are restricted to presentation layer (views, controllers, Blade)
- Fallback locale ensures missing translations degrade gracefully
