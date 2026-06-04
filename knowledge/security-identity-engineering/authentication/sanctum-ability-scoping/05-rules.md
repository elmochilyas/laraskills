# Rules: Sanctum Ability-Based Token Scoping

## Design Abilities as Action-Based Strings, Not Roles
---
## Category
Architecture
---
## Rule
Name Sanctum abilities as `resource:action` pairs (e.g., `post:create`, `post:read`). Never use role names like `admin` or `editor` as abilities.
---
## Reason
Action-based abilities enable granular permission control. Role-based abilities are too coarse — an `admin` ability grants everything or nothing. Action-based abilities allow combining read-only on one resource with write access on another, supporting the principle of least privilege.
---
## Bad Example
```php
$token = $user->createToken('mobile-app', ['admin']); // Role-based — too broad
```
---
## Good Example
```php
$token = $user->createToken('mobile-app', [
    'post:read',
    'post:create',
    'comment:create',
]);
```
---
## Exceptions
Simple applications where a binary admin/non-admin distinction is sufficient.
---
## Consequences Of Violation
Overly permissive tokens, inability to grant partial access.
---

## Check Abilities With tokenCan in Controllers or Custom Middleware
---
## Category
Framework Usage
---
## Rule
Use `$request->user()->tokenCan('ability-name')` in controllers or custom middleware to verify token abilities. Sanctum does not provide built-in ability middleware.
---
## Reason
Ability checking must happen server-side for every protected action. Middleware provides reusable, declarative checks. Controller-level checks allow context-specific ability verification. Without explicit checks, abilities have no enforcement effect.
---
## Bad Example
```php
// Token created with abilities but never checked
public function store(Request $request) {
    Post::create($request->validated()); // No ability check
}
```
---
## Good Example
```php
public function store(Request $request) {
    if (!$request->user()->tokenCan('post:create')) {
        return response()->json(['message' => 'Forbidden'], 403);
    }
    Post::create($request->validated());
}
```
---
## Exceptions
Routes that only use SPA cookie auth (no token abilities to check).
---
## Consequences Of Violation
Token abilities defined but not enforced — all tokens have full access.
---

## Combine tokenCan With Gates/Policies for Full Authorization
---
## Category
Architecture
---
## Rule
Use `tokenCan()` to check token-level permission and Gates/Policies to check user-level authorization. Both layers must pass.
---
## Reason
Token abilities restrict what a specific token can do within the user's scope. Gates/Policies enforce what the user is allowed to do. Without Gates/Policies, a token with `post:create` ability allows creating posts even if the user's account is suspended, or allows creating posts owned by other users.
---
## Bad Example
```php
// Only checks token ability — no user-level authorization
if ($request->user()->tokenCan('post:update')) {
    $post->update($request->validated());
}
```
---
## Good Example
```php
// Token ability + user authorization
if ($request->user()->tokenCan('post:update') && $request->user()->can('update', $post)) {
    $post->update($request->validated());
}
```
---
## Exceptions
Read-only public endpoints where user-level authorization is not needed.
---
## Consequences Of Violation
Token with ability bypasses user-level restrictions, data access beyond authorization boundaries.
---

## Be Explicit With Empty Abilities Array
---
## Category
Security
---
## Rule
Always pass an explicit abilities array to `createToken()`. An empty array gives the token access to all actions — not zero access.
---
## Reason
Sanctum treats a token with no abilities array as "no restrictions" (full access). Developers expecting default-deny behavior create tokens that unintentionally grant full access. Always be explicit: pass the minimal set of abilities the token needs.
---
## Bad Example
```php
// No abilities array — token has full access (unexpected)
$token = $user->createToken('mobile-app');
```
---
## Good Example
```php
// Explicit minimal abilities
$token = $user->createToken('mobile-app', ['post:read']);
```
---
## Exceptions
When full-access tokens are intentional (e.g., internal admin tools) — document clearly.
---
## Consequences Of Violation
Unintended full access via tokens expected to be restricted.
---

## Do Not Use Ability Scoping on SPA Cookie Auth Routes
---
## Category
Architecture
---
## Rule
Do not check `tokenCan()` on routes authenticated via Sanctum's SPA cookie mode. Ability scoping applies only to API token authentication.
---
## Reason
SPA cookie auth uses the session, not a token. The user's full permissions apply — there is no token to check abilities against. Calling `tokenCan()` on an SPA-authenticated request will always return `false`, incorrectly blocking legitimate requests.
---
## Bad Example
```php
// SPA route using cookie auth — tokenCan always returns false
Route::middleware('auth:sanctum')->get('/api/posts', function (Request $request) {
    if (!$request->user()->tokenCan('post:read')) { // Always fails for SPA
        abort(403);
    }
});
```
---
## Good Example
```php
// Use Gate/Policy for SPA routes — tokenCan only for API token routes
Route::middleware('auth:sanctum')->get('/api/posts', function (Request $request) {
    $this->authorize('viewAny', Post::class); // Correct for SPA
});
```
---
## Exceptions
No common exceptions — SPA and token routes have different authorization models.
---
## Consequences Of Violation
SPA routes incorrectly blocked, 403 errors for legitimate users.
---

## Prune Unused Tokens and Enforce Per-User Token Limits
---
## Category
Maintainability
---
## Rule
Schedule a command to prune unused tokens and enforce a maximum number of tokens per user to prevent token sprawl.
---
## Reason
Users may create tokens for many devices and never revoke old ones. The `personal_access_tokens` table grows, slowing queries. Unlimited token creation also allows a malicious user to flood the table. Pruning and limits maintain database performance and security hygiene.
---
## Bad Example
```php
// No token limit — users can create unlimited tokens
$user->createToken('test'); // Creates thousands
```
---
## Good Example
```php
// Enforce limit
if ($user->tokens()->count() >= 10) {
    throw new \Exception('Maximum token limit reached');
}
$user->createToken('device-name', ['post:read']);

// Schedule pruning
$schedule->call(fn () => PersonalAccessToken::where('last_used_at', '<', now()->subMonths(3))->delete())->daily();
```
---
## Exceptions
Applications where tokens are short-lived and automatically expire.
---
## Consequences Of Violation
Token table bloat, slow queries, database performance degradation.
