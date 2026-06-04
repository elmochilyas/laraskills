## Use Shallow Nesting By Default For API Routes
---
## Category
Architecture
---
## Rule
Always use ->shallow() on nested API resource routes; never register nested resources without shallow for JSON endpoints.
---
## Reason
Shallow nesting removes the parent parameter from show/update/destroy routes since child IDs (UUID/ULID) are globally unique. This produces cleaner URLs and reduces unnecessary parent model resolution.
---
## Bad Example
`php
Route::apiResource('users.posts', PostController::class); // /users/{user}/posts/{post} for all actions
`
---
## Good Example
`php
Route::apiResource('users.posts', PostController::class)->shallow(); // /users/{user}/posts for index/store, /posts/{post} for show/update/destroy
`
---
## Exceptions
Web applications that need parent context for breadcrumbs, navigation, or authorization should use non-shallow resources.
---
## Consequences Of Violation
Unnecessarily long URLs; redundant parent model resolution; verbose route listing.

## Validate Parent-Child Ownership In Policies
---
## Category
Security
---
## Rule
Always verify parent-child relationship ownership in policy methods for shallow routes; never rely on URL parameters alone for authorization.
---
## Reason
Shallow routes remove the parent parameter from the URL. Without explicit ownership checks, a user could access a child resource belonging to another parent.
---
## Bad Example
`php
// Policy trusts URL context that no longer exists on shallow routes
public function update(User , Post ): bool { return true; } // No ownership check
`
---
## Good Example
`php
public function update(User , Post ): bool { return ->user_id === ->id; } // Explicit ownership check
`
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Data leakage across parent contexts; user A accesses user B's posts; cross-tenant data access in multi-tenant systems.

## Limit Nesting To One Level Maximum
---
## Category
Architecture
---
## Rule
Never nest resources more than one level deep before applying shallow; restructure 3+ levels into separate shallow-nested pairs.
---
## Reason
Deep nesting produces fragile, hard-to-read URLs and expensive model resolution chains. Restructuring into shallow pairs maintains clarity and performance.
---
## Bad Example
`php
Route::apiResource('teams.users.posts.comments', CommentController::class); // 4 levels deep
`
---
## Good Example
`php
Route::apiResource('teams.users', UserController::class)->shallow();
Route::apiResource('users.posts', PostController::class)->shallow();
Route::apiResource('posts.comments', CommentController::class)->shallow();
`
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Fragile URLs; expensive multi-level model resolution; poor readability; difficult to test and maintain.

## Always Pair Shallow With Scoped Bindings
---
## Category
Reliability
---
## Rule
Always use ->scoped() alongside ->shallow() when custom binding keys are needed; never use shallow without scoped when child IDs are not UUID/ULID.
---
## Reason
Shallow removes the parent parameter, so the automatic parent-child scoping is lost. Without ->scoped(), the binding uses the default key which may not match the parent scope.
---
## Bad Example
`php
Route::apiResource('users.posts', PostController::class)->shallow(); // No scoped — binding uses default 'id'
`
---
## Good Example
`php
Route::apiResource('users.posts', PostController::class)->shallow()->scoped(['post' => 'uuid']);
`
---
## Exceptions
When child IDs are globally unique UUIDs/ULIDs and the default binding key is correct, ->scoped() may be omitted.
---
## Consequences Of Violation
Wrong model resolved; data access across parent contexts; 404 errors on valid child IDs resolved in wrong scope.

## Use Route Name Prefixes To Prevent Collisions
---
## Category
Maintainability
---
## Rule
Always use ->name() on nested shallow resource routes to prevent naming collisions with top-level resources; never rely on default naming for shallow routes.
---
## Reason
Shallow routes generate /posts/{post} which conflicts with a top-level posts resource. Route name prefixes disambiguate route generation.
---
## Bad Example
`php
Route::apiResource('posts', PostController::class);
Route::apiResource('users.posts', PostController::class)->shallow(); // Route name 'posts.show' collides with top-level
`
---
## Good Example
`php
Route::apiResource('posts', PostController::class);
Route::apiResource('users.posts', PostController::class)->shallow()->name('user.'); // 'user.posts.show' unique
`
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Route name collisions; oute('posts.show') resolves to the wrong route; URL generation returns unexpected URLs.
