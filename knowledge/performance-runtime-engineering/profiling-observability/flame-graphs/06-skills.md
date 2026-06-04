# Skill: Generate and Analyze Production Flame Graphs with p50/p95 Comparison

## Purpose
Generate production flame graphs using sampling profilers (<3% overhead), collect 10,000+ stack traces (60 seconds at 100 Hz), compare p50 vs p95 graphs to reveal load-dependent bottlenecks, interpret wide top frames as self-time targets and wide bottom frames as architectural issues, and correlate with deployment timeline for immediate regression detection — all within production-safe overhead limits.

## When To Use
- Production bottleneck identification for slow endpoints
- Comparing fast vs slow request profiles
- Validating optimization impact with before/after flame graphs
- Deployment regression detection via flame graph comparison
- Onboarding to unfamiliar codebase

## When NOT To Use
- For per-request debugging (use callgraph analysis)
- Without enough samples (<1000 stacks)
- When using Xdebug in production (50-200% overhead)

## Prerequisites
- Production-safe sampling profiler: SPX, Tideways, or eBPF
- Target endpoint with reproducible slow behavior
- 60+ seconds of profiling duration

## Inputs
- Sampling profiler installed and configured
- Target endpoint URL
- Deployment events for correlation

## Workflow

### 1. Select Production-Safe Tool
- eBPF (<0.5%): always-on, kernel-level, no PHP extension needed
- Tideways (1-3%): continuous APM + profiling, PHP call stacks
- SPX (<5%): on-demand, request-scoped, PHP call stacks
- Never Xdebug in production (50-200% overhead)

### 2. Collect 10,000+ Samples
- Profile for 60+ seconds at 100 Hz
- Fewer samples = noisy, unreliable flame graphs
- Under realistic load (not single request in isolation)
- For CLI tools: match duration to command runtime

### 3. Compare p50 vs p95 Flame Graphs
- Generate separate flame graphs for fast and slow requests
- Identify new wide frames in p95 that don't exist in p50
- Common: GC spikes, lock contention, queue buildup, connection pool exhaustion
- The difference IS the root cause of load-dependent degradation

### 4. Interpret Frame Position
- Wide top frame (tip): high self-time — function does the work, optimize directly
- Wide bottom frame (root): inclusive time from children — optimize children
- Tall stacks >20 frames: framework indirection overhead — consider middleware/service consolidation

### 5. Correlate with Deployments
- Store flame graphs alongside deployment events
- Compare before/after each production deployment
- New wide frame after deploy → rollback candidate in 5 minutes
- Archive flame graphs for trend analysis

## Validation Checklist
- [ ] Production-safe profiler selected (<3% overhead)
- [ ] 10,000+ samples collected (60+ seconds at 100 Hz)
- [ ] p50 and p95 flame graphs generated and compared
- [ ] Wide top frames identified as self-time hotspots
- [ ] Flame graphs correlated with deployment timeline
- [ ] Before/after optimization flame graphs show improvement

## Related Rules
- Compare p50 vs p95 (`05-rules.md:1`)
- Sampling profilers for production (`05-rules.md:27`)
- 10,000+ samples minimum (`05-rules.md:53`)
- Wide top = self-time target (`05-rules.md:77`)
- Correlate with deployments (`05-rules.md:104`)

## Related Skills
- Inclusive vs Exclusive Time Analysis
- Callgraph Analysis Techniques
- eBPF PHP Profiling
- Production Guardrails and Profiling Cost

## Success Criteria
- Flame graphs generated with 10,000+ samples using production-safe profiler
- p50 vs p95 comparison reveals load-dependent bottlenecks
- Wide frames correctly interpreted by position (top = self, bottom = delegation)
- Flame graphs correlated with deployment timeline
- Optimization validated with before/after comparison
