# Decomposition: SaaS Authorization Test Matrix for Roles and Entitlements

## Topic Overview

SaaS authorization testing requires a combinatorial matrix covering every intersection of user role, subscription plan, team membership, and protected action. A SaaS with 4 roles x 3 plans x 5 resource types x 6 actions = 360 test cases minimum. This Knowledge Unit defines the test axes, Pest dataset organization, cross-team isolation testing, subscription degradation testing, and architecture test enforcement for policy coverage.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. The authorization test matrix is a complete testing strategy for multi-tenant SaaS. No further decomposition is needed.

## Proposed Folder Structure

```
authorization-test-matrix-saas/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
  05-rules.md
  06-skills.md
  07-decision-trees.md
  08-anti-patterns.md
  09-checklists.md
```

## Knowledge Unit Inventory

### SaaS authorization test matrix for roles and entitlements
- **Purpose:** Define and implement a combinatorial authorization test matrix covering every role x plan x action intersection for a multi-tenant SaaS. Covers Pest datasets for role x plan combinations, cross-team isolation testing, subscription degradation testing (expired, cancelled, past_due), architecture tests enforcing policy method coverage, and right-role-wrong-plan / right-plan-wrong-role boundary tests.
- **Difficulty:** Advanced
- **Dependencies:** Pest 4, Spatie/laravel-permission, Laravel Policies & Gates

## Dependency Graph

This KU depends on: Pest 4 (testing framework), Spatie/laravel-permission (authorization system), Laravel Policies & Gates (authorization building blocks), Team-scoped Spatie Permission depth (team authorization configuration)

This KU is depended on by: Testing & Reliability Engineering (test strategy), Security audit workflows (penetration testing), CI pipeline configuration (test suite organization)

## Boundary Analysis

**In scope:** Authorization test matrix design (role x plan axes), Pest dataset definitions for declarative role/plan combinations, cross-team isolation tests (separate users in separate teams), subscription degradation tests (active, past_due, cancelled, expired), architecture tests enforcing policy method coverage, right-role-wrong-plan and right-plan-wrong-role boundary tests, platform admin bypass testing.

**Out of scope:** Unit testing of individual Policy methods (covered in standard policy tests), browser/E2E testing of authorization flows (covered in browser testing KUs), penetration testing (covered in security testing KUs), performance testing of authorization checks (covered in performance KUs), specific payment/billing provider integration testing (covered in billing KUs).

## Future Expansion Opportunities

None identified — the topic is stable and well-bounded at this granularity. However, if new authorization axes are introduced (e.g., time-based access, location-based access), the matrix may need expansion to cover additional dimensions.

---

## Success Criteria

This decomposition is complete when:

- No Knowledge Unit is overloaded

- No major concept is missing

- Boundaries are clear

- Future phases can operate on individual units

- The structure can scale without reorganization
