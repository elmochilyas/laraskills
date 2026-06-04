# Anti-Patterns: Memory Limit Configuration — memory_limit Directive, Per-Request vs Process Limits, pm.max_children Relationship

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Memory Management & Garbage Collection |
| Knowledge Unit | Memory Limit Configuration — memory_limit Directive, Per-Request vs Process Limits, pm.max_children Relationship |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Ignoring zval Memory Overhead for Scalars vs Compounds | Performance | High |
| 2 | Copy-On-Write Violation - Unnecessary Array Duplication | Performance | High |
| 3 | Ignoring Cyclic Garbage Collection Overhead | Configuration | Medium |
| 4 | Memory Leak in Long-Running Workers | Operations | Critical |
| 5 | Oversized Memory Limit Masking Waste | Configuration | Medium |

## Repository-Wide Anti-Patterns

- **Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- **Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.

---

## Anti-Pattern 1: Ignoring zval Memory Overhead for Scalars vs Compounds

### Category
Performance

### Description
Using compound types (strings, arrays, objects) for frequently-accessed data where scalars would suffice, ignoring that scalars are stored inline in the 16-byte zval while compounds require heap allocation, refcounting, and pointer dereferencing.

### Why It Happens
Developers default to strings or arrays for all data without considering the memory model. Convenience masks the allocation cost.

### Warning Signs
Profiler shows high allocation rate in zend_string_create or zend_array_dup. Hot-path functions return arrays where typed properties would work.

### Why Harmful
Scalars avoid heap allocation entirely, while each compound type triggers multiple allocations + refcount ops. On hot paths, 5-100x more memory.

### Consequences
2-5x more memory per request. Higher allocation/deallocation cost. Cumulative memory growth in persistent runtimes.

### Alternative
Use scalar types (int, float, bool) for hot-path data. Use typed properties instead of associative arrays for structured data.

### Refactoring Strategy
1. Profile allocation-heavy functions. 2. Replace string flags with int/bool constants. 3. Convert associative arrays to typed DTOs. 4. Verify memory reduction.

### Detection Checklist
- [ ] Hot-path data uses scalars
- [ ] No unnecessary string allocations in loops
- [ ] Profiling confirms reduced allocation

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Memory Limit Configuration — memory_limit Directive, Per-Request vs Process Limits, pm.max_children Relationship
- 05-rules.md: Prefer scalar types for frequently-accessed data
- 05-rules.md: Use typed properties over arrays for structured data
- 06-skills.md: Apply PHP Memory Model Knowledge to Optimize Memory Usage
- 07-decision-trees.md: Per-Request vs Persistent Memory Strategy

---

## Anti-Pattern 2: Copy-On-Write Violation - Unnecessary Array Duplication

### Category
Performance

### Description
Forcing PHP to duplicate arrays by writing to a variable that shares the same zval, ignoring COW semantics and causing unnecessary memory copy.

### Why It Happens
Lack of understanding of copy-on-write. Many developers believe assignment always copies, leading to defensive coding.

### Warning Signs
Explicit copy then immediate modification. foreach with &$value. array_merge used on single arrays.

### Why Harmful
COW allows sharing until modification. Breaking it early forces unnecessary allocation, defeating optimization.

### Consequences
2-3x memory for array-heavy code. Slower execution from unnecessary copies. Increased GC pressure.

### Alternative
Trust COW semantics. Only copy when genuinely needed. Use references only when necessary.

### Refactoring Strategy
1. Remove explicit copies. 2. Replace array_merge($arr) with just $arr. 3. Fix foreach with &$value. 4. Use SplFixedArray for fixed-size arrays.

### Detection Checklist
- [ ] No unnecessary copies
- [ ] COW verified via debug_zval_refcount
- [ ] No foreach &$value in hot paths

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Memory Limit Configuration — memory_limit Directive, Per-Request vs Process Limits, pm.max_children Relationship
- 05-rules.md: Never modify arrays in foreach by reference
- 05-rules.md: Trust COW semantics
- 06-skills.md: Optimize Array and String Memory Usage with COW Awareness
- 07-decision-trees.md: COW Optimization Decision

---

## Anti-Pattern 3: Ignoring Cyclic Garbage Collection Overhead

### Category
Configuration

