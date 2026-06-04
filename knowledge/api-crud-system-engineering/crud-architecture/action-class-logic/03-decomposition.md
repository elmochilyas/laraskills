# Action Class Logic — Decomposition

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** crud-architecture
- **Knowledge Unit:** Action Class Logic
- **Last Updated:** 2026-06-04

---

## Topic Overview
Action Class Logic covers the pattern of encapsulating single business operations into dedicated classes, enabling thin controllers, testable business logic, and reusable operations in Laravel CRUD architecture.

---

## Decomposition Strategy
This KU is separated from general controller architecture because action classes represent a specific separation pattern with unique design considerations — single responsibility enforcement, invokable class design, transactional boundaries, and composition strategies.

---

## Proposed Folder Structure
```
crud-architecture/
└── action-class-logic/
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
| Action Class Logic | Encapsulate single business operations into action classes | Intermediate | Controller-DTO-Action Flow, Service Container |

---

## Dependency Graph
```
Thin Controller Principle
  ├─ Service Container & DI
  └─ Action Class Logic
       ├─ DTO Construction Patterns
       ├─ Transactional Actions
       └─ Action Composition
```

---

## Boundary Analysis
**In scope:** Action class design, invokable pattern, controller delegation, action return values, transactional actions, action composition, testing action classes
**Out of scope:** General controller design, repository pattern, service class design, event/observer integration, job queuing

---

## Future Expansion Opportunities
- Spatie laravel-action package deep dive
- Action authorization integration
- Action monitoring and observability
- Asynchronous action execution via queues
