# Sanctum Token Auth

## Metadata (Domain: API & CRUD System Engineering, Subdomain: API Authentication & Authorization, Last Updated: 2026-06-02)

## Executive Summary
Sanctum token authentication provides a lightweight, stateless API authentication mechanism for first-party external consumers such as mobile apps, JavaScript frontends on different domains, and machine-to-machine communication. Tokens are issued per-user with arbitrary "abilities" (scopes), stored hashed in the database, and presented via the `Authorization: Bearer` header. Unlike Passport, Sanctum token auth has no OAuth2 overhead, no client registration flow, and no refresh token infrastructure — making it ideal for your own applications.

## Core Concepts
- **API Token**: A plain-text bearer token returned once at creation. Only the SHA-256 hash and last four characters are stored.
- **Token Abilities**: Arbitrary string identifiers assigned to a token (e.g., `'posts:read'`, `'posts:create'`). Checked at the endpoint level.
- **Token Creation**: `$user->createToken('token-name', ['ability1', 'ability2'])` returns a `NewAccessToken` instance containing the plain-text token.
- **Token Revocation**: `$user->tokens()->delete()` revokes all tokens; `$token->delete()` revokes a single token by its database ID.
- **Current Access Token**: Via `$request->user()->currentAccessToken()` to inspect the token's abilities within a request.

## Mental Models
- **Token as keycard**: Each token is a keycard with specific permissions (abilities). Give different keycards to different applications.
- **Stateless by nature**: The server does not track sessions. Each request carries the credential. No login state, no session file.
- **Hash-and-forget**: The plain-text token is shown once, like a password. If lost, revoke and regenerate. The server only remembers the hash.

## Internal Mechanics
1. `createToken()` generates a random 40-character hex string (using `Str::random(40)`).
2. Prepends a simple `ID|` prefix to allow lookup by token ID (not exposed to the client).
3. The full token `<ID>|<plain-text>` is returned as `$token->plainTextToken`.
4. The plain-text token is hashed with SHA-256 (`hash('sha256', ...)`) and stored in `personal_access_tokens.token` column.
5. The last four characters are stored separately for display purposes (`tokenable_id` in the UI).
6. On request, Sanctum extracts the Bearer token, splits on `|` to get the ID, finds the token record by ID, hashes the provided secret portion, and compares.
7. If matched and not expired/revoked, the authenticated user is loaded via the polymorphic `tokenable` relationship.
8. Token abilities are checked via `$user->tokenCan('ability')` or `abilities` middleware.

## Patterns
- **Mobile app login**: POST credentials → receive `plainTextToken` → store in secure device storage (Keychain/Keystore) → attach to all future requests as `Authorization: Bearer <token>`.
- **Multiple named tokens**: Allow users to create named tokens for different applications (e.g., "My iOS App", "CI/CD Pipeline"). UI shows name + last four chars.
- **Token prefix for identification**: Use descriptive token names that include environment (e.g., "Production CI Token", "Staging Deployment") for easier auditing.
- **Per-request token ability check**: `$request->user()->tokenCan('orders:export')` at the controller or middleware level.
- **Token revocation UI**: Provide a management interface where users can see all active tokens (name + last four) and revoke individual ones.

## Architectural Decisions
1. **Token length**: 40 characters is the default. Override by extending `HasApiTokens` trait if needed.
2. **Ability naming convention**: Use `resource:action` (e.g., `posts:read`, `posts:write`, `admin:impersonate`). Consistent naming simplifies middleware checks.
3. **Storage format**: The `ID|secret` format enables efficient lookup by ID without scanning all hashed tokens. Do not change this format.
4. **Token expiration**: Sanctum does not enforce expiration natively. Implement a custom `expires_at` column and middleware if TTL is required.

## Tradeoffs (table)
| Aspect | Sanctum Token Auth | Passport Token Auth |
|--------|-------------------|-------------------|
| Setup time | Minutes | Hours |
| Token rotation | Manual | Built-in refresh tokens |
| Database load | 1 query/request | 2-3 queries/request |
| Client registration | None | Required |
| Third-party ready | No (no OAuth2) | Yes |
| Token scopes | Abilities (custom) | Scopes (OAuth2 spec) |
| Revocation | Immediate (DB delete) | Immediate or by expiry |
| Audit trail | Token name + dates | Full client + token chain |

