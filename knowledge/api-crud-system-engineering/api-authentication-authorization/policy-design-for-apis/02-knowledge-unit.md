# Policy Design for APIs

## Metadata (Domain: API & CRUD System Engineering, Subdomain: API Authentication & Authorization, Last Updated: 2026-06-02)

## Executive Summary
Laravel Policies provide a centralized authorization layer that determines whether a user can perform a specific action on a specific resource. For APIs, policies are invoked after token authentication succeeds, checking the second layer of authorization: "Can this authenticated entity perform this action on this resource?" Policies complement Sanctum token abilities — abilities gate what a token can do broadly; policies gate what a user can do on an instance level. Well-structured policies follow resource naming conventions, leverage policy auto-discovery, and separate authorization logic from controllers.

## Core Concepts
- **Policy class**: A PHP class that defines authorization methods for a specific resource model (e.g., `PostPolicy` for `Post`).
- **Policy methods**: Standard methods: `viewAny`, `view`, `create`, `update`, `delete`, `restore`, `forceDelete`. Custom methods for non-CRUD actions: `publish`, `archive`, `export`.
- **The `User` vs `Authenticatable` parameter**: Policy methods receive the authenticated entity as the first parameter. For user tokens, this is `User`. For API keys (if using custom auth), it's the service identity.
- **Model instance as second parameter**: `view`, `update`, `delete` receive the specific model instance. `viewAny` and `create` receive only the user.
- **Auto-discovery**: Laravel automatically resolves policies for models when the model name and policy name follow conventions (e.g., `App\Models\Post` → `App\Policies\PostPolicy`).

## Mental Models
- **Policies as bouncers**: The token (or API key) is the ID card at the door. The policy is the bouncer who checks if you're on the list for this specific VIP area (resource instance).
- **Abilities vs policies spectrum**: Token abilities answer "Can this token access the posts feature?" Policies answer "Can this user edit _this specific_ post?"
- **Policy as a spreadsheet**: Each row is a resource, each column is an action, each cell is the rule that grants or denies access.

## Internal Mechanics
1. A request arrives, authenticated via Sanctum guard. The user object is resolved.
2. Controller method calls `$this->authorize('update', $post)` or uses `PostPolicy` via `Authorization::grantIf()`.
3. Laravel resolves `PostPolicy` via auto-discovery or explicit `Gate::policy()` registration.
4. The policy's `update()` method is called with `$user` and `$post` as arguments.
5. The method returns `true` (allowed), `false` (denied — 403), or throws `AuthorizationException`.
6. For API requests, the default response is `{"message": "This action is unauthorized."}` with 403 status.
7. For `viewAny` and `create`, only the user is passed (no model instance).
8. For `restore` and `forceDelete`, the model uses soft deletes.

## Patterns
- **Resource-based policy naming**: `PostPolicy`, `CommentPolicy`, `UserPolicy`. One policy per resource model.
- **`viewAny` with filters**: `viewAny($user)` can accept optional filters via the request: return `$user->isAdmin()` or apply query scopes via `Post::query()->where(...)`.
- **Policy + Ability combination**: Check the token ability first (in middleware), then the policy in the controller:
  ```php
  // Route: ->middleware(['auth:sanctum', 'abilities:posts:update'])
  // Controller: $this->authorize('update', $post);
  ```
- **Admin override pattern**: In each policy method, check for admin/super-admin first:
  ```php
  public function update($user, Post $post) {
      if ($user->isAdmin()) return true;
      return $user->id === $post->user_id;
  }
  ```
- **Policy for API key guards**: If using custom API key auth, the `$user` parameter is the API key's owner or service model. Adapt policy methods to check service-level permissions.
- **Inline authorization for simple checks**: Use `Gate::authorize('post.update', $post)` or `$user->can('update', $post)` for one-off checks outside policies.

## Architectural Decisions
1. **Policy vs controller authorization**: Keep authorization logic in policies, not controllers. Controllers should only orchestrate the request — they call `$this->authorize()` and then perform the action.
2. **Policy placement**: All policies in `app/Policies/`. Use subdirectories for large applications: `app/Policies/Api/V1/PostPolicy.php`.
3. **Response customization**: Override `AuthorizationException` handler in `App\Exceptions\Handler` to return structured JSON errors:
   ```php
   public function render($request, Throwable $e) {
       if ($e instanceof AuthorizationException && $request->expectsJson()) {
           return response()->json(['message' => $e->getMessage() ?: 'Forbidden'], 403);
       }
   }
   ```
4. **Policy discovery**: Register policies explicitly in `AuthServiceProvider` if auto-discovery is disabled or naming conventions are not followed.

