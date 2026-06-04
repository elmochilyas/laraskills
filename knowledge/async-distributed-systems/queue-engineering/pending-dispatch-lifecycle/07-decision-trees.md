# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Queue Engineering
**Knowledge Unit:** K007 — PendingDispatch Lifecycle
**Generated:** 2026-06-03

---

# Decision Inventory

* dispatch() Assignment vs Fire-and-Forget
* dispatchIf/dispatchUnless vs Conditional dispatch()

---

# Architecture-Level Decision Trees

---

## dispatch() Assignment vs Fire-and-Forget

---

### Decision Context

Whether to assign the result of `dispatch()` to a variable or use it as a fire-and-forget expression. Assignment delays actual dispatch until the variable goes out of scope.

---

### Decision Criteria

* Need for further chaining after dispatch
* Understanding of destructor timing
* Conditional dispatch requirements
* Scope management

---

### Decision Tree

Need to chain methods after dispatch()?
YES → Assign to variable: $job = MyJob::dispatch(...)->onQueue('high')
NO → Need conditional dispatch?
    YES → Use dispatchIf()/dispatchUnless() instead
NO → Fire-and-forget pattern?
    YES → Don't assign: MyJob::dispatch(...) — dispatches at expression end

---

### Rationale

`PendingDispatch` dispatches in its destructor, not at the `dispatch()` call. Assigning to a variable keeps it alive — dispatch happens when the variable goes out of scope at method end. Fire-and-forget dispatches immediately.

---

### Recommended Default

**Default:** Fire-and-forget `MyJob::dispatch(...)` for standard dispatch; assign only when chaining methods
**Reason:** Avoids unexpected dispatch timing bugs. Assignment-based dispatch introduces scope-dependent behavior that's easy to miss.

---

### Risks Of Wrong Choice

- Assigning without understanding: job dispatches at method end, not at dispatch() call
- Chaining on expression: PHP allows it but scope is confusing
- Exception in chain with assignment: destructor never fires, job silently lost

---

### Related Rules

- dont-assign-dispatch-unless-needed
- use-dispatchIf-for-conditional-dispatch

---

### Related Skills

- Design Queue Topology with Connections and Queues

---

## dispatchIf/dispatchUnless vs Conditional dispatch()

---

### Decision Context

Whether to use `dispatchIf()`/`dispatchUnless()` or wrap `dispatch()` in a conditional block.

---

### Decision Criteria

* Code clarity and intent
* PendingDispatch overhead
* Conditional complexity

---

### Decision Tree

Condition is simple (single boolean)?
YES → Prefer dispatchIf() / dispatchUnless() — explicit intent
NO → Complex condition with multiple checks?
    YES → Use conditional block with dispatch() inside
    NO → Always dispatch?
    YES → Use dispatch() directly

---

### Rationale

`dispatchIf()` and `dispatchUnless()` bypass `PendingDispatch` entirely and dispatch immediately. They make conditional intent explicit without the overhead of creating and destroying a `PendingDispatch` object in a conditional branch.

---

### Recommended Default

**Default:** Use `dispatchIf()` for conditional dispatch and `dispatchUnless()` for negative conditional dispatch
**Reason:** Clearer intent, no PendingDispatch overhead, immediate dispatch semantics.

---

### Risks Of Wrong Choice

- Conditional wrapping dispatch(): creates PendingDispatch even when condition is false
- Complex conditions with dispatchIf: callback-based syntax can be less readable
- Missing condition entirely: jobs dispatched when they shouldn't be

---

### Related Rules

- use-dispatchIf-for-conditional-dispatch

---

### Related Skills

- Design Queue Topology with Connections and Queues
