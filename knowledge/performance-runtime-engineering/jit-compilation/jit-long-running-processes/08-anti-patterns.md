# Anti-Patterns: JIT for Long-Running Processes

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | JIT Compilation |
| Knowledge Unit | JIT for Long-Running Processes |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Frequent Worker Recycling Defeating JIT Warm-Up | Operations | Critical |
| 2 | Not Pre-Warming JIT in Persistent Workers | Operations | High |
| 3 | Using Function JIT for 24h+ Processes | Configuration | Medium |
| 4 | Same Hot-Path Thresholds as FPM for Long-Running Processes | Configuration | Medium |
| 5 | Not Monitoring Fragmentation Over Full Process Lifetime | Operations | Medium |

---

## Anti-Pattern 1: Frequent Worker Recycling Defeating JIT Warm-Up

### Category
Operations

### Description
Recycling Octane/Swoole workers every 100-500 requests, causing JIT to never reach steady state and repeatedly pay compilation overhead.

### Why It Happens
FPM habits carried to Octane. Not understanding JIT amortization requires many requests per worker. Default max_requests copied from FPM.

### Warning Signs
max_requests < 1000 for Octane. JIT counts never stabilize. Throughput never reaches expected levels. Frequent restarts visible in logs.

### Why Harmful
JIT requires 100+ requests to reach steady state. Recycling before that threshold means workers only pay compilation overhead. The amortization advantage of persistent workers is destroyed.

### Consequences
JIT benefit lost in Octane. Compilation overhead paid repeatedly with no payoff. Throughput below expectations.

### Alternative
Set max_requests to 5000-10000 for Octane workers to allow JIT to reach steady state.

### Refactoring Strategy
1. Increase max_requests to 5000-10000 2. Monitor JIT counts (should stabilize) 3. Verify buffer fragmentation managed 4. Benchmark throughput improvement

### Detection Checklist
- [ ] max_requests > 5000 for long-running workers
- [ ] JIT compilation counts stabilize between recycling
- [ ] Buffer fragmentation monitored
- [ ] Throughput benchmarked after change

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: JIT for Long-Running Processes
- 05-rules.md: Relevant Rules
- 07-decision-trees.md: Relevant Trees

---

## Anti-Pattern 2: Not Pre-Warming JIT in Persistent Workers

### Category
Operations

### Description
Not executing representative requests at worker startup to trigger JIT compilation, causing the first 100+ requests to run in the interpreter.

### Why It Happens
Assuming JIT compiles on first execution. Not aware of hot-path thresholds. No warm-up in deployment pipeline.

### Warning Signs
Latency decreases over first 100+ requests after start. JIT counts increase during early lifetime. Deployment events cause latency spikes.

### Why Harmful
Without pre-warming, first 100-500 requests execute in the interpreter. In Octane with 5000 max_requests, this is 2-10% of all requests.

### Consequences
2-10% of requests run without JIT. Higher latency after each deployment. Inconsistent performance.

### Alternative
Implement JIT pre-warming: execute 50-100 representative requests after worker start before accepting traffic.

### Refactoring Strategy
1. Create warm-up script hitting 5-10 endpoints 10-20 times each 2. Execute after start 3. Verify JIT counts increase 4. Measure cold-start improvement

### Detection Checklist
- [ ] JIT pre-warming implemented
- [ ] Warm-up covers hot code paths
- [ ] JIT state verified after warm-up
- [ ] Cold-start latency measured

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: JIT for Long-Running Processes
- 05-rules.md: Relevant Rules
- 07-decision-trees.md: Relevant Trees

---

## Anti-Pattern 3: Using Function JIT for 24h+ Processes

### Category
Configuration

### Description
Using Function JIT mode in processes running 24+ hours, where fragmentation accumulates and degrades effective capacity.

### Why It Happens
Preference for Function JIT. Not considering fragmentation over long timeframes. No long-term buffer monitoring.

### Warning Signs
Function JIT (1205) with 24h+ uptime. Compaction count increases over time. Throughput degrades gradually.

### Why Harmful
Function JIT produces widely varying code segment sizes. Over 24h+, fragmentation reduces effective capacity by 15-30%.

### Consequences
Gradual performance degradation. More frequent recycling needed to reset fragmentation.

### Alternative
Use Tracing JIT (1254) for long-running processes. It produces 40-50% less fragmentation.

### Refactoring Strategy
1. Switch to Tracing JIT (1254) 2. Monitor fragmentation over 24h 3. Compare eviction rate 4. Extend worker lifetime

### Detection Checklist
- [ ] Tracing JIT used for 24h+ processes
- [ ] Fragmentation monitored over full lifetime
- [ ] Compaction count tracked
- [ ] Eviction rate near zero

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: JIT for Long-Running Processes
- 05-rules.md: Relevant Rules
- 07-decision-trees.md: Relevant Trees

---

## Anti-Pattern 4: Same Hot-Path Thresholds as FPM for Long-Running Processes

### Category
Configuration

### Description
Using default JIT thresholds in Octane where lower thresholds provide faster warm-up with better amortization.

### Why It Happens
Copying FPM configuration. Not adjusting for different amortization economics of persistent workers.

### Warning Signs
Same thresholds in FPM and Octane. Octane warm-up takes longer than expected. JIT counts slowly increase.

### Why Harmful
In long-running processes, compilation cost is amortized over thousands of requests. Lower thresholds accelerate warm-up with minimal downside.

### Consequences
Unnecessarily slow JIT warm-up in persistent workers. Performance left on the table during warm-up period.

### Alternative
In long-running processes, lower jit_hot_func and jit_hot_loop by 30-50% for faster warm-up.

### Refactoring Strategy
1. Lower thresholds by 30-50% for Octane workers 2. Monitor warm-up time 3. Verify buffer utilization remains acceptable 4. Benchmark steady-state

### Detection Checklist
- [ ] Thresholds adjusted for long-running processes
- [ ] Warm-up time benchmarked
- [ ] Buffer utilization monitored after change
- [ ] Steady-state throughput confirmed

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: JIT for Long-Running Processes
- 05-rules.md: Relevant Rules
- 07-decision-trees.md: Relevant Trees

---

## Anti-Pattern 5: Not Monitoring Fragmentation Over Full Process Lifetime

### Category
Operations

### Description
Checking JIT buffer state only at startup, missing the 15-30% capacity loss over 24 hours from fragmentation.

### Why It Happens
Short monitoring window. Not understanding that fragmentation accumulates over time. No long-duration testing.

### Warning Signs
Buffer looks healthy at startup but degrades over time. No monitoring data beyond first hour. Eviction rate unknown.

### Why Harmful
Fragmentation develops over hours. Without monitoring across the full process lifetime, capacity loss goes undetected until performance degrades.

### Consequences
Undetected performance degradation from fragmentation. Buffer appears healthy but underperforms.

### Alternative
Monitor buffer state at startup, 1h, 6h, and 24h intervals. Track compaction count and eviction rate trajectory.

### Refactoring Strategy
1. Set up multi-point monitoring at 0/1/6/24h 2. Track eviction rate over time 3. Adjust buffer size or JIT mode if degradation detected

### Detection Checklist
- [ ] Buffer state monitored at multiple time points
- [ ] Eviction rate tracked over process lifetime
- [ ] Compaction count trajectory known
- [ ] Corrective action taken if degradation detected

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: JIT for Long-Running Processes
- 05-rules.md: Relevant Rules
- 07-decision-trees.md: Relevant Trees
