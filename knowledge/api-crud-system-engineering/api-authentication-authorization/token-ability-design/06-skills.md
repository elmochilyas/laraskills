# Skill: Design Token Abilities

## Purpose
Design token ability scopes per resource and action using `createToken('name', ['post:read', 'post:write'])` with granular, least-privilege scopes and a clear ability taxonomy.

## When To Use
- Sanctum token auth with scoped access
- API tokens for different consumer types
- Third-party and first-party token access control

## When NOT To Use
- SPA cookie auth — abilities are for tokens only
- Simple APIs with single access level

## Prerequisites
- Sanctum token auth implementation
- Resource and action taxonomy

## Inputs
- Resource list (posts, users, comments)
- Actions per resource (read, write, delete, admin)
- Consumer types (mobile, web, third-party, admin)

## Workflow
1. Define ability naming convention: `resource:action` (e.g. `post:read`, `post:write`, `user:admin`)
2. Use resource-scoped abilities: `post:read`, `post:write`, `post:delete`, `post:admin`
3. Use wildcard abilities for full access: `*` for super-admin tokens
4. Create token with specific abilities: `$user->createToken('mobile-app', ['post:read', 'post:write'])`
5. Register ability middleware or gates for each ability check
6. Apply abilities middleware on routes: `->middleware('abilities:post:read')`
7. Check abilities with `$request->user()->tokenCan('post:read')` in Policies
8. Never use token name for authorization — abilities only
9. Document ability taxonomy in API docs with table of resources and actions
10. Test each ability combination — insufficient ability returns 403

## Validation Checklist
- [ ] Ability naming convention defined: `resource:action`
- [ ] Resource-scoped abilities for granular control
- [ ] Wildcard `*` ability for full-access tokens
- [ ] Abilities assigned at token creation
- [ ] Abilities middleware applied on routes
- [ ] `tokenCan()` checks in authorization logic
- [ ] Token name never used for authorization
- [ ] Ability taxonomy documented
- [ ] Tests verify ability enforcement (403 for insufficient)
- [ ] Ability names consistent across all resources and actions

## Common Failures
- Using token name for authorization — name is metadata, client can spoof
- Flat ability list without resource scope — `admin` ability grants all access
- No wildcard ability — super-admin tokens need all abilities listed explicitly
- Ability checked only in controller, not middleware — easy to miss on new routes
- Ability taxonomy undocumented — developers don't know which abilities exist
- Overly granular abilities — 50+ abilities difficult to manage and test

## Decision Points
- Action granularity — `resource:read,write,delete,admin` vs `resource:read,write` with wildcard
- Wildcard behavior — `resource:*` grants all actions on resource vs `*` grants all
- Ability naming — `resource:action` vs `resource.action` vs `resource.action`
- Middleware vs gate check — middleware for route-level, gate for model-level

## Performance Considerations
- Ability checks are in-memory array operations on `$token->abilities`
- Token abilities loaded on every `auth:sanctum` request — eager for consistency
- 10+ abilities per token adds no measurable overhead — array of strings

## Security Considerations
- Least-privilege token abilities — only grant what consumer needs
- Ability names are case-sensitive — enforce lowercase convention
- Revoke token when ability set changes — don't modify existing token abilities
- Never create tokens with `*` for third-party consumers
- Ability-based response filtering — return only resources the token can access

## Related Rules
- Use `resource:action` Naming Convention
- Use Token Abilities for Authorization, Not Token Names
- Apply Abilities Middleware on Routes
- Use `tokenCan()` in Authorization Logic
- Document Ability Taxonomy
- Test Each Ability Combination

## Related Skills
- Sanctum Token Auth — for token creation pattern
- Token Expiration and Rotation — for token lifecycle
- Sanctum vs Passport Decision — for auth approach

## Success Criteria
- Each token has minimal abilities for its purpose
- Abilities middleware returns 403 for insufficient access
- `tokenCan()` works correctly in Policies
- Ability taxonomy documented
- Tests verify ability enforcement for all resource-action combinations
- Wildcard ability works for super-admin tokens without explicit listing
