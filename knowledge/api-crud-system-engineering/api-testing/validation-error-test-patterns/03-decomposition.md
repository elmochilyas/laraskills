# Validation Error Test Patterns — Decomposition

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** api-testing
- **Knowledge Unit:** Validation Error Test Patterns
- **Last Updated:** 2026-06-04

---

## Topic Overview
Validation Error Test Patterns covers techniques for testing validation rule enforcement in API endpoints, including field-level error assertions, boundary value testing, dataset-driven validation tests, and error shape verification.

---

## Decomposition Strategy
This KU is separated from general HTTP endpoint assertions because validation error testing requires specialized knowledge about Laravel's validation response structures, form request behavior, and the tradeoffs of per-rule vs per-scenario testing approaches.

---

## Proposed Folder Structure
```
api-testing/
└── 05-validation-error-test-patterns/
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
| Validation Error Test Patterns | Verify validation rule enforcement and error response consistency | Intermediate | HTTP Endpoint Assertions, Form Request Validation Logic |

---

## Dependency Graph
```
HTTP Endpoint Assertions
  ├─ Form Request Validation Logic
  └─ Validation Error Test Patterns
       └─ Custom Rule Testing
```

---

## Boundary Analysis
**In scope:** Validation error response testing, field-level error assertions, boundary value tests, dataset-driven validation, error shape consistency
**Out of scope:** General HTTP response testing, form request implementation details, database-related assertions, authorization error testing

---

## Future Expansion Opportunities
- RFC 9457 problem details validation testing
- Async validation error patterns for real-time APIs
- Machine-readable validation error contract testing
