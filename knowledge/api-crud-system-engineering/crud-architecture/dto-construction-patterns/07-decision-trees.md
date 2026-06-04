# Decision Trees — DTO Construction Patterns

## Tree 1: Named Constructor Selection

**Decision Context**: Choosing which named constructors to provide on a DTO — fromArray, fromRequest, fromModel.

**Decision Criteria**:
- Data source types (HTTP request, Eloquent model, external API, CLI input)
- Number of distinct data sources
- Mapping complexity per source

**Decision Tree**:
```
Is the DTO constructed from HTTP request data?
├── YES → Provide fromRequest() — maps validated request data to DTO properties
└── NO → Is the DTO constructed from Eloquent model data?
    ├── YES → Provide fromModel() — maps model attributes to DTO properties (with type coercion as needed)
    └── NO → Is the DTO constructed from multiple sources (request + model + external)?
        ├── YES → Provide fromArray() as the base factory, plus source-specific named constructors that compose fromArray
        └── NO → Does the DTO have only one caller with trivial mapping?
            ├── YES → Direct constructor call — no named constructor needed
            └── NO → Provide fromArray() — covers all array-based construction
```

**Rationale**: Named constructors document the data source and encapsulate source-specific mapping logic.

**Recommended Default**: Provide fromArray() for every DTO. Add fromRequest() and fromModel() when those data sources are used.

**Risks**: Too many named constructors (4+) suggest the DTO serves too many contexts. Too few force callers to implement their own mapping logic.

---

## Tree 2: Factory Extraction Decision

**Decision Context**: Whether to keep DTO construction as static named constructors on the DTO class or extract to a separate factory class.

**Decision Criteria**:
- Construction complexity (needs database lookups, API calls)
- Number of factory methods per DTO
- Factory dependencies (needs injected services)

**Decision Tree**:
```
Does DTO construction require injected dependencies (database, API client, repository)?
├── YES → Extract to instance factory class with constructor injection — static methods can't inject dependencies
└── NO → Does the DTO have 4+ named constructors with complex mapping logic?
    ├── YES → Extract to factory class — keeps DTO class focused on data transport
    └── NO → Static named constructors on DTO class — simpler, co-located with DTO
```

**Rationale**: Static named constructors are sufficient for pure data mapping. Instance factories are needed when construction requires injected dependencies, and beneficial when there are many complex factories.

**Recommended Default**: Static named constructors on DTO for 1-3 factories. Instance factory for 4+ factories or dependency needs.

**Risks**: Extracting to factory too early adds an extra class. Keeping complex construction on the DTO violates the "pure data carrier" principle.
