# ECC Anti-Patterns — Memory Profiling and Observability

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Long-Running Processes |
| **Knowledge Unit** | Memory Profiling and Observability |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Single-Point-in-Time Snapshots
2. Profiling Tool as Leak Source
3. Manual Memory Inspection in Production
4. Ignoring GC Statistics
5. Not Accounting for Zend MM Internals

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — memory profiling is about resource monitoring, not queries
- Premature Caching — N/A

---

## Anti-Pattern 1: Single-Point-in-Time Snapshots

### Category
Observability

### Description
Taking one memory snapshot at request end and declaring "no leak."

### Why It Happens
Traditional PHP-FPM profiling habit — one snapshot per request is sufficient in FPM.

### Warning Signs
- Memory measured only at request end
- No start-of-request baseline
- Single data point used for leak detection

### Why It Is Harmful
Accumulation is a trend, not a point. A worker using 100MB is fine if stable. One that grows from 50MB to 100MB to 150MB has a leak. Without tracking baseline over time, the leak is invisible.

### Preferred Alternative
Track start-of-request baseline and end-of-request delta. Log both for trend analysis.

### Detection Checklist
- [ ] Start-of-request memory not captured
- [ ] Only request-end snapshot
- [ ] Accumulation trend undetected

### Related Rules
Memory Profiling (05-rules.md): N/A

### Related Skills
Memory Profiling (06-skills.md): N/A

### Related Decision Trees
Memory Profiling (07-decision-trees.md): D01 — Memory Measurement Strategy.

---

## Anti-Pattern 2: Profiling Tool as Leak Source

### Category
Reliability

### Description
The monitoring tool itself accumulates data in static arrays — becoming the source of the leak.

### Why It Happens
Telescope watchers and custom profilers store data in static properties.

### Warning Signs
- Memory grows even when no requests processed
- Disabling profiling stops memory growth
- Profiler stores data in static arrays

### Why It Is Harmful
The tool you use to detect leaks may be causing them. Telescope watchers are known to leak if not configured for Octane. The profiler's own static array accumulation masks application leaks.

### Preferred Alternative
Configure Telescope for Octane (limited watchers). Profile with the tool, then disable it and verify memory stability.

### Detection Checklist
- [ ] Profiling tool stores data in statics
- [ ] Memory grows without request traffic
- [ ] Disabling profiler fixes leak

### Related Rules
Memory Profiling (05-rules.md): N/A

### Related Skills
Memory Profiling (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 3: Manual Memory Inspection in Production

### Category
Workflow

### Description
Running `var_dump(memory_get_usage())` on live traffic to check memory.

### Preferred Alternative
Use structured logging or metrics for memory tracking.

### Detection Checklist
- [ ] `var_dump` or `dd` in production
- [ ] Manual inspection without logging

### Related Rules
Memory Profiling (05-rules.md): N/A

### Related Skills
Memory Profiling (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: Ignoring GC Statistics

### Category
Observability

### Description
Not checking `gc_status()` — growing root count indicates circular references.

### Preferred Alternative
Monitor `gc_status()['roots']` — growing roots indicate uncollected cycles.

### Detection Checklist
- [ ] GC roots not monitored
- [ ] Root count growing over time

### Related Rules
Memory Profiling (05-rules.md): N/A

### Related Skills
Memory Profiling (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Not Accounting for Zend MM Internals

### Category
Knowledge

### Description
Using `memory_get_usage(true)` (OS allocation) to measure per-request deltas.

### Preferred Alternative
Use `memory_get_usage(false)` for actual usage; `true` for baseline trend.

### Detection Checklist
- [ ] `true` used for per-request delta
- [ ] OS allocation never shrinks — confusing results

### Related Rules
Memory Profiling (05-rules.md): N/A

### Related Skills
Memory Profiling (06-skills.md): N/A

### Related Decision Trees
N/A
