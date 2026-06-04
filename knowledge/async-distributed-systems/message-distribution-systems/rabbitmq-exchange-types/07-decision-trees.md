# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Message Distribution Systems
**Knowledge Unit:** K036 — RabbitMQ Exchange Types
**Generated:** 2026-06-03

---

# Decision Inventory

* Exchange Type Selection: Direct vs Fanout vs Topic

---

# Architecture-Level Decision Trees

---

## Exchange Type Selection: Direct vs Fanout vs Topic

---

### Decision Context

Choosing the right RabbitMQ exchange type for message routing.

---

### Decision Criteria

* Routing precision requirements
* Number of consuming queues
* Message broadcast needs
* Routing key pattern complexity

---

### Decision Tree

Each message should go to exactly one queue based on routing key?
YES → Use Direct exchange — exact routing key match, O(1) routing
NO → Messages should go to ALL bound queues?
    YES → Use Fanout exchange — broadcast pattern, ignores routing key
NO → Need pattern-based routing (wildcards)?
    YES → Use Topic exchange — wildcard matching on routing keys
NO → Need routing based on message headers?
    YES → Use Headers exchange — matches on header key-value pairs

---

### Rationale

Direct exchange is the simplest and fastest — O(1) exact match routing. Fanout broadcasts to all queues. Topic enables flexible pattern matching. Headers is for complex metadata-based routing. Most Laravel queue use cases only need Direct.

---

### Recommended Default

**Default:** Use Direct exchange for standard Laravel queue patterns; Fanout for event broadcast; Topic for multi-service routing
**Reason:** Direct is simplest and fastest for point-to-point routing. Fanout is needed for pub/sub patterns. Topic is for flexible routing.

---

### Risks Of Wrong Choice

- Topic for exact routing: unnecessary pattern matching overhead
- Fanout when selective routing needed: all queues receive all messages
- Headers when simpler type suffices: adds complexity without benefit
- Non-durable exchange in production: exchange lost on broker restart

---

### Related Rules

- use-durable-exchanges-in-production

---

### Related Skills

- Configure RabbitMQ Message Distribution
