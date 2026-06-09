## Use Route::singleton() For One-To-One Resources
---
## Category
Framework Usage
---
## Rule
Always use Route::singleton() for one-to-one relationships (user profile, team settings); never use Route::apiResource()->only() which still includes an unnecessary ID parameter.
---
## Reason
Route::singleton() removes the {id} parameter from the URL entirely, producing cleaner URLs like /users/{user}/profile instead of /users/{user}/profile/{profile}.
---
## Bad Example
`php
Route::apiResource('users.profile', ProfileController::class)->only(['show', 'update']);
// URL: /users/{user}/profile/{profile} — has redundant {profile} parameter
`
---
## Good Example
`php
Route::singleton('users.profile', ProfileController::class);
// URL: /users/{user}/profile — clean, no ID parameter
`
---
## Exceptions
When the resource may have multiple instances in the future, start with a standard resource controller to avoid breaking URL changes.
---
## Consequences Of Violation
Unnecessary ID parameter in URLs; misleading URL structure that suggests multiple instances exist; harder to discover singleton pattern.

## Align Relationship Method Name With Singleton Name
---
## Category
Reliability
---
## Rule
Always ensure the parent model's relationship method name matches the singleton resource name; never use mismatched names.
---
## Reason
Laravel resolves the singleton by calling $parent->{resourceName}(). A mismatch causes resolution failure at runtime.
---
## Bad Example
`php
// Route: Route::singleton('users.profile', ProfileController::class);
class User extends Authenticatable { public function userProfile() { return ->hasOne(Profile::class); } } // Relationship named 'userProfile', singleton name is 'profile'
`
---
## Good Example
`php
// Route: Route::singleton('users.profile', ProfileController::class);
class User extends Authenticatable { public function profile() { return ->hasOne(Profile::class); } } // Relationship named 'profile', matches singleton name
`
---
## Exceptions
No common exceptions. Always name the relationship after the singleton resource.
---
## Consequences Of Violation
Runtime error when resolving the singleton; 500 error on every request; hard to debug since the error is in container resolution.

## Eager-Load Singleton On Parent Queries
---
## Category
Performance
---
## Rule
Always eager-load the singleton relationship when listing parent resources; never access the singleton in a loop.
---
## Reason
Accessing a singleton relationship inside a loop over parent resources triggers N+1 queries — one query per parent.
---
## Bad Example
`php
$users = User::all();
foreach ($users as $user) { $profile = $user->profile; ... } // N+1 queries
`
---
## Good Example
`php
$users = User::with('profile')->get();
foreach ($users as $user) { $profile = $user->profile; ... } // 2 queries total
`
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
N+1 query explosion; performance degradation proportional to parent collection size; unnecessary database load.

## Use creatable() Only When Resource May Not Exist
---
## Category
Design
---
## Rule
Only use ->creatable() on singleton routes when the resource may not exist (draft records, onboarding state); never use it when the resource always exists after parent creation.
---
## Reason
->creatable() adds create and store routes. If the singleton always exists (e.g., profile created during user registration), these are unused routes that bloat the route table.
---
## Bad Example
`php
// Profile always created during user registration — creatable adds unnecessary create/store routes
Route::singleton('profile', ProfileController::class)->creatable();
`
---
## Good Example
`php
// Profile always exists — no creatable needed
Route::singleton('profile', ProfileController::class);
// Draft order may not exist — creatable adds create/store
Route::singleton('orders.draft', DraftOrderController::class)->creatable();
`
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Unused routes registered; route table bloat; unnecessary endpoints exposed; ambiguous API contract.

## Type-Hint Parent, Not Singleton, In Method Signatures
---
## Category
Design
---
## Rule
Always type-hint the parent model (not the singleton) in singleton controller method signatures; never type-hint the singleton resource directly.
---
## Reason
Singleton routes resolve the singleton via the parent's relationship. The parent model is the route parameter; the singleton is resolved implicitly by the framework.
---
## Bad Example
`php
class ProfileController extends Controller { public function show(User $user) { ... } } // Singleton is not a route parameter
`
---
## Good Example
`php
class ProfileController extends Controller { public function show(User $user) { return $user->profile; } } // Parent is the route parameter
`
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Route model binding fails to resolve; wrong model injected; 404 errors on valid requests.
