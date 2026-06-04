# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Event-Driven Architecture
**Knowledge Unit:** wildcard-event-listener-discovery
**Generated:** 2026-06-03

---

# Decision Inventory

* Wildcard (*) vs Explicit Event Matching

---

# Architecture-Level Decision Trees

---

## Wildcard (*) vs Explicit Event Matching

---

### Decision Context

Whether to use wildcard event patterns (`Order*`, `User.*`) or explicitly register listeners for each event class.

---

### Decision Criteria

* Number of events in the pattern group
* Need for precise matching
* Performance of wildcard resolution
* Intent clarity

---

### Decision Tree

All events matching a pattern need the same handling (audit log, metrics)?
YES → Wildcard acceptable — single listener for multiple events
NO → Only specific events need the handler?
    YES → Explicit registration — precise control
NO → Pattern group is small (<5 events)?
    YES → Explicit registration is practical — wildcard isn't necessary
NO → Events follow a clear naming convention?
    YES → Wildcard with convention — OrderCreated, OrderUpdated, OrderDeleted
NO → Default?
    YES → Explicit registration — safer, more explicit

---

### Rationale

Wildcard listeners catch multiple events with a single pattern. They're useful for cross-cutting concerns (logging, metrics, audit). Explicit registration is safer for business logic where precision matters.

---

### Recommended Default

**Default:** Use wildcards for cross-cutting concerns (audit, metrics, logging); explicit registration for business logic
**Reason:** Cross-cutting concerns benefit from broad matching. Business logic needs precision to avoid unintended handling.

---

### Risks Of Wrong Choice

- Wildcard catching unintended events: wrong listener fires for unexpected event
- Explicit registration for all: missed events when adding new ones
- Wildcard without naming convention: pattern mismatch, events missed

---

### Related Rules

- run-event-cache-in-production

---

### Related Skills

- Handle Event Auto-Discovery and Registration