## Tradeoffs (table)
| Aspect | Policies in Controllers | Dedicated Policy Classes |
|--------|------------------------|------------------------|
| DRY compliance | Low (repeated logic) | High (reusable) |
| Testability | Low (coupled to controller) | High (unit-testable) |
| Discoverability | Scattered | Centralized |
| Complexity for simple CRUD | Lower (inline) | Higher (separate class) |
| Granularity | Per-controller | Per-resource |
| Admin override | Ad-hoc | Structured |

## Performance Considerations
- Policy resolution is cached after the first call per request. No repeated autoloading overhead.
- Policy methods that query the database (e.g., `$post->user_id === $user->id`) add a query. Ensure indexes on foreign keys.
- Eager load relations used in policies (e.g., `$post->team->owner_id`) to avoid N+1 queries within policy checks.
- For listing endpoints (`index`), avoid checking policies for each item individually. Use `viewAny` for the collection and filter results via query scopes.

## Production Considerations
- **Custom 403 responses**: Format 403 responses to match your API's error structure. Include the policy method name and resource type in the error response for debugging.
- **Policy logging**: Log denied authorization attempts (user ID, resource type, action, IP) for security auditing.
- **Policy caching for expensive checks**: If a policy method queries external APIs or performs expensive computations, cache the result with the user + resource as the key.
- **Rate limiting and policies**: Rate limiting happens before policy checks. A rate-limited request returns 429 before the policy is evaluated.
- **Soft delete policy methods**: Implement `restore` and `forceDelete` only if soft deletes are enabled. Otherwise, those methods are never called.

## Common Mistakes
- Not registering policies in `AuthServiceProvider` when auto-discovery is disabled.
- Checking `$user->id === $post->user_id` without null checks — if the post has no user, this throws an error.
- Writing authorization logic in controller actions instead of policies, leading to duplication.
- Forgetting that `viewAny` is called for index routes and `view` for show routes — they have different authorization semantics.
- Throwing generic `AuthorizationException` instead of returning boolean `false`. Exceptions break the flow; boolean returns allow graceful handling.
- Not testing policy edge cases (owner, non-owner, admin, guest).
- Exposing the reason for denial in production responses (e.g., "You are not the owner") — use generic "Forbidden" messages externally.

## Failure Modes
1. **Accidental admin bypass**: An `isAdmin()` check in every policy method accidentally grants admin access to all actions. Solution: Test admin policies explicitly; avoid catch-all `return true`.
2. **Policy not registered**: `$this->authorize('update', $post)` throws 403 even though the logic allows it. Solution: Verify `AuthServiceProvider` registration.
3. **Soft delete policy missing**: `restore` and `forceDelete` are not defined, defaulting to `false`. Solution: Implement all policy methods that correspond to the resource's capabilities.
4. **Race condition in ownership check**: Post owner changes between policy check and the actual update. Solution: Use database-level constraints (foreign keys) as a safety net.
5. **Guest user policy crash**: An unauthenticated request reaches a policy method that calls `$user->id` — crashes because `$user` is null. Solution: Gate checks before policies or use `Auth::check()` in policies.

## Ecosystem Usage
- **Laravel Nova**: Uses policies extensively for resource authorization. Each Nova resource can have a corresponding policy.
- **Laravel Filament**: Similar policy integration for admin panel access control.
- **Spatie Laravel Permission**: Often combined with policies — the policy checks the user's roles/permissions using Spatie's package, then returns boolean.

## Related Knowledge Units
### Prerequisites
- Laravel authorization (Gates, Policies)
- Sanctum token authentication

### Related Topics
- [token-ability-design](./phase-2/04-token-ability-design.md)
- [api-specific-middleware](./phase-2/15-api-specific-middleware.md)

### Advanced Follow-up Topics
- Policy-based authorization with OAuth2 scopes
- Attribute-Based Access Control (ABAC) implementation in Laravel
- Dynamic policy resolution for multi-tenant systems

## Research Notes
### Source Analysis
Laravel's `Illuminate\Auth\Access\Gate` class handles policy resolution. The `AuthorizesRequests` trait in controllers provides the `authorize()` method. Source in `vendor/laravel/framework/src/Illuminate/Auth/Access/`.

### Key Insight
Policies and token abilities serve complementary roles in API authorization: abilities answer "can this token use this feature?" (feature-level), policies answer "can this user act on this instance?" (instance-level). Both must pass for the request to proceed. This two-layer approach prevents authorization gaps.

### Version-Specific Notes
- **Laravel 9+**: Policy auto-discovery is enabled by default. Register policies in `AuthServiceProvider` only for non-conventional names.
- **Laravel 11**: The `AuthServiceProvider` is no longer included by default. Register policies in `AppServiceProvider` with `Gate::policy()`.
- **PHP 8.1+**: Policies can use constructor property promotion and readonly properties for cleaner dependency injection.

## Tradeoffs

**Benefit:** Centralized, consistent pattern. **Cost:** Additional abstraction layer, indirection. **Consequence:** Cleaner controllers but requires team discipline to maintain separation.