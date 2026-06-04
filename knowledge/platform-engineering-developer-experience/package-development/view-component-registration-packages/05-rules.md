# Rules: View Component Registration in Packages

## Metadata
- **Source KU:** view-component-registration-packages
- **Subdomain:** Package Development
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- VIEWC-RULE-001: **Package name as component namespace** — Use package name (without vendor prefix) as the component prefix: `<x-package-name::button />`.
- VIEWC-RULE-002: **Class-based for logic, anonymous for templates** — Class components when computed properties, methods, attributes needed. Anonymous for pure structural.
- VIEWC-RULE-003: **Always register view namespace** — `loadViewsFrom()` even if only using class components. Anonymous components depend on namespace registration.
- VIEWC-RULE-004: **Spatie tools for declarative registration** — `->hasViewComponent('prefix', Component::class)` in configurePackage().
- VIEWC-RULE-005: **Make views publishable for theming** — For themeable components. Keep functional components in vendor.

## Architecture Rules
- VIEWC-RULE-006: **Unique namespace prefix** — Ensure uniqueness to prevent collisions. Two packages using `admin` as namespace will conflict.
- VIEWC-RULE-007: **Component class location** — Store in `src/Components/`. Matches Laravel convention.
- VIEWC-RULE-008: **View cache in deployment** — Run `php artisan view:cache` in deployment to compile package Blade templates for optimal performance.

## Security Rules
- VIEWC-RULE-009: **Escape user data with {{ }}** — Never use `{!! !!}` for user-provided content in component views.
- VIEWC-RULE-010: **Validate constructor params** — Class component attributes passed via `<x-package::component attr="value">` must be validated and sanitized.
- VIEWC-RULE-011: **No dynamic namespace resolution** — Never resolve component namespace based on user input. View path traversal vulnerability.

## Common Mistakes
- VIEWC-RULE-012: **View namespace mismatch** — Using different namespace in Blade tags vs `loadViewsFrom()`. Components render empty.
- VIEWC-RULE-013: **Registering same namespace twice** — Two packages using same namespace. Last one wins, first breaks.
- VIEWC-RULE-014: **Class render() returns non-existent view** — View path returned by `render()` doesn't exist in registered namespace.

## Anti-Pattern Rules
- VIEWC-RULE-015: **Avoid global component registration** — No namespace prefix risks naming collisions with other packages.
- VIEWC-RULE-016: **Avoid no view namespace for class components** — Class components need view namespace for their rendered views.
- VIEWC-RULE-017: **Avoid overriding component classes** — Component classes can't be overridden by consumers. Only views can be published.
