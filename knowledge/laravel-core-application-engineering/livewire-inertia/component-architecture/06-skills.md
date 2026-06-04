# Skill: Create a Well-Structured Livewire Component

## Purpose

Build a Livewire component with proper class structure, typed properties, computed caching, kebab-case naming, and a Blade template, following separation of concerns.

## When To Use

When adding a new Livewire component (full-page or nested) to a Laravel application.

## When NOT To Use

- Completely static content (use plain Blade)
- Highly interactive UIs requiring complex client state (use Inertia + JS framework)

## Prerequisites

- Livewire installed in a Laravel application
- Understanding of PHP 8+ type declarations and attributes

## Inputs

- Component purpose (form, table, widget, page section)
- Required properties and their types
- Actions (methods callable from the frontend)
- Blade template path

## Workflow

1. Create the component class in `app/Livewire/` extending `Livewire\Component`
2. Declare public properties with explicit PHP 8+ type declarations:
   ```php
   public string $search = '';
   public int $count = 0;
   public ?User $selectedUser = null;
   ```
3. Apply `#[Rule]` attributes for validation rules on properties
4. Use `#[Computed]` on methods that perform expensive computations or database queries
5. Implement `render()` returning a `View` instance
6. Create the Blade template at `resources/views/livewire/component-name.blade.php`
7. Move complex logic (date formatting, status calculation, permission checks) out of the template into computed properties or helper methods
8. Keep the component focused on one concern — if it exceeds 150 lines or has 20+ properties, extract sub-components
9. Register the component route for full-page components:
   ```php
   Route::get('/path', App\Livewire\ComponentName::class);
   ```
10. Reference the component in Blade as `<livewire:component-name />` (kebab-case)

## Validation Checklist

- [ ] Component class in `app/Livewire/` directory
- [ ] Template exists at `resources/views/livewire/component-name.blade.php`
- [ ] All public properties have PHP type declarations
- [ ] Sensitive data marked `#[Volatile]`
- [ ] Component split at appropriate granularity (one concern per component)
- [ ] `render()` returns a View instance (not a string)
- [ ] `#[Computed]` used for expensive derived properties
- [ ] Blade template references use kebab-case (`<livewire:user-profile />`)
- [ ] No controller-level business logic in the component class

## Common Failures

- Giant monolithic component with 500+ lines, 20+ properties, 15+ actions — hard to maintain
- Untyped public properties — Livewire silently accepts incorrect types from frontend
- No `#[Computed]` on expensive getters — repeated DB queries in a single request
- Complex logic in Blade templates — cannot be unit tested, hard to debug
- kebab-case mismatch — `<livewire:UserProfile />` instead of `<livewire:user-profile />`

## Decision Points

- Split into sub-components when the class exceeds 150 lines or the template exceeds 200 lines
- Use full-page components for pages where >50% is interactive; use islands for content-heavy pages with some interactive widgets
- Use inline components (returning strings) only for prototyping — production code must return a View

## Performance Considerations

Livewire uses AJAX for every interaction. Minimize component size to reduce hydration payload. Use `#[Computed]` to cache derived data within a request. Use `#[Lazy]` for expensive components below the fold.

## Security Considerations

Livewire uses checksum verification to prevent tampered component state. Never store sensitive data (passwords, tokens, API keys) in public properties without `#[Volatile]`. CSRF protection applies to all Livewire requests.

## Related Rules

- One Component Per Concern (05-rules.md)
- Type All Public Properties (05-rules.md)
- Use Computed for Expensive Derived Properties (05-rules.md)
- Separate Presentation from Logic (05-rules.md)
- Name Components in Kebab-Case (05-rules.md)
- Use render to Return a View (05-rules.md)

## Related Skills

- Implement Efficient Data Binding with Correct Modifiers (livewire/data-binding)
- Implement and Test Livewire Actions with Events (livewire/actions-events)
- Implement Real-Time Server-Side Validation (livewire/validation)

## Success Criteria

- Component is focused on a single concern (one form, one table, one widget)
- All properties are typed — no silent type coercion bugs
- Expensive derived data is cached with `#[Computed]`
- Blade template contains only presentation logic (conditionals and output)
- Component name follows kebab-case convention consistently
- `render()` returns a proper View instance
