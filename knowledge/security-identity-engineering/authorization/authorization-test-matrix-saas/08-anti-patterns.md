# Anti-Patterns: SaaS Authorization Test Matrix

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authorization |
| Knowledge Unit | SaaS Authorization Test Matrix for Roles and Entitlements |
| Audience | Developers, QA Engineers, Security Engineers |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-ATM-01 | One-Test-Fits-All | Critical | High | Medium |
| AP-ATM-02 | Skipping Cross-Team Isolation | Critical | High | Medium |
| AP-ATM-03 | Hardcoded Role Names in Every Test | High | High | Medium |
| AP-ATM-04 | Testing Roles Without Plan Context | High | Medium | Medium |
| AP-ATM-05 | Testing Plan Without Role Context | High | Medium | Medium |
| AP-ATM-06 | Cross-Team Test with Same User in Both Teams | Critical | Medium | Low |

---

## Repository-Wide Anti-Patterns

- **Happy-path-only testing culture**: Tests exist only for the ideal case (owner + enterprise plan). All other combinations are "assumed to work." Authorization bugs accumulate silently.
- **No shared datasets**: Every test file hardcodes its own role and plan lists. Adding a new role requires searching and updating every test file individually.
- **Authorization tests mixed with feature tests**: Authorization tests are scattered across feature test files, making it impossible to run them as a dedicated suite or audit coverage.

---

## 1. One-Test-Fits-All

### Category
Testing · Coverage

### Description
Writing a single authorization test that creates an owner user on the enterprise plan and asserts they can "do everything" — read, create, update, delete, and manage. This tests 1 of 12+ role x plan combinations and proves nothing about the other 11. All other roles, plans, and user states are untested.

### Why It Happens
The happy path is the easiest to write and the most intuitive to test. "If the owner can do it, the system works." There's pressure to ship features quickly, and authorization testing feels like overhead. The developer writes the one obvious test, sees it pass, and moves on — reasoning that the Policy class "looks correct" for other roles.

### Warning Signs
- Authorization test file has exactly one test: "owner can manage resources"
- No tests for viewer, member, or admin roles
- No tests for free or cancelled plan states
- No cross-team tests exist anywhere in the test suite
- Policy class has methods for `viewAny`, `view`, `create`, `update`, `delete` but only `delete` is tested

### Why Harmful
Authorization bugs are silent — no exceptions, no error logs, no visible failures. A viewer on a free plan who can delete documents simply clicks "delete" and it works. The bug exists in production until discovered by a curious user, a security audit, or a data loss incident. The single happy-path test provides false confidence that authorization is correct when 90%+ of the combinations are untested.

### Real-World Consequences
- Viewer on free plan deletes all team documents — no test caught this because only owner was tested
- Admin on cancelled subscription still manages the team — no degradation test existed
- Security audit finds 47 untested authorization combinations — compliance failure
- Data loss incident traced to an authorization bug in an untested role x plan combination

### Preferred Alternative
Use Pest datasets to define all role x plan combinations. Test every combination for every protected action. The happy path (owner + enterprise) is one of many combinations, not the only one.

### Refactoring Strategy
1. Audit every Policy class — list all untested methods and combinations
2. Create shared Pest datasets for roles, plans, and role_x_plan cross-product
3. For each resource type, create a matrix test file with `->with('role_x_plan')` for each action
4. Add explicit boundary tests: right-role-wrong-plan, right-plan-wrong-role
5. Set CI to block merges that don't include corresponding matrix tests for new Policies

### Detection Checklist
- [ ] Does each Policy have tests for more than just the owner role?
- [ ] Are viewer, member, and admin roles tested for at least create/update/delete actions?
- [ ] Are all subscription plans represented in the test matrix?
- [ ] Is the single-test pattern present in any Policy test file?
- [ ] Can CI detect when a new Policy is added without a corresponding matrix test file?

### Related Rules/Skills/Trees
- Rule 1 (05-rules.md): Test Every Role x Plan Combination for Every Protected Action
- Rule 5 (05-rules.md): Test Right-Role-Wrong-Plan and Right-Plan-Wrong-Role as Separate Test Cases
- Full Matrix vs Targeted Sampling decision tree (07-decision-trees.md)
- Build SaaS Authorization Test Matrices (06-skills.md)

---

## 2. Skipping Cross-Team Isolation

### Category
Security · Multi-Tenant Testing

### Description
Authorization tests verify role and plan access within a single team but never test that a user in Team A cannot access Team B's resources. The test suite proves intra-team authorization works correctly but provides zero evidence that inter-team isolation is enforced.

### Why It Happens
Cross-team tests require creating two teams, two users, and resources in each team — more setup than single-team tests. The Policy class has `$document->team_id === getPermissionsTeamId()` checks, so it "should work." Developers trust the code they wrote without verifying it works in practice. Cross-team isolation is assumed from the Policy logic rather than proven by tests.

