# ECC Anti-Patterns — Token Ability Design

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | API & CRUD System Engineering |
| **Subdomain** | API Authentication & Authorization |
| **Knowledge Unit** | Token Ability Design |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Monolithic Single Admin Ability Instead of Granular Permissions
2. Inline String Abilities Without a Centralized Registry
3. Asterisk Used as Wildcard Expecting Expansion
4. Instance-Level Information Encoded in Ability Names
5. Ability-Only Authorization Without Policy Checks

---

## Repository-Wide Anti-Patterns

- Fat Controllers

---

## Anti-Pattern 1: Monolithic Single Admin Ability Instead of Granular Permissions

### Category
Design

### Description
Using a single `admin` ability that grants all operations on all resources, violating the principle of least privilege and making fine-grained access control impossible.

### Why It Happens
It's simpler to create one "admin" token than to manage per-resource abilities. Role-based thinking (admin vs user) is carried over into the token ability system.

### Warning Signs
- `$user->createToken('admin', ['admin'])` — single catch-all ability
- No per-resource abilities defined
- All routes check `tokenCan('admin')` uniformly
- Read-only consumers must get the `admin` ability to access basic endpoints

### Why It Is Harmful
A token with `admin` can read, create, update, and delete every resource. There is no way to grant read-only access or limit a third-party integration to specific resources. A compromised admin token exposes the entire API.

### Real-World Consequences
A CI/CD pipeline needs read-only access to deployment status. The only available ability is `admin`, which also grants write access. The CI token is compromised from logs. The attacker uses the `admin` ability to delete production resources.

### Preferred Alternative
Define per-resource, per-CRUD abilities: `posts:read`, `posts:create`, `posts:update`, `posts:delete`. Grant only the abilities each consumer needs.

### Refactoring Strategy
1. Define granular abilities for each resource and action
2. Create role-to-ability mapping for common patterns
3. Update middleware to check specific abilities per route
4. Migrate existing tokens from monolithic to granular abilities
5. Remove the monolithic `admin` ability after migration

### Detection Checklist
- [ ] Search for ability values — count distinct abilities
- [ ] Check if `admin` ability is the primary authorization mechanism
- [ ] Verify abilities follow `resource:action` format

### Related Rules
- Use Granular Per-CRUD-Operation Abilities (05-rules.md)

### Related Skills
- Design Token Abilities (06-skills.md)

### Related Decision Trees
- Ability Granularity — Per-CRUD vs Monolithic Per-Resource (07-decision-trees.md)

---

## Anti-Pattern 2: Inline String Abilities Without a Centralized Registry

### Category
Maintainability

### Description
Using raw string literals for abilities scattered across the codebase instead of defining them as constants in a dedicated class, causing typos, undetectable errors, and refactoring nightmares.

### Why It Happens
The first ability is written inline. It spreads to other files by copy-paste. No one creates the centralized registry.

### Warning Signs
- `'posts:read'`, `'posts:create'` as raw strings in multiple files
- Hard-to-find typos: `'post:read'` vs `'posts:read'`
- No class like `Abilities::POST_READ` defined anywhere
- IDE refactoring does not catch ability name changes

### Why It Is Harmful
A typo in an ability name creates an undetected 403 error — `tokenCan('post:read')` silently returns false when the token has `posts:read`. Without a centralized registry, developers must grep the entire codebase to discover all abilities.

### Real-World Consequences
A developer types `if ($user->tokenCan('post:read'))` missing the 's'. The check always returns false. The feature appears broken. Debugging takes 2 hours before someone spots the typo. The same bug potentially exists in multiple files.

### Preferred Alternative
Define all abilities as constants in a dedicated class: `class Abilities { const POST_READ = 'posts:read'; }`. Reference as `Abilities::POST_READ`.

### Refactoring Strategy
1. Create `app/Abilities.php` or similar constants class
2. Move all inline ability strings to class constants
3. Replace all inline strings with constant references
4. Add a test that validates all constants are unique and follow naming conventions

### Detection Checklist
- [ ] Search for raw ability strings in route files, controllers, middleware
- [ ] Check if a centralized ability registry exists
- [ ] Search for `tokenCan(` and `createToken(` for inline strings

### Related Rules
- Define Abilities as Class Constants (05-rules.md)

### Related Skills
- Design Token Abilities (06-skills.md)

### Related Decision Trees
- Ability Naming Convention — resource:action vs domain:resource:action (07-decision-trees.md)

---

## Anti-Pattern 3: Asterisk Used as Wildcard Expecting Expansion

### Category
Framework Usage

### Description
Using `'*'` as a token ability expecting Sanctum to expand it as a wildcard matching all abilities, when in fact Sanctum treats `'*'` as a literal string.

### Why It Happens
Developers familiar with OAuth2 scopes or filesystem wildcards expect `*` to match everything. The Sanctum documentation mentions `*` but not its literal behavior.

### Warning Signs
- `$user->createToken('admin', ['*'])` — expecting wildcard
- `$user->tokenCan('posts:read')` returns false despite having `'*'` ability
- Confusion about why the "wildcard" doesn't work
- Custom wildcard workarounds added without documentation

