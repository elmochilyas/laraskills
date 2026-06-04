# Topic Overview
Test data factories covers Laravel model factory states and sequences — the core DSL for expressing test data intent. States define reusable attribute presets; sequences apply ordered variations. This KU addresses how to design, organize, and maintain factory states and sequences across a codebase.

---

# Decomposition Strategy
Decompose by factory feature: state definitions (presets), sequence patterns (ordered variation), callbacks (afterCreating/afterMaking), relationship factories (`->has()`), and organization conventions. Each sub-topic has distinct mechanics and usage patterns.

---

# Proposed Folder Structure
```
ku-01-test-data-factories/
├── 02-knowledge-unit.md
├── 03-decomposition.md
├── 04-standardized-knowledge.md
├── state-definitions.md
├── state-chaining.md
├── sequence-patterns.md
├── dynamic-sequences.md
├── after-creating-hooks.md
├── relationship-factories.md
├── factory-organization.md
└── state-compatibility.md
```

---

# Knowledge Unit Inventory

| Sub-Topic | Description | Priority | Maturity |
|-----------|-------------|----------|----------|
| State Definitions | Creating named attribute presets via `->state()` | P0 | Stable |
| State Chaining | Applying multiple states and understanding precedence | P0 | Stable |
| Sequence Patterns | Applying ordered attribute sets via `->sequence()` | P1 | Stable |
| Dynamic Sequences | Using `$sequence->index` for computed values | P1 | Stable |
| After-Creating Hooks | afterCreating/afterMaking callbacks | P1 | Stable |
| Relationship Factories | `->has()` and `->for()` for related models | P0 | Stable |
| Factory Organization | Trait-based grouping, docblocks, conventions | P1 | Stable |
| State Compatibility | Detecting and preventing conflicting state definitions | P2 | Emerging |

---

# Dependency Graph
```
ku-01-test-data-factories
├── depends on: ku-04-test-data-relationships (relationship factory patterns)
├── depends on: ku-02-test-data-seeding (declarative methods use states internally)
├── extends:   base model factory fundamentals
└── supports:  ku-03-test-data-cleanup (minimal data with states)
```

---

# Boundary Analysis
- **In scope:** Factory state methods, state chaining, sequence definitions, dynamic callbacks, afterCreating/afterMaking hooks, `->has()` relationship factories, factory trait organization.
- **Adjacent:** ku-02-test-data-seeding covers declarative test helper methods that consume factory states. ku-04-test-data-relationships covers relationship factory patterns. Database lifecycle (RefreshDatabase) owns cleanup.
- **Out of scope:** Faker usage, base factory definitions (definition() method), non-factory test data creation.

---

# Future Expansion Opportunities
- **State linting:** Static analysis to detect conflicting state definitions (same column overridden in chained states).
- **Visual state graph:** Auto-generated diagrams showing available factory states and their column diffs.
- **AI state suggestion:** Tools that suggest factory states based on test Arrange section patterns.
