# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Authorization
**Knowledge Unit:** Blade Authorization Directives
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Blade @can vs @canany vs Custom PHP | Choosing authorization rendering approach | maintainability, readability |
| 2 | Server-Side Enforcement vs Blade-Only | Where authorization enforcement must happen | security |

---

# Architecture-Level Decision Trees

---

## Blade @can vs @canany vs Custom PHP

---

## Decision Context

Choosing the right Blade authorization rendering approach — `@can`, `@canany`, `@cannot`, or raw PHP `@if(Auth::user()->can(...))`.

---

## Decision Criteria

* maintainability
* readability

---

## Decision Tree

Is this a single permission check?
↓
YES → `@can('permission', $model)` (standard, readable)
NO → Is this a check for any of multiple permissions?
    YES → `@canany(['perm1', 'perm2'], $model)` (cleaner than chained @if)
    NO → Is this an inverse check (show when NOT allowed)?
        YES → `@cannot('permission', $model)` (clear intent)
        NO → Nested @can with @else for fallback

Is the condition more complex than a simple permission check?
↓
YES → Extract to a Blade component or PHP helper method
NO → Use `@can` or `@canany`

Do you need an else/fallback for unauthorized users?
↓
YES → `@can('permission', $model) ... @else ... @endcan` (standard)
NO → `@can` without @else (show or nothing)

---

## Rationale

Blade directives provide the clearest syntax for authorization checks. `@canany` is cleaner than multiple `@if(Auth::user()->can(...))` conditions. `@cannot` expresses inverse checks more clearly than `@unlesscan` or `@if(!Auth::user()->can(...))`. Complex logic should be extracted to components to keep templates readable.

---

## Recommended Default

**Default:** `@can('permission', $model)` for single checks; `@canany(['perm1', 'perm2'])` for multiple; `@cannot` for inverse
**Reason:** Blade directives are specifically designed for authorization rendering. They are more readable than raw PHP conditionals and follow Laravel conventions. Extract complex logic to keep templates clean.

---

## Risks Of Wrong Choice

- `@if(Auth::user()->can('x'))` instead of `@can('x')`: more verbose, less readable
- Complex logic in Blade: hard to test, hard to read, mixing presentation with business logic
- No @else for unauthorized users: users see blank space, poor UX
- Using @can without server-side check: security vulnerability despite correct directive

---

## Related Rules

- Always Pair @can With Server-Side Authorization (05-rules.md)
- Use Permission Names, Not Role Names in @can (05-rules.md)
- Pass Model Arguments for Model-Specific Checks (05-rules.md)

---

## Related Skills

- Use Blade Authorization Directives for Conditional UI Rendering (06-skills.md)

---

## Server-Side Enforcement vs Blade-Only

---

## Decision Context

Ensuring that every Blade `@can` directive has a corresponding server-side authorization check in the controller.

---

## Decision Criteria

* security

---

## Decision Tree

Does a route exist for the action shown/hidden by `@can`?
↓
YES → Is there `$this->authorize()` or `Gate::authorize()` in the controller?
    YES → Protected (directive + server-side = secure)
    NO → Security gap! Add server-side authorization immediately
NO → If no route exists, Blade-only is acceptable (nothing to navigate to)

Is the `@can` in a navigation menu (links to known routes)?
↓
YES → Must pair with server-side authorization on each linked route
NO → Is this a read-only UI element (no corresponding route)?
    YES → Blade-only is acceptable (no action to protect)
    NO → Must have server-side authorization

---

## Rationale

Blade directives control UI visibility only. They do not prevent URL-based access, form submissions, or API calls. Every route must have server-side authorization regardless of Blade directives. The only exception is UI-only elements (e.g., showing a label) that have no corresponding application action.

---

## Recommended Default

**Default:** Every `@can` that controls visibility of an actionable element (button, link, form) must have a corresponding `$this->authorize()` or `Gate::authorize()` in the controller
**Reason:** Blade directives are presentation-only. Server-side authorization is the actual security mechanism. Forgetting server-side checks while hiding UI controls creates an authorization bypass for users who know the URL.

---

## Risks Of Wrong Choice

- `@can` without server-side check: user navigates directly to URL, bypasses hidden UI
- Server-side check without `@can`: user sees disabled/inactive UI elements (confusing but secure)
- Neither: no authorization at all — open access
- `@can` on route that doesn't exist: dead UI, but no security risk

---

## Related Rules

- Always Pair @can With Server-Side Authorization (05-rules.md)
- Use Permission Names, Not Role Names in @can (05-rules.md)
- Pass Model Arguments for Model-Specific Checks (05-rules.md)

---

## Related Skills

- Use Blade Authorization Directives for Conditional UI Rendering (06-skills.md)
