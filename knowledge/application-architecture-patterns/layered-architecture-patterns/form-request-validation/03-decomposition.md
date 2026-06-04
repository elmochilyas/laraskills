# Form Request Validation — Decomposition

## Metadata
- **Domain:** Application Architecture Patterns
- **Subdomain:** Layered Architecture Patterns
- **Knowledge Unit:** LAP-12-form-request-validation
- **Last Updated:** 2026-06-04

---

## Topic Overview
Form Request classes as the HTTP input validation boundary in layered Laravel architecture, covering authorization, validation rules, input preparation, error handling, and testing.

---

## Decomposition Strategy
The topic splits by (1) Form Request structure — `authorize()`, `rules()`, `prepareForValidation()`, `messages()`, `failedValidation()`; (2) validation rule strategies — built-in rules vs custom Rule objects vs closures; (3) integration patterns — Inertia, API JSON, redirect; (4) testing — independent Form Request tests vs integration tests. This avoids overlapping with domain-level validation by clearly distinguishing format validation (Form Request) from business rule validation (Domain objects).

---

## Proposed Folder Structure
```
02-layered-architecture-patterns/LAP-12-form-request-validation/
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
|------|---------|------------|--------------|
| Form Request Validation | HTTP input validation and authorization gateway | Intermediate | Laravel Validation, Controller Design |
| Authorization in Form Requests | Endpoint-level security via authorize() | Intermediate | Laravel Auth/Policy |
| Rule Definitions | Validation rules configuration and organization | Intermediate | Form Request Validation |
| Input Preparation | Transforming/sanitizing input before validation | Intermediate | Form Request Validation |
| Custom Rule Objects | Extractable, testable validation rules | Intermediate | Rule Definitions |
| Error Customization | Messages, attributes, and failed validation responses | Intermediate | Form Request Validation |
| Form Request Testing | Independent validation logic tests | Intermediate | PHPUnit/Pest |

---

## Dependency Graph
```
Controller Design → Form Request Validation
                    ├── authorize() → Policy Gates
                    ├── rules() → Custom Rule Objects
                    ├── prepareForValidation() → Input normalization
                    ├── messages() → User-facing error text
                    └── failedValidation() → Response customization
```

---

## Boundary Analysis
**In scope**: Form Request `authorize()` method, `rules()` method, `prepareForValidation()`, `messages()` and `attributes()`, `failedValidation()`, `withValidator()` callback, custom Rule objects, input preparation patterns (trimming, normalization), validation error testing, one-per-operation pattern, relationship to controllers and Use Cases.

**Out of scope**: Domain-level validation (business rules, invariants), Eloquent model validation, client-side validation, Livewire validation attributes, generic Laravel validation rule list, database-level constraints.

---

## Future Expansion Opportunities
- Form Request generation from DTO/Use Case metadata
- Validation rule composability and reusability patterns
- Cross-form-request validation sharing via traits/mixins
- API-specific error formatting patterns
- Form Request testing strategies and coverage thresholds
