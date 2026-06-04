# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Queue Engineering
**Knowledge Unit:** K003 — QueueManager and Connector Pattern
**Generated:** 2026-06-03

---

# Decision Inventory

* Custom Queue Driver vs Built-in Driver
* Connector Registration Strategy

---

# Architecture-Level Decision Trees

---

## Custom Queue Driver vs Built-in Driver

---

### Decision Context

Whether to implement a custom queue driver (RabbitMQ, Kafka, Google Pub/Sub) or use one of Laravel's six built-in drivers.

---

### Decision Criteria

* Built-in driver support for required backend
* Development and maintenance cost of custom driver
* Contract compliance requirements
* Runtime stability implications

---

### Decision Tree

Backend supported by built-in drivers (Redis, SQS, Database, Beanstalkd)?
YES → Use built-in driver
NO → Need driver-specific behavior beyond standard operations?
    YES → Implement custom connector
    NO → Need different queue names only?
        YES → Use existing connection with multiple queues
        NO → Implement custom connector

---

### Rationale

Built-in drivers cover Redis, SQS, database, and Beanstalkd — the vast majority of use cases. Custom connectors require implementing the full `Queue` contract (`push`, `pop`, `delete`, `release`, `size`) and registering via service provider. Only justified for unsupported backends like RabbitMQ, Kafka, or Google Pub/Sub.

---

### Recommended Default

**Default:** Use built-in drivers; only implement custom connectors when the backend is unsupported
**Reason:** Built-in drivers are tested, documented, and maintained by the framework. Custom drivers carry maintenance burden and risk of contract incompatibility.

---

### Risks Of Wrong Choice

- Custom connector not implementing full Queue contract: runtime errors on first push
- Building custom driver when built-in suffices: unnecessary maintenance burden
- Extend() registration in routes: driver not registered in time

---

### Related Rules

- define-topology-before-deploying
- set-after-commit-per-connection

---

### Related Skills

- Select and Configure the Right Queue Driver
- Design Queue Topology with Connections and Queues

---

## Connector Registration Strategy

---

### Decision Context

How and where to register custom queue connectors — via service provider or at runtime.

---

### Decision Criteria

* Registration timing requirements
* Application architecture (package vs application)
* Runtime vs compile-time nature

---

### Decision Tree

Registering in a package?
YES → Use service provider boot method
NO → Need runtime registration flexibility?
    YES → Use Queue::extend() or Queue::addConnector() in service provider
    NO → Use service provider boot method

---

### Rationale

Custom connectors must be registered via service provider, not in routes or middleware. Service provider boot runs before middleware and controllers — the driver is registered before any queue operations happen. Extend() and addConnector() are for specialized runtime scenarios.

---

### Recommended Default

**Default:** Register custom connectors in a service provider's `boot()` method via `Queue::extend()`
**Reason:** Ensures the driver is registered before any queue operation runs, while keeping registration logic in a standard location.

---

### Risks Of Wrong Choice

- Registration in routes: connector not registered when worker boots
- Wrong registration timing: runtime error when connection resolution occurs

---

### Related Rules

- define-topology-before-deploying

---

### Related Skills

- Select and Configure the Right Queue Driver
