# Decomposition: Sanctum Token Auth

## Topic Overview
Sanctum token authentication provides a lightweight, stateless API authentication mechanism for first-party external consumers such as mobile apps, JavaScript frontends on different domains, and machine-to-machine communication. Tokens are issued per-user with arbitrary "abilities" (scopes), stored hashed in the database, and presented via the `Authorization: Bearer` header. Unlike Passport, Sanctum token auth has no OAuth2 overhead, no client registration flow, and no refresh token infrastructure â€” making it ideal for your own applications.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
sanctum-token-auth/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Sanctum Token Auth
- **Purpose:** Sanctum token authentication provides a lightweight, stateless API authentication mechanism for first-party external consumers such as mobile apps, JavaScript frontends on different domains, and machine-to-machine communication. Tokens are issued per-user with arbitrary "abilities" (scopes), stored hashed in the database, and presented via the `Authorization: Bearer` header. Unlike Passport, Sanctum token auth has no OAuth2 overhead, no client registration flow, and no refresh token infrastructure â€” making it ideal for your own applications.
- **Difficulty:** Intermediate
- **Dependencies:** sanctum-spa-cookie-auth, token-ability-design, token-expiration-rotation, api-key-pattern

## Dependency Graph
**Depends on:**
- sanctum-spa-cookie-auth
- token-ability-design
- token-expiration-rotation
- api-key-pattern

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- API Token
- Token Abilities
- Token Creation
- Token Revocation
- Current Access Token

**Out of scope:**
- sanctum-spa-cookie-auth topics covered in their respective KUs
- token-ability-design topics covered in their respective KUs
- token-expiration-rotation topics covered in their respective KUs
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