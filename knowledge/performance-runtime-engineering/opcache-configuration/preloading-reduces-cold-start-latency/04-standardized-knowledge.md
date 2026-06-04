# Preloading Reduces Cold-Start Latency at Cost of Startup Time and Baseline Memory

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | OpCache Configuration & Preloading |
| Knowledge Unit | Preloading Reduces Cold-Start Latency at Cost of Startup Time and Baseline Memory |
| Difficulty | Foundation |
| Last Updated | 2026-06-02 |

## Overview

OpCache preloading eliminates first-request latency penalty after PHP-FPM restart by loading all specified files into OpCache at startup. Tradeoff: faster first request (10-16ms autoloading saved) vs slower startup (time to compile preload script) and higher baseline memory (preloaded classes occupy OpCache space even if unused per request).

## Core Concepts

- Cold-start latency: Without preloading, first request after restart compiles and autoloads framework classes. 100-800ms overhead depending on application size.
- Preloading cost: Startup time increases by time to compile and execute preload script. For Laravel with 200 preloaded classes, ~200-500ms added.
- Baseline memory: Preloaded classes use memory equal to compiled size + metadata. Full Laravel preload (~800 classes): ~40-80MB additional OpCache consumption.
- Benefit proportionality: Fast APIs (<100ms) benefit most. Slow APIs (>500ms) see negligible improvement.

## When To Use

- Fast API endpoints where autoloading is a significant percentage of response time.
- Containerized environments (startup once, handle many requests).
- Framework-heavy applications with large bootstrap.

## When NOT To Use

- Slow applications where database queries dominate response time.
- Applications with very few classes.
- Environments with frequent PHP-FPM restarts.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Preload core framework classes only | Maximizes benefit-to-memory ratio. Leave app-specific classes for lazy loading. |
| Measure benefit before committing | If your app takes 500ms+ per request, preloading's 16ms savings may not matter. |

## Architecture Guidelines

- Without preloading: first request 200-800ms, steady-state same, startup 1-2s, memory low-medium.
- With preloading: first request 5-50ms, steady-state same, startup 2-3s, memory medium-high.
- Preloading compounds with inheritance cache for maximum class-loading speed.

## Performance Considerations

- Fast API (<50ms): 5-15x gain from Octane + preloading.
- Slow API (>500ms): 10-20% gain.
- Preloaded classes consume OpCache memory permanently.

## Security Considerations

- No direct security implications from preloading.
- Preload script runs at startup - ensure it doesn't execute sensitive operations.

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|----------------|
| Preloading for slow applications | If app makes 200ms DB queries, saving 16ms on autoloading yields <8% improvement. | Wasted memory and startup time. | Fix I/O bottlenecks first. |

## Anti-Patterns

- Preloading rarely-used classes: Wastes memory.
- Not measuring before/after: Preloading benefit varies widely by application.

## Examples

```bash
# Measure bootstrap time
php -r "echo 'Bootstrap: ' . (microtime(true) - \$start) . 's';" 2>/dev/null || true
# Comapre with and without preloading: check first-request latency after restart
```

## Related Topics

- Preloading Script Design Patterns
- OpCache File Cache and Container Cold Start
- OpCache Memory Sizing

## AI Agent Notes

- Preloading is a micro-optimization. Fix I/O bottlenecks first.
- Benefit is proportional to API speed. Fast APIs benefit enormously; slow APIs barely notice.
- The memory cost is real and permanent. Be selective about what's preloaded.
- In containerized environments, the startup time cost is paid once per container, making the tradeoff more favorable.

## Verification

- [ ] Measure bootstrap time (empty endpoint response time).
- [ ] Compute potential speedup: 1/(1-bootstrap_proportion).
- [ ] Implement preloading if speedup > 1.5x.
- [ ] Verify first-request latency reduction.
- [ ] Monitor OpCache memory usage increase from preloading.