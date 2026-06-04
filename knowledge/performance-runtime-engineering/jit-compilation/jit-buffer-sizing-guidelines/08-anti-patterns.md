# Anti-Patterns: JIT Buffer Sizing Guidelines

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | JIT Compilation |
| Knowledge Unit | JIT Buffer Sizing Guidelines |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Undersized Buffer Causing Compilation Thrashing | Configuration | Critical |
| 2 | Not Monitoring Buffer Utilization After Deployment | Operations | High |
| 3 | Ignoring Fragmentation in Effective Capacity Planning | Configuration | Medium |
| 4 | Function JIT with Minimum Buffer (64MB) | Configuration | High |
| 5 | Resizing Buffer Without PHP-FPM Restart | Operations | Medium |

---

## Anti-Pattern 1: Undersized Buffer Causing Compilation Thrashing

### Category
Configuration

### Description
Setting jit_buffer_size too small for the working set of compiled code, causing constant eviction and recompilation that negates JIT benefits.

### Why It Happens
Default 64MB or 128MB used without checking application size. No monitoring of buffer utilization. Unawareness that buffer overflow causes eviction.

### Warning Signs
High eviction count in opcache_get_status(). buffer_free < 10%. Throughput drops after warm-up. Compilation counts continuously increase.

### Why Harmful
When buffer overflows, oldest compiled code is evicted. Hot code must be recompiled on next execution. JIT benefit is eliminated because code runs interpreted while waiting for recompilation.

### Consequences
JIT provides zero benefit or degrades performance. CPU wasted on compilation. No steady state reached.

### Alternative
Start with 128MB for most apps, 256MB for large. Monitor buffer_free. Increase if < 20% at steady state.

### Refactoring Strategy
1. Monitor buffer_free over 24h 2. If < 20%, increase by 2x 3. Re-monitor for another 24h 4. Repeat until > 30%

### Detection Checklist
- [ ] Buffer utilization monitored
- [ ] buffer_free > 20% at steady state
- [ ] Eviction count near zero
- [ ] Buffer sized appropriately for codebase

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: JIT Buffer Sizing Guidelines
- 05-rules.md: Relevant Rules
- 07-decision-trees.md: Relevant Trees

---

## Anti-Pattern 2: Not Monitoring Buffer Utilization After Deployment

### Category
Operations

### Description
Setting buffer size once and never checking utilization, allowing gradual degradation as the codebase grows.

### Why It Happens
Set-and-forget approach. No monitoring alert for buffer utilization. Codebase growth not correlated with JIT buffer needs.

### Warning Signs
Buffer utilization gradually increasing over months. Eventual performance degradation. No buffer monitoring in dashboards.

### Why Harmful
As codebase grows, more functions cross JIT thresholds. Eventually buffer overflows, causing eviction and gradual performance degradation.

### Consequences
Gradual performance degradation over months. JIT goes from beneficial to harmful without detection.

### Alternative
Monitor buffer_free in production dashboards. Set alert when < 30%. Review quarterly and adjust as codebase grows.

### Refactoring Strategy
1. Add buffer_free to dashboard 2. Set alert at < 30% 3. Review quarterly 4. Increase as codebase grows

### Detection Checklist
- [ ] Buffer utilization monitored continuously
- [ ] Alert configured for < 30%
- [ ] Buffer size reviewed as codebase grows
- [ ] Historical data available

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: JIT Buffer Sizing Guidelines
- 05-rules.md: Relevant Rules
- 07-decision-trees.md: Relevant Trees

---

## Anti-Pattern 3: Ignoring Fragmentation in Effective Capacity Planning

### Category
Configuration

### Description
Treating buffer_free as usable capacity without accounting for fragmentation overhead, overestimating effective JIT buffer capacity.

### Why It Happens
buffer_free is the primary metric. Fragmentation is invisible without monitoring eviction and compaction counts.

