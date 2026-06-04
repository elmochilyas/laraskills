# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** JIT Compilation
**Knowledge Unit:** DynASM Framework Internals
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Whether to debug JIT compilation at DynASM level | Debug | Analyze |
| 2 | Register allocation mode selection (R in CRTO) | Configuration | Tune |

---

# Architecture-Level Decision Trees

---

## Decision: Debugging JIT at DynASM Level

---

## Decision Context

DynASM is the code generation backend. Debugging at this level is only needed when JIT produces incorrect results or segfaults.

---

## Decision Criteria

* **performance** — debug output adds overhead
* **architectural** — understanding IR pipeline helps diagnose type guard issues
* **maintainability** — only for development/staging, never production

---

## Decision Tree

Is there a confirmed JIT-related bug (segfault, incorrect results)?
↓
**NO** → Don't debug at DynASM level. Use higher-level tools (opcache_get_status).
**YES** → Proceed with DynASM debugging.

---

Is this in production or development?
↓
**Production** → Do NOT enable jit_debug. Disable JIT temporarily if needed.
**Development/Staging** → Enable opcache.jit_debug=1 to see compilation decisions.

---

Is the issue architecture-specific (x86-64 vs ARM64)?
↓
**YES** → Test on both architectures. DynASM codegen differs significantly.
**NO** → Issue is likely type-related; check guard failure rate first.

---

What does guard failure monitoring show?
↓
**High guard failure rate** → Fix type declarations first. Guard failures cause bailout to interpreter.
**Low guard failure rate** → May be a DynASM codegen bug; file a bug report.

---

## Rationale

DynASM debugging is rarely needed for application developers. Most JIT issues are caused by type inference failures or buffer fragmentation. Only use DynASM debug output when a genuine JIT compiler bug is suspected.

---

## Recommended Default

**Default:** Monitor guard failures and compilation counters via opcache_get_status() instead of DynASM debug.
**Reason:** Higher-level monitoring covers 95% of JIT issues without debug overhead.

---

## Risks Of Wrong Choice

* Enabling jit_debug in production: performance overhead
* Ignoring guard failures at high level: DynASM-level debugging won't help

---

## Related Rules

* Use JIT Debug Output Only in Development
* Check Guard Failure Rate First

---

## Related Skills

* DynASM Framework Internals
