# Standardized Knowledge: Xdebug Profiling Setup and Analysis — cachegrind Output, KCacheGrind Visualization

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Profiling & Observability |
| Knowledge Unit | Xdebug Profiling Setup and Analysis — cachegrind Output, KCacheGrind Visualization |
| Difficulty | Intermediate |
| Lifecycle | Configure, Diagnose |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Xdebug generates cachegrind-format profiling files containing per-function inclusive/exclusive time and call counts. Visualize with KCacheGrind (Linux), QCacheGrind (Windows/Mac), or PHPStorm's built-in profiler. Xdebug is a development-only tool — its profiling mode adds 50-200% overhead, prohibitive for production.

## Core Concepts

- **Setup**: `xdebug.mode=profile`, `xdebug.output_dir=/tmp/profiling`, `xdebug.profiler_output_name=cachegrind.out.%p`. Restart PHP-FPM. Trigger a request. Output file appears in configured directory.
- **cachegrind format**: Flat text format: `fl=file.php`, `fn=functionName`, `cfn=caller`, `calls=N`, line numbers with inclusive/exclusive time. Readable but best viewed in GUI tools.
- **KCacheGrind / QCacheGrind**: Visualize as call graph (callee map), flat profile (sorted by inclusive/exclusive time), call tree (parent-child cost), source annotation (cost per line).
- **Inclusive vs exclusive time**: Inclusive = time inside function INCLUDING its callees. Exclusive = time only inside function, excluding callees. Hotspots are functions with high inclusive time AND high exclusive time.

## When To Use

- Development and staging environments for deep per-request analysis
- Single-request profiling where exact measurements are needed
- Teams using PHPStorm's built-in profiler integration
- When cachegrind format is required for compatibility with analysis tools
- Educational purposes: understanding call graphs and inclusive/exclusive time concepts

## When NOT To Use

- In production — 50-200% overhead will degrade performance and alter profiling results
- For continuous monitoring — use Tideways or Blackfire instead
- When per-request overhead must be minimal — use SPX (<5%) or eBPF (<1%)
- When you need aggregated metrics across many requests — Xdebug is per-request only
- For profiling under realistic production traffic — staging with production-like load is acceptable but results may differ from production

## Best Practices

- **Never enable Xdebug profiling in production**: The 50-200% overhead makes profiles unreliable and degrades user experience. Use sampling profilers (Tideways, SPX, eBPF) for production.
- **Cachegrind output naming**: Use `xdebug.profiler_output_name=cachegrind.out.%p` to include PID. Avoid overwriting profiles when multiple requests run simultaneously.
- **Use trigger-based profiling**: Configure `xdebug.mode=profile` via HTTP trigger (`XDEBUG_PROFILE=1` cookie/POST/GET) rather than always-on profiling. This avoids profiling every request.
- **Combine with source annotation**: In KCacheGrind, click a function → "Source" tab shows cost per line. This pinpoints the exact line causing the bottleneck.

## Architecture Guidelines

- **Request-scoped profiling**: Xdebug profiles one request at a time. Each request generates one cachegrind file. No aggregation across requests — this is manual.
- **File-based output**: Cachegrind files are written to disk by the Xdebug extension. Ensure sufficient disk space and write permissions in `output_dir`.
- **Tooling chain**: Xdebug → cachegrind file → KCacheGrind/QCacheGrind/WebGrind/PHPStorm → call tree → hot path identification → source code → fix → re-profile
- **No daemon or agent**: Unlike Tideways/Blackfire, Xdebug has no daemon. Data is written directly to disk by the PHP process.

## Performance Considerations

- Overhead: 50-200% — highest of all profiling approaches — development/staging only
- Cachegrind file size: 100KB-10MB depending on request complexity and call depth
- Disk I/O: Each profiled request writes a cachegrind file synchronously — adds latency to the request
- Multiple concurrent profiled requests: Disk I/O contention and file naming conflicts if output name pattern is not unique
- No overhead for non-profiled requests when using trigger-based mode

