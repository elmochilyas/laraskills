# Validation Rule Composition — Decomposition

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** input-validation-architecture
- **Knowledge Unit:** Validation Rule Composition
- **Last Updated:** 2026-06-04

---

## Topic Overview
Validation Rule Composition covers how to combine, extend, and organize Laravel validation rules into expressive, maintainable validation definitions.

---

## Decomposition Strategy
This KU is separated from form request validation because rule composition is a deeper concern that spans beyond form requests — it includes rule objects, custom rules, conditional rules, and rule ordering strategies applicable in any validation context.

---

## Proposed Folder Structure
```
input-validation-architecture/
└── validation-rule-composition/
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
| Validation Rule Composition | Combine and organize validation rules effectively | Intermediate | Form Request Validation Logic |

---

## Dependency Graph
```
Form Request Validation Logic
  └─ Validation Rule Composition
       ├─ Input Sanitization Techniques
       └─ Custom Rule Implementation
```

---

## Boundary Analysis
**In scope:** Rule arrays vs strings, rule objects (Rule::unique, Rule::exists), conditional rules (required_if, etc.), custom rule objects, nested array validation, rule ordering, bail/sometimes/nullable modifiers
**Out of scope:** Form request lifecycle, error message customization, authorization, sanitization

---

## Future Expansion Opportunities
- Dynamic rule generation from database schemas
- Rule composition for GraphQL inputs
- Rule caching for frequently used validations
- Cross-field validation patterns
