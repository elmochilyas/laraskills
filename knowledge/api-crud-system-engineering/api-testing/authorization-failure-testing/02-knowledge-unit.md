# Authorization Failure Testing

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Testing
- **Knowledge Unit:** Authorization Failure Testing
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary
Authorization failure tests verify that authenticated users without the required permissions receive a 403 Forbidden response. These tests cover role-based access (admin vs user), ownership-based access (can only edit own resources), policy-gated actions, and model-scoped permissions. Laravel's `assertStatus(403)` and error-shape assertions validate rejection. Every endpoint with an `authorize()` call, `Gate`, or `@can` directive must prove it denies unauthorized users.

---

## Core Concepts
Authorization tests require two authenticated users: one with permission (should succeed) and one without (should fail 403). For ownership tests, create two resources — one owned by user A, one by user B — and assert user B cannot modify user A's resource. Laravel uses Gates (`Gate::allow/deny`), Policies (`PostPolicy`), and controller `authorize()` calls. The `assertStatus(403)` check must be paired with the error body assertion: `{"message": "This action is unauthorized."}`. Test both `index` (listing all resources — some visible, some not) and individual resource access.

---

## Mental Models
Authorization tests are **bouncer tests** — the bouncer (gate/policy) checks ID and says "you can enter" or "you're not on the list." You test that the bouncer correctly rejects the wrong people while admitting the right ones. Each gate is a rule; each rule needs a denial test.

---

## Internal Mechanics
When `$this->authorize('update', $post)` is called in a controller, Laravel resolves the `PostPolicy` via the container, calls `update(User $user, Post $post)`, and throws `AuthorizationException` if the policy returns false. This exception is converted to a 403 JSON response by `Handler::render()`. Gates registered with `Gate::define()` follow the same flow. The `@can` Blade directive doesn't apply to API controllers, but inline `Gate::authorize()` calls do. For resource ownership, policies typically compare `$user->id === $model->user_id`.

---

## Patterns
- **Two-user setup**: Arrange two users with different roles/permissions.
- **Positive-negative pairs**: For each permission test, assert both success (for permitted user) and failure (for denied user).
- **Use PestPHP `dataset` for roles**: Define roles dataset and iterate permission tests.
- **Assert DB state didn't change**: After a denied update, verify the resource hasn't changed.
- **Test policy methods individually**: Each policy method (`view`, `create`, `update`, `delete`, `restore`, `forceDelete`) should have a corresponding 403 test.

---

## Architectural Decisions
Separating authorization failure testing from authentication failure testing is a deliberate API testing standard: 401 means "I don't know you," 403 means "I know you but you can't do that." Combining them confuses deficiency analysis. The tests mirror the same logical separation — auth-failure tests omit credentials entirely, auth-failure tests include credentials that lack permissions.

---

## Tradeoffs
| Aspect | Feature AuthZ Test | Unit Policy Test |
|---|---|---|
| Ownership verification | Real (multiple users, real resources) | Mocked (stub user/resource) |
| Policy routing correctness | Verified | Not verified |
| Setup complexity | Higher (multi-user factories) | Lower (mocked arguments) |
| Confidence | Higher | Lower |

---

## Performance Considerations
Authorization tests require multiple database records (two users, resources owned by each) — each test has higher setup cost. Use `beforeEach` to create the user and resource once per class, then reference them. Use PestPHP's `higherOrderMessage` for shared setups. Avoid creating the same resources in every test method.

---

## Production Considerations
Every policy method must be tested for denial. Use architecture tests to enforce: reflect all policy classes and assert corresponding `*_denies_access` test methods exist. In production, log authorization failures at `warning` level — they often indicate probing or permission misconfiguration. Never expose why authorization failed (which specific gate denied) in the 403 response body.

---

## Common Mistakes
- Testing authorization with the same user (both acting and owning) — never triggers a denial.
- Asserting only 403 without checking the response body.
- Forgetting to test ownership-based authorization (e.g., user editing another user's post).
- Using `actingAs($user)->get()` but the route uses implicit binding that loads a resource the user doesn't own — the test passes but for the wrong reason.

---

## Failure Modes
- **Missing policy**: Endpoint uses `authorize()` but no policy is registered — Gate resolves to `Gate::allow()` by default, and the endpoint always succeeds. The 403 test never fails.
- **Wrong policy method**: Controller calls `authorize('update', $post)` but the policy only defines `updateMany()` — the fallback is true.
- **Global `before` gate**: A `Gate::before(fn($user) => $user->isAdmin())` in `AppServiceProvider` bypasses all specific policies for admin users. Tests with admin users will never get 403 on any endpoint.

---

## Ecosystem Usage
Spatie's `laravel-permission` package is the most common authorization layer for Laravel APIs. It provides roles and permissions that map to Gates. The package's own test suite tests every permission combination at the HTTP layer. Laravel Nova and Filament use Policy-based authorization with comprehensive 403 coverage.

---

## Related Knowledge Units
### Prerequisites
- Laravel Authorization (Gates, Policies, `authorize()` method)
- feature-test-structure (multi-user test setup)
- authentication-failure-testing (401 vs 403 distinction)

### Related Topics
- error-response-shape-testing (consistent 403 error format)
- happy-path-testing (paired success assertions)

### Advanced Follow-up Topics
- Multi-tenant authorization testing
- Dynamic policy resolution testing
- Test-time policy override patterns

---

## Research Notes
### Source Analysis
`Illuminate\Auth\Access\Gate` resolves policy classes. `Illuminate\Foundation\Auth\Access\Authorizable` trait provides `can()` and `cannot()`. `Illuminate\Auth\Access\AuthorizationException` triggers the 403 response.
### Key Insight
The most common authorization bug is a policy that doesn't exist, causing the Gate to default-allow every action. Testing denial is the only way to catch this.
### Version-Specific Notes
Laravel 11 introduced the `App\Providers\AuthServiceProvider` with implicit policy auto-discovery. Custom policies must be registered explicitly in `$policies` property. The default 403 response in Laravel 11's API exception handler returns `{"message": "This action is unauthorized."}`.
