# Rules — SaaS Authorization Test Matrix for Roles and Entitlements

## Rule 1: Test Every Role x Plan Combination for Every Protected Action
| Field | Value |
|-------|-------|
| **Name** | Test Every Role x Plan Combination for Every Protected Action |
| **Category** | Testing — Coverage |
| **Rule** | For every protected action (view, create, update, delete, export, manage), test every role (viewer, member, admin, owner) crossed with every plan (free, pro, enterprise). Use Pest datasets to define the matrix declaratively. Testing "owner on enterprise plan can do everything" is insufficient — the dangerous bugs are in the combinations you didn't test. |
| **Reason** | Authorization bugs are combinatorial by nature. A viewer on an enterprise plan should not be able to delete resources just because the plan is high-tier — role trumps plan for destructive actions. An admin on a free plan should not be able to access premium features just because they have the admin role — plan trumps role for features. Testing only the happy path leaves all other intersections untested. SaaS authorization bugs are silent — no exceptions, no error logs — the user simply sees content they shouldn't or gets denied access they should have. |
| **Bad Example** | A single test: "owner can delete document" — tests only 1 of 12 role x plan combinations. The other 11 are untested. |
| **Good Example** | Pest dataset with all role x plan combinations, applied to each action via `->with('role_x_plan')`. Each combination asserts the correct HTTP status code (200, 201, 204, or 403) based on the expected behavior for that role and plan. |
| **Exceptions** | Applications with only one role or one plan — standard policy tests suffice. Also, read-only endpoints where every authenticated team member can view — the plan axis may be unnecessary for view actions (but should still be tested for the edge case of expired/cancelled subscriptions). |
| **Consequences Of Violation** | A viewer on the enterprise plan can delete team resources — direct authorization bypass. An admin on the free plan can access premium features without paying. These bugs exist silently until discovered by a curious user or a security audit. Revenue impact from unauthorized feature access. |

## Rule 2: Test Cross-Team Isolation Explicitly and Separately
| Field | Value |
|-------|-------|
| **Name** | Test Cross-Team Isolation Explicitly and Separately |
| **Category** | Security — Multi-Tenant Testing |
| **Rule** | Dedicate a separate test file (`CrossTeamIsolationTest.php`) to cross-team isolation tests. For each resource type, test: user in Team A cannot view, create, update, or delete resources in Team B. Use a different user in each team — do not add the same user to both teams for isolation testing. |
| **Reason** | Cross-team data access is the most dangerous class of authorization bug in multi-tenant SaaS applications. If a user in Team A can access Team B's data by manipulating resource IDs, this is a direct data breach. Adding the same user to both teams for testing creates a false positive — the test passes because the user legitimately has access via Team B membership, not because isolation is properly enforced. |
| **Bad Example** | Adding User 1 to both Team A and Team B, then testing if User 1 can access Team B's resources. The test passes (access granted) but isolation is not proven. |
| **Good Example** | User A belongs only to Team A. User B belongs only to Team B. User A attempts to access Team B resources — must receive 403 Forbidden. Also test via IDOR: User A getting Team B's document ID directly without going through the team-scoped URL. |
| **Exceptions** | Platform admin and support users who are expected to have cross-team access — test these separately with explicit assertions that cross-team access is allowed only for these global roles. |
| **Consequences Of Violation** | Data breach through cross-team resource access. User in Team A reads Team B's documents, invoices, and customer data by guessing or enumerating resource IDs. This is a P0 security vulnerability that can lead to regulatory penalties (GDPR, SOC2) and customer trust loss. |

## Rule 3: Test Subscription Degradation States (Expired, Cancelled, Past Due)
| Field | Value |
|-------|-------|
| **Name** | Test Subscription Degradation States (Expired, Cancelled, Past Due) |
| **Category** | Testing — Coverage |
| **Rule** | Test every protected action for all subscription statuses: `active`, `past_due`, `cancelled` (during grace period), `cancelled` (after grace period), `expired`, and `incomplete`. The expected behavior changes per status — read access is usually retained during grace periods, write access is usually denied. Never assume a cancelled subscription behaves the same as an active one. |
| **Reason** | Subscription degradation is a business-critical authorization concern. A cancelled enterprise customer should retain read access during their 30-day grace period but lose write access. An expired subscription should deny all access (or redirect to the billing page). Testing only active subscriptions means you never verify the degradation behavior works — and it's the degradation states where most bugs hide because they're rarely exercised in development. |
| **Bad Example** | Only testing with `status = 'active'` subscriptions. The cancelled and expired paths are untested. |
| **Good Example** | A dedicated test file or `describe()` block for subscription degradation. Each subscription status is tested against create, read, update, and delete actions to verify the correct degradation behavior: read retained during grace, write denied, all denied after expiry. |
| **Exceptions** | Applications without subscription plans (single-tier). Applications where subscription status changes don't affect feature access (e.g., all plans include the same features). |
| **Consequences Of Violation** | Cancelled customers retain full write access during and after their cancellation period — effectively free access to paid features. Expired subscriptions still grant premium features. Past-due customers not limited to read-only mode. Revenue leakage from incorrect degradation logic. |

