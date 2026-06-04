# Skill: Configure Passport OAuth2 Server for Delegated Authorization

## Purpose
Implement Laravel Passport as a full OAuth2 server to enable third-party applications to securely access API resources on behalf of users.

## When To Use
- Your Laravel app needs to act as an OAuth2 provider for third-party apps
- Delegated authorization flows (e.g., "Allow MyApp to access your profile")
- Multi-service architecture requiring a centralized authorization server
- Compliance with OAuth2 standards for API access delegation

## When NOT To Use
- First-party SPA or mobile app auth (use Sanctum instead)
- Simple API token auth for your own applications
- When Sanctum's simpler token model suffices (80% of use cases)

## Prerequisites
- Laravel application with user authentication
- `composer require laravel/passport`
- RSA key pair generated via `php artisan passport:keys`

## Inputs
- OAuth2 grant type requirements (Authorization Code + PKCE, Client Credentials, Device Code)
- Client types (public SPA, confidential server, M2M)
- Scope definitions (granular permission list)
- Token lifetime requirements

## Workflow (numbered)
1. Install Passport: `composer require laravel/passport`
2. Run migrations: `php artisan migrate`
3. Generate RSA keys: `php artisan passport:keys` and secure with `chmod 600`
4. Register `Passport::routes()` in `AppServiceProvider`
5. Define scopes via `Passport::tokensCan()` with granular `resource.action` format
6. Configure token lifetimes via `Passport::tokensExpireIn()` and `Passport::refreshTokensExpireIn()`
7. Implement client management UI or API (since Laravel 13.x Passport is headless)
8. Apply `CheckScopes` or `CheckForAnyScope` middleware to protected routes
9. Schedule token pruning: `$schedule->command('passport:purge')->hourly()`
10. Register event listeners to revoke tokens on password change or security events

## Validation Checklist
- [ ] RSA keys generated and permissions set to 600, stored outside web root
- [ ] Private key NOT in version control
- [ ] PKCE required for all public clients
- [ ] Password Grant disabled
- [ ] Scopes are granular (e.g., `read-orders`, not `admin`)
- [ ] Token pruning scheduled in Kernel
- [ ] Token revocation on password change implemented
- [ ] Token lifetimes: access 15-60 min, refresh 14-30 days

## Common Failures
- Forgetting to secure the private key (default permissions allow reading)
- Using Password Grant in production (credentials exposed to client)
- Not pruning tokens (table bloat slows introspection queries)
- Overly broad scopes (defeats least-privilege principle)
- No token revocation on security events (compromised tokens survive password change)

## Decision Points
- **PKCE vs Secret**: Public clients (SPAs, mobile) must use PKCE; confidential clients (server apps) use client secret.
- **Grant Type**: Authorization Code + PKCE for user-facing apps; Client Credentials for M2M; Device Code for CLI/headless.
- **Token Lifetime**: Short access tokens (15-60 min) with longer refresh tokens (14-30 days). Enable refresh token rotation.

## Performance Considerations
- RSA signature verification on every auth'd request (~0.1-0.5ms)
- Token DB queries: scope lookup, revocation check on each request
- Schedule `passport:purge` to prevent table bloat from expired tokens

## Security Considerations
- OAuth2 private key is root of trust — 600 permissions, outside web root, never in version control
- Client secret for confidential clients only; PKCE for public clients
- Always validate requested scopes against authorized scope set
- Revoke tokens on password change, logout-all-devices, or security incidents
- Enable refresh token rotation to prevent replay attacks

## Related Rules (from 05-rules.md)
- Use PKCE for Public Clients (SPAs and Mobile Apps)
- Secure OAuth2 Private Key With 600 Permissions Outside Web Root
- Design Scopes as Granular Permissions, Not Broad Roles
- Schedule Token Pruning With passport:purge Command
- Revoke Tokens on Security Events
- Set Short Access Token Lifetimes With Longer Refresh Windows
- Do Not Use Passport for First-Party SPA Authentication

## Related Skills
- Configure Sanctum SPA and Token Authentication
- Implement OIDC Integration with Laravel
- Set Up Socialite OAuth Client Authentication
- Design RBAC Authorization System

## Success Criteria
- Third-party applications can obtain tokens via Authorization Code + PKCE
- Tokens are validated on every API request with correct scope enforcement
- Expired tokens are pruned automatically
- Token revocation on password change works end-to-end
- No Password Grant is enabled in production
- CI tests verify token flow: obtain, use, refresh, revoke
