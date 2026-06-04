# Decision Trees — Controller-DTO-Service Flow

## Tree 1: Service vs Direct Action Delegation

**Decision Context**: Whether to introduce a service layer between the controller and actions or delegate from controller directly to actions.

**Decision Criteria**:
- Number of related operations per entity
- Dependency sharing across operations
- Controller injection complexity
- Application codebase size

**Decision Tree**:
```
Does the entity have 3+ related CRUD operations?
├── YES → Do these operations share 50%+ of their dependencies?
│   ├── YES → Create service — single controller injection, shared dependencies
│   └── NO → Keep actions — dependency sharing doesn't justify service grouping
└── NO → Would the controller need to inject 4+ individual actions?
    ├── YES → Create service facade — reduces injection points
    └── NO → Use direct action delegation — fewer layers, simpler
```

**Rationale**: Services are justified by shared dependencies or injection point reduction, not by file count preference.

**Recommended Default**: Create service when 3+ related operations share 50%+ dependencies. Otherwise, delegate to actions directly.

**Risks**: Premature service for 1-2 operations adds ceremony. Service as dumping ground for unrelated operations destroys cohesion.

---

## Tree 2: Service Dependency Injection Strategy

**Decision Context**: Whether to inject concrete service classes or interfaces in controllers.

**Decision Criteria**:
- Need for multiple service implementations
- Test mocking requirements
- Polymorphism needs

**Decision Tree**:
```
Does the service have multiple implementations (different storage backends, feature flags)?
├── YES → Inject interface — bind implementation in service provider
└── NO → Are you writing unit tests that mock the service?
    ├── YES → Inject interface — enables easy mocking via container binding
    └── NO → Inject concrete class — no interface ceremony for single-implementation services
```

**Rationale**: Interface injection is needed only when polymorphism is required (multiple implementations, decorators). Concrete injection is simpler for single-implementation services.

**Recommended Default**: Inject concrete classes by default. Add interfaces only when multiple implementations or test-specific mocks are needed.

**Risks**: Interfaces for every service create unnecessary file count. No interfaces for decoration-needing services makes adding caching/logging decorators harder.
