# ECC Anti-Patterns — Custom Directives

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Blade / View Layer |
| **Knowledge Unit** | Custom Directives |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Business Logic in Directive Callbacks (Hidden Queries)
2. Unprefixed Directive Names (Framework Collision Risk)
3. `Blade::directive()` for Conditionals (Manual Scoping)
4. Directive Returning HTML (Pretending to Be a Component)
5. Missing `php artisan view:clear` After Directive Changes

---

## Repository-Wide Anti-Patterns

- Stateful Directives That Set Global State
- Non-Deterministic Directives (Different Output for Same Input)
- Directives with Side Effects (Logging, Session Writes)
- Unescaped Output in Directive Return Values
- Directives Scattered Across Multiple Providers

---

## Anti-Pattern 1: Business Logic in Directive Callbacks

### Category
Architecture | Maintainability

### Description
Placing database queries, API calls, or complex business rules inside a directive callback — logic that runs at compile time but whose results are invisible to standard profiling and debugging tools.

### Why It Happens
Developers use directives as "convenient shortcuts" for data retrieval patterns without recognizing that the logic is now hidden from view.

### Warning Signs
- Directive callback calls `User::where()`, `Post::popular()`, or repository methods
- The compiled view cache contains SQL queries embedded in PHP strings
- Debug toolbar shows queries executing "from nowhere" — no controller or service trace
- Directive bypasses service layer and database abstraction

### Preferred Alternative
Keep directives as simple compile-time syntax transformations. Move business logic to services, components, or view composers where it is testable and visible.

### Related Rules
- Rule: Keep Directive Logic Simple — No Business Logic

---

## Anti-Pattern 2: Unprefixed Directive Names

### Category
Maintainability

### Description
Registering directives with generic names like `@money`, `@date`, `@truncate` without an application-specific prefix.

### Why It Happens
Developers focus on readability without considering future framework evolution.

### Warning Signs
- Custom directives named `@money`, `@date`, `@price`, `@truncate`, `@badge`
- No prefix distinguishing application directives from built-in Blade directives
- Laravel upgrade breaks templates — `InvalidArgumentException` for conflicting names
- Cannot distinguish `@if` (built-in) from `@admin` (custom) without reading the provider

### Preferred Alternative
Prefix all custom directives with an application abbreviation: `@appMoney`, `@appDate`, `@appTruncate`.

### Related Rules
- Rule: Prefix All Custom Directive Names

---

## Anti-Pattern 3: `Blade::directive()` for Conditionals

### Category
Maintainability | Reliability

### Description
Using `Blade::directive()` to implement custom conditionals instead of `Blade::if()`, requiring manual `@if`/`@else`/`@endif` PHP output.

### Why It Happens
Developers don't know `Blade::if()` exists or think `Blade::directive()` is the "standard way."

### Warning Signs
- Multiple `Blade::directive()` calls for `@name`, `@elsename`, `@endname` as separate registrations
- Directive callback returns `<?php if (...): ?>` raw PHP
- Scoping bugs — unclosed `if` blocks or incorrect nesting in compiled output
- Manual `endif` directives that can be forgotten

### Preferred Alternative
Use `Blade::if()` for all custom conditionals — it auto-generates `@name`/`@elsename`/`@endname` with correct scoping.

### Related Rules
- Rule: Use `Blade::if()` for Custom Conditionals, Not `Blade::directive()`

---

## Anti-Pattern 4: Directive Returning HTML

### Category
Architecture

### Description
Using a custom directive to render HTML markup (multiple tags, classes, structure) instead of creating a Blade component.

### Why It Happens
Developers want a "short syntax" for reusable UI pieces and reach for `@directive` instead of `<x-component>`.

### Warning Signs
- Directive callback returns HTML strings with `<div>` tags
- Directive output wraps content in HTML structure
- Developer wants to pass content between directive tags (slot functionality) — impossible
- Directive logic includes escaping, class merging, or attribute handling

### Preferred Alternative
Use Blade components for reusable UI with HTML. Components support slots, attribute bags, dependency injection, and testing.

### Related Rules
- Rule: Do Not Create Directives for Reusable UI

---

## Anti-Pattern 5: Missing `php artisan view:clear` After Directive Changes

### Category
Maintainability | Reliability

### Description
Modifying a custom directive's logic without clearing the compiled view cache, causing stale output from the old directive code.

### Why It Happens
Developers forget that directives are compile-time transformations — the compiled PHP in `storage/framework/views/` still contains the old code.

### Warning Signs
- Developer reports "I changed the directive but it's not working"
- Stale formatting persists after logic update
- Directive produces output from old callback logic
- No `php artisan view:clear` step after directive modifications

### Preferred Alternative
Always run `php artisan view:clear` after every directive change. Add a reminder in the directive's docblock or CI pipeline.

### Related Rules
- Rule: Run `php artisan view:clear` After Every Directive Change
