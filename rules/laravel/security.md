---
paths:
  - "**/*.php"
  - "**/composer.lock"
  - "**/composer.json"
  - "**/.env*"
  - "**/config/*.php"
---
# Laravel 13 Security

> This file extends [common/security.md](../common/security.md), [php/security.md](../php/security.md) with Laravel 13 specific content.

## Mass Assignment (Laravel 13)

- Every model must have `#[Fillable]` or `#[Guarded]` (or legacy `$fillable` / `$guarded`).
- Never use `#[Unguarded]` / `unguard()` in production.
- Never pass `$request->all()` to `Model::create()` or `Model::update()`.

## SQL Injection

- Use Eloquent or the Query Builder for all database queries.
- Never concatenate user input into SQL strings.
- For raw queries, use parameterized bindings (`?` or named `:param`).
- Whitelist sort columns and other dynamic query parts.

## XSS

- Use `{{ }}` in Blade — never `{!! !!}` without sanitizing first.
- Use `@json($var)` or `Illuminate\Support\Js::from()` for JavaScript contexts.
- For rich HTML content, use a whitelist-based sanitizer (Mews/Purifier or strip_tags).

## CSRF

- All web routes (web middleware group) have CSRF protection by default.
- Never exclude routes from CSRF for authentication or state-changing endpoints.
- For APIs, use Sanctum with token-based or cookie-based authentication.

## Authorization

- Use Gates for simple permissions, Policies for model-based permissions.
- Every state-changing action must call `$this->authorize()` or `Gate::denies()`.
- Use FormRequest with `authorize()` method for input validation + authorization.

## Rate Limiting

- Define named rate limiters in `AppServiceProvider::boot()`.
- Apply `throttle:` middleware to all API routes.
- Login attempts: 5 per minute per email+IP.
- Registration: 3 per hour per IP.

## Reference

See skill: `laravel-security` for comprehensive security patterns.
