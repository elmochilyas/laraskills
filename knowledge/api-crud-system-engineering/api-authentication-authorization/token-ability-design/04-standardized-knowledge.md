# ECC Standardized Knowledge — Token Ability Design

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Authentication & Authorization |
| Knowledge Unit | Token Ability Design |
| Difficulty | Intermediate |
| Category | Authorization |
| Last Updated | 2026-06-02 |

## Overview

Token abilities (scopes) are named permissions assigned to API tokens controlling what operations a token can perform. Sanctum implements abilities as string tags checked at controller/middleware level. Well-designed abilities use consistent `resource:action` naming, map to application resources, and compose into flexible permission sets. They replace role-based checks for API contexts, providing finer-grained control than `is_admin` booleans.

## Core Concepts

- **Ability as string tag**: `'posts:create'`. Token has zero or more abilities.
- **Ability creation**: `$user->createToken('name', ['posts:read', 'posts:write'])`.
- **Ability checking**: `$user->tokenCan('posts:read')` returns boolean. `abilities` middleware checks before controller.
- **No ability = no access**: Token with no abilities authenticates but cannot perform any action.
- **Abilities + Policies**: Abilities gate feature access (middleware). Policies gate instance access (controller). Both must pass.

## When To Use

- Every API token created via Sanctum
- Multi-tenant or multi-role APIs where different clients need different permissions
- APIs with read-only vs read-write access patterns
- When exposing API tokens to end-users for self-service management

## When NOT To Use

- Public endpoints with no authentication (no tokens at all)
- APIs where all authenticated users have uniform access (use a single ability)
- Instance-level permission checks (use Policies — abilities are feature-level)
- Role-based systems where role → ability mapping is complex (use a permission package like Spatie Laravel Permission)

## Best Practices

- **`resource:action` naming**: Standard pattern: `posts:read`, `posts:create`, `posts:update`, `posts:delete`.
- **`domain:resource:action` for large systems**: `admin:users:impersonate`, `billing:invoices:void`.
- **Granular per-CRUD-operation abilities**: Enables principle of least privilege. One ability per operation.
- **Ability constants**: Define as class constants for type safety: `class TokenAbilities { const POSTS_READ = 'posts:read'; }`.
- **Role-to-ability mapping**: Map roles to ability arrays at token creation: `$abilities = $roleMap[$user->role] ?? []`.
- **Ability check in FormRequests**: Override `authorize()` to check token abilities before validation.

## Architecture Guidelines

- Abilities stored as JSON array in `personal_access_tokens.abilities` column.
- Sanctum's `abilities` middleware requires ALL specified abilities (AND logic).
- Sanctum's `ability` middleware requires at least one (OR logic).
- No built-in wildcard support. Implement custom middleware for prefix matching (`str_starts_with`).
- Check abilities in middleware before controllers. Controllers use policies for instance checks.

## Performance Considerations

- `in_array()` on small JSON array — sub-millisecond.
- Avoid hundreds of abilities per token (JSON column deserialization overhead).
- Sanctum caches token lookup per request. Ability check reuses cached token.
- Custom wildcard matching adds microseconds — acceptable for most APIs.

## Security Considerations

- **`*` is literal, not wildcard**: Sanctum treats `*` as a literal string. `tokenCan('*')` matches only if `'*'` is in the array.
- **Empty abilities array**: All `tokenCan()` calls return false. Document this behavior.
- **Overly broad abilities**: A `posts:admin` ability grants everything for posts — defeats fine-grained control.
- **Stale abilities**: If you remove an ability from the system, existing tokens still have it in their JSON. Migrate to strip unknown abilities.

## Common Mistakes

- **`*` used as wildcard**: Sanctum does not support wildcards. All abilities must be explicitly listed.
- **No abilities on token creation**: Empty array → all endpoints return 403.
- **Inconsistent naming**: Mixing `Post:Read`, `posts_read`, `read-post` — creates documentation and audit chaos.
- **Instance-level abilities**: `post:123:edit` should be a policy check, not an ability. Abilities are resource-level.
- **Ability-only authorization without policies**: Missing instance-level checks.

## Anti-Patterns

- **Single `admin` ability**: Defeats fine-grained control. Use per-resource abilities.
- **Abilities mirroring database records**: Abilities should be resource-level, not instance-level.
- **No centralized ability registry**: Abilities scattered across codebase, hard to discover or audit.

## Examples

- Constant registry: `class Abilities { const POST_READ = 'posts:read'; const POST_CREATE = 'posts:create'; const POST_UPDATE = 'posts:update'; const POST_DELETE = 'posts:delete'; }`.
- Role mapping: `'editor' => [Abilities::POST_READ, Abilities::POST_CREATE, Abilities::POST_UPDATE]`.
- Middleware: `Route::middleware('auth:sanctum', 'abilities:' . Abilities::POST_CREATE)`.

## Related Topics

- **Prerequisites**: Sanctum token authentication, Laravel authorization (policies + gates)
- **Closely Related**: Sanctum Token Auth, Policy Design for APIs, Token Expiration & Rotation
- **Advanced**: OAuth2 scopes vs Sanctum abilities, hierarchical ability systems, ABAC
- **Cross-Domain**: Security & Identity Engineering

## AI Agent Notes

When generating token ability code: use `resource:action` naming, define as constants, use array for role→ability mapping, always assign abilities on `createToken()`, check abilities in middleware before controller policies.

## Verification

Sources: `HasApiTokens::tokenCan()` source, Sanctum `abilities`/`ability` middleware, domain-analysis.md.
