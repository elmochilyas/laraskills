# Token Ability Design

## Metadata (Domain: API & CRUD System Engineering, Subdomain: API Authentication & Authorization, Last Updated: 2026-06-02)

## Executive Summary
Token abilities (also called scopes) are named permissions assigned to API tokens that control what operations a token can perform. Sanctum implements abilities as simple string tags on each token, checked at the controller or middleware level. Well-designed abilities follow a consistent naming convention, map to application resources and actions, and can be composed to create flexible permission sets for different client types (mobile, admin dashboard, CI/CD, third-party). Abilities replace role-based checks for API contexts, providing finer-grained control than `is_admin` boolean checks.

## Core Concepts
- **Ability as string tag**: An ability is a string like `'posts:create'`. A token can have zero or more abilities.
- **Token creation with abilities**: `$user->createToken('name', ['posts:read', 'posts:write'])`.
- **Ability checking**: `$user->tokenCan('posts:read')` returns boolean. The `abilities` middleware checks before the controller.
- **No ability = no access**: A token with no abilities can authenticate but cannot perform any action. Useful for tokens that only identify the user.
- **Policies and abilities**: Abilities are checked before policies. A token without the `posts:read` ability is rejected before the PostPolicy is consulted.

## Mental Models
- **Abilities as elevator buttons**: Each ability is a button the token can press. If the token doesn't have the button, it can't go to that floor.
- **Resource:Action matrix**: Think of abilities as a grid. Resources (posts, users, orders) on one axis. Actions (read, create, update, delete) on the other. Each cell is a possible ability.
- **Wildcard vs explicit**: Some systems use wildcards (`posts:*`). Sanctum does not support wildcards natively — each ability must be explicitly listed or checked programmatically.

## Internal Mechanics
- Abilities are stored as a JSON array in the `abilities` column of `personal_access_tokens`.
- `tokenCan(ability)` calls `in_array($ability, $this->abilities)` — a simple array membership test.
- Sanctum's `abilities` middleware accepts a variadic list of required abilities. All must be present for the request to proceed.
- Sanctum's `ability` middleware accepts a variadic list where at least one must be present.
- Neither middleware supports hierarchical abilities or wildcards. Implement custom middleware for advanced matching.

## Patterns
- **`resource:action` naming**: Standard pattern: `{plural-resource}:{action}`. Examples: `posts:read`, `posts:create`, `posts:update`, `posts:delete`, `users:manage`, `reports:export`.
- **`domain:resource:action` for large systems**: For multi-domain applications: `admin:users:impersonate`, `billing:invoices:void`.
- **Granular per-resource abilities**: Create fine-grained abilities for each CRUD operation rather than a single `posts:admin`. This enables the principle of least privilege.
- **Composite ability groups**: Define ability sets as PHP constants: `class TokenAbilities { const POSTS_READ = 'posts:read'; const POSTS_WRITE = 'posts:write'; const POSTS_ALL = [self::POSTS_READ, self::POSTS_WRITE]; }`.
- **Role-to-abilities mapping**: Map user roles to ability sets at token creation time: `$abilities = match($role) { 'admin' => ['*'], 'editor' => ['posts:read', 'posts:create', 'posts:update'], 'viewer' => ['posts:read'] };`.
- **Ability check in FormRequests**: Override `authorize()` in FormRequest to check token abilities before validation: `return $this->user()->tokenCan('posts:create');`.

## Architectural Decisions
1. **Ability granularity**: Too coarse (single `admin` ability) defeats the purpose. Too fine (every individual field) creates management overhead. Aim for per-CRUD-action per-resource.
2. **Wildcard implementation**: If wildcards are needed, implement a custom middleware that checks prefix matching: `str_starts_with($tokenAbility, $requiredPrefix)`.
3. **Static vs dynamic abilities**: Static abilities (defined in code) are easier to reason about. Dynamic abilities (stored in DB, assignable via UI) are more flexible but harder to audit.
4. **Ability naming language**: Use English consistently. Avoid abbreviations. Use lowercase and colons as delimiters.

## Tradeoffs (table)
| Aspect | Granular Abilities | Coarse Roles |
|--------|-------------------|--------------|
| Precision | Fine-grained (least privilege) | Blunt (all-or-nothing) |
| Management overhead | High (many abilities to assign) | Low (few roles) |
| Audit clarity | Clear (exact permission) | Vague (role may include extras) |
| UI complexity | Complex (checkboxes per ability) | Simple (role dropdown) |
| Middleware verbosity | Long middleware lists | Short middleware calls |

