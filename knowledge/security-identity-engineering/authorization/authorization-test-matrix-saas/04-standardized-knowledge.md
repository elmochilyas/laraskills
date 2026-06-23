# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authorization |
| Knowledge Unit | SaaS authorization test matrix for roles and entitlements |
| Difficulty | Advanced |
| Maturity | Stable |
| Priority | P0 |
| Status | Initial Draft |
| Last Updated | 2026-06-22 |
| Dependencies | Pest 4, Spatie/laravel-permission, Laravel Policies & Gates |
| Related KUs | Team-scoped Spatie Permission depth, Laravel Policies & Gates, Roles & Permissions, Multi-tenant authentication |
| Source | domain-analysis.md |

# Overview

SaaS authorization testing requires a combinatorial matrix: for every protected action, test user-not-in-team, viewer, member, admin, owner, right-role-but-wrong-plan, right-plan-but-wrong-role, platform-admin, cross-team isolation, and expired subscription. A SaaS with 4 roles x 3 plans x 5 resource types = 60+ authorization tests minimum. Accept this volume — authorization bugs are silent security vulnerabilities that affect billing (user on free plan accessing premium features) or data security (user in team A reading team B data). Every policy method must be tested, every role x plan combination must be exercised, and cross-team isolation must be proven.

# Core Concepts

- **Authorization test matrix axes**: For each protected action, test: (1) user not in team, (2) viewer role, (3) member role, (4) admin role, (5) owner role, (6) right role but wrong plan, (7) right plan but wrong role, (8) platform admin, (9) cross-team isolation, (10) expired/cancelled subscription.
- **Pest datasets**: Use Pest's `dataset()` to define role x plan combinations declaratively. Each dataset entry is tested against every protected action.
- **Architecture tests for policies**: Use Pest architecture tests (`->arch()->expect()`) to verify every Policy class has test coverage for each of its methods (`viewAny`, `view`, `create`, `update`, `delete`, `restore`, `forceDelete`).
- **Test volume acceptance**: SaaS authorization testing generates many permutations. A system with 4 roles x 3 plans x 5 resource types x 6 actions per resource = 360 test cases. This is normal and necessary.
- **Common gaps**: Forgetting right-role-wrong-plan, forgetting cross-team isolation, forgetting expired subscription access, and assuming admin = super-admin. These are the most common authorization bugs in production.

# When To Use

- Every SaaS application with team-scoped roles and subscription plans
- When a new resource type is added (new model + policy)
- When a new role is introduced or role permissions change
- When a new subscription plan is added or plan features change
- When multi-tenant isolation must be proven correct

# When NOT To Use

- For single-tenant applications without team scoping (standard policy tests suffice)
- For applications without subscription plans (skip the plan axis)
- When authorization is trivial (everyone can do everything — rare)

# Best Practices (WHY)

- **Test every axis for every protected action**: Reason: Authorization bugs are combinatorial. Testing only "owner can access" leaves 9 other axes untested. A viewer on an enterprise plan should not be able to delete resources just because the plan allows it.
- **Use Pest datasets for role x plan combinations**: Reason: Datasets keep test code DRY. One test method covers all role x plan combinations. Adding a new plan or role is one line in the dataset.
- **Test cross-team isolation explicitly**: Reason: The most dangerous authorization bug is cross-team data access. A user in team A reading team B data must return 403 — never silently succeed with wrong data.
- **Test expired/cancelled subscription access separately**: Reason: Graceful degradation on expired subscription is different from never-had-access on free plan. An expired enterprise user should see read-only access (or a prompt to renew), not 403.
- **Architecture tests enforce test coverage for policies**: Reason: Without enforcement, new policies or new policy methods can be added without corresponding tests. Architecture tests catch this at CI time.
- **Test platform admin bypasses team scope**: Reason: Platform admins should access any team's resources for support purposes, but they should NOT inherit team-specific roles or leak team data outside the support context.

# Architecture Guidelines

- **Test file organization**: `tests/Feature/Authorization/{Resource}PolicyTest.php` for each policy. `tests/Feature/Authorization/CrossTeamIsolationTest.php` for cross-team tests. `tests/Feature/Authorization/SubscriptionDegradationTest.php` for plan-related tests.
- **Dataset organization**: Define datasets in `tests/Datasets/Authorization.php`. Import them in test files. Keep datasets synchronized with actual roles and plans in the application.
- **Architecture test location**: `tests/Architect/PolicyCoverageTest.php` — verifies every policy method has a corresponding test.
- **Test isolation**: Each test should create its own team, user, role, plan, and resource. Use `RefreshDatabase` to ensure no state leakage between combinations.

