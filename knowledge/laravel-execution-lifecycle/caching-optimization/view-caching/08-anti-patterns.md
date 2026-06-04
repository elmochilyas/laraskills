# ECC Anti-Patterns — View Caching (ku-04)

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Caching & Optimization |
| **Knowledge Unit** | View Caching |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Business Logic in Blade Templates
2. Bypassing Blade Compilation with Raw PHP
3. View Composer Overuse
4. Not Clearing Views on Deploy
5. Extremely Deep View Nesting

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — view composers triggering database queries for every view render
- Premature Caching — N/A (view caching is automatic)

---

## Anti-Pattern 1: Business Logic in Blade Templates

### Category
Architecture

### Description
Writing database queries, calculations, or complex conditionals directly in `.blade.php` files.

### Why It Happens
Developers find it convenient to inline logic in templates for quick output.

### Warning Signs
- `DB::query()` or `Model::where()` in Blade templates
- Complex `@if` / `@foreach` logic with computations
- API calls in Blade files

### Why It Is Harmful
Business logic in templates is untestable, violates separation of concerns, and cannot be reused. The compiled view caches the PHP code, but the logic still executes on every render.

### Preferred Alternative
Move all business logic to controllers, services, or view composers. Keep Blade templates for presentation only.

### Detection Checklist
- [ ] Database queries in Blade templates
- [ ] API calls in Blade files
- [ ] Complex calculations in `@php` blocks

### Related Rules
ku-04 (04-standardized-knowledge.md): Avoid heavy logic in Blade templates.

---

## Anti-Pattern 2: Bypassing Blade Compilation with Raw PHP

### Category
Maintainability

### Description
Using `<?php` tags directly in Blade templates instead of Blade directives.

### Why It Happens
Developers accustomed to raw PHP use `<?php` for control structures, bypassing Blade's compilation system.

### Preferred Alternative
Use Blade directives (`@if`, `@foreach`, `@php`) instead of raw PHP tags.

### Detection Checklist
- [ ] `<?php` tags in `.blade.php` files
- [ ] `echo` statements in templates

### Related Rules
ku-04 (04-standardized-knowledge.md): Use Blade directives, not raw PHP.

---

## Anti-Pattern 3: View Composer Overuse

### Category
Performance

### Description
Registering global view composers that attach data to every view, even those that don't need them.

### Why It Happens
Developers use global view composers as a convenient way to inject data into all views.

### Preferred Alternative
Use explicit view composers for specific views. Pass data from controllers directly.

### Detection Checklist
- [ ] View composer registered for `*` (all views)
- [ ] Queries run for views that don't need the data

### Related Rules
ku-04 (04-standardized-knowledge.md): Minimize view inheritance depth.

---

## Anti-Pattern 4: Not Clearing Views on Deploy

### Category
Reliability

### Description
Deploying view changes without running `php artisan view:clear`.

### Preferred Alternative
Include `php artisan view:clear` in deployment script when templates have changed.

### Detection Checklist
- [ ] View changes not reflected after deploy
- [ ] Stale compiled views served

### Related Rules
ku-04 (04-standardized-knowledge.md): Use view:clear in deployment.

---

## Anti-Pattern 5: Extremely Deep View Nesting

### Category
Performance

### Description
10+ levels of `@extends` and `@include` — each level is a separate compiled file.

### Preferred Alternative
Flatten view structure using components and slots.

### Detection Checklist
- [ ] Deep `@extends` chain (5+ levels)
- [ ] High I/O from many compiled view includes

### Related Rules
ku-04 (04-standardized-knowledge.md): Minimize view inheritance depth.
