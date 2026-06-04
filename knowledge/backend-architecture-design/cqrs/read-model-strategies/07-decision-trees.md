# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** CQRS
**Knowledge Unit:** Read model strategies (denormalized tables, materialized views, in-memory)
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: In-memory transformation vs denormalized table vs materialized view
* Decision 2: Read model storage technology selection (SQL vs Elasticsearch vs Redis)
* Decision 3: Acceptable staleness window per read model

---

# Architecture-Level Decision Trees

---

## Decision: In-Memory Transformation vs Denormalized Table vs Materialized View

---

## Decision Context

Choose the read model implementation strategy based on query complexity and performance requirements.

---

## Decision Criteria

* performance considerations: in-memory is simplest; denormalized tables are fastest for reads
* architectural considerations: denormalized tables require projection infrastructure
* security considerations: all strategies can enforce field-level security
* maintainability considerations: in-memory requires no infrastructure; materialized views need DB support

---

## Decision Tree

Is the query result simple (< 3 joins, < 10ms on current hardware)?
↓
YES → In-memory transformation (compute at query time from write model, no infrastructure)
NO → Is the query result needed in real-time (< 100ms p99)?
    YES → Denormalized table (pre-computed, refreshed via projector)
    NO → Does the database support materialized views?
        YES → Materialized view (DB-managed refresh, less code than projectors)
        NO → Denormalized table with projector infrastructure
            ↓
            Does the data change infrequently (< 10 updates/day)?
            YES → Materialized view with manual refresh (simplest)
            NO → Denormalized table with event-driven projector

---

## Rationale

Start with the simplest strategy (in-memory) and escalate only when performance requirements force it. Denormalized tables provide the best read performance but require projector infrastructure. Materialized views are a middle ground when the database supports them.

---

## Recommended Default

**Default:** In-memory transformation for most queries; denormalized table only when < 10ms p99 is required.

**Reason:** In-memory transformation requires no infrastructure, no eventual consistency, and no projection maintenance. It works well for the majority of query patterns.

---

## Risks Of Wrong Choice

Denormalized tables without need: projection infrastructure overhead, eventual consistency complexity. In-memory for complex reads: slow queries, poor user experience, write model schema compromises.

---

## Related Rules

- Rule 1: Build read models via projectors listening to domain events, never via dual writes
- Rule 2: Denormalize aggressively — read models should be query-optimized, not normalized

---

## Related Skills

- Implement Read Model Strategies
- Implement Query Handlers

---

## Decision: Read Model Storage Technology Selection

---

## Decision Context

Choose the storage technology for read models based on query patterns and operational capacity.

---

## Decision Criteria

* performance considerations: Redis is fastest; SQL is most familiar; ES is best for search
* architectural considerations: each technology has different query capabilities
* security considerations: additional stores increase security surface and access control complexity
* maintainability considerations: each store adds operational burden

---

## Decision Tree

Does the query pattern require full-text search?
↓
YES → Elasticsearch/Meilisearch (purpose-built for search)
NO → Does the query require complex aggregations or reporting?
    YES → SQL read model (materialized view or denormalized table)
    NO → Is sub-millisecond read latency required?
        YES → Redis (in-memory, fastest reads)
        NO → Is the query a simple key-value lookup?
            YES → Redis (simple, fast)
            NO → SQL read model (relational, familiar, good enough for most)

---

## Rationale

Each storage technology has strengths: SQL for relational queries, Elasticsearch for search, Redis for low-latency key-value lookups. Default to SQL (most familiar, lowest operational overhead) and adopt specialized stores only when specific query patterns demand them.

---

## Recommended Default

**Default:** SQL denormalized tables as the primary read model store; add Elasticsearch for search and Redis for real-time lookups only when needed.

**Reason:** SQL is the most familiar, best-understood store with the lowest operational overhead. Specialized stores should be added only when SQL cannot meet the query pattern requirements.

---

## Risks Of Wrong Choice

Elasticsearch for everything: operational complexity, overkill for simple queries. SQL for full-text search: poor search capabilities, complex query building. Multiple stores without need: multiplied operational burden.

---

## Related Rules

- Rule 4: Choose read model storage based on query pattern, not defaulting to write model technology

---

## Related Skills

- Implement Read Model Strategies
- Implement Query Handlers

---

## Decision: Acceptable Staleness Window Per Read Model

---

## Decision Context

Determine the acceptable staleness window for each read model (how old the data can be before the read model is refreshed).

---

## Decision Criteria

* performance considerations: shorter staleness means more frequent updates
* architectural considerations: staleness window determines projection strategy (sync vs async)
* security considerations: stale read models may show outdated authorization state
* maintainability considerations: tighter staleness windows increase infrastructure load

---

## Decision Tree

Does the read model need to be strongly consistent with the write model?
↓
YES → Sync projection (update read model in same transaction; use outbox pattern)
NO → Can users tolerate seconds of staleness?
    YES → Is sub-second staleness acceptable?
        YES → Async projection with minimal delay (< 1s)
        NO → Is minute-level staleness acceptable?
            YES → Async projection with batch processing (efficient, higher latency)
            NO → Async projection with moderate delay (1-5s)
    NO → Sync projection (strong consistency required)

---

## Rationale

The staleness window determines projection strategy. Sync projections (outbox pattern) provide strong consistency but add transaction complexity. Async projections are simpler but introduce eventual consistency. Communicate the staleness window to users where possible.

---

## Recommended Default

**Default:** Async projection with < 5 second staleness for most read models; sync projection only when strong consistency is a hard requirement.

**Reason:** Async projections are simpler and sufficient for most use cases. Most business data doesn't require strong consistency for reads.

---

## Risks Of Wrong Choice

Sync projection without need: distributed transaction complexity, write-path slowdown. Async projection for strongly consistent needs: users see stale data, business logic errors.

---

## Related Rules

- Rule 3: Communicate the staleness window clearly to consumers

---

## Related Skills

- Implement Read Model Strategies
- Implement Outbox Pattern
