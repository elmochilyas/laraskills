# Skill: Implement Sanctum Token Authentication

## Purpose
Set up Sanctum token-based API authentication with `Sanctum::actingAs()` in tests, token abilities for scoped access, token expiration, and `hasApiTokens` trait on the User model.

## When To Use
- API authentication for first-party and third-party consumers
- Token-based auth where each client needs a scoped token
- SPA and mobile API authentication

## When NOT To Use
- OAuth2 flows with third-party authorization — use Passport
- Session-based web authentication — use Laravel's built-in session auth

## Prerequisites
- Sanctum package installed
- User model with `HasApiTokens` trait

## Inputs
- Auth guard configuration
- Token ability definitions

## Workflow
1. Add `Laravel\Sanctum\HasApiTokens` trait to User model
2. Configure `'guard' => 'sanctum'` in `config/auth.php` for API
3. Generate token on login: `$token = $user->createToken('token-name', ['read', 'write'])`
4. Return token in login response — plaintext token, not hashed
5. Protect routes with `auth:sanctum` middleware
6. Apply `abilities` middleware for token ability checks: `Route::middleware('auth:sanctum', 'abilities:read')`
7. Revoke tokens on logout: `$request->user()->currentAccessToken()->delete()`
8. Test with `Sanctum::actingAs($user, ['read'])` for token-gated endpoints
9. Configure token expiration in `config/sanctum.php`: `'expiration' => 60 * 24` (1 day)
10. Use token names for identifying token purpose — never for authorization logic

## Validation Checklist
- [ ] `HasApiTokens` trait added to User model
- [ ] API guard configured for Sanctum in `config/auth.php`
- [ ] Login endpoint generates and returns token
- [ ] Protected routes use `auth:sanctum` middleware
- [ ] Token ability middleware applied for scoped access
- [ ] Logout endpoint revokes current token
- [ ] Tests use `Sanctum::actingAs()` for auth simulation
- [ ] Token expiration configured
- [ ] Token names used for identification, not authorization
- [ ] Plaintext token returned once on creation

## Common Failures
- Returning hashed token instead of plaintext — client can't use it
- No token abilities — all tokens have full access
- Token name used for authorization — name is metadata, not a security control
- No token expiration — tokens valid forever
- Logout not revoking token — token remains valid after "logout"
- CORS not configured — SPA cannot send Authorization header
- Sanctum::actingAs() without abilities — token ability gates fail in tests

## Decision Points
- Single vs multiple tokens per user — single for simple, multiple for device-specific
- Token expiration duration — short (hours) for high-security, long (days) for convenience
- Abilities structure — scope-based (`read, write, admin`) or resource-based (`posts:read`)

## Performance Considerations
- Token lookup via `tokenable_id` and hash — indexed, O(log n)
- Token count per user affects login response time — limit active tokens
- Ability checks are in-memory array operations — negligible overhead

## Security Considerations
- Return plaintext token only at creation — never in subsequent responses
- Token must be sent as `Authorization: Bearer <token>`, never in URL
- Token hash stored in DB — DB compromise doesn't reveal plaintext tokens
- Token abilities are checked at middleware level — cannot be bypassed by controller logic
- Token expiration tokens are cleaned by Sanctum's garbage collection

## Related Rules
- Add HasApiTokens to User Model
- Return Plaintext Token at Creation Only
- Use Token Abilities For Scoped Access
- Revoke Token on Logout
- Test With Sanctum::actingAs()
- Configure Token Expiration

## Related Skills
- Sanctum SPA Cookie Auth — for cookie-based Sanctum auth
- Token Ability Design — for ability structure
- Token Expiration and Rotation — for token lifecycle
- Sanctum vs Passport Decision — for choosing auth provider

## Success Criteria
- Login returns plaintext token with defined abilities
- Protected routes reject unauthenticated requests with 401
- Token ability middleware returns 403 for insufficient scope
- Logout invalidates current token
- Tests authenticate with token abilities correctly
- Token expiration automatically invalidates old tokens
