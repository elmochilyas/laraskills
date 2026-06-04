# Anti-Patterns: JIT Memory Layout and Fragmentation

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | JIT Compilation |
| Knowledge Unit | JIT Memory Layout and Fragmentation |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Assuming buffer_free Accurately Reflects Usable Space | Configuration | High |
| 2 | Disabling PHP 8.4+ Buffer Compaction | Configuration | Medium |
| 3 | Setting Huge Buffer to Avoid Monitoring Fragmentation | Configuration | Medium |
| 4 | Function JIT in Long-Running Processes | Configuration | High |
| 5 | Not Monitoring Eviction Count as Primary Health Indicator | Operations | High |

---

## Anti-Pattern 1: Assuming buffer_free Accurately Reflects Usable Space

### Category
Configuration

### Description
Relying on jit_buffer_free as the sole indicator of buffer health without accounting for fragmentation gaps that reduce effective capacity.

### Why It Happens
buffer_free is the default metric in opcache_get_status(). Fragmentation is invisible without understanding segment layout.

### Warning Signs
buffer_free shows > 20% space but evictions still occur. Compaction count is high. JIT degrades despite apparently adequate free space.

### Why Harmful
Fragmentation creates unusable gaps between compiled code segments. buffer_free overestimates usable capacity because no single gap may be large enough.

### Consequences
Unexpected evictions. Misleading dashboard metrics. Buffer appears healthy but JIT benefit diminishes.

### Alternative
Monitor eviction count as primary buffer health indicator. Treat buffer_free as optimistic upper bound.

### Refactoring Strategy
1. Start monitoring eviction count 2. Set alert on any eviction 3. Estimate fragmentation overhead (15-30% for Function JIT) 4. Increase buffer considering fragmentation

### Detection Checklist
- [ ] Eviction count monitored as primary indicator
- [ ] Compaction count tracked
- [ ] Fragmentation estimated in capacity planning
- [ ] buffer_free interpreted with overhead in mind

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: JIT Memory Layout and Fragmentation
- 05-rules.md: Relevant Rules
- 07-decision-trees.md: Relevant Trees

---

## Anti-Pattern 2: Disabling PHP 8.4+ Buffer Compaction

### Category
Configuration

### Description
Disabling buffer compaction to avoid ~50-200us pauses, allowing fragmentation to accelerate eviction.

### Why It Happens
Performance sensitivity to latency variance. Not understanding fragmentation causes more loss than compaction pauses.

### Warning Signs
Compaction disabled. Fragmentation increases over time. Eviction count rises. JIT degrades progressively.

### Why Harmful
Compaction defragments by rearranging compiled code. Without it, fragmentation accumulates until evictions begin. Each eviction costs 50-500us for recompilation.

### Consequences
More performance loss from evictions than compaction pauses would cause.

### Alternative
Keep compaction enabled (default). The 50-200us pause is negligible compared to fragmentation-driven evictions.

### Refactoring Strategy
1. Re-enable compaction 2. Monitor compaction frequency 3. Increase buffer if compacting more than once per hour 4. Verify eviction rate drops

### Detection Checklist
- [ ] Compaction enabled (default)
- [ ] Compaction frequency monitored
- [ ] Eviction rate compared before/after enabling
- [ ] Compaction pause impact acceptable

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: JIT Memory Layout and Fragmentation
- 05-rules.md: Relevant Rules
- 07-decision-trees.md: Relevant Trees

---

## Anti-Pattern 3: Setting Huge Buffer to Avoid Monitoring Fragmentation

### Category
Configuration

### Description
Using a large buffer (1GB+) as a substitute for monitoring, wasting address space instead of addressing fragmentation root causes.

### Why It Happens
Bigger buffer solves all problems approach. Avoiding monitoring complexity. Not addressing JIT mode selection.

### Warning Signs
Huge buffer with Function JIT. No fragmentation monitoring. Compaction count not tracked. Eviction rate unknown.

### Why Harmful
Large buffer delays fragmentation but doesn't solve it. Eventually fragmentation fills even large buffers.

### Consequences
Wasted virtual address space. Fragmentation problems delayed but not prevented.

### Alternative
Use Tracing JIT (40-50% less fragmentation) with 128-256MB buffer. Monitor compaction and eviction counts.

### Refactoring Strategy
1. Switch to Tracing JIT if using Function JIT 2. Set reasonable buffer (256MB max) 3. Enable monitoring 4. Track fragmentation over lifetime

### Detection Checklist
- [ ] JIT mode chosen to minimize fragmentation
- [ ] Buffer size reasonable (not oversized to avoid monitoring)
- [ ] Fragmentation monitored proactively
- [ ] Eviction rate tracked

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: JIT Memory Layout and Fragmentation
- 05-rules.md: Relevant Rules
- 07-decision-trees.md: Relevant Trees

---

## Anti-Pattern 4: Function JIT in Long-Running Processes

### Category
Configuration

### Description
Using Function JIT mode for processes running 24+ hours where Tracing JIT would produce 40-50% less fragmentation.

### Why It Happens
Preference for function-level compilation. Not considering fragmentation accumulation over extended uptime.

### Warning Signs
Function JIT with 24h+ uptime. Compaction count increasing. Effective capacity decreasing. Evictions starting.

### Why Harmful
Function JIT produces widely varying code segment sizes. Over extended periods, fragmentation severely reduces effective capacity.

### Consequences
Forced early recycling to reset fragmentation. Higher compaction overhead. Reduced steady-state throughput.

### Alternative
Use Tracing JIT for processes running 24+ hours. Reserve Function JIT for short-lived processes or benchmarking.

### Refactoring Strategy
1. Switch to Tracing JIT 2. Run for 24h 3. Compare fragmentation metrics 4. Document improvement

### Detection Checklist
- [ ] Tracing JIT used for 24h+ processes
- [ ] Fragmentation compared between modes
- [ ] Effective capacity measured over 24h
- [ ] JIT mode decision documented

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: JIT Memory Layout and Fragmentation
- 05-rules.md: Relevant Rules
- 07-decision-trees.md: Relevant Trees

---

## Anti-Pattern 5: Not Monitoring Eviction Count as Primary Health Indicator

### Category
Operations

### Description
Only checking buffer_free while evictions are happening, missing the early warning sign of buffer pressure.

### Why It Happens
buffer_free is most visible. Eviction count requires deeper inspection. No alerting on evictions.

### Warning Signs
buffer_free shows adequate space but evictions occur (invisible without checking). Performance degrades unexplained.

### Why Harmful
Evictions are the primary indicator of buffer pressure. When evictions occur, JIT benefit is lost for evicted code.

### Consequences
Unnoticed JIT degradation. Wrong fixes applied (threshold tuning instead of buffer increase).

### Alternative
Monitor eviction count as primary JIT buffer health metric. Set alert on any non-zero eviction rate.

### Refactoring Strategy
1. Add eviction count to dashboard 2. Set alert when > 0 in any 5-min window 3. Investigate root cause (fragmentation vs buffer size) 4. Take corrective action

### Detection Checklist
- [ ] Eviction count monitored
- [ ] Alert on non-zero eviction rate
- [ ] buffer_free NOT used as sole indicator
- [ ] Fragmentation considered when evictions occur

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: JIT Memory Layout and Fragmentation
- 05-rules.md: Relevant Rules
- 07-decision-trees.md: Relevant Trees
