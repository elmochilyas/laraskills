# Phase 5: Rules — Token Ability Design

> Generated from 04-standardized-knowledge.md

## Use resource:action Naming Convention
---
## Category
Code Organization
---
## Rule
Always use the `resource:action` naming convention for token abilities (e.g., `posts:read`, `posts:create`).
---
## Reason
Consistent naming enables predictable ability discovery, simplifies documentation, and avoids chaos from ad-hoc naming patterns like `PostRead`, `read_post`, or `read-posts`.
---
## Bad Example
```php
$user->createToken('token', ['PostRead', 'edit_post', 'delete-posts']);
```

---
## Good Example
```php
$user->createToken('token', [
    Abilities::POST_READ,
    Abilities::POST_CREATE,
    Abilities::POST_UPDATE,
    Abilities::POST_DELETE,
]);
```

---
## Exceptions
No common exceptions. Consistency is critical for ability management.
---
## Consequences Of Violation
Undiscoverable abilities; documentation confusion; audit difficulty.

---
## Define Abilities as Class Constants
---
## Category
Maintainability
---
## Rule
Always define all token ability strings as constants in a dedicated class rather than using inline string literals.
---
## Reason
Inline strings are not refactorable, not discoverable, and prone to typos. Constants provide IDE autocompletion, type safety, and a single source of truth for all abilities in the system.
---
## Bad Example
```php
$user->createToken('mobile', ['posts:read']);
// Elsewhere: if ($user->tokenCan('post:read')) { ... } // Typo — never matches
```

---
## Good Example
```php
class Abilities
{
    const POST_READ = 'posts:read';
    const POST_CREATE = 'posts:create';
    const POST_UPDATE = 'posts:update';
    const POST_DELETE = 'posts:delete';
}

$user->createToken('mobile', [Abilities::POST_READ]);
// Elsewhere: $user->tokenCan(Abilities::POST_READ);
```

---
## Exceptions
No common exceptions. Always use constants.
---
## Consequences Of Violation
Hard-to-find typos in ability strings; inability to refactor; scattered magic strings.

---
## Use Granular Per-CRUD-Operation Abilities
---
## Category
Design
---
## Rule
Always define separate abilities for each CRUD operation rather than a single monolithic ability per resource.
---
## Reason
Monolithic abilities violate the principle of least privilege. A token with `posts:admin` can read, create, update, and delete — even if the use case only requires read access.
---
## Bad Example
```php
$token = $user->createToken('read-only', ['posts:admin']);
// Can create, update, delete — far more than needed
```

---
## Good Example
```php
$token = $user->createToken('read-only', [Abilities::POST_READ]);
// Can only read — minimum necessary permission
```

---
## Exceptions
Internal admin tools where broad access is intentional and audited.
---
## Consequences Of Violation
Tokens with excessive permissions; breach impact amplified by overprivileged tokens.

---
## Check Abilities in Middleware, Policies for Instance Checks
---
## Category
Architecture
---
## Rule
Always check token abilities at the middleware level (feature gating) and use Policies for instance-level authorization. Both must pass.
---
## Reason
Abilities gate whether a token can perform an action at all (feature-level). Policies gate whether the user can perform that action on a specific resource (instance-level). Separating these concerns prevents ability checks from becoming overly specific or policy checks from becoming overly broad.
---
## Bad Example
```php
// Instance-level check in ability name
$user->createToken('token', ['post:123:edit']);
// What happens for post 456? New ability needed per resource
```

---
## Good Example
```php
// Middleware checks ability (feature gate)
Route::put('/posts/{post}', [PostController::class, 'update'])
    ->middleware('abilities:' . Abilities::POST_UPDATE);

// Controller checks policy (instance gate)
public function update(Request $request, Post $post)
{
    $this->authorize('update', $post);
}
```

---
## Exceptions
No common exceptions. Abilities and policies serve different purposes.
---
## Consequences Of Violation
Overly broad abilities bypassing instance checks; or ability inflation from encoding instance logic.

---
## Never Use * as a Wildcard
---
## Category
Framework Usage
---
## Rule
Never use `'*'` expecting wildcard matching in Sanctum ability checks. Sanctum treats `'*'` as a literal string value.
---
## Reason
Sanctum does not support wildcard or prefix matching. `tokenCan('*')` only returns `true` if the token has an ability literally named `'*'`. Expecting wildcard behavior leads to 403 errors on all protected routes.
---
## Bad Example
```php
$user->createToken('token', ['*']);
// if ($user->tokenCan('posts:read')) → false (no wildcard expansion)
```

---
## Good Example
```php
// List abilities explicitly
$user->createToken('token', [
    Abilities::POST_READ,
    Abilities::POST_CREATE,
]);

// Or implement custom middleware with str_starts_with prefix matching
```

---
## Exceptions
No common exceptions. Sanctum has no wildcard support.
---
## Consequences Of Violation
Silent 403 errors on all ability-gated routes; developers confused about why tokenCan fails.