## Performance Considerations
- `in_array()` check on a small array is negligible (sub-millisecond).
- Avoid storing hundreds of abilities per token — JSON column size grows and deserialization time increases.
- For high-throughput endpoints, cache the ability check result per token per request (Sanctum already caches the token lookup).
- Custom wildcard matching (str_starts_with, regex) adds microseconds — acceptable for most APIs.

## Production Considerations
- **Ability documentation**: Maintain a reference of all abilities with descriptions in the API documentation. Auto-generate from a central ability registry.
- **Deprecation policy**: When renaming an ability, keep the old name working for a deprecation period. Log usage of deprecated abilities.
- **Audit trail**: Log `token_name`, `abilities`, and `endpoint` for every API request. This helps identify tokens with excessive permissions.
- **Minimum ability principle**: When creating tokens in the UI, default to the minimum required abilities. Force users to explicitly opt into expanded permissions.
- **Ability migration**: When adding a new ability that replaces an old one, run a one-time migration to update existing tokens: `Token::whereJsonContains('abilities', 'old:ability')->each(fn($t) => $t->update(['abilities' => ...]))`.

## Common Mistakes
- Using `*` as an ability value and checking it with `tokenCan('*')` — Sanctum does not treat `*` as a wildcard. It matches only the literal `*`.
- Forgetting to pass abilities when creating a token → empty array → all `tokenCan()` calls return false.
- Checking abilities in the controller but not in the middleware, leading to inconsistent authorization.
- Creating abilities that mirror database records (e.g., `post:123:edit`) — abilities should be resource-level, not instance-level. Use policies for instance-level checks.
- Naming abilities inconsistently (mix of `Post:Read`, `posts_read`, `read-post`) making them hard to document and audit.
- Over-relying on abilities for UI-level access control (buttons show/hide) when the backend should be the source of truth.

## Failure Modes
1. **Token with no abilities can authenticate but can't do anything**: The user sees "authenticated" but every endpoint returns 403. Solution: Clearly communicate that abilities must be assigned.
2. **Ability name collision**: Two features accidentally use the same ability string but mean different things. Solution: Centralized ability registry with code review.
3. **Token with superset of required abilities**: A token with `admin:*` passes a check for `posts:read` but also accidentally passes other checks. Solution: Don't use wildcards unless absolutely necessary.
4. **Stale tokens after ability revocation**: A token was created with ability X, but ability X is later removed from the system. The token still has it in its JSON but it's meaningless. Solution: Run a migration to strip unknown abilities from existing tokens.

## Ecosystem Usage
- **GitHub Personal Access Tokens**: Uses fine-grained scopes (`repo`, `workflow`, `read:packages`). Similar `resource:action` pattern.
- **Stripe API Keys**: Uses key-level permissions (publishable vs secret). Stripe's newer restricted keys follow ability-like patterns.
- **Laravel Forge API**: Uses token abilities to restrict what a token can do (servers, sites, daemons).

## Related Knowledge Units
### Prerequisites
- Sanctum token authentication basics
- Laravel authorization (policies + gates)

### Related Topics
- [sanctum-token-auth](./phase-2/03-sanctum-token-auth.md)
- [policy-design-for-apis](./phase-2/08-policy-design-for-apis.md)
- [token-expiration-rotation](./phase-2/05-token-expiration-rotation.md)

### Advanced Follow-up Topics
- OAuth2 scopes vs Sanctum abilities (semantic differences)
- Hierarchical ability systems (implementing role-permission inheritance)
- ABAC (Attribute-Based Access Control) on top of abilities

## Research Notes
### Source Analysis
Sanctum's `HasApiTokens::tokenCan()` and `HasApiTokens::tokenAbilities()` methods in `vendor/laravel/sanctum/src/HasApiTokens.php` are the reference implementations.

### Key Insight
The `resource:action` naming convention maps cleanly to RESTful API design. For a typical CRUD resource with N operations, you need N abilities. This is manageable for 10-20 resources but becomes unwieldy for microservices with hundreds of endpoints. In that case, group abilities by domain or service boundary.

### Version-Specific Notes
- Sanctum has not changed its ability system since Sanctum 2.x. The implementation is stable.
- Laravel 11 did not introduce changes to Sanctum's ability handling.

## Tradeoffs

**Benefit:** Centralized, consistent pattern. **Cost:** Additional abstraction layer, indirection. **Consequence:** Cleaner controllers but requires team discipline to maintain separation.