# Performance Considerations

- Authorization tests are database-heavy (create users, teams, roles, permissions, resources). With 100+ test cases, RefreshDatabase transaction rollback keeps each test under 50ms.
- Use factory states for role and plan setup. `User::factory()->withRole('admin')->forTeam($team)->create()` is faster than manual setup.
- Parallel testing: authorization tests can run in parallel because each test creates its own isolated data. Enable `--parallel` in CI for these tests.
- Consider a dedicated `AuthorizationTest` test suite in `phpunit.xml` for targeted execution during development.

# Security Considerations

- Test credentials must NEVER be real credentials. Use factories with fake data exclusively.
- Do not test authorization with real Stripe/Payment API calls. Mock or fake the billing service.
- Authorization test assertions should verify HTTP status codes (200, 403, 404) and response structure. Never assert sensitive data in error messages (authorization failures should not leak resource existence).
- Cross-team isolation tests must verify that a different team's resource ID returns 403 (or 404 to not leak existence), not 200 with wrong data.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Testing only the happy path (owner+enterprise plan) | Shortcut during test writing | Viewer on free plan can delete resources — direct authorization bypass | Use Pest datasets to systematically test every role x plan combination |
| Forgetting cross-team isolation | Testing within a single team only | User in team A can access team B resources by ID | Dedicated cross-team test file: create resource in team A, attempt access as team B user |
| Not testing right-role-wrong-plan | Assuming plans and roles are independent | Admin on free plan accesses premium features despite plan restrictions | Test each role against the free plan explicitly |
| Not testing right-plan-wrong-role | Assuming enterprise plan grants all access | Viewer on enterprise plan can administer the team | Test each role against the enterprise plan; role trumps plan for destructive actions |
| Assuming admin = super-admin | Using admin role in tests as a catch-all | Platform admin bypass not tested; team-scoped admin can access other teams | Separate "admin" (team-scoped) from "super-admin"/"platform-admin" (global) in tests |
| Not testing expired subscription | Only testing active and inactive | Cancelled subscription user retains full access until manual deprovisioning | Test subscription statuses: active, past_due, cancelled, expired, incomplete |
| Architecture tests not covering policies | Focus only on feature tests | New Policy method added without tests; no CI failure | `->arch()->expect('App\\Policies')->toHaveMethods(['viewAny', 'view', 'create', 'update', 'delete'])->toHaveTests()` (conceptual; `toHaveTests()` is not a standard Pest arch method — this is pseudo-code representing the intent) |

# Anti-Patterns

- **One-test-fits-all**: A single test that creates an owner user and asserts they can do "everything." Bypasses all other role and plan combinations.
- **Hardcoded role names in every test**: `User::factory()->state(['role' => 'admin'])` scattered across 50 test files. Use dedicated factory methods: `User::factory()->withRole('admin')`.
- **Testing roles without plan context**: Testing `$user->can('delete', $resource)` without setting the team's plan. The plan check is silently skipped.
- **Testing plan without role context**: Testing that enterprise plan allows feature X, but using an owner user. The test doesn't prove that a viewer on enterprise plan still can't perform admin actions.
- **Cross-team test with same user in both teams**: Testing isolation by adding the same user to both teams. The user has access via team B — the test passes but doesn't prove isolation.

# Examples

**Authorization dataset definitions (Pest)**
```php
// tests/Datasets/Authorization.php
dataset('team_roles', [
    'viewer' => ['viewer'],
    'member'  => ['member'],
    'admin'   => ['admin'],
    'owner'   => ['owner'],
]);

dataset('subscription_plans', [
    'free'       => ['free'],
    'pro'        => ['pro'],
    'enterprise' => ['enterprise'],
]);

dataset('role_x_plan', function () {
    $roles = ['viewer', 'member', 'admin', 'owner'];
    $plans = ['free', 'pro', 'enterprise'];

    $combinations = [];
    foreach ($roles as $role) {
        foreach ($plans as $plan) {
            $combinations["{$role} on {$plan} plan"] = [$role, $plan];
        }
    }
    return $combinations;
});
```

