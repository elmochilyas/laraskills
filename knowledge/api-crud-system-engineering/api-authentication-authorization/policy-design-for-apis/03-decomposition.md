# Decomposition: Policy Design for APIs

## Topic Overview
Laravel Policies provide a centralized authorization layer that determines whether a user can perform a specific action on a specific resource. For APIs, policies are invoked after token authentication succeeds, checking the second layer of authorization: "Can this authenticated entity perform this action on this resource?" Policies complement Sanctum token abilities â€” abilities gate what a token can do broadly; policies gate what a user can do on an instance level. Well-structured policies follow resource naming conventions, leverage policy auto-discovery, and separate authorization logic from controllers.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
policy-design-for-apis/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Policy Design for APIs
- **Purpose:** Laravel Policies provide a centralized authorization layer that determines whether a user can perform a specific action on a specific resource. For APIs, policies are invoked after token authentication succeeds, checking the second layer of authorization: "Can this authenticated entity perform this action on this resource?" Policies complement Sanctum token abilities â€” abilities gate what a token can do broadly; policies gate what a user can do on an instance level. Well-structured policies follow resource naming conventions, leverage policy auto-discovery, and separate authorization logic from controllers.
- **Difficulty:** Intermediate
- **Dependencies:** token-ability-design, api-specific-middleware

## Dependency Graph
**Depends on:**
- token-ability-design
- api-specific-middleware

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- Policy class
- Policy methods
- The `User` vs `Authenticatable` parameter
- Model instance as second parameter
- Auto-discovery

**Out of scope:**
- token-ability-design topics covered in their respective KUs
- api-specific-middleware topics covered in their respective KUs

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