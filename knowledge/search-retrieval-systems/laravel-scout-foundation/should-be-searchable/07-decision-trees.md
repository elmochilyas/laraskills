# Metadata

**Domain:** Search & Retrieval Systems
**Subdomain:** Laravel Scout Foundation
**Knowledge Unit:** Shouldbesearchable
**Generated:** 2026-06-03

---

# Decision Inventory

1. Searchable Trait Implementation Strategy
2. Indexing Strategy Selection
3. Queue vs Synchronous Indexing Mode

---

# Architecture-Level Decision Trees

## Searchable Trait Implementation Strategy

---

### Decision Context

When implementing Shouldbesearchable in a Laravel Scout context, you must decide how to configure the searchable behavior for your Eloquent models.

### Decision Criteria

* performance
* maintainability

### Decision Tree

Does this model need to appear in search results?
|
YES -> Add Laravel Scout's Searchable trait to the model
    |
    Do you need to customize which fields are indexed?
    YES -> Override toSearchableArray() with only necessary fields
    NO -> Default behavior sends all attributes (not recommended)
NO -> Skip Scout integration for this model
|
Is the model related to other searchable content?
YES -> Denormalize related fields in toSearchableArray()
    Add eager loading via makeAllSearchableUsing()
NO -> No additional relation handling needed

### Rationale

The Searchable trait enables Scout features, but the default behavior of sending all model attributes to the index is rarely correct. Customizing toSearchableArray() ensures only relevant fields are indexed.

### Recommended Default

**Default:** Implement Searchable trait + customize toSearchableArray().
**Reason:** Balances search functionality with performance and security.

### Risks Of Wrong Choice

- No toSearchableArray override: index bloat and potential data exposure
- Missing eager loading: N+1 query explosion during batch import
- No shouldBeSearchable: unpublished records appear in search

### Related Rules

- Follow Best Practices for Shouldbesearchable

### Related Skills

- Configure and Implement Shouldbesearchable

---

## Indexing Strategy Selection

---

### Decision Context

When configuring Shouldbesearchable, you must decide between batch indexing, incremental indexing, or a combination of both strategies.

### Decision Criteria

* performance
* reliability

### Decision Tree

Is this a new search implementation?
|
YES -> Start with batch indexing via scout:import for initial population
    |
    After initial import, enable incremental indexing for ongoing sync
    |
    Do records have status-based visibility (published/draft)?
    YES -> Also implement shouldBeSearchable() for conditional indexing
    NO -> Standard incremental indexing is sufficient
NO -> Is this a recovery scenario (corruption/schema change)?
    YES -> Run batch re-index with scout:import
    NO -> Incremental indexing handles ongoing sync

### Rationale

A combined strategy (batch + incremental) provides both data freshness and recovery capability. Batch handles initial load and recovery; incremental keeps the index in sync day-to-day.

### Recommended Default

**Default:** Batch for initial import + queued incremental for ongoing sync.
**Reason:** Most reliable combination for production applications.

### Risks Of Wrong Choice

- Batch-only: index becomes stale between runs
- Incremental-only: no recovery mechanism for corruption
- No conditional indexing: restricted content exposed in search

### Related Rules

- Follow Best Practices for Shouldbesearchable

### Related Skills

- Configure and Implement Shouldbesearchable

---

## Queue vs Synchronous Indexing Mode

---

### Decision Context

For incremental indexing of Shouldbesearchable, you must decide between synchronous (immediate) or queue-based (async) index updates.

### Decision Criteria

* performance
* user-experience

### Decision Tree

Is this a production environment?
|
YES -> Enable queue-based indexing (SCOUT_QUEUE=true)
    |
    Does the app require immediate index consistency on every write?
    YES -> Use synchronous indexing (slower responses but immediate)
    NO -> Queue mode is the correct production choice
NO -> Is this a development/testing environment?
    YES -> Sync mode is acceptable for debugging simplicity
    NO -> Default to queue for safety

### Rationale

Sync indexing adds search engine round-trip latency to every write. Queue mode decouples index updates from HTTP responses, keeping API response times fast and providing retry on failure.

### Recommended Default

**Default:** Queue mode enabled (SCOUT_QUEUE=true) for production.
**Reason:** Keeps API response times fast and provides failure retry capability.

### Risks Of Wrong Choice

- Sync in production: slow responses and request timeouts
- Queue in development: harder to debug, delayed index updates

### Related Rules

- Follow Best Practices for Shouldbesearchable

### Related Skills

- Configure and Implement Shouldbesearchable