## Security

- Cachegrind files contain full function names, file paths, and call counts — may reveal business logic and internal architecture
- Store cachegrind files with restricted permissions (not world-readable)
- Never serve cachegrind files via web server — attackers could analyze application internals
- Clean up cachegrind files regularly — they accumulate quickly in shared environments

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Xdebug profiler in production | Convenience, familiarity | 50-200% overhead, altered performance profile, degraded user experience | Use Blackfire, Tideways, SPX, or eBPF for production profiling |
| Overwriting cachegrind files | Default output name pattern is same for all requests | Lost profiles; only last profile preserved | Use `xdebug.profiler_output_name=cachegrind.out.%p` to include PID |
| Always-on profiling | No trigger configuration | Every request profiled, constant high overhead | Use trigger-based profiling (`XDEBUG_PROFILE=1`) |
| Ignoring source annotation | Only looking at call tree | Missing the exact line-level bottleneck | Click function → Source tab → see cost per line |

## Anti-Patterns

- **Xdebug as primary profiler**: Xdebug is for staging/debugging only. Relying on it as the team's main profiling tool means you're never profiling production.
- **Profiling without cleaning up**: Cachegrind files accumulate quickly. Without cleanup, they consume disk space and can be accidentally served or committed.
- **Comparing Xdebug profiles with production profilers**: Xdebug's overhead alters timing. A profile from Xdebug cannot be meaningfully compared with a Tideways or Blackfire profile of the same endpoint.

## Examples

```bash
# php.ini configuration for Xdebug 3 profiling
xdebug.mode=profile
xdebug.output_dir=/tmp/profiling
xdebug.profiler_output_name=cachegrind.out.%p

# Trigger profiling via cookie
curl -b "XDEBUG_PROFILE=1" http://app/slow-endpoint

# Or via GET parameter
curl "http://app/slow-endpoint?XDEBUG_PROFILE=1"

# Open in KCacheGrind
kcachegrind /tmp/profiling/cachegrind.out.1234

# KCacheGrind workflow:
# 1. "Flat Profile" tab → sort by "Incl. Time" descending
# 2. Double-click top function → "Call Graph" tab
# 3. Follow hot path: most expensive child → repeat
# 4. Leaf with high self time → "Source" tab → see cost per line
# 5. Optimize → re-profile → compare

# PHPStorm integration:
# Tools → Xdebug Profiler → Open cachegrind.out.*
```

## Related Topics

- Inclusive vs Exclusive Time Analysis
- Callgraph Analysis Techniques
- Blackfire Installation and Triggered Profiling
- SPX Self-Hosted Profiling
- Flame Graph Generation and Interpretation

## AI Agent Notes

- Xdebug is development/staging only — never enable in production (50-200% overhead)
- Trigger-based profiling is essential: configure cookie/GET/POST trigger, not always-on
- cachegrind files are flat text — use KCacheGrind or PHPStorm for visualization
- Source annotation in KCacheGrind shows cost per line — the fastest path to root cause
- Always clean up cachegrind files after investigation — they accumulate and may leak internals

## Verification

- [ ] Xdebug profiling configured in php.ini (`xdebug.mode=profile`)
- [ ] Output directory created with appropriate permissions
- [ ] Output name pattern configured with PID (`cachegrind.out.%p`)
- [ ] Trigger-based profiling enabled (cookie/GET/POST, not always-on)
- [ ] Cachegrind file generated for the target endpoint
- [ ] File opened in KCacheGrind/QCacheGrind or PHPStorm
- [ ] Functions sorted by inclusive time descending
- [ ] Hot path followed to leaf with high self time
- [ ] Source annotation viewed for the optimization target
- [ ] Cachegrind files cleaned up after investigation
- [ ] No Xdebug profiling active in production configuration
- [ ] Team trained that Xdebug is for staging only