## Rule 4: Use Pest Datasets for Declarative Matrix Definitions
| Field | Value |
|-------|-------|
| **Name** | Use Pest Datasets for Declarative Matrix Definitions |
| **Category** | Testing — Maintainability |
| **Rule** | Define role x plan datasets in a shared `tests/Datasets/Authorization.php` file using Pest's `dataset()` function. Import these datasets in test files. Never hardcode role names or plan names across multiple test files — when a new role or plan is added, update the dataset in one place and all matrix tests automatically cover the new combination. |
| **Reason** | Hardcoded role names scattered across 50 test files create a maintenance nightmare. When a new role ("contributor") is added, each test file must be manually updated — inevitably, some are missed. A centralized dataset is the single source of truth. Adding a new role is one line in the dataset, and all matrix-based tests automatically include the new role in their permutations. |
| **Bad Example** | Each test file repeating role and plan arrays: `['viewer', 'member', 'admin', 'owner']` and `['free', 'pro', 'enterprise']`. Six months later, a new "contributor" role is added — must update 20 test files. |
| **Good Example** | ```php
// tests/Datasets/Authorization.php
dataset('team_roles', [['viewer'], ['member'], ['admin'], ['owner']]);
dataset('subscription_plans', [['free'], ['pro'], ['enterprise']]);
dataset('role_x_plan', /* computed from roles x plans */);

// In test files
test('matrix test', function ($role, $plan) { ... })->with('role_x_plan');
``` |
| **Exceptions** | When some roles or plans have intentionally different behavior that doesn't fit the matrix pattern (e.g., a "billing-only" role that can only access billing pages). These should still reference the dataset but have specific assertions. |
| **Consequences Of Violation** | New roles or plans deployed without corresponding authorization tests. Authorization regression bugs introduced because the test matrix is stale. Maintenance burden grows linearly with each new role/plan addition. Team avoids adding new roles because testing is too painful. |

## Rule 5: Test Right-Role-Wrong-Plan and Right-Plan-Wrong-Role as Separate Test Cases
| Field | Value |
|-------|-------|
| **Name** | Test Right-Role-Wrong-Plan and Right-Plan-Wrong-Role as Separate Test Cases |
| **Category** | Testing — Coverage |
| **Rule** | In addition to the full matrix, add explicit test cases for the two most commonly missed intersections: (1) a user with the right role (admin) but on the wrong plan (free) trying to access a premium feature, and (2) a user with the right plan (enterprise) but the wrong role (viewer) trying to perform an admin action. These tests verify that the authorization logic doesn't confuse role-based and plan-based access. |
| **Reason** | The matrix tests exercise all combinations systematically, but the most dangerous bugs are at the intersection boundaries. An admin on the free plan who can access premium features indicates the plan check is missing or bypassed. A viewer on the enterprise plan who can administer the team indicates the role check is missing or the plan check is erroneously granting elevated access. These boundary tests serve as canaries — if either fails, the entire authorization model needs review. |
| **Bad Example** | Only testing the full matrix without explicit boundary assertions. A matrix test for admin+free that expects 403 may pass for the wrong reason (e.g., a missing permission rather than an explicit plan check). |
| **Good Example** | ```php
test('right role but wrong plan: admin on free plan cannot access premium feature', function () {
    // Setup admin on free plan, attempt premium feature
    $response->assertForbidden();
});
test('right plan but wrong role: enterprise viewer cannot delete documents', function () {
    // Setup viewer on enterprise plan, attempt delete
    $response->assertForbidden();
});
``` |
| **Exceptions** | Applications where one of the axes doesn't exist (no plans, or all roles have the same permissions). |
| **Consequences Of Violation** | Plan checks silently bypassed for high-role users. Role checks silently bypassed for high-plan users. The authorization model has a gap where role and plan checks are conflated, and neither the matrix (which tests combinatorically) nor the happy-path tests (which test the ideal case) catch it. |
