# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Authorization
**Knowledge Unit:** SaaS Authorization Test Matrix for Roles and Entitlements
**Generated:** 2026-06-22

# Quick Checklist (10-20 derived items)
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

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Test file organization**: `tests/Feature/Authorization/{Resource}PolicyMatrixTest.php` per resource
- **Dataset organization**: `tests/Datasets/Authorization.php` for shared role x plan combinations
- **Cross-team tests**: `tests/Feature/Authorization/CrossTeamIsolationTest.php`
- **Subscription tests**: `tests/Feature/Authorization/SubscriptionDegradationTest.php`
- **Architecture tests**: `tests/Architect/PolicyCoverageTest.php`
- **Test isolation**: Each test creates its own team, user, role, plan, resource

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Pest datasets defined for `team_roles`, `subscription_plans`, `role_x_plan`
- [ ] `{Resource}PolicyMatrixTest.php` for each Policy class (e.g., `DocumentPolicyMatrixTest.php`)
- [ ] Each matrix test uses `->with('role_x_plan')` to test all role x plan combinations
- [ ] Cross-team tests create two separate teams with different users (not same user in both)
- [ ] Subscription degradation tests cover: active, past_due, cancelled (grace), cancelled (expired), incomplete
- [ ] Architecture tests verify `toHaveMethods` for all Policy classes
- [ ] Factory methods: `User::factory()->withRole('admin')->forTeam($team)->create()`
- [ ] Factory methods: `Team::factory()->withPlan('enterprise', status: 'active')->create()`

# Performance Checklist
- Authorization tests are database-heavy — `RefreshDatabase` keeps each test under 50ms
- Factory states for role and plan setup reduce test setup boilerplate
- Parallel testing safe because each test creates isolated data
- Consider dedicated `AuthorizationTest` test suite for targeted CI execution

# Security Checklist
- [ ] Test credentials are fake — factory data only, never real credentials
- [ ] No real Stripe/Payment API calls in authorization tests — mock or fake the billing service
- [ ] Assert HTTP status codes (200, 403, 404), never assert sensitive data in error messages
- [ ] Cross-team isolation tests verify 403 or 404 (not 200 with wrong data)

# Reliability Checklist
- [ ] Matrix tests verify both allowed (200/201/204) and denied (403) responses
- [ ] Cross-team tests verify no data leakage between teams
- [ ] Subscription degradation tests verify correct behavior for each status
- [ ] Platform admin tests verify global access without team membership
- [ ] Architecture tests catch new policy methods without corresponding tests

# Testing Checklist
- [ ] Every Policy method has at least one "can" and one "cannot" test
- [ ] User-not-in-team: 403 for every protected action
- [ ] Viewer: can read, cannot create/update/delete
- [ ] Member: can read/create/update own, cannot delete others'
- [ ] Admin: can read/create/update/delete within team
- [ ] Owner: full access within team, including billing and team management
- [ ] Right-role-wrong-plan: admin on free plan cannot access premium features
- [ ] Right-plan-wrong-role: viewer on enterprise cannot perform admin actions
- [ ] Cross-team: user in Team A cannot access/see Team B resources by any means
- [ ] Expired subscription: read retained, write denied
- [ ] Cancelled subscription: grace period access, post-grace denied
- [ ] Platform admin: can access any team's resources for support

# Maintainability Checklist
- [ ] Datasets are single source of truth — adding a role updates one file
- [ ] Test file naming convention: `{Resource}PolicyMatrixTest.php`
- [ ] Factory methods encapsulate role and plan setup (`withRole()`, `withPlan()`)
- [ ] Architecture tests run in CI to enforce coverage on new policies

# Anti-Pattern Prevention Checklist
- [ ] Prevent: One-test-fits-all (single test with owner+enterprise proves nothing)
- [ ] Prevent: Hardcoded role names in every test (use datasets and factory methods)
- [ ] Prevent: Testing roles without plan context (plan check silently skipped)
- [ ] Prevent: Testing plan without role context (owner always passes)
- [ ] Prevent: Cross-team test with same user in both teams (false positive for isolation)

# Production Readiness Checklist
- [ ] Authorization matrix tests pass for all resource types
- [ ] Cross-team isolation tests pass for all resource types
- [ ] Subscription degradation tests pass for all plan statuses
- [ ] Architecture tests enforce policy method coverage
- [ ] All authorization failure modes return correct status codes
- [ ] Test suite runs reliably in CI (no flaky authorization tests)

# Final Approval Checklist
- [ ] Architecture review completed (test organization, dataset design)
- [ ] Security review completed (coverage of all axes, isolation verification)
- [ ] Performance impact assessed (parallel testing, test suite execution time)
- [ ] Testing coverage adequate (matrix, isolation, degradation, architecture)
- [ ] Anti-patterns reviewed and prevented
- [ ] Production readiness confirmed

# Related Rules/Skills/Trees/Anti-Patterns
## Rules
- Test Every Role x Plan Combination for Every Protected Action
- Test Cross-Team Isolation Explicitly and Separately
- Test Subscription Degradation States (Expired, Cancelled, Past Due)
- Use Pest Datasets for Declarative Matrix Definitions
- Test Right-Role-Wrong-Plan and Right-Plan-Wrong-Role as Separate Test Cases
## Anti-Patterns
- One-test-fits-all
- Hardcoded role names in every test
- Testing roles without plan context
- Testing plan without role context
- Cross-team test with same user in both teams