### Warning Signs
buffer_free shows adequate space but evictions still occur. Compaction count is high. JIT performance degrades despite free space.

### Why Harmful
Fragmentation creates unusable gaps between compiled code segments. buffer_free overestimates usable capacity by 15-30% in Function JIT mode.

### Consequences
Unexpected evictions. Overestimated effective capacity leads to undersized buffers.

### Alternative
Account for 15-30% fragmentation overhead. Use Tracing JIT for 40-50% less fragmentation. Monitor eviction count as primary indicator.

### Refactoring Strategy
1. Check compaction count and eviction rate 2. If evictions occur despite > 20% free, fragmentation is cause 3. Increase buffer by 30% or switch to Tracing JIT

### Detection Checklist
- [ ] Fragmentation accounted for in sizing
- [ ] Eviction count monitored as primary indicator
- [ ] Compaction count tracked
- [ ] Tracing JIT preferred for long-running processes

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: JIT Buffer Sizing Guidelines
- 05-rules.md: Relevant Rules
- 07-decision-trees.md: Relevant Trees

---

## Anti-Pattern 4: Function JIT with Minimum Buffer (64MB)

### Category
Configuration

### Description
Using Function JIT mode with the minimum 64MB buffer, guaranteeing constant eviction and zero JIT benefit due to fragmentation.

### Why It Happens
Copying Function JIT config without considering buffer requirements. Assuming default buffer is sufficient for any mode.

### Warning Signs
Function JIT (1205) with jit_buffer_size=64M. High eviction count. Compaction events frequent. JIT worse than disabled.

### Why Harmful
Function JIT produces widely varying code segment sizes. With 64MB buffer, fragmentation fills capacity within hours, causing constant eviction.

### Consequences
JIT performance worse than disabled. Compilation overhead with zero benefit.

### Alternative
Use at least 256MB with Function JIT. Better: use Tracing JIT (1254) with 128MB for less fragmentation.

### Refactoring Strategy
1. Switch to Tracing JIT (1254) with 128MB 2. Or keep Function JIT with 256MB buffer 3. Monitor eviction count after change

### Detection Checklist
- [ ] Buffer matches JIT mode requirements
- [ ] Function JIT has adequate buffer (256MB+)
- [ ] Tracing JIT preferred when buffer constrained
- [ ] Eviction rate near zero after change

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: JIT Buffer Sizing Guidelines
- 05-rules.md: Relevant Rules
- 07-decision-trees.md: Relevant Trees

---

## Anti-Pattern 5: Resizing Buffer Without PHP-FPM Restart

### Category
Operations

### Description
Changing jit_buffer_size in php.ini without restarting PHP-FPM, expecting the change to take effect immediately when buffer is allocated at startup.

### Why It Happens
Most config changes can be applied via reload. Unawareness that JIT buffer is pre-allocated at JIT initialization.

### Warning Signs
Buffer size changed in php.ini but opcache_get_status() shows old value. No effect after change. Confusion about why.

### Why Harmful
JIT buffer is allocated during JIT initialization (PHP-FPM startup). Changes to jit_buffer_size require a full restart. Changing without restart wastes time.

### Consequences
Wasted time. Buffer size unchanged despite config edit. Incorrect conclusions about buffer sizing.

### Alternative
Plan buffer size changes with PHP-FPM restarts during maintenance windows. Verify change via opcache_get_status() after restart.

### Refactoring Strategy
1. Edit php.ini with new buffer size 2. Schedule PHP-FPM restart 3. Restart and verify via opcache_get_status() 4. Monitor utilization over 24h

### Detection Checklist
- [ ] PHP-FPM restarted after buffer size change
- [ ] New buffer size verified via opcache_get_status()
- [ ] Change planned during maintenance window
- [ ] Utilization monitored after change

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: JIT Buffer Sizing Guidelines
- 05-rules.md: Relevant Rules
- 07-decision-trees.md: Relevant Trees
