# Decomposition: Team-Scoped Spatie Permission Depth for SaaS

## Topic Overview

Spatie Permission's team support enables multi-tenant role and permission management within a single database. The core concepts — team context resolution, guard name consistency, permission cache invalidation per team, global vs team-scoped role separation, and plan entitlement isolation — form a complete authorization layer for SaaS applications. Without explicit attention to these details, permissions leak across teams or silently fail to apply.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. The team-scoped Spatie Permission implementation is a complete authorization pattern for multi-tenant SaaS. No further decomposition is needed.

## Proposed Folder Structure

```
team-spatie-permission-depth/
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

### Team-scoped Spatie Permission depth for SaaS
- **Purpose:** Configure and operate Spatie Permission with team mode in a multi-tenant SaaS application. Covers team context resolution via middleware, guard name consistency, cache invalidation on team switch, global role bypass via Gate::before(), and strict separation of subscription plan entitlements from Spatie permissions.
- **Difficulty:** Advanced
- **Dependencies:** Spatie/laravel-permission, Laravel Gates & Policies, Multi-tenant architecture

## Dependency Graph

This KU depends on: Spatie/laravel-permission (core package), Laravel Gates & Policies (authorization building blocks), Multi-tenant authentication (tenant isolation patterns)

This KU is depended on by: Authorization test matrix for SaaS (testing team-scoped permissions), Roles & Permissions (role hierarchy design), Enterprise IAM (identity governance)

## Boundary Analysis

**In scope:** Team context middleware design, guard name consistency enforcement, permission cache invalidation on team switches, global vs team-scoped role separation, plan entitlement isolation from permissions, policy design with team ID validation, team switch flow with cache reset and session regeneration.

**Out of scope:** Basic Spatie Permission setup (covered in the spatie-permission KU), subscription billing logic (covered in billing/commerce KUs), database-per-tenant architecture (different authorization model), SAML/OIDC SSO (covered in authentication KUs), authorization test matrix design (covered in authorization-test-matrix-saas KU).

## Future Expansion Opportunities

None identified — the topic is stable and well-bounded at this granularity. However, if Spatie Permission introduces breaking changes to team mode in future major versions, a version-specific sub-KU may be warranted.

---

## Success Criteria

This decomposition is complete when:

- No Knowledge Unit is overloaded

- No major concept is missing

- Boundaries are clear

- Future phases can operate on individual units

- The structure can scale without reorganization
