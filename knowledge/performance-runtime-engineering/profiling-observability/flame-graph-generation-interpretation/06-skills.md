# Skill: Generate and Interpret Flame Graphs with p50/p95 Comparison

## Purpose
Generate flame graphs from sampling profilers (SPX, Tideways, eBPF) with 10,000+ stack traces, interpret wide frames (self-time hotspots at top, architectural delegation at bottom) and tall stacks (framework indirection), and compare p50 vs p95 flame graphs to reveal load-dependent issues (GC spikes, lock contention, queue buildup) — enabling production-safe bottleneck identification.

## When To Use
- Diagnosing production latency regressions
- Identifying CPU hotspots vs I/O wait patterns
- Comparing fast vs slow request profiles
- Validating optimization impact with before/after flame graphs
- Onboarding to unfamiliar codebase — identify expensive code paths visually

## When NOT To Use
- As replacement for APM transaction traces (flame graphs show aggregate, not individual requests)
- Without enough samples (<1000 stacks)
- For per-request debugging (use callgraph analysis instead)

## Prerequisites
- Sampling profiler: SPX, Tideways, or eBPF
- Target endpoint with reproducible slow behavior
- Profiling duration: 60+ seconds at 100 Hz

## Inputs
- Sampling profiler configuration
- Target endpoint URL
- Expected traffic profile (p50 typical, p95 under load)

## Workflow

### 1. Select Production-Safe Profiler
- eBPF (<0.5%): always-on production profiling, kernel-level
- Tideways/SPX (1-5%): production-safe sampling, PHP-level call stacks
- Never use Xdebug in production (50-200% overhead)
- Match profiler to investigation: system-level (eBPF) vs PHP-level (Tideways/SPX)

### 2. Collect 10,000+ Stack Samples
- Profile for 60+ seconds at 100 Hz (6000+ samples minimum)
- For p95 analysis: profile under realistic load, not single request
- Ensure samples span multiple request types at the target endpoint
- Fewer samples produce noisy, unreliable flame graphs

### 3. Interpret Wide and Tall Frames
- Wide top frame (tip) = function with high self time — optimize directly
- Wide bottom frame (root) = expensive call subtree — optimize children
- Tall stack = deep call chain with indirection overhead (>20 frames)
- Use color: red/orange = CPU-bound, blue/teal = I/O-bound, gray = waiting

### 4. Compare p50 vs p95 Flame Graphs
- Generate separate flame graphs for fast (p50) and slow (p95) requests
- Identify new wide frames in p95 that don't exist in p50
- Common findings: GC spikes under memory pressure, lock contention under concurrency, queue buildup at saturation
- The difference between p50 and p95 is your investigation target

### 5. Validate Optimization Impact
- Generate before-flame graph before making changes
- Apply optimization
- Generate after-flame graph with same profiler and duration
- Use differential flame graphs (red = regression, blue = improvement)
- Verify wide frames are narrower or eliminated

### 6. Correlate with Deployment Timeline
- Store flame graphs alongside deployment events
- Compare before/after flame graph for every production deployment
- New wide frame after deployment → rollback candidate identified within minutes
- Archive flame graphs for trend analysis

## Validation Checklist
- [ ] Production-safe profiler selected (eBPF or sampling)
- [ ] 10,000+ stack traces collected (60+ seconds at 100 Hz)
- [ ] p50 and p95 flame graphs compared
- [ ] Wide top frames identified as self-time hotspots
- [ ] Color used to determine CPU vs I/O vs wait type
- [ ] Optimization validated with before/after differential flame graph
- [ ] Flame graphs correlated with deployment timeline

## Related Rules
- Read bottom-up, focus on wide frames (`05-rules.md:1`)
- Differentiate inclusive vs exclusive (`05-rules.md:26`)

## Related Skills
- Inclusive vs Exclusive Time Analysis
- Callgraph Analysis Techniques
- eBPF PHP Profiling
- Production Guardrails and Profiling Cost

## Success Criteria
- Flame graphs generated with 10,000+ samples using production-safe profiler
- p50 vs p95 comparison reveals load-dependent bottlenecks
- Wide top frames identified and traced to source code
- Optimization validated with before/after differential flame graph
- Flame graphs stored and correlated with deployment timeline
