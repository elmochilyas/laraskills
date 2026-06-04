# Skill: Use Blade Authorization Directives for Conditional UI Rendering

## Purpose
Conditionally render UI elements based on user permissions using Blade `@can`, `@cannot`, `@canany`, and `@else` directives for clean, declarative template authorization.

## When To Use
- Blade templates that show/hide elements based on user permissions
- Conditional action buttons, edit/delete links, and form elements
- Admin panel UI that adapts to user roles

## When NOT To Use
- API responses or non-Blade frontends (use controller-level authorization)
- Complex conditional logic (extract to a component or helper)
- Authorization that should happen at the route/controller level

## Prerequisites
- Gates or Policies defined for authorization
- Spatie `@can` integration works automatically

## Workflow
1. Use `@can('update', $post)` for model policy checks in Blade
2. Use `@can('edit-articles')` for permission string checks with Spatie
3. Use `@cannot` for the inverse condition
4. Use `@canany(['update', 'delete'], $post)` for multiple permission checks
5. Use `@else` with `@can` for fallback content
6. Avoid `@role('editor')` or `@hasRole` — always check permissions, not roles
7. Extract complex authorization logic to a Blade component or helper

## Validation Checklist
- [ ] `@can` uses permission names, not role names
- [ ] Policy methods exist for each directive used
- [ ] `@cannot` used for inverse checks (not `@unlesscan`)
- [ ] Fallback content provided with `@else` where appropriate
