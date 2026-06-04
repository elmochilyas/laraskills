# Skill: Prevent XSS in Blade Templates with Proper Escaping

## Purpose
Apply Blade's auto-escaping (`{{ }}`), raw output (`{!! !!}`) only when safe, and Content-Security-Policy as defense-in-depth to prevent cross-site scripting in rendered templates.

## When To Use
- Every Blade template rendering user-provided content
- Any application that outputs data from the database
- When CSP is needed as secondary XSS defense

## When NOT To Use
- API responses (XSS is a browser-rendering concern)
- CLI output

## Prerequisites
- Blade templating engine
- Understanding of XSS vectors (HTML, JS, CSS injection)

## Workflow
1. Use `{{ $variable }}` (auto-escaped) for all user-provided content by default
2. Use `{!! $html !!}` (raw) only for trusted HTML — never for user input
3. Use `@verbatim` directive to output Blade syntax literally when needed
4. Implement CSP with strict `script-src` as secondary XSS defense
5. Validate and sanitize HTML input if raw HTML is needed (use HTML purifier)
6. Escape in JavaScript context: `@json($data)` for PHP-to-JSON, `{{ $var }}` in JS strings

## Validation Checklist
- [ ] User-provided content rendered with `{{ }}` (auto-escaped)
- [ ] `{!! !!}` only used for trusted HTML, never user input
- [ ] HTML sanitization applied for rich text content
- [ ] CSP configured with strict script-src as secondary defense
- [ ] JSON passed to JavaScript via `@json`, not manual string interpolation
