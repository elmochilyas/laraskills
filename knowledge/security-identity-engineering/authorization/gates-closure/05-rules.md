# Rules: Gates (Closure-Based Authorization)

## Use Gate::before() for Super-Admin Bypass Only
---
## Category
Architecture
---
## Rule
Register `Gate::before()` exclusively for super-admin bypass. The closure must return `true|null` — never `false`.
---
## Reason
Returning `true` from `before()` grants access immediately. Returning `null` delegates to the specific gate. Returning `false` denies access even if the specific gate would allow it. `false` return accidentally blocks all authorization for non-super-admin users.
---
## Bad Example
```php
Gate::before(function (User $user) {
    return $user->isSuperAdmin() ?: false; // Blocks non-super-admins!
});
```
---
## Good Example
```php
Gate::before(function (User $user) {
    if ($user->isSuperAdmin()) {
        return true; // Allow all
    }
    // Return null — delegate to specific gate
});
```
---
## Exceptions
No common exceptions — `before()` return semantics are strict.
---
## Consequences Of Violation
All non-super-admin users denied access to all routes.
---

## Check Gates Server-Side in Controllers, Not Only in Blade
---
## Category
Security
---
## Rule
Call `Gate::authorize()` or `$this->authorize()` in controllers for server-side enforcement. Blade `@can` directives are UI-only and provide no security.
---
## Reason
Blade directives only control what is displayed in the view. A user can navigate directly to a URL, bypassing Blade conditions entirely. Server-side `Gate::authorize()` throws a 403 exception if the user is not authorized, providing the actual security enforcement.
---
## Bad Example
```php
// Controller relies on Blade @can — no server-side check
public function dashboard() {
    return view('dashboard');
}
```
---
## Good Example
```php
public function dashboard() {
    Gate::authorize('view-dashboard'); // Throws 403 if unauthorized
    return view('dashboard');
}
```
---
## Exceptions
No common exceptions — server-side check is mandatory.
---
## Consequences Of Violation
Authorization bypass via direct URL access.
---

## Name Gates With Action-Oriented Names, Not Roles
---
## Category
Maintainability
---
## Rule
Use action-oriented names for gates (e.g., `view-dashboard`, `export-reports`). Never use role names (e.g., `admin`, `editor`).
---
## Reason
Action-oriented names describe what the user can do, independent of their role. If roles are renamed or restructured, action-based gate names remain stable. Role-based names break when roles change and are too coarse-grained.
---
## Bad Example
```php
Gate::define('admin', function (User $user) { // Role-based — fragile
    return $user->isAdmin();
});
```
---
## Good Example
```php
Gate::define('view-dashboard', function (User $user) { // Action-based — stable
    return $user->hasPermission('view-dashboard');
});
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Gates break on role rename, coarse permission checks.
---

## Keep Gate::before() Lightweight — Single Boolean Check
---
## Category
Performance
---
## Rule
The `before()` closure must be a simple boolean check (role check, column check). Avoid database queries or complex logic inside `before()`.
---
## Reason
`Gate::before()` executes on every single authorization check in the application. A database query inside `before()` would add a query to every policy/gate evaluation, potentially causing N+1 query problems. A simple boolean check is fast and scalable.
---
## Bad Example
```php
Gate::before(function (User $user) {
    return $user->roles()->where('name', 'super-admin')->exists(); // DB query on every check
});
```
---
## Good Example
```php
Gate::before(function (User $user) {
    return $user->is_super_admin; // Column check — no query
    // or: return $user->hasRole('super-admin'); // Cached by Spatie
});
```
---
## Exceptions
No common exceptions — `before()` must always be lightweight.
---
## Consequences Of Violation
N+1 query overhead on every authorization check, performance degradation.
---

## Handle Null User in Gate Closures
---
## Category
Security
---
## Rule
Type-hint the user parameter as nullable (`?User $user`) in gate closures and check for null before accessing user properties.
---
## Reason
Gates may be evaluated for unauthenticated (guest) requests. If the user parameter is not nullable or null is not checked, accessing `$user->id` or similar properties throws a TypeError or error, causing a 500 response instead of a proper authorization denial.
---
## Bad Example
```php
Gate::define('view-dashboard', function (User $user) { // Not nullable
    return $user->isAdmin(); // Error when guest
});
```
---
## Good Example
```php
Gate::define('view-dashboard', function (?User $user) {
    return $user !== null && $user->isAdmin(); // Safe for guests
});
```
---
## Exceptions
Routes that are always behind the `auth` middleware (guaranteed authenticated user).
---
## Consequences Of Violation
500 error for unauthenticated users on gated routes.
---

## Use Policies for Model-Specific CRUD, Not Gates
---
## Category
Architecture
---
## Rule
Define model-specific authorization (create, read, update, delete) in Policy classes. Reserve Gates for non-model actions (view-dashboard, export-reports).
---
## Reason
Policies organize authorization around a model, supporting auto-discovery, `authorizeResource()`, and clear method naming. Gates are closures without structure — putting model CRUD in gates loses these benefits and scatters authorization logic.
---
## Bad Example
```php
Gate::define('update-post', function (User $user, Post $post) {
    return $user->id === $post->user_id;
});
// No auto-discovery, no authorizeResource(), no structure
```
---
## Good Example
```php
// app/Policies/PostPolicy.php
class PostPolicy {
    public function update(User $user, Post $post): bool {
        return $user->id === $post->user_id;
    }
}
// Auto-discovered, supports authorizeResource()
```
---
## Exceptions
Simple applications where a full Policy class is over-engineering for one action.
---
## Consequences Of Violation
Scattered authorization logic, lost auto-discovery, missing `authorizeResource()`.
