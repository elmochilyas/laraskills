# Anti-Patterns: Profiling vs Monitoring

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Engine Performance |
| Knowledge Unit | Profiling vs Monitoring |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Using Xdebug in Production | Operations | Critical |
| 2 | Only Monitoring Without Profiling Capability | Methodology | High |
| 3 | Profiling Without a Hypothesis | Methodology | Medium |
| 4 | Using Profiling as Monitoring (Always-On Heavy Profiling) | Methodology | High |
| 5 | Guessing at Bottlenecks Without Profiling Data | Methodology | Critical |

## Repository-Wide Anti-Patterns

- **Observability imbalance**: Teams over-invest in either monitoring (dashboards, alerts) or profiling (deep dives) but not both, leaving blind spots in their ability to detect AND diagnose performance issues.
- **Production profiling fear**: Avoiding production profiling entirely due to overhead concerns, relying only on staging profiling that may not reflect production workload patterns.

---

## Anti-Pattern 1: Using Xdebug in Production

### Category
Operations

### Description
Running Xdebug with profiling enabled in a production environment, introducing 50-200% overhead that degrades application performance, increases latency, and can cause cascading failures under load.

### Why It Happens
- Xdebug is the most familiar profiling tool for PHP developers
- Convenience: installed on dev machines and deployed to production with the same configuration
- Unawareness that Xdebug profiling adds 50-200% overhead (step debugging is even worse)
- Copy-paste from Dockerfiles or setup scripts that don't distinguish environments
- "It was only for a quick look" — but left enabled after the session

### Warning Signs
- Production latency spikes that correlate with Xdebug configuration presence
- CPU utilization 2-3x normal with Xdebug installed but not active (loading the extension adds overhead)
- Application becomes unusably slow during profiling sessions
- Xdebug extension loaded in production php.ini or Docker image
- Profiling output files accumulating on production servers (cachegrind files)
- Production incidents that resolve when Xdebug extension is removed

### Why Harmful
Xdebug is designed for development, not production:
- Xdebug profiling adds 50-200% overhead to all requests
- Step debugging (xdebug.mode=debug) can make requests 10-100x slower
- Xdebug's remote debugging pauses application execution while waiting for IDE connection
- Xdebug profiling writes cachegrind files to disk, causing I/O contention
- The overhead scales with request complexity — complex requests are affected most
- During traffic spikes, Xdebug overhead can cause cascading failures

### Consequences
- 50-200% latency increase for all requests
- Production incidents from overloaded servers
- CPU and I/O contention from profiling data collection and file writing
- Cachegrind files filling disk space
- False positives in performance monitoring (degradation caused by profiler, not code)
- Emergency debugging sessions to identify the cause of "unexplained" slowdown

### Alternative
Use production-safe profiling tools:
- Blackfire: 2-5% overhead, triggered sampling, production-safe
- Tideways: 1-3% overhead, sampled continuous profiling
- SPX: <5% overhead, on-demand triggered profiling
- eBPF: <1% overhead, continuous production profiling (requires kernel support)
- Use Xdebug profiling ONLY in development and staging environments
- Never install Xdebug extension in production Docker images or servers

### Refactoring Strategy
1. Verify Xdebug is not installed or loaded in production: run `php -m | grep xdebug`
2. If Xdebug is present: remove or disable the extension in production configuration
3. Install a production-safe profiler (Blackfire, Tideways, or SPX)
4. Configure the production profiler with overhead-appropriate sampling rates
5. Keep Xdebug available for development/staging profiling when needed
6. Add CI check to prevent Xdebug from being deployed to production

### Detection Checklist
- [ ] Xdebug extension not loaded in production (php -m shows no xdebug)
- [ ] Production-safe profiler (Blackfire, Tideways, SPX, eBPF) used instead
- [ ] CI pipeline checks for Xdebug presence in production build images
- [ ] Dockerfiles and provisioning scripts distinguish dev and production profilers
- [ ] Production profiling overhead measured and confirmed < 5%
- [ ] Development/staging profiling uses Xdebug appropriately

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Profiling vs Monitoring
- 05-rules.md: Never Use Xdebug in Production
- 07-decision-trees.md: Profiling Tool Selection Decision Tree

---

## Anti-Pattern 2: Only Monitoring Without Profiling Capability

### Category
Methodology

### Description
Investing exclusively in monitoring dashboards, alerts, and APM tools without the ability to perform deep profiling when monitoring detects a problem — knowing something is slow but having no way to determine why.

### Why It Happens
- Monitoring tools (Datadog, New Relic) are easier to set up than profiling infrastructure
- Monitoring provides continuous visibility, which feels more valuable than on-demand profiling
- Teams don't realize that monitoring identifies the "what" but not the "why"
- Profiling requires more expertise to interpret results (flame graphs, call graphs)
- Budget allocated to APM may leave no room for profiling tools

### Warning Signs
- Monitoring alerts fire but root cause analysis takes days or weeks
- p95 latency increased but team cannot identify the specific code path responsible
- Flame graphs are not available for debugging sessions
- Profiling tools (Blackfire, Tideways) are not installed or configured
- Performance regression investigations rely on code reading, not profiling data
- "We need to add more logging to understand what's slow" — should use profiling instead

### Why Harmful
Monitoring alone is insufficient for performance management:
- Monitoring tells you WHAT is slow (endpoint, database query, service)
- Monitoring does NOT tell you WHY it is slow (specific function, memory allocation, lock contention)
- Without profiling, every performance investigation starts from zero (code reading, guesswork)
- Profiling reduces investigation time from days to minutes
- Performance optimization without profiling is random — you might fix the wrong thing
- The gap between "detect" (monitoring) and "diagnose" (profiling) allows regressions to persist

### Consequences
- Performance investigations taking days when profiling could provide answers in minutes
- Optimization effort wasted on non-bottleneck code (guessing instead of measuring)
- Regressions recurring because root cause wasn't identified with profiling
- Team frustration from inability to make performance progress
- Wasted APM investment (alerts that can't be actioned)
- Slow incident response to performance degradation

### Alternative
Always pair monitoring with profiling capability:
1. Install monitoring for continuous health tracking (latency, error rate, CPU, memory)
2. Install profiling tools for on-demand deep dives (Blackfire, Tideways, SPX)
3. Create a workflow: monitoring alert → profiling session → root cause → fix
4. Train the team on flame graph interpretation and call graph analysis
5. Include profiling in the incident response runbook for performance issues
6. Set up always-on sampling profiler (low overhead) that captures data when monitoring alerts

### Refactoring Strategy
1. Install a production-safe sampling profiler (Blackfire/Tideways)
2. Configure triggered profiling: start profiling session based on monitoring alert conditions
3. Create a standard operating procedure: "When p95 latency alert fires, review flame graphs from triggered session"
4. Train the on-call team on flame graph interpretation
5. Monitor time-to-diagnose for performance incidents — target < 30 minutes
6. Continuously improve the profiling ↔ monitoring integration

### Detection Checklist
- [ ] Production-safe profiling tool installed alongside monitoring
- [ ] Team trained on flame graph and call graph interpretation
- [ ] Incident response runbook includes profiling step
- [ ] Triggered/automatic profiling on monitoring alert conditions
- [ ] Time-to-diagnose for performance incidents tracked
- [ ] No performance investigation performed without profiling data

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Profiling vs Monitoring
- 05-rules.md: Always Pair Profiling with Monitoring
- 06-skills.md: Tiered Profiling Workflow
- 07-decision-trees.md: Profiling vs Monitoring Decision Tree

---

## Anti-Pattern 3: Profiling Without a Hypothesis

### Category
Methodology

### Description
Starting a profiling session without a specific question or hypothesis about what might be slow, leading to information overload from the profiling output and inability to identify actionable optimizations.

### Why It Happens
- "Let's profile everything and see what's slow" approach
- Excitement about using profiling tools without a structured investigation plan
- Lack of experience in forming performance hypotheses
- Availability of detailed profiling data creates the illusion that all of it is useful
- No established profiling methodology or workflow

### Warning Signs
- Profiling session produces pages of data but no clear conclusions
- Multiple flame graphs reviewed without finding actionable bottlenecks
- "This function takes 5% of time — should we optimize it?" without context
- No specific question defined before the profiling session
- Profiling results cannot be translated into a concrete optimization task
- The same profiling session is repeated without a change in hypothesis

### Why Harmful
Without a hypothesis, profiling is inefficient:
- Profiling produces enormous amounts of data (every function call, every allocation)
- Without a question, there's no way to prioritize which data is relevant
- Time is wasted reviewing non-bottleneck code paths
- Important findings may be missed because they weren't being looked for
- The "everything is fast from one angle" effect — without a specific question, nothing looks clearly slow
- Optimization effort becomes unfocused and less effective

### Consequences
- Wasted time reviewing irrelevant profiling data
- Missed bottlenecks that weren't specifically looked for
- Optimization effort spread too thin across non-critical paths
- Perceived complexity of profiling reduces adoption
- Team reverts to guessing (the profiling "didn't help")
- No repeatable profiling methodology developed

### Alternative
Always profile with a specific hypothesis:
1. Start with monitoring data: which endpoint is slow? Which database query?
2. Form a hypothesis: "The /orders endpoint is slow because of the ORDER BY on an unindexed column"
3. Profile to confirm or reject: flame graph should show the sort operation as a wide frame
4. If confirmed: fix (add index), then profile again to verify
5. If rejected: form a new hypothesis based on what the profiling data shows
6. Each profiling session answers one question

### Refactoring Strategy
1. Before profiling, write down: "I expect to find _____ is slow because of _____"
2. Profile the specific endpoint or operation
3. Review the flame graph for the expected bottleneck
4. If found: fix and re-profile to confirm
5. If not found: look for the widest frame you didn't expect — that's your new hypothesis
6. Document: "Profiled /orders endpoint, confirmed hypothesis that unindexed sort was bottleneck"

### Detection Checklist
- [ ] Specific hypothesis documented before profiling session
- [ ] Profiling session targets the endpoint or operation in the hypothesis
- [ ] Hypothesis confirmed or rejected by profiling data
- [ ] Optimization action defined based on profiling findings
- [ ] Follow-up profiling verifies the optimization's effect
- [ ] Each profiling session has a documented conclusion

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Profiling vs Monitoring
- 05-rules.md: Profile with a Hypothesis
- 06-skills.md: Tiered Profiling Workflow
- 07-decision-trees.md: Bottleneck Localization Decision Tree

---

## Anti-Pattern 4: Using Profiling as Monitoring (Always-On Heavy Profiling)

### Category
Methodology

### Description
Running a heavy profiling tool continuously on all production requests, treating it as a monitoring solution, which introduces unacceptable overhead and defeats the purpose of both profiling (deep but expensive) and monitoring (lightweight and always-on).

### Why It Happens
- Confusion between the two concepts: "profiling tells me what's slow, so I should always profile"
- Availability of continuous profiling tools (Tideways, Blackfire) that blur the line
- Desire for maximum visibility without understanding the overhead trade-off
- One-size-fits-all approach to observability
- No cost/benefit analysis of profiling overhead vs monitoring overhead

### Warning Signs
- Profiling tool running at high sampling rate (every request) in production
- Overhead from profiling visible in monitoring dashboards (CPU, latency increase)
- "Continuous profiling" without configuring sampling or trigger conditions
- Profiling data volume overwhelming storage and analysis systems
- Profiling overhead exceeds 5% of total CPU
- Team complains about production performance but won't disable the profiler

### Why Harmful
Profiling every request is too expensive:
- Heavy profiling (Xdebug, full-trace mode) adds 50-200% overhead
- Even sampling profilers at high rates add 3-10% overhead that compounds
- Profiling data volume grows proportionally to traffic, requiring significant storage
- The overhead of always-on profiling affects the metrics being measured
- Profiling data is too detailed for continuous monitoring — most of it is never reviewed
- Always-on profiling creates a tax on every request, not just the ones being investigated

### Consequences
- 3-10% throughput loss from always-on profiling (even with sampling)
- Higher latency for all requests due to profiling overhead
- Increased infrastructure costs (need more servers to compensate for overhead)
- Massive data volumes that are expensive to store and rarely analyzed
- Profiling overhead contaminates performance metrics (measuring the profiler, not the app)
- Team becomes dependent on always-on profiling data, can't disable it

### Alternative
Use profiling and monitoring for their intended purposes:
- Monitoring (always-on, <1% overhead): track latency, error rate, CPU, memory
- Profiling (on-demand or sampled, <5% overhead): deep dive on specific issues
- Use continuous sampling profilers (eBPF, Tideways) with very low sampling rates
- Trigger profiling sessions based on monitoring alerts (not running continuously)
- Increase profiling detail only when investigating a specific issue
- Profile in staging first, then validate findings with targeted production profiling

### Refactoring Strategy
1. Reduce always-on profiling sampling rate to < 1% of requests
2. Configure automated profiling triggered by monitoring alert conditions
3. Move heavy profiling sessions to development/staging environments
4. Monitor profiling overhead in production: keep it under 2% CPU increase
5. Use eBPF-based profiling (<1% overhead) for continuous visibility if needed
6. Review profiling data retention: keep data only for triggered sessions

### Detection Checklist
- [ ] Profiling overhead measured and confirmed < 2% CPU in production
- [ ] Sampling rate configured appropriately (not 100% of requests)
- [ ] Continuous profiling uses low-overhead tools (eBPF) if always-on
- [ ] Heavy profiling sessions triggered by monitoring alerts, not always-on
- [ ] Profiling data retention policy defined
- [ ] Profiling cost (overhead, storage) tracked and reviewed

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Profiling vs Monitoring
- 05-rules.md: Keep Production Profiling Overhead Under 2%
- 07-decision-trees.md: Profiling Intensity Decision Tree

---

## Anti-Pattern 5: Guessing at Bottlenecks Without Profiling Data

### Category
Methodology

### Description
Making performance optimization decisions based on intuition, code reading, or common assumptions rather than empirical profiling data — guessing which code is slow instead of measuring it.

### Why It Happens
- Profiling is perceived as difficult, slow, or unavailable
- Code reading gives the illusion of understanding performance (complex loops look slow)
- Common assumptions ("database queries are always the bottleneck") may be wrong for the specific case
- Time pressure to "fix something" without waiting for profiling
- Overconfidence: experienced developers believe they can identify bottlenecks by intuition

### Warning Signs
- "I think this function is slow" without profiling data
- Performance optimizations approved in code review without profiling evidence
- Cache layers added without profiling to confirm database bottleneck
- Code complexity increased for performance reasons without before/after profiling
- Multiple optimizations applied simultaneously — can't tell which one helped
- Performance discussions rely on assumptions, not data

### Why Harmful
Intuition about bottlenecks is unreliable:
- Studies consistently show that developers correctly identify bottlenecks <50% of the time
- Complex-looking code is often not the bottleneck (framework overhead, I/O wait dominate)
- Common assumptions ("ORM is slow") may be wrong for the specific workload
- Without profiling, effort is optimized for the wrong code paths
- Guessing leads to random optimization: some help, some don't, some make things worse
- Team learns the wrong lessons (correlation mistaken for causation)

### Consequences
- Wasted engineering hours on non-bottleneck code
- Actual bottleneck remains unaddressed
- Added code complexity with no performance benefit
- Caching layers that are unnecessary and add maintenance burden
- Performance still poor after "optimizations" — team morale drops
- Inability to learn what actually affects performance (no data to correlate)

### Alternative
Always measure before optimizing:
1. Profile the system to identify the hottest code paths (inclusive time > 10%)
2. Form a hypothesis based on profiling data
3. Apply the optimization
4. Profile again to confirm the improvement
5. Move to the next bottleneck
6. No optimization is approved without profiling evidence of the bottleneck

### Refactoring Strategy
1. Before optimizing anything, run a profiler on the target endpoint
2. Identify the top 3 bottlenecks by inclusive time
3. Optimize the #1 bottleneck only
4. Re-profile to confirm the bottleneck is resolved
5. Repeat for the new #1 bottleneck
6. Document: "Profiling showed X was the bottleneck. Optimized Y. Confirmed Z% improvement."

### Detection Checklist
- [ ] Every optimization is justified by profiling data
- [ ] Code review requires profiling evidence for performance changes
- [ ] Before-and-after profiling data available for all performance PRs
- [ ] No "I think" optimizations without profiling confirmation
- [ ] Team has access to profiling tools (Blackfire, Tideways, SPX)
- [ ] Team trained on profiling tool usage and flame graph interpretation

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Profiling vs Monitoring
- 05-rules.md: Profile Before Optimizing
- 06-skills.md: Tiered Profiling Workflow
- 07-decision-trees.md: Bottleneck Prioritization Decision Tree