**Authorization matrix test for a single resource (Document)**
```php
// tests/Feature/Authorization/DocumentPolicyMatrixTest.php
use App\Models\Document;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('Document Policy — Role x Plan Matrix', function () {

    test('user not in team cannot access documents', function () {
        $team = Team::factory()->create();
        $document = Document::factory()->for($team)->create();
        $outsider = User::factory()->create(); // Not in any team

        $response = $this->actingAs($outsider)
            ->getJson("/api/teams/{$team->id}/documents/{$document->id}");

        $response->assertForbidden();
    });

    test('role x plan matrix for document read access', function (string $role, string $plan) {
        $team = Team::factory()->withPlan($plan)->create();
        $user = User::factory()->withRole($role)->forTeam($team)->create();
        $document = Document::factory()->for($team)->for($user)->create();

        $response = $this->actingAs($user)
            ->getJson("/api/teams/{$team->id}/documents/{$document->id}");

        // Read access: all roles on all plans can read documents in their team
        $response->assertOk();
    })->with('role_x_plan');

    test('role x plan matrix for document create access', function (string $role, string $plan) {
        $team = Team::factory()->withPlan($plan)->create();
        $user = User::factory()->withRole($role)->forTeam($team)->create();

        $response = $this->actingAs($user)
            ->postJson("/api/teams/{$team->id}/documents", [
                'title' => 'Test Document',
                'content' => 'Test content',
            ]);

        // Create access: viewer can never create. member/admin/owner can.
        if ($role === 'viewer') {
            $response->assertForbidden();
        } else {
            $response->assertCreated();
        }
    })->with('role_x_plan');

    test('role x plan matrix for document delete access', function (string $role, string $plan) {
        $team = Team::factory()->withPlan($plan)->create();
        $user = User::factory()->withRole($role)->forTeam($team)->create();
        $document = Document::factory()->for($team)->for($user)->create();

        $response = $this->actingAs($user)
            ->deleteJson("/api/teams/{$team->id}/documents/{$document->id}");

        // Delete access: only admin/owner can delete
        if (in_array($role, ['admin', 'owner'])) {
            $response->assertNoContent();
        } else {
            $response->assertForbidden();
        }
    })->with('role_x_plan');

    test('right plan but wrong role: enterprise viewer cannot delete documents', function () {
        $team = Team::factory()->withPlan('enterprise')->create();
        $user = User::factory()->withRole('viewer')->forTeam($team)->create();
        $document = Document::factory()->for($team)->create();

        $response = $this->actingAs($user)
            ->deleteJson("/api/teams/{$team->id}/documents/{$document->id}");

        // Enterprise plan does NOT grant admin capabilities to a viewer
        $response->assertForbidden();
    });

    test('right role but wrong plan: admin on free plan cannot access premium feature', function () {
        $team = Team::factory()->withPlan('free')->create();
        $user = User::factory()->withRole('admin')->forTeam($team)->create();

        $response = $this->actingAs($user)
            ->postJson("/api/teams/{$team->id}/reports/export");

        // Admin has the role, but the free plan doesn't include report export
        $response->assertForbidden();
    });
});
```

**Cross-team isolation tests**
```php
// tests/Feature/Authorization/CrossTeamIsolationTest.php
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('Cross-Team Isolation', function () {

    test('user in team A cannot access team B documents', function () {
        $teamA = Team::factory()->create();
        $teamB = Team::factory()->create();
        $userA = User::factory()->withRole('admin')->forTeam($teamA)->create();
        $documentB = Document::factory()->for($teamB)->create();

        $response = $this->actingAs($userA)
            ->getJson("/api/teams/{$teamB->id}/documents/{$documentB->id}");

        // Must be forbidden — user does not belong to team B
        $response->assertForbidden();
    });

    test('user in team A cannot list team B documents', function () {
        $teamA = Team::factory()->create();
        $teamB = Team::factory()->create();
        $userA = User::factory()->withRole('admin')->forTeam($teamA)->create();
        Document::factory()->count(5)->for($teamB)->create();

        $response = $this->actingAs($userA)
            ->getJson("/api/teams/{$teamB->id}/documents");

        $response->assertForbidden();
    });

    test('user in team A cannot create documents in team B', function () {
        $teamA = Team::factory()->create();
        $teamB = Team::factory()->create();
        $userA = User::factory()->withRole('admin')->forTeam($teamA)->create();

        $response = $this->actingAs($userA)
            ->postJson("/api/teams/{$teamB->id}/documents", [
                'title' => 'Attempted intrusion',
                'content' => '...',
            ]);

        $response->assertForbidden();
    });

    test('user in team A cannot access team B by IDOR (direct ID manipulation)', function () {
        $teamA = Team::factory()->create();
        $teamB = Team::factory()->create();
        $userA = User::factory()->withRole('owner')->forTeam($teamA)->create();
        $documentB = Document::factory()->for($teamB)->create();

        // Owner of team A tries to access team B's document directly by ID
        $response = $this->actingAs($userA)
            ->getJson("/api/documents/{$documentB->id}");

        // Must be 404 (don't leak existence) or 403
        $response->assertForbidden();
    });
});
```

