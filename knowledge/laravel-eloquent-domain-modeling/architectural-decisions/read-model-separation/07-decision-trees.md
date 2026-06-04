# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Architectural Decisions
**Knowledge Unit:** Read Model Separation
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Read Model Separation vs Single Model for Both Reads and Writes
* Decision 2: Database View vs Queue-Based Projection System
* Decision 3: Real-Time Consistency vs Eventual Consistency for Read Models
* Decision 4: Read Model Indexing Strategy — Independent vs Shared

---

# Architecture-Level Decision Trees

---

## Decision 1: Read Model Separation vs Single Model for Both Reads and Writes

---

## Decision Context

Choose whether to create a separate read model (CQRS-lite) or use the same Eloquent model for both reading and writing data.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Does the read representation differ significantly from the write model's structure?
↓
YES → Read Model Separation
NO → Is read performance critical and the write model's query patterns are slow?
    YES → Read Model Separation
    NO → Does the read need data from multiple aggregates (dashboards, reports)?
        YES → Read Model Separation
        NO → Single Model

---

## Rationale

Read model separation optimizes the read side for presentation without constraining the write model's design. However, it adds maintenance overhead (projections, rebuild commands, monitoring). When read and write structures are identical and queries are simple, a single model is sufficient and avoids unnecessary complexity.

---

## Recommended Default

**Default:** Single model. Extract to a read model only when query patterns become painful, performance requires it, or the representation diverges significantly.
**Reason:** Premature read model separation adds projection code, rebuild commands, and eventual consistency without benefit. Start simple and extract when needed.

---

## Risks Of Wrong Choice

* Read model for every model: overhead without benefit, duplication of identical structures
* Single model for complex reads: slow queries, write model refactoring breaks queries, multiple joins on every read

---

## Related Rules

* Rule 1: Never call `save()`/`create()`/`update()`/`delete()` on a read model (`05-rules.md`)
* Rule 4: Use database views as the default read model (`05-rules.md`)

---

## Related Skills

* Create a View-Backed Read Model (`06-skills.md` Skill 1)
* Build a Projection System with Rebuild Command (`06-skills.md` Skill 2)

---

## Decision 2: Database View vs Queue-Based Projection System

---

## Decision Context

Choose between a simple database view (zero maintenance, always current) and a queue-based projection system (denormalized tables, eventual consistency) for implementing a read model.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Is a database view fast enough for the query pattern?
↓
YES → Is the view query too slow at scale (complex joins, large tables)?
    YES → Queue-Based Projection (denormalized table)
    NO → Database View (simplest approach)
NO → Does the read model need data from multiple bounded contexts?
    YES → Queue-Based Projection
    NO → Does the read model need transformation beyond what a view can do?
        YES → Queue-Based Projection
        NO → Database View

---

## Rationale

Database views are the simplest read model: no projection code, no event handlers, no queue infrastructure, always current. Queue-based projections offer better performance for complex aggregations but introduce eventual consistency, monitoring, and maintenance costs.

---

## Recommended Default

**Default:** Start with a database view. Migrate to a queue-based projection only when the view becomes a performance bottleneck.
**Reason:** Views have near-zero maintenance cost and always reflect current data. Projections require event handling, rebuild commands, and lag monitoring.

---

## Risks Of Wrong Choice

* Queue-based projection for view-suitable data: unnecessary complexity, projection lag, event handling code that must be maintained and monitored
* Database view for complex multi-context data: slow queries, database load, no caching structure

---

## Related Rules

* Rule 4: Use database views as the default read model before building a projection system (`05-rules.md`)
* Rule 2: Provide a rebuild Artisan command for every read model (`05-rules.md`)
* Rule 7: Monitor projection lag and alert on threshold breaches (`05-rules.md`)

---

## Related Skills

* Create a View-Backed Read Model (`06-skills.md` Skill 1)
* Build a Projection System with Rebuild Command (`06-skills.md` Skill 2)

---

## Decision 3: Real-Time Consistency vs Eventual Consistency for Read Models

---

## Decision Context

Determine whether a read model must reflect the write model's state in real-time or can tolerate a delay (eventual consistency).

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Does the user depend on immediately seeing their own writes?
↓
YES → Real-Time Consistency (synchronous projection or direct read from write model)
NO → Is the data displayed on dashboards, reports, or analytics?
    YES → Eventual Consistency (5-15 minute staleness acceptable)
    NO → Is the data a lookup or reference table?
        YES → Eventual Consistency (1-24 hour staleness acceptable)
        NO → Evaluate use case — default to real-time if uncertain

---

## Rationale

Real-time consistency ensures users always see their latest changes, but limits read model optimization options. Eventual consistency allows queue-based projections and caching but risks users seeing stale data. The acceptable staleness depends on the use case: dashboard reports can be 15 minutes stale, user-facing balances must be current.

---

## Recommended Default

**Default:** Document acceptable staleness per read model. Real-time for user-facing data. Eventual (5-15 min) for dashboards. Eventual (1-24 hr) for reference data.
**Reason:** Different use cases tolerate different delays. Without documented SLAs, developers assume real-time for all read models, leading to either over-engineering or disappointed users.

---

## Risks Of Wrong Choice

* Eventual consistency for user-facing data: users see stale balances, lose trust, report "bugs" that are actually lag
* Real-time for dashboards: slower page loads, no caching benefit, synchronous projections slow down write path

---

## Related Rules

* Rule 3: Define acceptable staleness per read model (`05-rules.md`)
* Rule 7: Monitor projection lag and alert on threshold breaches (`05-rules.md`)

---

## Related Skills

* Build a Projection System with Rebuild Command (`06-skills.md` Skill 2)

---

## Decision 4: Read Model Indexing Strategy — Independent vs Shared

---

## Decision Context

Choose whether to design read model indexes independently from the write model or use the same indexing strategy for both.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Are the read model's query patterns (filter, sort, aggregate) different from write model lookups?
↓
YES → Independent indexes optimized for read query patterns
NO → Is the read model backed by a database view on the same table as the write model?
    YES → Balance read and write performance on underlying table indexes
    NO → Independent indexes

---

## Rationale

Write model indexes optimize for transactional integrity and primary key lookups. Read model indexes should optimize for the filter, sort, and aggregation patterns of actual queries. Different access patterns require different indexes. When using database views on the same table, the underlying indexes must balance read and write performance.

---

## Recommended Default

**Default:** Design read model indexes independently based on actual query patterns. Use composite indexes with the most selective column first.
**Reason:** Forcing read queries to use write-optimized indexes results in full table scans and slow reports. Independent indexing is the primary performance benefit of read model separation.

---

## Risks Of Wrong Choice

* Same indexes for read and write: read queries perform full table scans, slow dashboards, indexes added reactively after incidents
* Over-indexing read models: slower projection writes, increased storage, unnecessary maintenance

---

## Related Rules

* Rule 5: Index read model tables independently from write model tables (`05-rules.md`)
* Rule 6: Never expose write-model columns in read models (`05-rules.md`)

---

## Related Skills

* Set Up Read Model Indexing (`06-skills.md` Skill 3)