### Description
Leaving GC enabled with default collection probability on workloads that produce few cycles, wasting CPU on unnecessary cycle detection.

### Why It Happens
Default GC settings are conservative but still run. Teams do not profile GC overhead.

### Warning Signs
Profiling shows gc_collect_cycles in top time consumers. Many runs with zero cycles collected.

### Why Harmful
Each GC run scans all zvals - O(n). For workloads without cycles (common in PHP-FPM), this is pure overhead.

### Consequences
1-5% CPU wasted on GC for workloads without cyclic references.

### Alternative
Disable GC for PHP-FPM where cycles are rare. Re-enable before batch/complex operations.

### Refactoring Strategy
1. Profile GC overhead. 2. gc_disable() at bootstrap for FPM. 3. gc_enable() before cycle-heavy operations. 4. gc_collect_cycles() after batch jobs.

### Detection Checklist
- [ ] GC overhead profiled
- [ ] gc_status() shows low cycle collection ratio
- [ ] GC disabled for request-scoped workloads

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Memory Limit Configuration — memory_limit Directive, Per-Request vs Process Limits, pm.max_children Relationship
- 05-rules.md: Disable GC for request-scoped workloads
- 05-rules.md: Enable GC explicitly for cycle-prone operations
- 06-skills.md: Tune Garbage Collection for Workload Type
- 07-decision-trees.md: GC Enable/Disable Decision Tree

---

## Anti-Pattern 4: Memory Leak in Long-Running Workers

### Category
Operations

### Description
Allowing memory to grow unbounded in persistent runtimes (Octane, Swoole, FrankenPHP) by not releasing circular references or accumulated zvals across requests.

### Why It Happens
PHP-FPM developers port code without adapting memory patterns. Static caches and circular references from ORM entities never free.

### Warning Signs
Worker RSS grows steadily. Octane/Swoole worker restarts increasing. memory_get_usage() rising after each request.

### Why Harmful
Persistent runtimes reuse heap across requests. Memory leaks compound until worker OOM.

### Consequences
Worker OOM kills after hours/days. 50-70% throughput loss before restart. Cascading failures.

### Alternative
Weak references for caches, explicit unset of large variables, cycle collection after each request.

### Refactoring Strategy
1. Enable GC for persistent runtimes. 2. Implement explicit cleanup. 3. Use WeakReference for caches. 4. Monitor per-worker RSS. 5. Set max request count.

### Detection Checklist
- [ ] Memory stable over 10k requests
- [ ] Worker RSS within 20% of baseline
- [ ] GC enabled in persistent runtimes

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Memory Limit Configuration — memory_limit Directive, Per-Request vs Process Limits, pm.max_children Relationship
- 05-rules.md: Memory growth is linear, not cumulative
- 05-rules.md: Implement per-request cleanup in persistent workers
- 06-skills.md: Detect and Fix Memory Leaks in Long-Running PHP Processes
- 07-decision-trees.md: Persistent Worker Memory Strategy

---

## Anti-Pattern 5: Oversized Memory Limit Masking Waste

### Category
Configuration

### Description
Setting memory_limit too high, masking inefficient code, preventing detection of leaks until production OOM.

### Why It Happens
Better safe than sorry approach. Dev environments use high limits so developers never notice waste.

### Warning Signs
memory_limit > 256MB for typical apps. Production OOM despite staging passing.

### Why Harmful
High limits hide regressions. Code working in dev OOMs in constrained environments.

### Consequences
Unexpected OOM in constrained environments. Lower throughput from wasted memory.

### Alternative
Set memory_limit to realistic value. Use CI to enforce memory budgets.

### Refactoring Strategy
1. Profile peak memory. 2. Set limit to 2x peak. 3. Add memory threshold alerts. 4. CI enforces budget.

### Detection Checklist
- [ ] memory_limit set to 2x typical peak
- [ ] CI enforces memory budget
- [ ] Memory profiled per request

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Memory Limit Configuration — memory_limit Directive, Per-Request vs Process Limits, pm.max_children Relationship
- 05-rules.md: Set memory_limit based on profiled peak usage
- 05-rules.md: CI must fail on memory regressions
- 06-skills.md: Profile and Optimize Per-Request Memory Usage
- 07-decision-trees.md: Memory Limit Sizing Decision

---
