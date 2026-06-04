# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Event-Driven Architecture
**Knowledge Unit:** should-be-discovered-interface
**Generated:** 2026-06-03

---

# Decision Inventory

* ShouldBeDiscovered vs Manual Registration for Listener Control

---

# Architecture-Level Decision Trees

---

## ShouldBeDiscovered vs Manual Registration for Listener Control

---

### Decision Context

Whether to use `ShouldBeDiscovered` (Laravel 13.12+ opt-in discovery) or manually register listeners for explicit control.

---

### Decision Criteria

* Laravel version (13.12+ required)
* Need for per-listener opt-in to discovery
* Balance between convenience and control

---

### Decision Tree

Using Laravel 13.12+?
YES → Need some listeners auto-discovered, some not?
    YES → Use ShouldBeDiscovered — opt-in per listener class
NO → Need all listeners discovered?
    YES → Default auto-discovery without ShouldBeDiscovered
NO → Need explicit control (no auto-discovery at all)?
    YES → Manual registration in EventServiceProvider

---

### Rationale

`ShouldBeDiscovered` is an opt-in interface for auto-discovery. Only listeners implementing it are discovered. This was introduced in Laravel 13.12+ to provide finer-grained control than the all-or-nothing auto-discovery approach.

---

### Recommended Default

**Default:** Use `ShouldBeDiscovered` on listeners that should be auto-discovered (Laravel 13.12+); manual registration for listeners that need explicit control
**Reason:** Opt-in discovery provides the right balance — convenience of auto-discovery with explicit opt-in per listener.

---

### Risks Of Wrong Choice

- Not using ShouldBeDiscovered when available: all listeners discovered whether intended or not
- Manual registration for all: unnecessary boilerplate
- ShouldBeDiscovered on package listeners: hidden dependency on app's directory structure

---

### Related Rules

- run-event-cache-in-production

---

### Related Skills

- Handle Event Auto-Discovery and Registration