### Warning Signs
- No test file named `CrossTeamIsolationTest.php` or similar
- All authorization tests use a single team
- Tests that verify "user cannot access document" use a document owned by a different user within the same team
- No tests attempt to access resources using a different team's ID in the URL
- No IDOR (Insecure Direct Object Reference) tests exist

### Why Harmful
Cross-team data access is the most dangerous authorization bug in multi-tenant SaaS. If a user in Team A can access Team B's data by manipulating resource IDs or team IDs, this is a direct data breach. The Policy code may look correct — `$document->team_id === getPermissionsTeamId()` — but if `getPermissionsTeamId()` returns the wrong value (stale context, middleware bug) or is never called, the check silently passes. Only cross-team tests can catch this.

### Real-World Consequences
- User in Team A reads Team B's invoices by guessing invoice IDs
- User in Team A accesses Team B's customer list via API endpoint that doesn't validate team membership
- Data breach reported by a customer who found another team's data in their dashboard
- GDPR violation: personal data from Team B exposed to Team A users
- Security audit finds no cross-team isolation tests — immediate compliance failure

### Preferred Alternative
Create a dedicated `CrossTeamIsolationTest.php` file. For each resource type, verify that a user in Team A cannot view, create, update, or delete resources in Team B. Test both team-scoped URLs (`/teams/{teamB}/documents/{id}`) and direct ID access (`/documents/{id}`) to catch IDOR vulnerabilities. Never add the same user to both teams for isolation testing.

### Refactoring Strategy
1. Create `tests/Feature/Authorization/CrossTeamIsolationTest.php`
2. For each resource type, add tests: view, list, create, update, delete across team boundaries
3. Test IDOR: access Team B's resource by ID directly without going through Team B's URL prefix
4. Verify responses are 403 (or 404 to not leak existence) — never 200
5. Add cross-team tests for API endpoints, file downloads, exports, and any other resource access paths

### Detection Checklist
- [ ] Is there a dedicated cross-team isolation test file?
- [ ] Does every resource type have cross-team access tests?
- [ ] Are IDOR attacks tested (direct resource ID access without team context)?
- [ ] Are cross-team tests using different users in each team (not the same user in both)?
- [ ] Do cross-team tests verify 403/404 responses, not 200?

### Related Rules/Skills/Trees
- Rule 2 (05-rules.md): Test Cross-Team Isolation Explicitly and Separately
- Build SaaS Authorization Test Matrices (06-skills.md)

---

## 3. Hardcoded Role Names in Every Test

### Category
Maintainability · Testing

### Description
Hardcoding role names and plan names across multiple test files instead of using shared Pest datasets and factory methods. `['viewer', 'member', 'admin', 'owner']` appears in 8 test files. `['free', 'pro', 'enterprise']` appears in 6 test files. When a new role ("contributor") is added, every test file must be manually updated — inevitably, some are missed.

### Why It Happens
At the start, there are only 3 roles and 2 plans — hardcoding is faster than setting up datasets. As the system grows, roles and plans are added, but the test code is never refactored to use datasets. The pattern persists because "it works" and refactoring tests feels low-priority compared to feature development.

### Warning Signs
- Array of roles `['viewer', 'member', 'admin', 'owner']` appears in multiple test files
- Array of plans `['free', 'pro', 'enterprise']` appears in multiple test files
- No `tests/Datasets/Authorization.php` file exists
- New role added 3 sprints ago — only 3 of 8 test files include it in their role arrays
- Adding a new plan requires searching the entire test suite for plan arrays

### Why Harmful
The test matrix silently goes stale. A new role is added, but 5 of 8 test files don't include it — the new role has no authorization test coverage for those resources. A new plan is added, but the subscription degradation tests don't include it — the new plan's degradation behavior is untested. The maintenance burden grows with each new role or plan, and eventually the team stops adding authorization tests entirely because "it's too much work to update everything."

### Real-World Consequences
- New "contributor" role deployed without authorization tests for 5 of 8 resource types
- Authorization regression: contributor can delete resources because the delete test only checks "admin and owner"
- New "business" plan launched without any subscription degradation test coverage
- Team avoids adding new roles because updating test files is painful — authorization model stagnates

### Preferred Alternative
Define shared datasets in `tests/Datasets/Authorization.php`. Use Pest's `dataset()` with named entries. Import datasets in test files via `->with('role_x_plan')`. Adding a new role updates one dataset file, and all matrix tests automatically include the new role. Use factory methods (`User::factory()->withRole('admin')`) instead of direct state manipulation.

