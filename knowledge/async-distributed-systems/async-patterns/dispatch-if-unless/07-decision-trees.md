# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Async Patterns
**Knowledge Unit:** dispatch-if-unless
**Generated:** 2026-06-03

---

# Decision Inventory

* dispatchIf/dispatchUnless vs Conditional Block

---

# Architecture-Level Decision Trees

---

## dispatchIf/dispatchUnless vs Conditional Block

---

### Decision Context

Whether to use `dispatchIf()`/`dispatchUnless()` or a conditional block wrapping `dispatch()`.

---

### Decision Criteria

* Conditional complexity
* Code readability preference
* PendingDispatch overhead concern

---

### Decision Tree

Condition is a simple boolean?
YES → Use dispatchIf() / dispatchUnless() — explicit, clean
NO → Condition requires multiple checks or try/catch?
    YES → Use conditional block — more flexible for complex logic
NO → Always dispatch?
    YES → Use dispatch() directly — no condition needed
NO → Default?
    YES → Use dispatchIf() — clearer intent than conditional dispatch()

---

### Rationale

`dispatchIf()` and `dispatchUnless()` bypass `PendingDispatch` entirely and dispatch immediately (or not at all) based on the condition. They make conditional intent explicit without the overhead of creating a `PendingDispatch` object in a conditional branch.

---

### Recommended Default

**Default:** Use `dispatchIf()` for simple conditional dispatch; conditional block for complex conditions
**Reason:** `dispatchIf()` clearly communicates intent. Conditional blocks are more flexible for complex logic with side effects.

---

### Risks Of Wrong Choice

- dispatchIf with complex condition: callback-based syntax is awkward for multi-line conditions
- Conditional block for simple condition: more verbose than dispatchIf
- Wrapping dispatch() in condition without understanding: creates PendingDispatch even when condition is false

---

### Related Rules

- set-after-commit-at-connection-level

---

### Related Skills

- Configure Async Patterns and Transactional Safety
