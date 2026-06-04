# Decision Trees — Controller-Service-Repository Flow

## Tree 1: Full Stack vs Simplified Approach

**Decision Context**: Whether to implement the full Controller-Service-Repository stack or use a simpler approach for a given entity.

**Decision Criteria**:
- Entity query complexity
- Multi-tenancy requirements
- Caching needs
- Database swap likelihood
- Application size

**Decision Tree**:
```
Does the entity have complex query logic (multi-tenant scoping, conditional filters, multiple sort options)?
├── YES → Full stack: Controller → Service → Repository Interface → Repository Implementation
└── NO → Is multi-tenancy required with automatic query scoping?
    ├── YES → Full stack — repository enforces tenant scoping on all queries
    └── NO → Is centralized caching needed at the data access layer?
        ├── YES → Full stack — decorator pattern at repository level for caching
        └── NO → Is the application >100k LOC with strict data access governance?
            ├── YES → Full stack — layer isolation rules need enforcement points
            └── NO → Simpler approach (Controller-DTO-Action or Controller-DTO-Service) — ceremony not justified
```

**Rationale**: The full stack is justified by concrete needs (multi-tenancy, caching, complex queries). Without those needs, the ceremony outweighs benefits.

**Recommended Default**: Simplified approach (Controller-DTO-Action or Controller-DTO-Service) for most entities. Full stack only for entities with complex data access requirements.

**Risks**: Full stack for simple entities creates resentment against the architecture. Simplified approach for multi-tenant entities risks data leakage.

---

## Tree 2: Repository Interface Granularity

**Decision Context**: Choosing between single CRUD interface, separate read/write interfaces, or criteria-based methods.

**Decision Criteria**:
- Query vs command complexity ratio
- Number of query variations
- Need for read optimization

**Decision Tree**:
```
Does the entity have significantly different read and write optimization needs?
├── YES → Separate read/write interfaces (CQRS-light) — optimize reads independently
└── NO → Does the entity have 5+ distinct query variations?
    ├── YES → Criteria/query objects — one search method with typed criteria object
    └── NO → Classic CRUD interface — find, findAll, paginate, create, update, delete
```

**Rationale**: CQRS-light separation allows independent optimization. Criteria objects prevent method explosion. Classic CRUD interface is sufficient for simple entities.

**Recommended Default**: Classic CRUD interface for 80% of entities. Criteria objects for entities with complex filtering. CQRS-light for entities with different read/write patterns.

**Risks**: Criteria objects add complexity for simple queries. CQRS-light separation adds interface count for entities that don't benefit from it.
