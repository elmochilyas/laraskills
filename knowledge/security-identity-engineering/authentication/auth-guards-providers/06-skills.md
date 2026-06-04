# Skill: Configure Auth Guards and Providers for Multi-Strategy Authentication

## Purpose
Design and implement Laravel's guard-provider architecture to support multiple authentication strategies across different route groups (web, admin, API) with proper isolation.

## When To Use
- Every Laravel application configuring its authentication foundation
- Applications with multiple user types requiring different auth strategies
- Custom authentication backends (LDAP, Active Directory, REST API)
- Multi-guard setups for separating admin, customer, and API auth

## When NOT To Use
- Stateless microservices without user authentication
- Applications where all users authenticate with the same strategy

## Prerequisites
- Laravel application with `config/auth.php`
- Understanding of authentication strategies (session, token, Sanctum, Passport)
- User model implementing `Authenticatable` contract

## Inputs
- User types requiring authentication (web users, admins, API clients)
- Authentication strategies per user type (session, token, Sanctum, Passport)
- User storage mechanism (Eloquent, database, custom provider)

## Workflow (numbered)
1. Define guards in `config/auth.php` — one per user type with appropriate driver
2. Define corresponding providers — reference correct Eloquent model or custom provider
3. Set default guard to match the primary authentication use case
4. Apply route middleware with explicit guard name: `auth:admin`, `auth:sanctum`
5. Implement custom `UserProvider` for non-DB user storage if needed
6. Register custom provider via `Auth::provider()` in a service provider
7. Test each guard independently with route group coverage
8. Configure session driver (Redis for multi-server) in production

## Validation Checklist
- [ ] Separate guards for each user type with correct drivers
- [ ] Each guard has a corresponding provider defined
- [ ] Default guard matches primary auth use case
- [ ] Route middleware explicitly specifies guard names
- [ ] Custom providers implement `UserProvider` contract
- [ ] `web` guard uses `session` driver — not modified

## Common Failures
- Using one guard for all user types (session on API, token on web)
- Not specifying guard in routes (default guard misapplied)
- Modifying `web` guard driver (breaks framework conventions)
- Guard without provider (runtime error on auth attempt)

## Decision Points
- **Driver selection**: `session` for browser-based, `sanctum` for SPA/token, `passport` for OAuth2 provider
- **Provider type**: `eloquent` for DB users, `database` for query builder, custom for external sources

## Performance Considerations
- Guard resolution cached after first request — negligible overhead
- Session driver: use Redis in production for multi-server deployments
- Custom providers: implementation-dependent performance

## Security Considerations
- Guard confusion: misconfigured guard on routes is an auth bypass vector
- Default guard mismatch causes silent auth failures on implicit calls
- Custom providers must validate credentials securely (hash verification)

## Related Rules (from 05-rules.md)
- Use Separate Guards Per User Type
- Explicitly Specify Guard in Route Middleware
- Never Modify the Web Guard's Driver or Provider
- Pair Every Guard With a Corresponding Provider
- Implement UserProvider Contract for Non-DB User Storage
- Set Default Guard to Match Primary Use Case
- Cache Session Storage With Redis in Multi-Server Deployments

## Related Skills
- Configure Sanctum SPA and Token Authentication
- Implement Passport OAuth2 Server
- Set Up Fortify Headless Auth Backend
- Design RBAC Authorization System

## Success Criteria
- Each user type authenticates with the correct strategy
- Route middleware explicitly references the correct guard
- Custom providers work for non-DB user storage
- Session driver is production-appropriate (Redis for multi-server)
- All tests pass for each guard configuration
