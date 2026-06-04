# Anti-Patterns: Sanctum Ability-Based Token Scoping

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authentication Systems |
| Knowledge Unit | Sanctum Ability-Based Token Scoping |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-SS-01 | Role-Based Ability Names | High | High | Medium |
| AP-SS-02 | Abilities-Without-Checks | Critical | High | Low |
| AP-SS-03 | Abilities-Only Authorization Bypass | High | Medium | High |
| AP-SS-04 | Empty Array Full-Access Surprise | Critical | High | Low |
| AP-SS-05 | SPA Route Ability Check | High | Medium | Low |

---

## Repository-Wide Anti-Patterns

- **Unlimited Token Creation**: No per-user limits allowing token sprawl and database bloat
- **Ability as Sole Auth Layer**: Using abilities without Gates/Policies, missing user-scope restrictions
- **Stale Token Proliferation**: No pruning of tokens never used or expired

---

## 1. Role-Based Ability Names

### Category
Architecture · Security

### Description
Using role names like `admin`, `editor`, or `user` as Sanctum abilities instead of action-based permissions (`post:create`, `post:read`).

### Why It Happens
Role-based thinking is natural — applications already have roles. Developers map existing roles directly to abilities without considering granularity. The "admin" ability seems sufficient until partial access is needed.

### Warning Signs
- `$user->createToken('name', ['admin'])` or similar role strings
- Ability names are single words without action/resource separation
- All tokens grant the same set of actions regardless of ability name
- No ability can grant read-only access without also granting write access

### Why Harmful
Role-based abilities are binary — the token either has `admin` or it doesn't, so every token with `admin` has the same permissions as every other token. This defeats the purpose of token scoping. Applications need granular permissions: a read-only mobile token, an M2M integration token that only creates orders, a monitoring token that only reads health status.

### Real-World Consequences
- Mobile app token has full admin capabilities because `admin` ability is the only option
- Customer integration token can delete data because there's no read-only ability
- Cannot create a limited token for a third-party service that only needs to check order status
- Security audit flags tokens as "overly permissive due to coarse ability design"

### Preferred Alternative
Use `resource:action` naming convention for all abilities.

### Refactoring Strategy
1. Design a complete ability matrix: list all resources and actions (create, read, update, delete)
2. Replace role-based ability names with granular `resource:action` names
3. Update all `createToken()` calls to use new ability names
4. Update all `tokenCan()` checks to reference the new ability names
5. Communicate breaking changes to any clients that create tokens programmatically

### Detection Checklist
- [ ] Search for `createToken(` calls — what ability strings are used?
- [ ] Are any abilities named after roles (admin, editor, user, moderator)?
- [ ] Can a read-only token be created?
- [ ] Is there a consistent naming convention across all abilities?

### Related Rules/Skills/Trees
- Design Abilities as Action-Based Strings, Not Roles (05-rules.md)
- Ability Naming Convention decision tree (07-decision-trees.md)

---

## 2. Abilities-Without-Checks

### Category
Security · Critical

### Description
Defining abilities on tokens but never calling `tokenCan()` to enforce them, making the abilities decorative and providing no actual access control.

### Why It Happens
Developers create tokens with abilities but forget or don't prioritize implementing the enforcement checks. The abilities column in the database exists but no code reads it. Since there's no visible error, the omission goes unnoticed.

### Warning Signs
- `$user->createToken('name', ['post:read', 'post:create'])` exists but no `tokenCan()` call in the codebase
- Token creation UI has ability selection, but API endpoints don't check abilities
- No custom middleware for ability enforcement
- All tokens work the same regardless of specified abilities

### Why Harmful
Without enforcement, ability definitions are meaningless — every token has unrestricted access to every endpoint. The development effort to design and implement abilities is wasted. More importantly, there's a false sense of security because the abilities appear to be configured correctly.

### Real-World Consequences
- Security review reveals "no ability enforcement" — all tokens have full access
- QA tests show tokens with "read-only" abilities can create, update, and delete
- Compliance audit finds tokens without enforced restrictions
- Developer hours wasted designing a scope system that was never connected

### Preferred Alternative
Always check abilities with `tokenCan()` in controllers or custom middleware for every protected action.

### Refactoring Strategy
1. Audit all API endpoints to determine which ability checks are needed
2. Add `tokenCan()` checks to controllers or create custom middleware
3. Verify that tokens with limited abilities are correctly restricted
4. Add tests that verify ability enforcement for each endpoint

### Detection Checklist
- [ ] Search for `tokenCan(` — does it appear in controllers or middleware?
- [ ] Does a token created with only `post:read` ability allow POST requests?
- [ ] Are there any custom ability-checking middleware classes?
- [ ] Do tests verify ability enforcement?

### Related Rules/Skills/Trees
- Check Abilities With tokenCan in Controllers or Custom Middleware (05-rules.md)
- Ability Enforcement Location decision tree (07-decision-trees.md)

---

## 3. Abilities-Only Authorization Bypass

### Category
Security · Architecture

### Description
Relying solely on Sanctum ability checks for authorization without combining with Gates/Policies, allowing tokens with valid abilities to access resources they shouldn't.

### Why It Happens
Ability checking is easier to implement than full Gate/Policy authorization. Developers believe that checking a token ability is sufficient for access control — if the token has `post:create`, the user can create posts.

### Warning Signs
- Controllers check `tokenCan()` but do not call `$this->authorize()` or `Gate::allows()`
- No Policy classes defined for models accessed via token-authenticated routes
- A token with `post:update` ability can update posts belonging to other users
- Suspended or banned users can still perform actions via API tokens

