# Skill: Profile and Optimize Each Phase of the PHP Execution Lifecycle

## Purpose

Identify which phase of PHP execution (lexing, parsing, compilation, execution) is the bottleneck and apply phase-specific optimizations.

## When To Use

- Profiling shows significant time spent in PHP execution before application code runs
- After deployment, endpoints are slower than expected despite OpCache being enabled
- Tuning OpCache, JIT, and preloading configurations

## When NOT To Use

- When the bottleneck is clearly in application logic or I/O (database, external APIs)
- For single-request CLI scripts where lifecycle phases run once

## Prerequisites

- OpCache enabled and optimally configured
- Profiling tool that distinguishes compilation from execution time
- Understanding of the five lifecycle phases: lex → parse → compile → execute → clean up

## Inputs

- Profiling data showing time breakdown across lifecycle phases
- OpCache hit rate and cache_full metrics
- JIT buffer utilization data
- Preloading configuration and class list

## Workflow (numbered steps)

1. Measure baseline: profile a request and record wall time broken into bootstrap vs execution
2. Check OpCache hit rate: if <99%, compilation overhead is inflating execution time — size OpCache memory and max files
3. If OpCache hit rate >99% but execution still slow, check JIT utilization: if JIT buffer is >80% full, increase buffer size
4. If preloading is not configured, identify the top 100 most-loaded classes from profiling data and add them to preload script
5. Enable preloading: create `config/preload.php` with class list and configure `opcache.preload` in php.ini
6. Benchmark before/after each optimization phase to measure individual impact
7. Document the optimized configuration and lifecycle phase improvements

## Validation Checklist

- [ ] OpCache hit rate >99% confirmed
- [ ] JIT buffer utilization monitored (<80% full)
- [ ] Preloading configured for frequently-used classes
- [ ] Lifecycle phase optimization documented
- [ ] Before/after benchmark shows reduction in execution time

## Common Failures

- **Assuming OpCache eliminates all compilation overhead**: OpCache caches opcodes but bootstrap still runs — preloading addresses this
- **Ignoring preloading for frameworks**: Laravel/Symfony have thousands of classes — preloading the most-used 100 saves 1-3ms per request
- **Not measuring lifecycle phases separately**: Without profiling, you can't tell if the bottleneck is compilation or execution

## Decision Points

- If compilation phase is the bottleneck: focus on OpCache sizing and hit rate
- If bootstrap/autoloading is the bottleneck: focus on preloading and Composer autoloader optimization
- If execution phase is the bottleneck: focus on JIT, algorithm optimization, or caching
- If all phases are fast: the bottleneck is I/O, not PHP execution

## Performance Considerations

- Without OpCache: lex+parse+compile takes 60-80% of request time
- With OpCache: compilation eliminated on cache hits (target >99% hit rate)
- With preloading: autoloading time reduced by 1-3ms per request
- With JIT: CPU-bound execution improved by 61-95%

## Security Considerations

- Preloading executes the preload script with full privileges — only trusted code should be preloaded
- OpCache file cache must not be publicly accessible if enabled
- JIT configuration does not affect PHP's security model

## Related Rules (from 05-rules.md)

- Enable OpCache First, Tune Later
- Configure OpCache Before JIT
- Use Preloading for Framework Classes
- Never Disable OpCache for Debugging

## Related Skills

- OpCache Monitoring and Hit Rate Analysis
- Preloading Script Design Patterns
- Composer Autoloader Optimization

## Success Criteria

- Execution lifecycle phase bottlenecks identified and addressed
- OpCache hit rate >99% confirmed
- Preloading configured for framework classes
- Before/after benchmark shows measurable improvement in request time
