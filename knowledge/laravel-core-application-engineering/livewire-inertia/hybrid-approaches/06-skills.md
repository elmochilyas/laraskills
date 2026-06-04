# Skill: Implement Route-Level Stack Segregation

## Purpose

Set up separate route files and middleware groups so that Livewire and Inertia routes are cleanly segregated by prefix, with shared Laravel infrastructure.

## When To Use

When building an application that uses both Livewire and Inertia for different sections (e.g., admin panel in Livewire, public site in Inertia).

## When NOT To Use

- Small applications where one stack suffices
- Teams experienced in only one stack
- When the same page needs both technologies

## Prerequisites

- Laravel application with both Livewire and Inertia installed
- Understanding of route prefixes and middleware groups
- Decision on which routes belong to which stack

## Inputs

- Route prefix mapping (e.g., `/admin` → Livewire, `/app` → Inertia)
- Layout requirements per stack

## Workflow

1. Create separate route files: `routes/livewire.php` and `routes/inertia.php`
2. In `routes/web.php`, wrap both files in a shared middleware group:
   ```php
   Route::middleware(['auth', 'verified'])->group(function () {
       Route::prefix('/admin')->group(base_path('routes/livewire.php'));
       Route::prefix('/app')->group(base_path('routes/inertia.php'));
   });
   ```
3. Create a Blade layout for Livewire at `resources/views/layouts/admin.blade.php` that loads `@livewireStyles` and `@livewireScripts`
4. Create a JS component layout for Inertia at `resources/js/Layouts/AppLayout.jsx` that loads the JS framework bundle
5. Register Livewire components in `routes/livewire.php` as full-page routes:
   ```php
   Route::get('/users', App\Livewire\UsersIndex::class);
   ```
6. Register Inertia routes in `routes/inertia.php` using controllers:
   ```php
   Route::get('/dashboard', [DashboardController::class, 'index']);
   ```
7. Extract shared business logic into service classes accessible by both stacks
8. Document the route-to-stack assignment in the project README

## Validation Checklist

- [ ] No route appears in both Livewire and Inertia route files
- [ ] Livewire routes load only Livewire assets (not JS framework bundle)
- [ ] Inertia routes load only Inertia assets (not Livewire JS)
- [ ] Both stacks share the same middleware pipeline for auth, CSRF, session
- [ ] No Blade template mixes `@inertia` and `<livewire:component>`
- [ ] Shared business logic resides in service classes, not duplicated in components/controllers
- [ ] Route-to-stack mapping is documented and accessible to all developers

## Common Failures

- Livewire component embedded inside an Inertia page via Blade includes — causes DOM conflicts
- Both JS bundles loaded on every page — defeats performance benefit
- Separate auth middleware for each stack instead of sharing — security inconsistency
- Route prefix documented nowhere — developers add routes to wrong stack

## Decision Points

- If a new route could reasonably fit in either stack, refer to the documented boundary. If it spans both, split it into multiple routes or reconsider the boundary
- If a route needs functionality only available in the other stack, refactor to the chosen stack rather than mixing

## Performance Considerations

Each stack loads only its own assets. Livewire's ~30KB bundle is not loaded on Inertia routes; Inertia's ~100KB+ bundle is not loaded on Livewire routes. This keeps per-page payload minimal.

## Security Considerations

Both stacks run through the same Laravel middleware pipeline — auth, CSRF, rate limiting apply uniformly. Never duplicate or split infrastructure logic between stacks.

## Related Rules

- Route-Level Stack Segregation (05-rules.md)
- Separate Layouts Per Stack (05-rules.md)
- Shared Laravel Infrastructure (05-rules.md)
- Exclusive Asset Loading Per Stack (05-rules.md)
- Documented Stack Boundary (05-rules.md)
- No Duplicated Business Logic (05-rules.md)

## Related Skills

- Evaluate and Select Frontend Stack (stack-selection-guide)
- Create an Inertia Page Component with Typed Props (inertia/page-components)
- Create a Well-Structured Livewire Component (livewire/component-architecture)

## Success Criteria

- Each route renders exclusively with Livewire or Inertia, never both
- Both stacks use shared Laravel middleware, auth, and session
- Each stack loads only its own JavaScript assets
- Stack boundary is documented and enforced in code review
- Business logic is extracted into shared service classes