### Why Harmful
Sanctum abilities only check what a _token_ can do, not what a _user_ should be allowed to do. A token with `post:create` ability allows the authenticated user to create posts — even if the user is banned, their account is suspended, or the post ownership validation fails. Gates/Policies provide user-level authorization: is this user allowed to update this specific post?

### Real-World Consequences
- User banned for policy violations can still post via an API token with `post:create`
- Customer A's token with `order:read` can read Customer B's orders (no ownership check)
- Moderator token with `comment:delete` can delete any comment including admin's
- Audit trail shows unauthorized resource access — root cause is missing Policy check

### Preferred Alternative
Combine `tokenCan()` for token-level permission with Gates/Policies for user-level authorization.

### Refactoring Strategy
1. Define Policy classes for all models accessed via API token routes
2. Add `$this->authorize()` calls to controllers after `tokenCan()` checks
3. Ensure Policies check user roles, resource ownership, and account status
4. Verify that a banned user with valid tokens cannot perform actions
5. Verify that user A cannot access user B's resources via API token

### Detection Checklist
- [ ] Do controllers check both `tokenCan()` and `$this->authorize()`?
- [ ] Are Policy classes defined for token-accessible models?
- [ ] Can a suspended user perform actions via a valid token?
- [ ] Can user A read user B's private resources via API?

### Related Rules/Skills/Trees
- Combine tokenCan With Gates/Policies for Full Authorization (05-rules.md)
- Ability Scoping vs Passport Scopes decision tree (07-decision-trees.md)

---

## 4. Empty Array Full-Access Surprise

### Category
Security · Framework Usage

### Description
Calling `$user->createToken('name')` without an abilities array, expecting the token to have no permissions, while Sanctum treats it as full access.

### Why It Happens
Developers familiar with "default deny" security models assume that omitting the abilities parameter means the token has no permissions. Sanctum's documentation notes this behavior, but it's counterintuitive and easily missed.

### Warning Signs
- `->createToken('device-name')` called without a second argument
- Token created with abilities array empty: `->createToken('name', [])`
- Tokens expected to be restricted have full access to all endpoints
- Developer comment: "Why does this restricted token have full access?"

### Why Harmful
A token created without explicit abilities silently grants full access. This is particularly dangerous for user-generated tokens where the user intends to create a limited token — the token ends up with unrestricted access. The security boundary that abilities should provide is completely absent.

### Real-World Consequences
- User creates a "read-only" API token without abilities parameter — it has full write access
- M2M token intended for monitoring only can execute admin operations
- Support token created for debugging has unrestricted data access
- Security audit finds all tokens created without explicit abilities have full access

### Preferred Alternative
Always pass an explicit abilities array, even if the token needs full access (document the intent).

### Refactoring Strategy
1. Find all `createToken()` calls without a second argument
2. Add explicit abilities arrays to each call
3. For tokens that genuinely need full access, use `['*']` or document the reason
4. Write a static analysis rule or CI check that flags `createToken()` calls without abilities
5. Verify that token restrictions work as expected

### Detection Checklist
- [ ] `grep -r 'createToken(' app/` — which calls lack the abilities parameter?
- [ ] Are there tokens in the database with NULL abilities column?
- [ ] Do all token creation UI flows include ability selection?
- [ ] Does the `PersonalAccessToken` model have a default `abilities` value?

### Related Rules/Skills/Trees
- Be Explicit With Empty Abilities Array (05-rules.md)
- Ability Naming Convention decision tree (07-decision-trees.md)

---

## 5. SPA Route Ability Check

### Category
Architecture · Reliability

### Description
Calling `tokenCan()` on routes authenticated via Sanctum's SPA cookie mode, where no token is available and the check always returns false.

### Why It Happens
Developers use the same middleware or controller logic for both SPA cookie auth and API token routes. Since the route is protected by `auth:sanctum`, they assume `tokenCan()` works for all authentication modes.

### Warning Signs
- SPA routes (using cookie auth) check `$request->user()->tokenCan()`
- 403 errors on SPA routes but not on API token routes
- SPA users see "not authorized" for actions they should be able to perform
- `tokenCan()` and Gate/Policy checks are mixed in the same controller method

### Why Harmful
In SPA cookie mode, Sanctum authenticates via the session — there is no token to check abilities against. `tokenCan()` looks at the current token's abilities array. When there's no token (cookie auth), it checks the `null` token and returns `false`. This silently blocks all SPA requests that require ability checks, while correctly allowing token-authenticated requests.

### Real-World Consequences
- SPA users cannot create posts because `tokenCan('post:create')` returns false
- Admin SPA dashboard shows blank/empty state because all ability checks fail
- Hours of debugging to find that SPA routes are incorrectly blocked
- Workaround: removing `tokenCan()` checks makes SPA work but removes token restrictions

### Preferred Alternative
Use Gates/Policies for SPA cookie auth routes. Reserve `tokenCan()` for API token routes only.

### Refactoring Strategy
1. Identify which routes use SPA cookie auth vs API token auth
2. Replace `tokenCan()` calls on SPA routes with Gate/Policy checks
3. Keep `tokenCan()` on API token routes
4. Add custom middleware that detects auth mode and applies appropriate checks
5. Write tests for both auth modes

### Detection Checklist
- [ ] Which routes use cookie auth (same-domain SPA) vs token auth?
- [ ] Do any controllers check `tokenCan()` on routes used by SPAs?
- [ ] Do SPA users get 403 errors that API token users don't?
- [ ] Are Gate/Policy checks present alongside token ability checks?

### Related Rules/Skills/Trees
- Do Not Use Ability Scoping on SPA Cookie Auth Routes (05-rules.md)
- Sanctum Auth Mode: SPA Cookie vs Bearer Token decision tree (07-decision-trees.md)
