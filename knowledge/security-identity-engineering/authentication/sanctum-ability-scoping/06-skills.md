# Skill: Scope Sanctum API Tokens with Abilities for Granular Access Control

## Purpose
Implement Sanctum's ability-based token scoping to create API tokens with granular, least-privilege permissions using `resource:action` naming conventions.

## When To Use
- Granular API token permissions for first-party applications
- Mobile app tokens with limited scope (e.g., read-only token)
- M2M service accounts with specific allowed operations
- User-controlled token generation with selectable permissions

## When NOT To Use
- Third-party OAuth2 delegation (use Passport scopes)
- Simple yes/no token access without granularity
- SPA cookie-based auth (cookie sessions already have full user permissions)

## Prerequisites
- Laravel Sanctum installed and configured
- API routes protected with `auth:sanctum` middleware
- API token authentication mode (not SPA cookie mode)

## Inputs
- Ability definitions in `resource:action` format (e.g., `post:create`, `post:read`)
- Token creation points (user settings UI, API registration, M2M setup)
- Ability check locations (controllers, middleware)
- Gate/Policy integration for user-level authorization

## Workflow (numbered)
1. Define abilities as `resource:action` strings — granular, not role-based
2. Create tokens with explicit abilities array: `$user->createToken('name', ['post:read'])`
3. Check abilities in controllers: `$request->user()->tokenCan('post:create')`
4. Create custom middleware for reusable ability checks
5. Combine `tokenCan()` with Gates/Policies for full authorization
6. Implement per-user token limits and prune unused tokens
7. Avoid `tokenCan()` on SPA cookie auth routes (use Gates/Policies instead)
8. Be explicit with empty abilities — an empty array means full access, not no access

## Validation Checklist
- [ ] Abilities use `resource:action` format (not role names)
- [ ] `tokenCan()` checked in controllers for token-protected routes
- [ ] Gates/Policies used alongside `tokenCan()` for user-level authorization
- [ ] SPA cookie auth routes do not use `tokenCan()`
- [ ] Explicit abilities array on every `createToken()` call
- [ ] Unused tokens pruned and per-user limit enforced

## Common Failures
- Using role names as abilities (`admin`, `editor`) instead of action-based
- Not checking abilities anywhere (tokens created with abilities but unused)
- Only checking `tokenCan()` without Gates/Policies (bypasses user-level authorization)
- Empty abilities array assumed to mean no access (actually means full access)
- `tokenCan()` on SPA routes (always returns false for cookie auth)

## Decision Points
- **Ability naming**: Always `resource:action` — never role names
- **Where to check**: Custom middleware for reusable checks, controller for context-specific
- **Combined authorization**: Token ability + Gate/Policy = full access control

## Performance Considerations
- `tokenCan()` is an in-memory check against abilities array — negligible overhead
- Token retrieval from DB or cache is the primary cost
- No additional queries for ability checking

## Security Considerations
- Abilities complement Gates/Policies — both layers must pass for full security
- Empty abilities array = full access (be explicit with minimal set)
- SPA cookie auth bypasses ability scoping entirely (use Gates/Policies)
- Leaked API token exposes only its permitted abilities, not user's full access

## Related Rules (from 05-rules.md)
- Design Abilities as Action-Based Strings, Not Roles
- Check Abilities With tokenCan in Controllers or Custom Middleware
- Combine tokenCan With Gates/Policies for Full Authorization
- Be Explicit With Empty Abilities Array
- Do Not Use Ability Scoping on SPA Cookie Auth Routes
- Prune Unused Tokens and Enforce Per-User Token Limits

## Related Skills
- Configure Sanctum SPA and Token Authentication
- Design RBAC Authorization System
- Implement Gates and Policies Authorization
- Configure Passport OAuth2 Server

## Success Criteria
- Tokens created with granular action-based abilities
- `tokenCan()` enforces ability restrictions on protected routes
- Gates/Policies provide user-level authorization alongside token abilities
- SPA routes unaffected by ability scoping
- Token pruning and limits prevent table bloat
- No tokens granted unintended full access via empty abilities