### Why It Is Harmful
Tokens created with `['*']` authenticate but `tokenCan()` returns false for everything. All ability-protected routes return 403. The token appears broken, but the ability system is working as designed — `'*'` is just a literal string.

### Real-World Consequences
A super-admin token is created with `['*']`. Every admin endpoint returns 403. The admin user thinks the application is broken. Debugging traces the issue to `tokenCan('admin:*')` returning false because `'*'` does not match `'admin:*'`.

### Preferred Alternative
List all abilities explicitly for super-admin tokens. If there are many, implement custom middleware with `str_starts_with()` prefix matching.

### Refactoring Strategy
1. Replace `['*']` with explicit ability list
2. For super-admin tokens, consider implementing custom ability middleware
3. Add documentation that Sanctum does not support wildcards
4. Test token abilities explicitly

### Detection Checklist
- [ ] Search for `'*'` in ability arrays
- [ ] Verify `tokenCan()` calls return expected results for `*` tokens
- [ ] Test wildcard expectations match Sanctum's literal behavior

### Related Rules
- Never Use * as a Wildcard (05-rules.md)

### Related Skills
- Design Token Abilities (06-skills.md)

### Related Decision Trees
- (Ability granularity decisions)

---

## Anti-Pattern 4: Instance-Level Information Encoded in Ability Names

### Category
Architecture

### Description
Encoding specific resource instance identifiers in ability names (e.g., `post:123:edit`) instead of using resource-level abilities combined with Policy instance checks.

### Why It Happens
Developers try to solve instance-level authorization within the ability system rather than using Policies. This creates an unbounded set of abilities and violates the separation between feature-gating and instance-gating.

### Warning Signs
- Ability names contain model IDs: `post:123:edit`, `user:456:read`
- New abilities created dynamically per resource instance
- Token ability arrays grow with every resource the user interacts with
- No Policy instance checks — all authorization is via abilities
- Ability count per token exceeds 50

### Why It Is Harmful
Abilities should be resource-level, not instance-level. Encoding instance IDs creates an unbounded ability space, requires token modification every time a user gets access to a new resource, and prevents any meaningful ability auditing.

### Real-World Consequences
A user manages 500 projects. Their token needs 500 abilities like `project:1:read`, `project:2:read`, etc. When they gain access to project 501, the token must be reissued. The ability system is being used as a per-instance ACL, which it is not designed for.

### Preferred Alternative
Use resource-level abilities (e.g., `projects:read`) for feature gating and Policies for instance-level checks (e.g., `$user->can('view', $project)`).

### Refactoring Strategy
1. Remove instance IDs from ability names
2. Implement Policy classes for instance-level authorization
3. Use `$this->authorize()` in controllers for instance checks
4. Migrate existing tokens to remove instance-specific abilities
5. Add tests verifying both ability and policy checks

### Detection Checklist
- [ ] Search for ability names containing numeric IDs or wildcards
- [ ] Check if Policies exist alongside ability checks
- [ ] Verify ability-to-policy separation in authorization flow

### Related Rules
- Check Abilities in Middleware, Policies for Instance Checks (05-rules.md)

### Related Skills
- Design Token Abilities (06-skills.md)
- Policy Design for APIs (06-skills.md)

### Related Decision Trees
- Ability Granularity — Per-CRUD vs Monolithic Per-Resource (07-decision-trees.md)

---

## Anti-Pattern 5: Ability-Only Authorization Without Policy Checks

### Category
Architecture

### Description
Relying solely on token ability checks (`tokenCan()`) for all authorization without implementing Policy-based instance checks, allowing users with the resource-level ability to access any instance of that resource.

### Why It Happens
Ability checks are simpler to implement than Policies. For endpoints where any authenticated user can access any resource, abilities alone seem sufficient. But this assumption breaks when instance-level ownership checks are needed later.

### Warning Signs
- All authorization is through `abilities` middleware or `tokenCan()` checks
- No Policy classes defined for resources
- Users with `posts:read` can read any user's posts
- Ownership checks missing from controllers

### Why It Is Harmful
A user with `posts:read` ability can read every post in the system, including other users' private posts. Ability checks only verify feature access (can you read posts?), not instance access (can you read this specific post?).

### Real-World Consequences
A support agent has `tickets:read` ability to help customers. Without a Policy check, they can read tickets assigned to other support agents — including tickets containing customer PII that they should not see. A privacy violation occurs.

### Preferred Alternative
Use abilities for feature gating (middleware) and Policies for instance gating (controller). Both must pass.

### Refactoring Strategy
1. Implement Policy classes for all resources with instance-level rules
2. Add `$this->authorize('view', $post)` in controller methods
3. Keep `abilities` middleware for feature-level gating
4. Test both authorization layers independently
5. Document the two-layer authorization model

### Detection Checklist
- [ ] Check if Policy classes exist for all resource models
- [ ] Search for `tokenCan(` checks without corresponding `authorize(` calls
- [ ] Verify instance-level checks are present in controller methods

### Related Rules
- Check Abilities in Middleware, Policies for Instance Checks (05-rules.md)

### Related Skills
- Design Token Abilities (06-skills.md)
- Policy Design for APIs (06-skills.md)

### Related Decision Trees
- (Ability vs Policy authorization decisions)

---
