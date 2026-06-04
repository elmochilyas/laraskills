# ECC Anti-Patterns — Octane Architecture Overview

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Long-Running Processes |
| **Knowledge Unit** | Octane Architecture Overview |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Blind Singleton-to-Scoped Conversion
2. Ignoring Static Properties
3. No max_requests
4. Sharing Octane Workers with Horizon
5. Treating Octane as "Drop-In Faster Laravel"

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — Octane addresses bootstrap overhead, not query performance
- Premature Caching — Octane already caches the booted framework — caching decisions differ

---

## Anti-Pattern 1: Blind Singleton-to-Scoped Conversion

### Category
Performance

### Description
Converting every singleton to scoped "just to be safe" without understanding which services need persistence.

### Why It Happens
Developers overreact to singleton leak warnings without analyzing each binding.

### Warning Signs
- All bindings registered as `scoped()`
- Connection pools, config readers, loggers converted to scoped
- Sandbox creation time increased 10-20ms per request

### Why It Is Harmful
Scoped bindings add ~0.5-2ms overhead per binding per request. Converting safe singletons (config readers, HTTP clients, connection pools) to scoped adds unnecessary overhead and breaks lazy-loaded singletons that need persistence (database connection pooling).

### Preferred Alternative
Audit each binding individually. Only convert singletons with mutable per-request state to scoped.

### Detection Checklist
- [ ] All singletons converted to scoped
- [ ] Infrastructure services (config, HTTP, DB) converted
- [ ] Sandbox creation time > 10ms

### Related Rules
Octane Overview (05-rules.md): N/A

### Related Skills
Octane Overview (06-skills.md): N/A

### Related Decision Trees
Octane Overview (07-decision-trees.md): D01 — Singleton vs Scoped Decision.

---

## Anti-Pattern 2: Ignoring Static Properties

### Category
Reliability

### Description
Focusing only on container singletons while static properties accumulate memory unbounded.

### Preferred Alternative
Audit both container bindings and static property usage.

### Detection Checklist
- [ ] Only container bindings audited
- [ ] Static accumulation ignored

### Related Rules
Octane Overview (05-rules.md): N/A

### Related Skills
Octane Overview (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 3: No max_requests

### Category
Reliability

### Description
Setting `max_requests` to 0 or null — no safety valve for memory leaks.

### Preferred Alternative
Always set `max_requests` based on leak profile.

### Detection Checklist
- [ ] `max_requests=0` or null
- [ ] No worker recycling

### Related Rules
Octane Overview (05-rules.md): N/A

### Related Skills
Octane Overview (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: Sharing Octane Workers with Horizon

### Category
Architecture

### Description
Running queue workers in the same process as Octane workers.

### Preferred Alternative
Run Octane and Horizon in separate process pools.

### Detection Checklist
- [ ] Queue and HTTP in same worker
- [ ] State corruption

### Related Rules
Octane Overview (05-rules.md): N/A

### Related Skills
Octane Overview (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Treating Octane as "Drop-In Faster Laravel"

### Category
Knowledge

### Description
Deploying Octane without auditing service bindings for safety.

### Preferred Alternative
Full binding audit and state safety review before Octane deployment.

### Detection Checklist
- [ ] No pre-deployment audit
- [ ] Binding safety not assessed

### Related Rules
Octane Overview (05-rules.md): N/A

### Related Skills
Octane Overview (06-skills.md): N/A

### Related Decision Trees
N/A
