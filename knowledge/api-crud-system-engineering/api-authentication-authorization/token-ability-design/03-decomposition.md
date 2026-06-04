# Decomposition: Token Ability Design

## Topic Overview
Token abilities (also called scopes) are named permissions assigned to API tokens that control what operations a token can perform. Sanctum implements abilities as simple string tags on each token, checked at the controller or middleware level. Well-designed abilities follow a consistent naming convention, map to application resources and actions, and can be composed to create flexible permission sets for different client types (mobile, admin dashboard, CI/CD, third-party). Abilities replace role-based checks for API contexts, providing finer-grained control than `is_admin` boolean checks.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
token-ability-design/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Token Ability Design
- **Purpose:** Token abilities (also called scopes) are named permissions assigned to API tokens that control what operations a token can perform. Sanctum implements abilities as simple string tags on each token, checked at the controller or middleware level. Well-designed abilities follow a consistent naming convention, map to application resources and actions, and can be composed to create flexible permission sets for different client types (mobile, admin dashboard, CI/CD, third-party). Abilities replace role-based checks for API contexts, providing finer-grained control than `is_admin` boolean checks.
- **Difficulty:** Intermediate
- **Dependencies:** sanctum-token-auth, policy-design-for-apis, token-expiration-rotation

## Dependency Graph
**Depends on:**
- sanctum-token-auth
- policy-design-for-apis
- token-expiration-rotation

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- Ability as string tag
- Token creation with abilities
- Ability checking
- No ability = no access
- Policies and abilities

**Out of scope:**
- sanctum-token-auth topics covered in their respective KUs
- policy-design-for-apis topics covered in their respective KUs
- token-expiration-rotation topics covered in their respective KUs

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization