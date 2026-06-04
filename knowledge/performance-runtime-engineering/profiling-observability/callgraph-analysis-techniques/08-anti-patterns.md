# Anti-Patterns: Standardized Knowledge: Callgraph Analysis Techniques — Call Tree, Callee Map, Hot Path Identification

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Profiling & Observability |
| Knowledge Unit | Standardized Knowledge: Callgraph Analysis Techniques — Call Tree, Callee Map, Hot Path Identification |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Production Profiling Without Overhead Control | Operations | Critical |
| 2 | Firefighting Without Flame Graphs | Operations | High |
| 3 | Observability Without Traces | Architecture | High |
| 4 | Dashboards Without Actionable Alerts | Operations | Medium |
| 5 | Ignoring Memory Profiling (CPU-Only Focus) | Operations | Medium |

## Repository-Wide Anti-Patterns

- **Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- **Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.

---

## Anti-Pattern 1: Production Profiling Without Overhead Control

### Category
Operations

### Description
Running profilers with 100% sampling or heavy instrumentation in production.

### Why It Happens
Real data beats synthetic. Default settings applied to production.

### Warning Signs
Latency spikes when profiling. CPU increase correlating with profiler.

### Why Harmful
Heavy profiling adds 10-30% overhead. Distorted timing data.

### Consequences
Degraded user experience during profiling sessions.

### Alternative
Use sampling at 1-10%. Profile specific endpoints only.

### Refactoring Strategy
1. Set sampling to 1-5%. 2. Enable on specific endpoints. 3. Monitor profiler CPU impact.

### Detection Checklist
- [ ] Sampling rate <= 10%
- [ ] Profiler CPU < 3%
- [ ] No user-facing latency increase

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Standardized Knowledge: Callgraph Analysis Techniques — Call Tree, Callee Map, Hot Path Identification
- 05-rules.md: Profile at low sampling rate
- 05-rules.md: Monitor profiler overhead
- 06-skills.md: Configure Production-Safe Profiling
- 07-decision-trees.md: Production Profiling Strategy

---

## Anti-Pattern 2: Firefighting Without Flame Graphs

### Category
Operations

### Description
Debugging performance issues by guessing without collecting flame graph data.

### Why It Happens
Flame graphs considered slow/complex. Relying on logs and intuition.

### Warning Signs
Debugging takes hours. No empirical data. Team disagrees on root cause.

### Why Harmful
Without data debugging is guessing. Fixes address symptoms not causes.

### Consequences
Hours lost in guesswork. Performance issues persist.

### Alternative
Always collect flame graph before investigating performance.

### Refactoring Strategy
1. Profile endpoint. 2. Generate flame graph. 3. Identify hot path. 4. Optimize. 5. Re-profile.

### Detection Checklist
- [ ] Flame graph collected
- [ ] Root cause from data
- [ ] Targeted hot path

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Standardized Knowledge: Callgraph Analysis Techniques — Call Tree, Callee Map, Hot Path Identification
- 05-rules.md: Collect flame graph before debugging
- 05-rules.md: Optimize based on data
- 06-skills.md: Generate and Analyze Flame Graphs
- 07-decision-trees.md: Performance Debugging Workflow

---

## Anti-Pattern 3: Observability Without Traces

### Category
Architecture

### Description
Relying solely on logs without distributed tracing.

### Why It Happens
Logging is simplest. Teams start with logs and never add tracing.

### Warning Signs
No trace IDs in logs. Cannot correlate request across services.

### Why Harmful
Logs cannot show request flow. You see symptoms not causes.

### Consequences
Hours to trace across services. Microservices issues invisible.

### Alternative
Implement distributed tracing (OpenTelemetry, Jaeger). Add trace IDs to logs.

### Refactoring Strategy
1. Add OpenTelemetry SDK. 2. Instrument calls. 3. Add trace IDs to logs. 4. Set up Jaeger.

### Detection Checklist
- [ ] Tracing implemented
- [ ] Trace IDs in all logs
- [ ] Cross-service flow visible

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Standardized Knowledge: Callgraph Analysis Techniques — Call Tree, Callee Map, Hot Path Identification
- 05-rules.md: Implement tracing for cross-service observability
- 05-rules.md: Add trace IDs to logs
- 06-skills.md: Set Up Distributed Tracing with OpenTelemetry
- 07-decision-trees.md: Observability Strategy Decision

---

## Anti-Pattern 4: Dashboards Without Actionable Alerts

### Category
Operations

### Description
Building dashboards without alerting rules. Nobody watches dashboards 24/7.

### Why It Happens
Dashboards are fun. Alerts require threshold engineering.

### Warning Signs
Incidents found by users first. No on-call alerts for key metrics.

### Why Harmful
Observability without alerts is just pretty graphs.

### Consequences
Longer incident response. SLA violations.

### Alternative
Define SLOs. Set alert thresholds at SLO burn rate.

### Refactoring Strategy
1. Identify key metrics. 2. Set SLOs. 3. Configure alerts. 4. Route to on-call.

### Detection Checklist
- [ ] Alerts for key metrics
- [ ] Thresholds tied to SLOs
- [ ] Alerts tested

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Standardized Knowledge: Callgraph Analysis Techniques — Call Tree, Callee Map, Hot Path Identification
- 05-rules.md: Alert on all key metrics
- 05-rules.md: Alert threshold = SLO burn rate
- 06-skills.md: Design Actionable Alerting Rules
- 07-decision-trees.md: Alerting Strategy Decision

---

## Anti-Pattern 5: Ignoring Memory Profiling (CPU-Only Focus)

### Category
Operations

### Description
Profiling only CPU while ignoring memory allocation patterns.

### Why It Happens
CPU is obvious. Memory profiling tools less familiar.

### Warning Signs
CPU flame graphs only. Memory issues diagnosed without profiles.

### Why Harmful
Memory issues manifest as CPU (GC, allocation). Treating symptoms not causes.

### Consequences
High GC CPU from allocation-heavy code. Leaks undiagnosed.

### Alternative
Include memory profiling in regular workflow.

### Refactoring Strategy
1. Enable memory profiling. 2. Compare allocation vs CPU flame graphs. 3. Identify hotspots.

### Detection Checklist
- [ ] Memory profiles collected
- [ ] Allocation flame graphs
- [ ] GC overhead measured

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Standardized Knowledge: Callgraph Analysis Techniques — Call Tree, Callee Map, Hot Path Identification
- 05-rules.md: Profile memory alongside CPU
- 05-rules.md: Optimize allocation before CPU when GC > 5%
- 06-skills.md: Profile PHP Memory Allocation Patterns
- 07-decision-trees.md: Profiling Strategy Decision

---
