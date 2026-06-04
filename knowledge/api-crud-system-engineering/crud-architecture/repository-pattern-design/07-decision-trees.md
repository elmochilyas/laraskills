# Decision Trees — Repository Pattern Design

## Tree 1: Repository Necessity

**Decision Context**: Whether to use a repository for a given entity or access Eloquent directly.

**Decision Criteria**:
- Query complexity
- Multi-tenancy scoping needs
- Caching requirements
- Number of call sites for the same query

**Decision Tree**:
```
Does the entity have complex query logic (conditional filters, dynamic sorting, search)?
├── YES → Use repository — centralize and reuse complex query logic
└── NO → Does the entity require multi-tenant scoping on every query?
    ├── YES → Use repository — enforce tenant scoping at the data access layer
    └── NO → Does the entity need caching at the data access layer?
        ├── YES → Use repository — decorator pattern for transparent caching
        └── NO → Use direct Eloquent — repository adds ceremony without benefit
```

**Rationale**: Repositories earn their existence through query centralization, scoping enforcement, or caching decoration. Direct Eloquent is the default for simple entities.

**Recommended Default**: Direct Eloquent for simple entities. Repository only when query complexity, multi-tenancy, or caching justifies it.

**Risks**: Repository for every entity creates ceremony without benefit. Direct Eloquent for complex entities scatters query logic across call sites.

---

## Tree 2: Interface vs Concrete Class

**Decision Context**: Whether to create an interface for each repository or use concrete classes directly.

**Decision Criteria**:
- Number of implementations per repository
- Need for decorators (caching, logging, scoping)
- Test mocking requirements

**Decision Tree**:
```
Does the repository have multiple implementations (Eloquent + in-memory + external API)?
├── YES → Interface required — container binding maps interface to current implementation
└── NO → Do you need a decorator (caching, logging, scoping wrapper)?
    ├── YES → Interface required — decorator implements the same interface
    └── NO → Concrete class without interface — PHP 8 allows constructor promotion directly from concrete class
```

**Rationale**: Interfaces add value when there are multiple implementations or decorators. For single-implementation repositories, concrete injection is simpler.

**Recommended Default**: Concrete class for single-implementation repositories. Add interface when a second implementation or decorator is needed.

**Risks**: Interface for every repository adds file count without value. No interface for decoration-needing repositories makes adding a caching layer harder.