### Refactoring Strategy
1. Create `tests/Datasets/Authorization.php` with datasets for roles, plans, statuses, and role_x_plan
2. Search for hardcoded role and plan arrays across all test files
3. Replace each with the corresponding dataset import and `->with()` usage
4. Add factory methods: `User::factory()->withRole()`, `Team::factory()->withPlan()`
5. Add a CI check (or architecture test) that verifies no test file hardcodes role or plan arrays

### Detection Checklist
- [ ] Is there a `tests/Datasets/Authorization.php` file with shared datasets?
- [ ] Do any test files contain hardcoded arrays of roles or plans?
- [ ] Are factory methods used for role and plan setup?
- [ ] Would adding a new role update one file or multiple files?
- [ ] Can CI detect hardcoded role arrays in test files?

### Related Rules/Skills/Trees
- Rule 4 (05-rules.md): Use Pest Datasets for Declarative Matrix Definitions
- Pest Datasets vs Manual Tests decision tree (07-decision-trees.md)
- Build SaaS Authorization Test Matrices (06-skills.md)

---

## 4. Testing Roles Without Plan Context

### Category
Testing · Coverage

### Description
Authorization tests that check role-based access (`$user->can('delete', $resource)`) without setting the team's subscription plan. The plan check in the application code is silently skipped because the plan context is not established in the test. The test passes because the role check grants access, but in production, a plan check would also run — and could deny access.

### Why It Happens
The test is written to verify the Policy logic. The plan check lives in the Action/Controller layer (or a middleware), not in the Policy. The test author correctly isolates the Policy but forgets that the full authorization flow includes plan checks that the Policy doesn't see. The authorization matrix is incomplete because it misses the integration point between role checks and plan checks.

### Warning Signs
- Tests use `$user->can('delete', $document)` directly instead of making HTTP requests
- Team factory doesn't include a `withPlan()` call
- Tests pass for actions that should be denied on the free plan
- No test file tests the interaction between role-based Policy checks and plan-based Entitlement checks
- Policy tests and Controller tests are completely separate with no overlap

### Why Harmful
Tests give false confidence. The Policy returns `true` for admin+delete, so the test passes. But in production, the Controller also checks `$entitlement->allows('advanced-delete', $team)` — and that check fails for free plan teams. The admin on free plan can delete in production because the plan check was never tested. The bug is a missing integration test, not a logic error — which makes it hard to find.

### Real-World Consequences
- Admin on free plan deletes documents — Policy test passed, but plan check was never tested
- New feature gated behind "pro plan" is accessible to all users because the plan check wasn't included in authorization tests
- QA reports "this feature works on staging" (where all test teams are on enterprise plan) but fails in production for real free-plan customers
- Regression: plan check refactored out of the Controller; only Policy tests exist, and they don't catch the regression

### Preferred Alternative
Test authorization at the HTTP layer (feature tests making actual requests) rather than (or in addition to) unit-testing Policy methods directly. The HTTP test exercises the full middleware chain, including plan checks in the Controller/Action. When unit-testing Policies, also test the integration by making HTTP requests with the plan set explicitly.

### Refactoring Strategy
1. Identify Policy tests that don't include plan setup
2. For each, add an HTTP-level test that exercises the full authorization chain
3. Ensure Team factory includes `->withPlan()` in authorization test setup
4. Create dedicated integration tests: right-role-wrong-plan, right-plan-wrong-role
5. Add a CI check: every authorization test file must reference a plan

### Detection Checklist
- [ ] Do authorization tests set the team's subscription plan?
- [ ] Are there HTTP-level tests that exercise the full authorization middleware?
- [ ] Are right-role-wrong-plan and right-plan-wrong-role tested explicitly?
- [ ] Would removing the plan check from a Controller be caught by a test?
- [ ] Do all test teams have an explicit plan assignment?

### Related Rules/Skills/Trees
- Rule 5 (05-rules.md): Test Right-Role-Wrong-Plan and Right-Plan-Wrong-Role as Separate Test Cases
- Build SaaS Authorization Test Matrices (06-skills.md)

---

## 5. Testing Plan Without Role Context

### Category
Testing · Coverage

### Description
Authorization tests that verify enterprise plan users can access premium features, but always using an owner user. The test proves the plan check works for an owner — it doesn't prove that a viewer on the enterprise plan still can't perform admin actions. The role check is never tested because the owner role always passes.

### Why It Happens
The test is focused on the plan axis. The developer creates an owner user (the most permissive role) and verifies the enterprise plan grants access. The test name is "enterprise plan allows premium feature access" — it's written to test the plan, not the role. The role check is assumed to work because it's tested elsewhere, but the intersection of "right plan + wrong role" is never explicitly tested.

### Warning Signs
- Plan-related tests always use the owner role or admin role
- No test verifies that "viewer on enterprise plan cannot delete" or "member on enterprise plan cannot manage billing"
- The plan test file (`SubscriptionDegradationTest.php`) doesn't vary the user's role
- Test names mention plans but not roles: "enterprise user can export reports" (which user role?)

