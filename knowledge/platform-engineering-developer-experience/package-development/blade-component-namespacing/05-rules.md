# Rules: Blade Component Namespacing

## Metadata
- **Source KU:** blade-component-namespacing
- **Subdomain:** Package Development
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- BC-RULE-001: **Package name as namespace** — Use the composer package name (without vendor prefix) as the Blade namespace prefix for uniqueness.
- BC-RULE-002: **Class vs anonymous** — Use class components for components with PHP logic (computed properties, validation, DI). Use anonymous for purely presentational templates.
- BC-RULE-003: **Consistent namespace** — Use the same namespace prefix across views, components, and layouts.
- BC-RULE-004: **Verify uniqueness** — Check no other popular package uses the same namespace prefix to prevent silent override conflicts.

## Architecture Rules
- BC-RULE-005: **Subdirectory organization** — Organize component templates in subdirectories: `forms/input.blade.php`. Reference as `<x-package::forms.input />`. Max 2 levels deep.
- BC-RULE-006: **Component class location** — Store in `src/Components/` to match Laravel convention.
- BC-RULE-007: **Spatie tools pattern** — Use `->hasViews()` for view namespace and `->hasViewComponent('prefix', Component::class)` for each component.

## Implementation Rules
- BC-RULE-008: **Register view namespace** — Always call `loadViewsFrom()` even if only using class-based components. Anonymous component resolution depends on it.
- BC-RULE-009: **Kebab-case for anonymous** — PHP class `MyButton` renders as `<x-package::my-button />`. Name files accordingly.

## Security Rules
- BC-RULE-010: **Escape user data** — Class components accessing container should not expose sensitive data. Published views can be modified by consumers.
- BC-RULE-011: **Validate constructor params** — Validate and sanitize Blade attributes passed to class component constructors.

## Performance Rules
- BC-RULE-012: **Class vs anonymous speed** — Class components resolve faster (explicit mapping). Anonymous has a filesystem check on first access. Run `view:cache` in deployment.

## Anti-Pattern Rules
- BC-RULE-013: **Avoid global registration** — Never register components without a namespace prefix (`<x-button />`). Risk of naming collisions.
- BC-RULE-014: **Avoid changing namespace** — Changing namespace between versions breaks all existing consumer references.
- BC-RULE-015: **Avoid over-deep namespaces** — 4+ levels of subdirectories creates verbose tags. Keep it simple.
