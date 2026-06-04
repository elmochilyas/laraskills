# Topic Overview
Declarative factory methods are custom test helpers that wrap complex factory chains behind intent-revealing method names. This KU covers their design, organization, naming conventions, and maintenance.

---

# Decomposition Strategy
Decompose by method type (single-entity, multi-entity, parameterized), organization (trait structure, naming), and lifecycle (creation, review, deprecation). Each aspect has its own conventions and tooling requirements.

---

# Proposed Folder Structure
```
ku-02-test-data-seeding/
├── 02-knowledge-unit.md
├── 03-decomposition.md
├── 04-standardized-knowledge.md
├── single-entity-methods.md
├── multi-entity-methods.md
├── parameterized-methods.md
├── trait-organization.md
├── naming-conventions.md
├── return-type-patterns.md
├── overrides-pattern.md
├── method-lifecycle.md
└── helper-discovery.md
```

---

# Knowledge Unit Inventory

| Sub-Topic | Description | Priority | Maturity |
|-----------|-------------|----------|----------|
| Single-Entity Methods | Methods creating one model with specific state | P0 | Stable |
| Multi-Entity Methods | Methods creating related model graphs | P1 | Stable |
| Parameterized Methods | Methods with configurable parameters | P1 | Stable |
| Trait Organization | Grouping methods by domain into traits | P0 | Stable |
| Naming Conventions | `create`/`make` standard, verb naming | P0 | Stable |
| Return Type Patterns | Typed returns, named arrays, destructuring | P0 | Stable |
| Overrides Pattern | `$overrides` array for exceptional cases | P1 | Stable |
| Method Lifecycle | Creating, reviewing, deprecating helpers | P2 | Emerging |

---

# Dependency Graph
```
ku-02-test-data-seeding
├── depends on: ku-01-test-data-factories (consumes factory states)
├── depends on: ku-03-test-data-cleanup (minimal data principle)
├── extends:   ku-04-test-data-relationships (relationship setup)
└── supports:  feature test readability (consumers)
```

---

# Boundary Analysis
- **In scope:** Declarative method design (single/multi/parameterized), trait organization, naming conventions (`create`/`make`), return type patterns, `$overrides` pattern, method lifecycle management.
- **Adjacent:** ku-01-test-data-factories defines the factory states these methods consume. ku-03-test-data-cleanup provides the minimal data principle that guides method scope. Test organization patterns (directory structure, naming) are in ku-05-test-organization-templates.
- **Out of scope:** Production code refactoring, base factory definition method, CI execution of tests using these helpers.

---

# Future Expansion Opportunities
- **Auto-generate declarative methods:** Tooling that scans test Arrange sections and suggests extraction to declarative methods.
- **Method usage analytics:** Detect unused or rarely-used factory methods for deprecation.
- **IDE navigation plugin:** Quick-jump to trait method definitions for test helper discovery.
