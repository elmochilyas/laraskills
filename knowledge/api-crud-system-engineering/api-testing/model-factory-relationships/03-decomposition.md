# Model Factory Relationships — Decomposition

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** api-testing
- **Knowledge Unit:** Model Factory Relationships
- **Last Updated:** 2026-06-04

---

## Topic Overview
Model Factory Relationships covers how to define, use, and manage Eloquent relationships within Laravel factories for creating realistic test data in API integration tests.

---

## Decomposition Strategy
This KU is separated from general factory creation because relationship management introduces unique concerns — circular dependencies, pivot data, polymorphic associations, and performance implications — that deserve dedicated treatment.

---

## Proposed Folder Structure
```
api-testing/
└── 06-model-factory-relationships/
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
| Model Factory Relationships | Define and use Eloquent relationships in factories | Intermediate | Factory Definitions, Eloquent Relationships |

---

## Dependency Graph
```
Factory Definitions
  ├─ Eloquent Relationships
  └─ Model Factory Relationships
       └─ Test Data Factory Design
```

---

## Boundary Analysis
**In scope:** Factory relationship methods (for, has, hasAttached), polymorphic relationships in factories, circular dependency resolution, pivot data, factory states with relationships
**Out of scope:** General factory definition patterns, database seeding strategies, relationship definition on models, Eloquent relationship theory

---

## Future Expansion Opportunities
- Factory relationship performance benchmarking
- Multi-connection factory relationships
- Factory relationship verification through architecture tests
