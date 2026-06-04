# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Event-Driven Architecture
**Knowledge Unit:** with-events-custom-listener-directories
**Generated:** 2026-06-03

---

# Decision Inventory

* Custom Listener Directory vs Default app/Listeners

---

# Architecture-Level Decision Trees

---

## Custom Listener Directory vs Default app/Listeners

---

### Decision Context

Whether to use the default `app/Listeners` directory or configure custom listener directories via `withEvents()`.

---

### Decision Criteria

* Modular/monolith architecture
* Domain-driven design organization
* Package vs application
* Team code organization preferences

---

### Decision Tree

Using domain-driven design (listeners in domain modules)?
YES → Use withEvents() to register each domain's listener directory
NO → Standard Laravel structure?
    YES → Default app/Listeners is sufficient
NO → Modular monolith (modules with own listeners)?
    YES → Register each module's listener directory via withEvents()
NO → Package development?
    YES → Use manual registration in service provider — withEvents() is app-level

---

### Rationale

`withEvents()` in `EventServiceProvider` allows registering additional listener directories beyond `app/Listeners`. This is useful for modular architectures where listeners live in domain modules.

---

### Recommended Default

**Default:** Use default `app/Listeners` for standard apps; `withEvents()` for modular/domain-driven architectures
**Reason:** Default works for most apps. Modular architectures benefit from co-locating listeners with their domain.

---

### Risks Of Wrong Choice

- Not registering custom directories: listeners in module directories never discovered
- Registering package directories via withEvents(): app should register manually
- Too many custom directories: discovery overhead, confusing organization

---

### Related Rules

- run-event-cache-in-production

---

### Related Skills

- Handle Event Auto-Discovery and Registration
