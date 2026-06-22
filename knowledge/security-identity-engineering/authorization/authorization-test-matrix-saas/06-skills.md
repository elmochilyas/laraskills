# Skill: Build SaaS Authorization Test Matrices

## Purpose

Design and implement a combinatorial authorization test matrix for multi-tenant SaaS applications. This skill covers defining role x plan test axes, building Pest datasets for declarative test data, writing cross-team isolation tests, testing subscription degradation states, and enforcing policy method coverage through architecture tests. The output is a complete, maintainable test suite that proves every authorization boundary is correct.

## When To Use

- Every SaaS application with team-scoped roles and subscription plans
- When a new resource type is added (new model + policy)
- When a new role is introduced or role permissions change
- When a new subscription plan is added or plan features change
- When multi-tenant isolation must be proven correct before a security audit
- When CI pipeline needs to block merges that break authorization

## When NOT To Use

- Single-tenant applications without team scoping (standard policy tests suffice)
- Applications without subscription plans (skip the plan axis)
- Application with trivial authorization where everyone can do everything (rare)
- For unit-testing individual Policy methods (covered by standard policy unit tests)

## Prerequisites

- Pest 4 testing framework installed and configured
- Spatie/laravel-permission with team mode enabled
- Laravel Policies defined for all resource types
- Subscription plan model with status tracking (active, past_due, cancelled, expired)
- Team model with user membership tracking
- RefreshDatabase trait available for test isolation

## Inputs

- Role definitions: all active roles in the system (viewer, member, admin, owner)
- Plan definitions: all active subscription plans (free, pro, enterprise) and their feature sets
- Resource types: every model with a Policy class
- Policy methods: `viewAny`, `view`, `create`, `update`, `delete`, `restore`, `forceDelete` (and any custom methods)
- Subscription statuses: active, past_due, cancelled (grace period), cancelled (expired), incomplete
- Factory classes: User factory with role/team states, Team factory with plan states

## Workflow

1. Define shared Pest datasets in `tests/Datasets/Authorization.php`:
   - `dataset('team_roles', ...)` — all team-scoped roles
   - `dataset('subscription_plans', ...)` — all subscription plans
   - `dataset('role_x_plan', ...)` — computed cross-product of roles x plans
   - `dataset('subscription_statuses', ...)` — all possible subscription statuses
2. For each resource type (Document, Report, Invoice, etc.), create `tests/Feature/Authorization/{Resource}PolicyMatrixTest.php`
3. In each matrix test file, test every axis for every protected action:
   - **Axis 1 — User not in team**: Outsider cannot access any team resources (403)
   - **Axis 2 — Role matrix**: Every role x plan combination tested for each action
   - **Axis 3 — Right-role-wrong-plan**: Admin on free plan cannot access premium features
   - **Axis 4 — Right-plan-wrong-role**: Viewer on enterprise plan cannot perform admin actions
4. Create `tests/Feature/Authorization/CrossTeamIsolationTest.php`:
   - User in Team A cannot view, create, update, or delete resources in Team B
   - Use different users in each team — never add the same user to both teams
   - Test Insecure Direct Object Reference (IDOR): user A gets team B's resource ID directly
5. Create `tests/Feature/Authorization/SubscriptionDegradationTest.php`:
   - Test each protected action for every subscription status
   - Active: normal access based on role + plan
   - Past due: read retained, write retained initially, may degrade
   - Cancelled (grace period): read retained, write denied
   - Cancelled (expired): all access denied or redirect to billing
   - Expired: all access denied
   - Incomplete: no access until payment completes
6. Create `tests/Feature/Authorization/PlatformAdminTest.php`:
   - Platform admin can access any team's resources for support purposes
   - Platform admin does NOT inherit team-specific roles
   - Platform admin actions are audited separately
7. Create `tests/Architect/PolicyCoverageTest.php`:
   - Verify every Policy class in `App\Policies` has `viewAny`, `view`, `create`, `update`, `delete` methods
   - Verify no policy uses blanket `return true` for all methods
   - Verify authorization test files exist for each Policy class
8. Configure factory methods for test setup efficiency:
   - `User::factory()->withRole('admin')->forTeam($team)->create()`
   - `Team::factory()->withPlan('enterprise', status: 'active')->create()`
   - `Document::factory()->for($team)->for($user)->create()`
9. Add the authorization test suite to CI with parallel execution enabled