## Performance Considerations
- Reading the token by ID is an integer primary key lookup — very fast with proper indexing.
- The `personal_access_tokens` table should have indexes on `tokenable_id`, `tokenable_type`, and `token` columns.
- For APIs with millions of tokens, consider partitioning the `personal_access_tokens` table by `tokenable_type`.
- Token creation is lightweight — one insert per token. No external service calls.
- Deleting all tokens for a user is a single DELETE query with the user's morph constraint.

## Production Considerations
- **Display token once**: Store the `plainTextToken` in a flash session or return it in the API response immediately after creation. Do not log or store the plain text.
- **Token limits**: Enforce a maximum number of tokens per user (e.g., 10 per user) to prevent runaway token creation.
- **Rotation policy**: Encourage users to rotate tokens periodically. Send email notifications when a token older than N days is used.
- **Audit logging**: Log token creation and revocation events with IP address and user agent for security monitoring.
- **Revocation on security events**: Provide an endpoint `/api/revoke-all-tokens` for users to invalidate all sessions after a suspected breach.
- **Token cleanup**: Schedule `sanctum:prune-expired --hours=24` to remove expired tokens from the database.

## Common Mistakes
- Logging the `plainTextToken` in application logs (security leak).
- Storing the plain-text token in the database alongside the hash (redundant and insecure).
- Not distinguishing between "user revoked" and "token expired" in the API response.
- Using tokens as a substitute for user authentication on session-based routes.
- Creating tokens without abilities and then wondering why `tokenCan()` returns false.
- Assuming `$request->user()` in an unauthenticated route will return null — it returns null, but safe checks are still required.
- Exposing the full token in response bodies after the initial creation response (only last four characters should be shown).

## Failure Modes
1. **Token not found (401)**: The token was revoked, expired, or the Bearer header is missing/malformed. Return `{"message": "Unauthenticated."}` with 401 status.
2. **Ability denied (403)**: Token exists but lacks the required ability. Return `{"message": "Forbidden."}` with 403 status.
3. **Token leaked via logs**: A developer accidentally logs incoming request headers. Solution: Use a log scrubber middleware to redact `Authorization` headers.
4. **Database `personal_access_tokens` table grows unbounded**: No cleanup schedule leads to millions of revoked tokens slowing queries. Solution: Schedule `sanctum:prune-expired`.
5. **Token collision**: Two users create tokens with the same name and abilities — no collision (tokens are unique), but the user may be confused about which is which. Solution: Append a timestamp or index to duplicate names.

## Ecosystem Usage
- **Laravel API Boilerplate**: Generated with `laravel new app --api` uses Sanctum token auth by default.
- **Flutter/Dart apps**: Use the `dio` or `http` package to send Bearer tokens. Store in `flutter_secure_storage`.
- **React Native**: Use `axios` with Bearer token stored in `react-native-keychain`.
- **CI/CD scripts**: cURL requests with `Authorization: Bearer` header for deployment triggers.

## Related Knowledge Units
### Prerequisites
- Laravel authentication guards
- HTTP Authorization header standard

### Related Topics
- [sanctum-spa-cookie-auth](./phase-2/02-sanctum-spa-cookie-auth.md)
- [token-ability-design](./phase-2/04-token-ability-design.md)
- [token-expiration-rotation](./phase-2/05-token-expiration-rotation.md)
- [api-key-pattern](./phase-2/06-api-key-pattern.md)

### Advanced Follow-up Topics
- Laravel Sanctum source code walkthrough
- Building a custom token driver on top of Sanctum
- Multi-tenancy token isolation

## Research Notes
### Source Analysis
The `HasApiTokens` trait (`vendor/laravel/sanctum/src/HasApiTokens.php`) and `Guard` check (`vendor/laravel/sanctum/src/Guard.php`) are the primary source files for understanding Sanctum's token mechanics.

### Key Insight
Sanctum's `ID|secret` format is arguably its most important design decision. By prepending the database ID, Sanctum avoids scanning all hashed tokens on every request (which would be O(n)). The lookup becomes O(1) — a primary key query. This makes Sanctum's token auth viable even with millions of tokens.

### Version-Specific Notes
- **Sanctum 2.x**: Tokens stored in plain text. The `ID|secret` format was introduced in Sanctum 3.x.
- **Sanctum 3.x+**: Tokens are hashed with SHA-256. Existing plain-text tokens from Sanctum 2.x continue to work but are automatically hashed on first access.
- **Laravel 11**: Sanctum is pre-installed. The `createToken` method signature remains unchanged.

## Tradeoffs

**Benefit:** Centralized, consistent pattern. **Cost:** Additional abstraction layer, indirection. **Consequence:** Cleaner controllers but requires team discipline to maintain separation.