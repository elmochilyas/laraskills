# Decomposition: Authentication Documentation

## Topic Overview
Documenting how API consumers authenticate — authentication schemes, token acquisition, credential management, and per-endpoint security requirements in OpenAPI.

## Decomposition Strategy
This KU is atomic — it covers the single concept of documenting authentication for API consumers. The implementation of authentication is covered in the api-authentication-authorization subdomain.

## Proposed Folder Structure
```
authentication-documentation/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Authentication Documentation
- **Purpose:** Document all authentication methods, token acquisition, and per-endpoint security requirements
- **Difficulty:** Foundation
- **Dependencies:** Laravel Sanctum Token Auth, HTTP Authentication Headers

## Dependency Graph
Depends on: Laravel Sanctum Token Auth, HTTP Authentication Headers. Related to: Endpoint Documentation Content (per-endpoint security), Token Ability Design (scopes). Serves as prerequisite for: SDK Generation from OpenAPI (security schemes in generated clients).

## Boundary Analysis
**In scope:** OpenAPI security scheme definitions (Bearer, API Key, OAuth2, OpenID Connect), token acquisition endpoint documentation, token usage documentation, scope/ability documentation, per-operation security requirements, public endpoint documentation, token expiration and rotation documentation, multi-auth scheme documentation.
**Out of scope:** Authentication implementation (api-authentication-authorization subdomain), token ability design decisions (api-authentication-authorization subdomain), CORS configuration (api-authentication-authorization subdomain), API security headers (api-authentication-authorization subdomain), OAuth2 server implementation.

## Future Expansion Opportunities
- Auth Flow Sequence Diagrams — Visual documentation of token acquisition flows
- OAuth2 Flow Documentation Pattern — Detailed guide for documenting OAuth2 authorization flows
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization