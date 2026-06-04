# ECC Anti-Patterns — Static Property Accumulation

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Long-Running Processes |
| **Knowledge Unit** | Static Property Accumulation |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Static Property as Request Cache
2. Ignoring Third-Party Statics
3. No Cleanup in RequestTerminated
4. Over-Relying on `max_requests`
5. Confusing Static Leaks with Singleton Leaks

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — static accumulation is about memory management, not queries
- Premature Caching — N/A

---

## Anti-Pattern 1: Static Property as Request Cache

### Category
Reliability

### Description
Using `static::$cache[$key] = $value` for per-request memoization.

### Why It Happens
Static caches are fast and convenient.

### Warning Signs
- `static::$cache` arrays that grow with unique keys per request
- Memoization pattern using static properties
- Memory baseline growing over time

### Why It Is Harmful
Static properties survive across all requests. If each request adds a unique key to the static cache, it grows unbounded. After thousands of requests, OOM.

### Preferred Alternative
Use scoped bindings for per-request memoization. Statics should only be used for truly permanent data.

### Detection Checklist
- [ ] `static::$cache` with per-request unique keys
- [ ] Static array growing across requests
- [ ] Memory baseline increasing

### Related Rules
Static Properties (05-rules.md): N/A

### Related Skills
Static Properties (06-skills.md): N/A

### Related Decision Trees
Static Properties (07-decision-trees.md): D01 — Static vs Instance Cache.

---

## Anti-Pattern 2: Ignoring Third-Party Statics

### Category
Reliability

### Description
Assuming only application code has static accumulators — vendor code has them too.

### Preferred Alternative
Audit vendor packages for static accumulation patterns.

### Detection Checklist
- [ ] Only app code checked
- [ ] Vendor statics ignored

### Related Rules
Static Properties (05-rules.md): N/A

### Related Skills
Static Properties (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 3: No Cleanup in RequestTerminated

### Category
Reliability

### Description
Not registering cleanup listeners for known leaky classes.

### Preferred Alternative
Register `RequestTerminated` listeners to clear known static accumulators.

### Detection Checklist
- [ ] No cleanup listeners
- [ ] Statics accumulate until OOM

### Related Rules
Static Properties (05-rules.md): N/A

### Related Skills
Static Properties (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: Over-Relying on `max_requests`

### Category
Architecture

### Description
Lowering `max_requests` instead of fixing the leak — masking the symptom.

### Preferred Alternative
Fix the leak at the source. Use `max_requests` as safety net, not primary defense.

### Detection Checklist
- [ ] `max_requests` lowered to mask leaks
- [ ] Leak root cause not addressed

### Related Rules
Static Properties (05-rules.md): N/A

### Related Skills
Static Properties (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Confusing Static Leaks with Singleton Leaks

### Category
Knowledge

### Description
Applying singleton fix to a static property problem — wrong fix, no effect.

### Preferred Alternative
Recognize statics are class-bound, not container-bound. Use different fix strategies.

### Detection Checklist
- [ ] Static leaks misdiagnosed as singleton
- [ ] Wrong fix applied

### Related Rules
Static Properties (05-rules.md): N/A

### Related Skills
Static Properties (06-skills.md): N/A

### Related Decision Trees
N/A
