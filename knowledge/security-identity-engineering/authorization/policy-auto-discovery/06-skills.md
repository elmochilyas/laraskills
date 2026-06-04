# Skill: Configure Policy Auto-Discovery for Convention-Based Authorization

## Purpose
Leverage Laravel's policy auto-discovery to automatically resolve model policies based on naming conventions, eliminating manual `AuthServiceProvider` registration.

## When To Use
- Projects following Laravel conventions (`App\Models\Post` → `App\Policies\PostPolicy`)
- Reducing boilerplate in `AuthServiceProvider`
- Teams wanting convention-over-configuration authorization

## When NOT To Use
- Non-standard model/policy naming conventions
- When explicit policy registration clarifies intent
- Policies in custom namespaces outside auto-discovery scope

## Prerequisites
- Policies created following naming convention: `ModelNamePolicy`
- Models in `App\Models` namespace

## Workflow
1. Create policy with matching model name: `PostPolicy` for `Post` model
2. Ensure policy is in `App\Policies` namespace (or auto-discovered directory)
3. Verify auto-discovery works: `php artisan route:list` shows middleware auth
4. Test that `$this->authorize('update', $post)` resolves to `PostPolicy@update`
5. Override auto-discovery with explicit registration only when needed
6. Document any policies that deviate from naming convention
