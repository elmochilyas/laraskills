# Decomposition: Sanctum vs Passport Decision

## Topic Overview
Laravel provides two first-party API authentication packages: Sanctum and Passport. Sanctum is a lightweight, token-based system designed for SPAs, mobile apps, and simple token APIs. Passport is a full OAuth2.0 server implementation suitable for third-party client applications, scoped access, and complex authorization flows. Choosing between them depends on client type, authentication flow requirements, and organizational complexity tolerance.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
sanctum-vs-passport-decision/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Sanctum vs Passport Decision
- **Purpose:** Laravel provides two first-party API authentication packages: Sanctum and Passport. Sanctum is a lightweight, token-based system designed for SPAs, mobile apps, and simple token APIs. Passport is a full OAuth2.0 server implementation suitable for third-party client applications, scoped access, and complex authorization flows. Choosing between them depends on client type, authentication flow requirements, and organizational complexity tolerance.
- **Difficulty:** Intermediate
- **Dependencies:** sanctum-spa-cookie-auth, sanctum-token-auth, token-ability-design, api-key-pattern

## Dependency Graph
**Depends on:**
- sanctum-spa-cookie-auth
- sanctum-token-auth
- token-ability-design
- api-key-pattern

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- Sanctum
- Passport
- Token vs OAuth2
- First-party vs Third-party

**Out of scope:**
- sanctum-spa-cookie-auth topics covered in their respective KUs
- sanctum-token-auth topics covered in their respective KUs
- token-ability-design topics covered in their respective KUs
- api-key-pattern topics covered in their respective KUs

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