# Decomposition: API Client SDK Auto-Generation from OpenAPI

## Topic Overview
API client SDK auto-generation produces type-safe, language-specific client libraries from OpenAPI specifications, dramatically reducing the effort of building and maintaining API integrations. Tools like Speakeasy, OpenAPI Generator, Fern, and Postman convert OpenAPI specs into complete SDKs with typed interfaces, request/response models, authentication handling, and error types. In the Laravel ecosystem, auto-generated SDKs can produce SaloonPHP-based connectors and requests, bridging the gap between specification-driven development and structured API integration.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k038-sdk-auto-generation/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### API Client SDK Auto-Generation from OpenAPI
- **Purpose:** API client SDK auto-generation produces type-safe, language-specific client libraries from OpenAPI specifications, dramatically reducing the effort of building and maintaining API integrations. Tools like Speakeasy, OpenAPI Generator, Fern, and Postman convert OpenAPI specs into complete SDKs with typed interfaces, request/response models, authentication handling, and error types. In the Laravel ecosystem, auto-generated SDKs can produce SaloonPHP-based connectors and requests, bridging the gap between specification-driven development and structured API integration.
- **Difficulty:** Intermediate
- **Dependencies:** K030, K010, K016, K027, K009

## Dependency Graph
**Depends on:**
- K030
- K010
- K016
- K027
- K009

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- OpenAPI as Source of Truth
- Code Generation Pipeline
- Speakeasy
- OpenAPI Generator
- Fern
- Postman

**Out of scope:**
- K030 topics covered in their respective KUs
- K010 topics covered in their respective KUs
- K016 topics covered in their respective KUs
- K027 topics covered in their respective KUs
- K009 topics covered in their respective KUs

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