## Validation Checklist

- [ ] For each resource type, all 7 standard Policy methods have test coverage
- [ ] User-not-in-team axis tested for every protected action
- [ ] Viewer role tested for every action (can read, cannot write/delete)
- [ ] Member role tested for every action (can read/write own, cannot admin)
- [ ] Admin role tested for every action (can read/write/manage, except billing/team deletion)
- [ ] Owner role tested for every action (full access including billing and team deletion)
- [ ] Right-role-wrong-plan tested (admin on free plan cannot access premium features)
- [ ] Right-plan-wrong-role tested (enterprise plan but viewer role cannot perform admin actions)
- [ ] Platform admin bypass tested (can access any team for support)
- [ ] Cross-team isolation tested (team A user cannot access team B resources)
- [ ] Expired subscription degradation tested (read retained, write denied)
- [ ] Cancelled subscription degradation tested (grace period access)
- [ ] Architecture tests verify every Policy class has test coverage for each method
- [ ] All authorization failures return 403 (or 404 to not leak existence)

## Common Failures

- Testing only the happy path (owner + enterprise plan) — 1 combination tested, 11 untested
- Forgetting cross-team isolation — testing within a single team only; cross-team access silently succeeds
- Not testing right-role-wrong-plan — admin on free plan accesses premium features despite plan restrictions
- Not testing right-plan-wrong-role — viewer on enterprise plan can administer the team
- Assuming admin = super-admin — using admin role in tests as a catch-all; platform admin bypass not verified
- Not testing expired subscription — only testing active subscriptions; cancelled users retain full access
- Cross-team test with the same user in both teams — false positive; the user legitimately has access via membership
- Hardcoding role names and plan names across multiple test files — maintenance nightmare when roles/plans change

## Decision Points

- Test coverage depth: full matrix (every role x plan x action) vs targeted sampling?
- Pest datasets vs manual test cases: when do datasets add value vs when are explicit tests clearer?
- Dedicated test suite vs inline with feature tests: should authorization tests run separately in CI?
- Subscription degradation: read-only mode, redirect to billing, or hard 403?
- Cross-team denial: 403 Forbidden (reveals resource exists) or 404 Not Found (hides existence)?

## Performance Considerations

- Authorization tests are database-heavy — use `RefreshDatabase` to keep each test under 50ms via transaction rollback
- Factory states for role and plan setup reduce test setup boilerplate: `User::factory()->withRole('admin')->forTeam($team)->create()`
- Parallel testing is safe because each test creates its own isolated data — enable `--parallel` in CI
- Consider a dedicated `AuthorizationTest` test suite in `phpunit.xml` for targeted execution during development
- Large matrices (6 roles x 4 plans x 8 resource types x 6 actions = 1,152 tests) may need test splitting across parallel processes

## Security Considerations

- Test credentials must be fake — use factories exclusively, never real credentials
- Never use real Stripe/Payment API calls in authorization tests — mock or fake the billing service
- Assert HTTP status codes (200, 403, 404) — never assert sensitive data in error messages
- Cross-team isolation tests must verify 403 or 404 responses, never 200 with wrong data
- Authorization failure messages must not leak resource existence: prefer 404 over 403 for IDOR tests

## Related Rules (from 05-rules.md)

- Rule 1: Test Every Role x Plan Combination for Every Protected Action
- Rule 2: Test Cross-Team Isolation Explicitly and Separately
- Rule 3: Test Subscription Degradation States (Expired, Cancelled, Past Due)
- Rule 4: Use Pest Datasets for Declarative Matrix Definitions
- Rule 5: Test Right-Role-Wrong-Plan and Right-Plan-Wrong-Role as Separate Test Cases

## Related Skills

- Choose Test Coverage Depth for Authorization Matrix (07-decision-trees.md)
- Choose Pest Datasets vs Manual Tests (07-decision-trees.md)
- Implement Team-Scoped Spatie Permission in SaaS (team-spatie-permission-depth/06-skills.md)
- Write Laravel Policies & Gates (laravel-authentication skill)

## Success Criteria

- Every role x plan combination yields the correct HTTP status code for every protected action
- Cross-team isolation cannot be bypassed by URL manipulation, IDOR, or direct API calls
- Subscription degradation correctly handles every plan status with appropriate access levels
- New roles or plans added to the dataset automatically propagate to all matrix tests
- CI pipeline blocks merges that introduce authorization regressions
