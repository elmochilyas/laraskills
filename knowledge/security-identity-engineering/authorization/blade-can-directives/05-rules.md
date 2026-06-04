# Rules: Blade Authorization Directives

## Always Pair @can With Server-Side Authorization
---
## Category
Security
---
## Rule
Every `@can` directive in a Blade template must have a corresponding `$this->authorize()` or `Gate::authorize()` call in the controller. Never rely on Blade directives alone for security.
---
## Reason
Blade directives only hide or show UI elements. They do not prevent a user from navigating directly to a URL, sending a cURL request, or bypassing the frontend entirely. Only server-side authorization blocks unauthorized access. Blade-only protection is a security vulnerability.
---
## Bad Example
```blade
{{-- UI says user can't see edit link, but /posts/1/edit is unprotected --}}
@cannot('update', $post)
    <p>You cannot edit this post.</p>
@endcannot
```
---
## Good Example
```php
// Controller
public function edit(Post $post) {
    $this->authorize('update', $post); // Server-side enforcement
    return view('posts.edit');
}
```
```blade
@can('update', $post)
    <a href="{{ route('posts.edit', $post) }}">Edit</a>
@endcan
```
---
## Exceptions
No common exceptions — Blade directives are never a security mechanism.
---
## Consequences Of Violation
Direct URL access bypasses hidden UI, authorization bypass.
---

## Use Permission Names, Not Role Names in @can
---
## Category
Framework Usage
---
## Rule
Pass permission names (e.g., `'edit-articles'`) to `@can`, not role names (e.g., `'editor'`).
---
## Reason
Roles can change, be renamed, or have different permission sets. Checking a role name in Blade means adding a permission to that role does not automatically update the blade check. Permission names are stable authorization primitives that reflect the actual capability.
---
## Bad Example
```blade
@role('editor') {{-- Role-based — fragile --}}
    <a href="/articles/create">New Article</a>
@endrole
```
---
## Good Example
```blade
@can('create-articles') {{-- Permission-based — stable --}}
    <a href="/articles/create">New Article</a>
@endcan
```
---
## Exceptions
No common exceptions — permissions should always be checked, not roles.
---
## Consequences Of Violation
Broken UI when role names change, inconsistent visibility.
---

## Pass Model Arguments for Model-Specific Checks
---
## Category
Framework Usage
---
## Rule
Include the model instance as the second argument to `@can` for model-specific authorization (e.g., `@can('update', $post)`).
---
## Reason
Without the model, `@can('update')` only checks a gate-level ability and does not evaluate the Policy method that checks ownership or other model-specific conditions. Model-specific policy methods require the model instance to determine access.
---
## Bad Example
```blade
@can('update') {{-- No model — only checks gate, not policy --}}
```
---
## Good Example
```blade
@can('update', $post) {{-- Model passed — checks PostPolicy@update --}}
```
---
## Exceptions
Non-model actions (e.g., `@can('view-dashboard')`) that have no model dependency.
---
## Consequences Of Violation
Model-specific policy checks skipped, incorrect authorization in UI.
---

## Use @canany for Multiple Permission Checks
---
## Category
Code Organization
---
## Rule
Use `@canany(['permission1', 'permission2'], $model)` instead of chaining `@if(Auth::user()->can(...))` conditions in Blade.
---
## Reason
`@canany` provides a declarative, readable syntax for checking if the user has any of several permissions. Chained `@if` conditions are verbose, harder to read, and mix PHP logic into templates unnecessarily.
---
## Bad Example
```blade
@if(Auth::user()->can('edit-articles') || Auth::user()->can('delete-articles'))
    <div class="admin-actions">...</div>
@endif
```
---
## Good Example
```blade
@canany(['edit-articles', 'delete-articles'])
    <div class="admin-actions">...</div>
@endcanany
```
---
## Exceptions
No common exceptions — `@canany` is always preferred.
---
## Consequences Of Violation
Verbose templates, mixed PHP/Blade logic.
---

## Avoid Complex Authorization Logic Inside Blade Directives
---
## Category
Code Organization
---
## Rule
Extract complex authorization conditions beyond a simple `@can` to Blade components, computed properties, or dedicated service methods. Do not write multi-line PHP conditionals inside Blade directives.
---
## Reason
Complex logic in Blade templates is untestable, hard to read, and mixes presentation with business logic. Keeping templates declarative maintains separation of concerns and enables unit testing of authorization logic.
---
## Bad Example
```blade
@if(Auth::user()->hasRole('admin') && $post->status === 'draft' && $post->user_id === Auth::id())
    <button>Publish</button>
@endif
```
---
## Good Example
```blade
@can('publish', $post)
    <button>Publish</button>
@endcan
```
---
## Exceptions
No common exceptions — authorization logic belongs in Policies/Gates, not Blade.
---
## Consequences Of Violation
Unreadable templates, untestable logic, maintenance burden.
---

## Route Registration Without Server-Side Auth Is a Gap
---
## Category
Security
---
## Rule
Ensure every route hidden from the UI by `@cannot` still has server-side authorization. Hiding a link does not protect the route.
---
## Reason
A hidden "Delete" button does not prevent a user from sending `DELETE /posts/1` via browser console, Postman, or automated script. The route itself must enforce authorization regardless of UI visibility.
---
## Bad Example
```php
// Route exists without authorization — hidden by Blade but accessible
Route::delete('/posts/{post}', [PostController::class, 'destroy']); // No middleware, no authorize()
```
---
## Good Example
```php
Route::delete('/posts/{post}', [PostController::class, 'destroy'])->middleware('can:delete,post');
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Direct URL access bypass allows unauthorized deletion/modification.