**Subscription degradation tests**
```php
// tests/Feature/Authorization/SubscriptionDegradationTest.php
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('Subscription Degradation', function () {

    test('expired subscription: admin retains read access but cannot create', function () {
        $team = Team::factory()->withPlan('pro', status: 'expired')->create();
        $user = User::factory()->withRole('admin')->forTeam($team)->create();
        $existingDocument = Document::factory()->for($team)->for($user)->create();

        // Read access retained
        $readResponse = $this->actingAs($user)
            ->getJson("/api/teams/{$team->id}/documents/{$existingDocument->id}");
        $readResponse->assertOk();

        // Create access denied (expired subscription)
        $createResponse = $this->actingAs($user)
            ->postJson("/api/teams/{$team->id}/documents", [
                'title' => 'New document',
                'content' => '...',
            ]);
        $createResponse->assertForbidden();
    });

    test('cancelled subscription: all write access denied, read retained for 30 days', function () {
        $team = Team::factory()->withPlan('enterprise', status: 'cancelled', cancels_at: now()->addDays(15))->create();
        $user = User::factory()->withRole('owner')->forTeam($team)->create();
        $document = Document::factory()->for($team)->for($user)->create();

        // Read access retained during grace period
        $readResponse = $this->actingAs($user)
            ->getJson("/api/teams/{$team->id}/documents/{$document->id}");
        $readResponse->assertOk();

        // Delete denied (cancelled subscription)
        $deleteResponse = $this->actingAs($user)
            ->deleteJson("/api/teams/{$team->id}/documents/{$document->id}");
        $deleteResponse->assertForbidden();
    });

    test('free plan user cannot access premium features', function (string $premiumFeature) {
        $team = Team::factory()->withPlan('free')->create();
        $user = User::factory()->withRole('owner')->forTeam($team)->create();

        $response = $this->actingAs($user)
            ->getJson("/api/teams/{$team->id}/{$premiumFeature}");

        $response->assertForbidden();
    })->with([
        'advanced reporting',
        'api access',
        'custom domain',
        'priority support',
        'team audit logs',
    ]);

    test('platform admin bypasses team scope for support access', function () {
        $team = Team::factory()->create();
        $document = Document::factory()->for($team)->create();
        $platformAdmin = User::factory()->globalAdmin()->create(); // Not in any team

        $response = $this->actingAs($platformAdmin)
            ->getJson("/api/admin/teams/{$team->id}/documents/{$document->id}");

        // Platform admin can view any team's resources for support
        $response->assertOk();
    });
});
```

**Architecture test: verify every policy method has test coverage**
```php
// tests/Architect/PolicyCoverageTest.php
arch('every policy has test coverage')
    ->expect('App\Policies')
    ->toHaveMethods(['viewAny', 'view', 'create', 'update', 'delete']);

arch('no policy allows everything')
    ->expect('App\Policies')
    ->not->toBeAbstract();

arch('authorization tests exist for all resource types')
    ->expect('App\Policies')
    ->toHaveTests(); // Conceptual: adapt to your Pest version. Standard Pest arch does not include toHaveTests(). Use architecture presets or custom rules.
```

# Related Topics

- Team-scoped Spatie Permission depth (configuring Spatie for teams)
- Laravel Policies & Gates (authorization building blocks)
- Roles & Permissions (role hierarchy and permission design)
- Multi-tenant authentication (tenant isolation patterns)
- Pest datasets (declarative test data)
- Pest architecture tests (enforcing conventions)

# AI Agent Notes

- When generating authorization tests for a SaaS application, always include all axes: user-not-in-team, every role, every plan, cross-team isolation, and subscription degradation.
- Use Pest datasets for role x plan combinations. Generate the dataset automatically from the application's role and plan enums or configuration.
- Never generate authorization tests that only test the happy path (owner + enterprise plan). Always include at least one "forbidden" test per action.
- When generating a new Policy, also generate the corresponding `{Resource}PolicyMatrixTest.php` file with the full matrix.
- Include cross-team isolation tests in every authorization test suite. This is the most dangerous class of authorization bugs.
- For subscription degradation, generate tests for every plan status: active, past_due, cancelled (grace period), cancelled (expired), and incomplete.

# Verification

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