---
## Use Domain:Resource:Action for Large Systems
---
## Category
Scalability
---
## Rule
Always use the `domain:resource:action` pattern for ability naming in large or multi-domain systems (e.g., `admin:users:impersonate`, `billing:invoices:void`).
---
## Reason
In systems with multiple domains (admin, billing, content), `resource:action` alone may collide (e.g., `users:create` in both admin and billing). Domain prefixing prevents collision and organizes abilities by bounded context.
---
## Bad Example
```php
// Ambiguous across domains
'users:create', 'users:delete'
```

---
## Good Example
```php
// Domain-qualified
'admin:users:create', 'admin:users:delete',
'billing:invoices:void', 'content:posts:publish',
```

---
## Exceptions
Small applications with a single domain where `resource:action` is sufficient.
---
## Consequences Of Violation
Ability name collisions between domains; confusion about which context an ability applies to.

---
## Map Roles to Ability Arrays at Token Creation
---
## Category
Design
---
## Rule
Always centralize role-to-ability mappings in a single location and use them at token creation time instead of hardcoding ability lists per user.
---
## Reason
Hardcoded ability lists per user lead to inconsistencies and are impossible to audit. A single role map ensures every user with the same role gets the same abilities.
---
## Bad Example
```php
// Ad-hoc abilities per user
if ($request->input('type') === 'editor') {
    $abilities = ['posts:read', 'posts:create', 'posts:update'];
}
if ($request->input('type') === 'viewer') {
    $abilities = ['posts:read']; // Inconsistent with other viewer tokens
}
```

---
## Good Example
```php
class RoleAbilities
{
    const MAP = [
        'admin' => [Abilities::POST_READ, Abilities::POST_CREATE, Abilities::POST_UPDATE, Abilities::POST_DELETE],
        'editor' => [Abilities::POST_READ, Abilities::POST_CREATE, Abilities::POST_UPDATE],
        'viewer' => [Abilities::POST_READ],
    ];
}

$abilities = RoleAbilities::MAP[$request->user()->role] ?? [];
$token = $request->user()->createToken('token', $abilities);
```

---
## Exceptions
Systems without roles where permissions are assigned individually.
---
## Consequences Of Violation
Inconsistent ability assignments; audit difficulty; privilege drift between users with same role.

---
## Use abilities Middleware for AND Logic
---
## Category
Framework Usage
---
## Rule
Always use Sanctum's `abilities` middleware (AND — all required) over `ability` middleware (OR — any required) for more restrictive authorization.
---
## Reason
`abilities` requires all specified abilities on the token, enforcing strict permission requirements. `ability` allows any one of the specified abilities, which is less restrictive and easier to bypass accidentally.
---
## Bad Example
```php
// OR logic — token needs only posts:read OR posts:create
Route::middleware('ability:posts:read,posts:create');
```

---
## Good Example
```php
// AND logic — token needs both posts:read AND posts:create
Route::middleware('abilities:posts:read,posts:create');
```

---
## Exceptions
Endpoints where multiple ability paths should grant access (e.g., read via `posts:read` or `posts:admin`).
---
## Consequences Of Violation
Tokens satisfying any one ability bypass more restrictive requirements.

---
## Check Ability Authorization in FormRequests
---
## Category
Design
---
## Rule
Always override the `authorize()` method in FormRequest classes to check token abilities before validation.
---
## Reason
Ability checks in FormRequests keep authorization colocated with validation rules, ensuring that requests are authorized before any validation rules are processed.
---
## Bad Example
```php
class StorePostRequest extends FormRequest
{
    public function rules(): array { /* ... */ }
    // No authorize() — ability not checked
}
```

---
## Good Example
```php
class StorePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->tokenCan(Abilities::POST_CREATE) ?? false;
    }

    public function rules(): array { /* ... */ }
}
```

---
## Exceptions
Simple endpoints where middleware-level ability checks are sufficient and FormRequests are not used.
---
## Consequences Of Violation
Request validated before authorization; unnecessary processing of unauthorized requests.

---
## Strip Unknown Abilities During Token Migration
---
## Category
Maintainability
---
## Rule
Always implement a migration or command to strip unknown/removed abilities from existing tokens when the system's ability set changes.
---
## Reason
Removing an ability from the codebase does not remove it from existing tokens. The stale ability remains in the JSON column, potentially granting unintended access if the ability name is later reused for a different purpose.
---
## Bad Example
```php
// Ability 'posts:admin' removed from code but still in stored tokens
// Later reused as 'posts:admin' for a more permissive scope — old tokens gain unintended access
```

---
## Good Example
```php
// Migration or command
$validAbilities = Abilities::all();
foreach (PersonalAccessToken::cursor() as $token) {
    $token->abilities = array_intersect($token->abilities, $validAbilities);
    $token->save();
}
```

---
## Exceptions
No common exceptions. Stale abilities must be actively cleaned.
---
## Consequences Of Violation
Tokens retain permissions for removed features; ability name reuse grants unintended access to old tokens.
