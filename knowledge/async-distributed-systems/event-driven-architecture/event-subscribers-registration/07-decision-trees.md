# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Event-Driven Architecture
**Knowledge Unit:** event-subscribers-registration
**Generated:** 2026-06-03

---

# Decision Inventory

* Event Subscriber vs Individual Listener Classes
* Manual Registration vs Auto-Discovery for Subscribers

---

# Architecture-Level Decision Trees

---

## Event Subscriber vs Individual Listener Classes

---

### Decision Context

Whether to use an event subscriber (single class handling multiple events) or individual listener classes.

---

### Decision Criteria

* Logical grouping of related events
* Subscriber reusability
* Class size and maintainability
* Testing granularity

---

### Decision Tree

Multiple events are logically related (all User* events)?
YES → Use subscriber — co-locates related handling
NO → Events are unrelated (OrderShipped + UserRegistered)?
    YES → Individual listeners — separation of concerns
NO → Subscriber would have >5 methods?
    YES → Individual listeners — subscriber becomes too large
NO → Need to dynamically subscribe/unsubscribe at runtime?
    YES → Subscriber with subscribe() method — dynamic registration

---

### Rationale

Subscribers group related event handling in one class. They're useful for domain boundaries (User events, Order events). Individual listeners are better for unrelated events and when subscriber classes would become too large.

---

### Recommended Default

**Default:** Use subscribers for logically related events (same domain); individual listeners for unrelated events
**Reason:** Subscribers keep domain logic co-located. Individual listeners maintain separation of concerns for unrelated events.

---

### Risks Of Wrong Choice

- Subscriber for unrelated events: single class handles too many concerns
- Individual listeners for related events: scattered logic, harder to find all User* handlers
- Subscriber with too many methods: violates Single Responsibility Principle

---

### Related Rules

- run-event-cache-in-production

---

### Related Skills

- Handle Event Auto-Discovery and Registration
- Configure Queued Event Listeners
