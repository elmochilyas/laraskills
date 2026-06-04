# Rules: Super-Admin Bypass (Gate::before)

## Return true|null From Gate::before(), Never false
---
## Category
Security
---
## Rule
The `Gate::before()` closure must return `true` (allow all) or `null` (delegate to gate). Never return `false`.
---
## Reason
Returning `false` from `before()` denies the action permanently — even if the specific Gate or Policy would normally allow it. This blocks all authorization for non-super-admin users. `true` allows, `null` delegates to the normal authorization check.
---
## Bad Example
```php
Gate::before(function (User $user) {
    return $user->isSuperAdmin() ?: false; // Non-admins denied everything!
});
```
---
## Good Example
```php
Gate::before(function (User $user) {
    if ($user->isSuperAdmin()) {
        return true; // Allow all
    }
    // Return null — delegate to specific gate/policy
});
```
---
## Exceptions
No common exceptions — return semantics are strict and non-negotiable.
---
## Consequences Of Violation
All non-super-admin users receive 403 for every action.
---

## Keep Gate::before() Logic Simple — Single Boolean Method Call
---
## Category
Performance
---
## Rule
The `before()` closure must contain a single boolean check (e.g., `$user->isSuperAdmin()`). Never include database queries, API calls, or complex logic.
---
## Reason
`before()` executes on every single authorization check in the application. A database query inside `before()` would add N+1 query overhead to every policy evaluation. A simple method call keeps it fast and scalable.
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
    return $user->isSuperAdmin() ?: null; // Simple method call
});

// User model
public function isSuperAdmin(): bool {
    return $this->is_super_admin; // Column check — no query
}
```
---
## Exceptions
No common exceptions — performance requirement is strict.
---
## Consequences Of Violation
N+1 query overhead, slow authorization for all routes.
---

## Log Super-Admin Actions on Restricted Resources
---
## Category
Audit Logging
---
## Rule
Log when a super-admin accesses or modifies a resource that they would not normally have access to (resource owned by another user).
---
## Reason
Super-admins can access all data. Without audit logging, super-admin actions are invisible in standard authorization logs. Logging super-admin access to other users' resources provides accountability and detects potential abuse or mistakes.
---
## Bad Example
```php
// Super-admin action not logged — no audit trail
public function deleteAnyPost(Request $request, Post $post) {
    $post->delete();
}
```
---
## Good Example
```php
public function deleteAnyPost(Request $request, Post $post) {
    if (!$request->user()->can('delete', $post)) {
        activity()->by($request->user())->on($post)->log('super_admin_delete');
    }
    $post->delete();
}
```
---
## Exceptions
No common exceptions — super-admin actions must be auditable.
---
## Consequences Of Violation
No accountability for super-admin actions, undetected abuse.
---

## Register Only One Gate::before() Callback
---
## Category
Architecture
---
## Rule
Register `Gate::before()` exactly once in the application, typically in `AppServiceProvider::boot()` or `AuthServiceProvider::boot()`.
---
## Reason
Only the last registered `before()` callback takes effect. Multiple registrations silently override each other. Combined logic must be handled within a single `before()` closure, not across multiple registrations.
---
## Bad Example
```php
// Two before() registrations — only the last one works
Gate::before(function (User $user) { return $user->isSuperAdmin() ?: null; });
Gate::before(function (User $user) { return $user->hasRole('support') ?: null; }); // Overrides first
```
---
## Good Example
```php
Gate::before(function (User $user) {
    if ($user->isSuperAdmin() || $user->hasRole('support')) {
        return true;
    }
});
```
---
## Exceptions
No common exceptions — only one `before()` registration allowed.
---
## Consequences Of Violation
Silent bypass of one bypass rule, inconsistent authorization.
---

## Ensure Gate::before() Does Not Affect Guest Users
---
## Category
Security
---
## Rule
Type-hint the user parameter as `User` (not nullable) to ensure `before()` is only called for authenticated users. Guests never trigger `before()`.
---
## Reason
`Gate::before()` should only grant bypass for authenticated users. If the user is nullable and a guest triggers `before()`, the closure must handle null correctly. Type-hinting as `User` ensures the gate system only calls `before()` when a user is authenticated.
---
## Bad Example
```php
Gate::before(function (?User $user) { // Nullable — may be called for guests
    return $user?->isSuperAdmin() ?: null; // Guest returns null — fine but unclear
});
```
---
## Good Example
```php
Gate::before(function (User $user) { // Non-nullable — only called for authenticated users
    return $user->isSuperAdmin() ?: null;
});
```
---
## Exceptions
No common exceptions — guest bypass is never intended.
---
## Consequences Of Violation
Confusing behavior for guest users, potential accidental bypass.
---

## Control Super-Admin Assignment Tightly
---
## Category
Security
---
## Rule
Implement strict controls over which users can be granted super-admin status. Require multi-person approval for assignment.
---
## Reason
Super-admin bypass grants unrestricted access to all data and features. A compromised super-admin account is catastrophic. Tight assignment controls (approval workflow, audit trail, limited assignment authority) reduce the risk of unauthorized super-admin grants.
---
## Bad Example
```php
// Any admin can grant super-admin
public function grantSuperAdmin(User $user) {
    $user->is_super_admin = true; // No oversight
    $user->save();
}
```
---
## Good Example
```php
// Requires approval workflow
public function requestSuperAdmin(User $user) {
    SuperAdminRequest::create([
        'requested_by' => Auth::id(),
        'user_id' => $user->id,
        'approved_by' => null,
    ]);
    // Notify senior admins for approval
}
```
---
## Exceptions
No common exceptions — super-admin assignment must be controlled.
---
## Consequences Of Violation
Unauthorized super-admin grants, catastrophic data exposure.