### Why Harmful
A viewer on the enterprise plan should not be able to perform admin actions just because the team is on a high-tier plan. Role trumps plan for destructive and administrative actions. If the plan check is erroneously coded to grant elevated access (e.g., `if ($plan === 'enterprise') return true`), the viewer gains admin capabilities — and no test catches it because the plan tests only use owner users.

### Real-World Consequences
- Viewer on enterprise plan deletes team resources through a plan check that doesn't verify role
- New billing admin feature uses `$plan->allows('manage-billing')` without checking `$user->hasRole('owner')`
- Enterprise plan customers report that "any team member can manage billing settings" — security vulnerability
- Plan upgrade grants implicit admin access to all team members — privilege escalation

### Preferred Alternative
For every plan-based access test, vary the user's role. Test that enterprise plan grants access only when combined with the appropriate role. Test that enterprise plan does NOT grant access when combined with a lower role. Use the full role x plan matrix with conditionals to verify both axes.

### Refactoring Strategy
1. Audit plan-related tests — for each, check if the user's role is varied
2. Add tests for "right plan, wrong role" explicitly
3. In the matrix test, use conditionals based on role within each plan
4. Ensure subscription degradation tests also vary the user's role
5. Add test: "viewer on enterprise plan still gets 403 for admin-only actions"

### Detection Checklist
- [ ] Do plan-related tests use more than one role?
- [ ] Is there a test for "viewer on enterprise plan cannot perform admin actions"?
- [ ] Is there a test for "member on enterprise plan cannot manage billing"?
- [ ] Do subscription degradation tests vary the user's role?
- [ ] Would a plan check that ignores role be caught by any test?

### Related Rules/Skills/Trees
- Rule 5 (05-rules.md): Test Right-Role-Wrong-Plan and Right-Plan-Wrong-Role as Separate Test Cases
- Build SaaS Authorization Test Matrices (06-skills.md)

---

## 6. Cross-Team Test with Same User in Both Teams

### Category
Testing · Security

### Description
Testing cross-team isolation by adding the same user to both Team A and Team B, then verifying they can access Team B's resources. The test passes (access granted) because the user legitimately has access via their Team B membership — not because isolation is properly enforced. This creates a false positive that cross-team isolation works when it doesn't.

### Why It Happens
It's the simplest way to set up a cross-team test: create one user, add them to both teams, test access. The developer doesn't think through the implication — the user has legitimate access to both teams, so of course they can access Team B's data. The test proves nothing about isolation between teams for users who belong to only one team.

### Warning Signs
- Cross-team test creates one user and adds them to both teams
- Test assertion is `$response->assertOk()` — the user should have access because they belong to both teams
- The test would fail if the user were removed from Team B
- No test uses two separate users (User A in Team A only, User B in Team B only)
- The test name says "cross-team isolation" but the setup gives the user access to both teams

### Why Harmful
The test proves nothing. Cross-team isolation is not verified. A user who belongs only to Team A might be able to access Team B's resources through an authorization bug, and the "isolation" test passes because it tested with a user who legitimately belongs to both teams. The false positive is worse than no test at all because it creates misplaced confidence.

### Real-World Consequences
- Cross-team isolation bug exists in production for 6 months, but "the tests pass"
- Security audit finds the isolation test is a false positive — all cross-team isolation must be re-tested
- User in Team A accesses Team B data via a bug that the test never exercised
- Compliance failure: SOC2 audit questions the validity of isolation tests

### Preferred Alternative
Always use separate users for isolation testing. User A belongs only to Team A. User B belongs only to Team B. User A attempts to access Team B resources → must receive 403 Forbidden. User B attempts to access Team A resources → must receive 403 Forbidden. The test setup explicitly proves that cross-team access is denied for non-members.

### Refactoring Strategy
1. Audit every cross-team test — verify the test user does NOT belong to the target team
2. For any test where the user belongs to both teams, rewrite with separate users
3. Add explicit assertion: the test user's team memberships do not include the target team
4. Test the IDOR scenario: user A directly accesses Team B's resource by ID
5. Add a CI architecture test that detects cross-team tests with shared user membership

### Detection Checklist
- [ ] Do cross-team isolation tests use separate users in separate teams?
- [ ] Does any cross-team test add the same user to both teams?
- [ ] Are there assertions verifying the test user does NOT belong to the target team?
- [ ] Is the IDOR scenario tested (direct resource ID access without team context)?
- [ ] Would removing the test user from the target team cause the test to fail (should pass)?

### Related Rules/Skills/Trees
- Rule 2 (05-rules.md): Test Cross-Team Isolation Explicitly and Separately
- Build SaaS Authorization Test Matrices (06-skills.md)
