# Authentication Test Patterns — Decomposition

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** api-testing
- **Knowledge Unit:** Authentication Test Patterns
- **Last Updated:** 2026-06-04

---

## Topic Overview
Authentication Test Patterns covers techniques for verifying authentication enforcement in API endpoints, including unauthenticated access rejection, token-based auth simulation, role/scope verification, and multi-guard testing.

---

## Decomposition Strategy
This KU is separated from general HTTP assertions because authentication testing has unique concerns — simulating different auth states, testing multiple guards, and verifying role/scope enforcement — that require dedicated patterns beyond basic status code assertions.

---

## Proposed Folder Structure
```
api-testing/
└── 04-authentication-test-patterns/
    ├── 02-knowledge-unit.md
    ├── 03-decomposition.md
    ├── 04-standardized-knowledge.md
    ├── 05-rules.md
    ├── 06-skills.md
    ├── 07-decision-trees.md
    ├── 08-anti-patterns.md
    └── 09-checklists.md
```

---

## Knowledge Unit Inventory
| Name | Purpose | Difficulty | Dependencies |
|------|---------|------------|-------------|
| Authentication Test Patterns | Verify authentication enforcement across API endpoints | Intermediate | HTTP Endpoint Assertions, Sanctum/Passport setup |

---

## Dependency Graph
```
HTTP Endpoint Assertions
  └─ Authentication Test Patterns
       ├─ Authorization Test Patterns
       └─ CORS Behavior Testing
```

---

## Boundary Analysis
**In scope:** Simulating authenticated requests, testing 401/403 responses, role/scope verification, multi-guard test patterns, token expiry testing
**Out of scope:** Authentication implementation details, OAuth2 server configuration, session-based web auth, SSO flow simulation

---

## Future Expansion Opportunities
- OAuth2 PKCE flow integration testing
- Biometric/MFA authentication testing
- Token introspection and revocation testing
