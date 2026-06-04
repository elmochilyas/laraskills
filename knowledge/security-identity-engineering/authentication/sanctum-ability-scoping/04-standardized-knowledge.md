# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authentication Systems |
| Knowledge Unit | Sanctum Ability-Based Token Scoping |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Sanctum's ability-based token scoping allows API tokens to have granular permissions. When creating a token, you specify which abilities the token grants (e.g., `['create', 'read', 'update', 'delete']`). The token can then be verified against specific abilities on each API request using `$request->user()->tokenCan('ability-name')`. Unlike OAuth2 scopes, Sanctum abilities are simple string identifiers checked against the token's stored abilities. They are designed for first-party API access control, not third-party OAuth2 delegation.

---

## Core Concepts

- **Abilities**: String identifiers assigned to tokens (e.g., `'post:create'`, `'post:read'`, `'admin'`).
- **tokenCan()**: Method on the authenticated user to check if the current token has a specific ability: `$request->user()->tokenCan('post:create')`.
- **createToken()**: `$user->createToken('token-name', ['ability1', 'ability2'])`.
- **Middleware**: Sanctum does not have built-in ability-checking middleware — implement custom middleware using `tokenCan()`.
- **Ability Design**: Abilities should describe actions, not roles (`'post:create'` not `'editor'`).

---

## When To Use

- Granular API token permissions for first-party applications
- Mobile app tokens with limited scope (e.g., read-only token)
- M2M service accounts with specific allowed operations
- User-controlled token generation (let users create tokens with limited abilities)

## When NOT To Use

- Third-party OAuth2 delegation (use Passport scopes)
- Simple yes/no token access without granularity (ability scoping adds complexity without benefit)
- SPA cookie-based auth (cookie sessions already have full user permissions)

---

## Best Practices

- **Design Abilities as Permissions**: `'post:create'`, `'post:read'`, `'post:update'`, `'post:delete'`. Consistent naming convention.
- **Check Abilities in Controllers**: Use `$request->user()->tokenCan()` at the controller level, not in middleware (for flexibility).
- **Combine with Gates/Policies**: `tokenCan()` checks token permission; Gates/ Policies check user authorization. Both should pass for full access control.
- **Maximum Token Limit**: Limit the number of tokens per user to prevent token sprawl. Prune unused tokens.

---

## Architecture Guidelines

- Abilities are stored in the `personal_access_tokens` table as a JSON `abilities` column
- `tokenCan()` checks if an ability exists in the token's abilities array
- A token with no abilities means "check with the user's full permissions" (not "no permissions")
- SPA cookie auth bypasses ability checking (uses session, not token)
- Create custom middleware for reusable ability checks: `php artisan make:middleware CheckTokenAbility`

---

## Performance Considerations

- `tokenCan()` is an in-memory check against the token's abilities array — negligible overhead
- Token retrieval (from database or cache) is the primary cost
- No additional database queries for ability checking

---

## Security Considerations

- **Abilities vs User Permissions**: Abilities restrict what a token can do. They complement user authorization — a token with `'admin'` ability only bypasses token-level checks, not Gate/Policy authorization.
- **Token Without Abilities**: A token created with no abilities array defaults to allowing all actions. Be explicit.
- **SPA Session Bypass**: SPA cookie auth does not use tokens — `tokenCan()` is not applicable. SPA sessions use the user's full permissions.
- **Token Leakage**: A leaked API token exposes only its permitted abilities, not the user's full access.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using role names as abilities | 'editor', 'admin' string literals | Rigid — cannot grant partial permissions | Use action-based abilities (`'post:create'`) |
| Only checking ability in one place | Controller-level only | API endpoint called from another entry point bypasses check | Gate/Policy as the primary guard, ability for token restriction |
| Empty abilities array means no access | Expecting default-deny | Token actually allows all actions | Explicitly list minimal abilities |
| Relying solely on abilities for authorization | Missing Gate/Policy layer | Token with ability can access resources owned by other users | Combine `tokenCan()` with authorization policies |

---

## Anti-Patterns

- **Abilities as Roles**: `'editor'`, `'admin'` — too coarse. Use action-level abilities.
- **No ability on SPA routes**: SPA cookie auth does not use ability scoping — ensure API token routes have separate protection.
- **Using token abilities for user-level authorization**: Abilities restrict what a token can do; Gates/Policies restrict what a user can do. Different layers.

---

## Examples

**Creating a token with abilities:**
```php
$token = $user->createToken('mobile-app', [
    'post:read',
    'post:create',
    'comment:create',
]);

return $token->plainTextToken;
```

**Checking abilities in a controller:**
```php
public function store(Request $request)
{
    if (!$request->user()->tokenCan('post:create')) {
        return response()->json(['message' => 'Not authorized'], 403);
    }
    
    // Proceed with creating the post
}
```

**Custom ability middleware:**
```php
// app/Http/Middleware/TokenAbility.php
public function handle(Request $request, Closure $next, string $ability): Response
{
    if (!$request->user() || !$request->user()->tokenCan($ability)) {
        abort(403, 'Token does not have the required ability.');
    }
    
    return $next($request);
}

// Route definition
Route::middleware(['auth:sanctum', 'ability:post:create'])->group(function () {
    // ...
});
```

---

## Related Topics

- Sanctum SPA vs Token auth
- Sanctum authentication
- Gates and Policies (authorization layer)
- API authentication

---

## AI Agent Notes

- Ability scoping is Sanctum's permission system for tokens. Check if the project uses meaningful ability names or just placeholder strings.
- Action-based ability naming (`resource:action`) is the recommended pattern — check for role-based instead.
- Ability checking should complement, not replace, Gate/Policy authorization.

---

## Verification

- [ ] Abilities defined as action-based strings (`resource:action`)
- [ ] `tokenCan()` checked in relevant controllers
- [ ] Custom middleware created for reusable ability checks (if needed)
- [ ] SPA routes do not use ability checking (cookie sessions)
- [ ] Token without abilities array does not default to allow-all (if that's the intent)
- [ ] Token creation UI lets users select abilities
- [ ] Unused tokens pruned periodically
- [ ] Token limit per user enforced (if needed)
