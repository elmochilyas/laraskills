# Anti-Patterns: Standardized Knowledge: FrankenPHP Container Memory Management

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Alternative PHP Runtimes |
| Knowledge Unit | Standardized Knowledge: FrankenPHP Container Memory Management |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Porting PHP-FPM Code Without Adapting to Persistent Runtime | Migration | Critical |
| 2 | Choosing Runtime Without Workload Analysis | Architecture | High |
| 3 | Not Configuring Worker Count to CPU Topology | Configuration | High |
| 4 | Ignoring Goridge Serialization Overhead (RoadRunner) | Performance | Medium |
| 5 | FrankenPHP Thread Safety Violations | Security | Critical |

## Repository-Wide Anti-Patterns

- **Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- **Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.

---

## Anti-Pattern 1: Porting PHP-FPM Code Without Adapting to Persistent Runtime

### Category
Migration

### Description
Running PHP-FPM code on persistent runtimes without addressing memory persistence and static state.

### Why It Happens
Works on FPM = should work on runtime X. No understanding of memory-resident lifecycle.

### Warning Signs
Memory growth per request. Static variables accumulating. Stale connections reused.

### Why Harmful
Persistent runtimes keep heap across requests. What works in FPM leaks here.

### Consequences
Memory leak OOM. Data corruption. Non-deterministic bugs.

### Alternative
Use framework adapters for persistent runtimes. Reset state per request.

### Refactoring Strategy
1. Audit static/global state. 2. Implement request lifecycle hooks. 3. Test with 10k+ requests.

### Detection Checklist
- [ ] Static state audited and reset
- [ ] Memory stable over 10k requests

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Standardized Knowledge: FrankenPHP Container Memory Management
- 05-rules.md: Reset global/static state per request
- 05-rules.md: Use scoped containers
- 06-skills.md: Adapt PHP-FPM Code for Persistent PHP Runtimes
- 07-decision-trees.md: Runtime Migration Decision Tree

---

## Anti-Pattern 2: Choosing Runtime Without Workload Analysis

### Category
Architecture

### Description
Selecting runtime based on hype without matching to workload characteristics.

### Why It Happens
Developer preference over data. No comparative benchmarks.

### Warning Signs
Migration shows no improvement. No comparative benchmarks exist.

### Why Harmful
Wrong runtime can hurt. Async adds overhead for CPU-bound work.

### Consequences
Slower than PHP-FPM. Added complexity without benefit.

### Alternative
Benchmark workload on each candidate. Consider CPU vs I/O ratio.

### Refactoring Strategy
1. Profile workload. 2. Benchmark on FPM, Swoole, RoadRunner, FrankenPHP.

### Detection Checklist
- [ ] Workload profiled
- [ ] Comparative benchmarks executed

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Standardized Knowledge: FrankenPHP Container Memory Management
- 05-rules.md: Benchmark on each runtime before choosing
- 05-rules.md: Match to workload profile
- 06-skills.md: Evaluate Alternative Runtimes for Workload Fit
- 07-decision-trees.md: Runtime Selection Decision Tree

---

## Anti-Pattern 3: Not Configuring Worker Count to CPU Topology

### Category
Configuration

### Description
Setting workers higher than available CPU cores causing context-switch thrashing.

### Why It Happens
FPM mentality of more workers = more throughput applied to persistent runtimes.

### Warning Signs
High context-switch rate. CPU 100% but throughput flat. System time > user time.

### Why Harmful
Excess workers compete for CPU. Context switching overhead reduces actual work.

### Consequences
20-40% throughput loss. Higher p95/p99 latency. Cache thrashing.

### Alternative
Set workers = cores (CPU-bound) or cores*2 (I/O-bound).

### Refactoring Strategy
1. Get nproc. 2. Set workers = cores. 3. Monitor context switches. 4. Adjust.

### Detection Checklist
- [ ] Worker count <= cores*2
- [ ] Context switch rate low
- [ ] CPU user > system time

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Standardized Knowledge: FrankenPHP Container Memory Management
- 05-rules.md: Worker count must consider CPU topology
- 05-rules.md: Monitor context switch rate
- 06-skills.md: Tune Worker Count for Runtime and Workload
- 07-decision-trees.md: Worker/Thread Count Sizing Decision

---

## Anti-Pattern 4: Ignoring Goridge Serialization Overhead (RoadRunner)

### Category
Performance

### Description
Using RoadRunner without accounting for serialization cost between Go and PHP processes.

### Why It Happens
Benchmarks show raw throughput. Users forget Goridge serialization overhead.

### Warning Signs
Performance below expectations. Time in Goridge. Large payloads slow.

### Why Harmful
Goridge serialization is O(n) in payload. Complex arrays add overhead.

### Consequences
Serialization dominates request time (30-50%). FPM may outperform for payload-heavy work.

### Alternative
Minimize Goridge round-trips. Consider FrankenPHP where PHP runs in-process.

### Refactoring Strategy
1. Profile serialization. 2. Batch calls. 3. Reduce payloads. 4. Use binary formats.

### Detection Checklist
- [ ] Goridge overhead profiled
- [ ] Serialization time < 10%
- [ ] Payloads minimized

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Standardized Knowledge: FrankenPHP Container Memory Management
- 05-rules.md: Profile Goridge overhead
- 05-rules.md: Minimize RPC round-trips
- 06-skills.md: Optimize RoadRunner Goridge Communication
- 07-decision-trees.md: RoadRunner Optimization Decision

---

## Anti-Pattern 5: FrankenPHP Thread Safety Violations

### Category
Security

### Description
Enabling threads in FrankenPHP while running code that is not thread-safe.

### Why It Happens
Threads are faster assumption. Not checking ZTS compatibility.

### Warning Signs
Intermittent crashes under load. Corrupted data. Crashes with thread count > 1.

### Why Harmful
Thread safety violations cause memory corruption, not just logic errors.

### Consequences
Data corruption. Application crashes. Need to revert to single-thread.

### Alternative
Verify ZTS compatibility. Use single-thread for non-ZTS code.

### Refactoring Strategy
1. Check PHP_ZTS enabled. 2. Audit extensions. 3. Test threads=1 then increase.

### Detection Checklist
- [ ] PHP built with ZTS
- [ ] Extensions ZTS-compatible
- [ ] No crashes under load

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Standardized Knowledge: FrankenPHP Container Memory Management
- 05-rules.md: Verify ZTS before enabling threads
- 05-rules.md: Test under production load
- 06-skills.md: Ensure Thread Safety in FrankenPHP
- 07-decision-trees.md: FrankenPHP Thread Safety Decision

---
