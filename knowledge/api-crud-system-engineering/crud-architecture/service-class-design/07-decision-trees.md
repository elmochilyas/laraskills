# Decision Trees — Service Class Design

## Tree 1: Entity-Oriented vs Capability-Oriented

**Decision Context**: Choosing between entity-oriented naming (UserService) and capability-oriented naming (AuthenticationService).

**Decision Criteria**:
- Domain cohesion (do methods naturally group by entity or by process?)
- Cross-entity operations
- Team familiarity

**Decision Tree**:
```
Are all service methods related to a single entity (UserService: register, update, suspend)?
├── YES → Entity-oriented — predictable navigation, natural grouping
└── NO → Do the methods form a cross-cutting business process (CheckoutService, RefundService)?
    ├── YES → Capability-oriented — cohesive by process, spans entities
    └── NO → Are methods split by CRUD vs business operations?
        ├── YES → Split into entity-oriented service for CRUD + capability-oriented for business
        └── NO → Entity-oriented as default — rename when cohesion becomes problematic
```

**Rationale**: Entity-oriented is the default because it provides predictable navigation. Capability-oriented is for cross-cutting processes that span entities.

**Recommended Default**: Entity-oriented (UserService, OrderService). Switch to capability-oriented (AuthenticationService, CheckoutService) for cross-entity processes.

**Risks**: Entity-oriented with unrelated methods creates fat services. Capability-oriented for simple CRUD hides which entity the service manages.

---

## Tree 2: Service Bloat Detection

**Decision Context**: Determining when a service has grown too large and needs to be split.

**Decision Criteria**:
- Constructor dependency count
- Public method count
- Dependency overlap between methods
- Cohesion score

**Decision Tree**:
```
Does the service have 5+ constructor dependencies?
├── YES → Warning — dependencies exceed the 5-dependency threshold
│   Do the methods share 50%+ of these dependencies?
│   ├── YES → Acceptable if method count is <10 — high cohesion justifies dependencies
│   └── NO → Split — methods with different dependency profiles belong in different services
└── NO → Does the service have 10+ public methods?
    ├── YES → Do the methods share 50%+ of dependencies across all methods?
    │   ├── YES → Review carefully — may need extraction to sub-services
    │   └── NO → Split — low overlap means low cohesion
    └── NO → Service is healthy — monitor as it grows
```

**Rationale**: Dependency count and method count are health signals. The key metric is dependency overlap — if methods don't share dependencies, they don't belong together.

**Recommended Default**: Split when dependency count >5 AND overlap <50%, or method count >10. Monitor proactively.

**Risks**: Splitting too early creates services that should be action classes. Not splitting allows god services to grow unmanageable.
