# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Profiling & Observability
**Knowledge Unit:** Xdebug Profiling Setup and Analysis â€” cachegrind Output, KCacheGrind Visualization
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Never enable Xdebug profiling in production**: The 50-200% overhead makes profiles unreliable and degrades user experience. Use sampling profilers (Tideways, SPX, eBPF) for production.
- [ ] **Cachegrind output naming**: Use `xdebug.profiler_output_name=cachegrind.out.%p` to include PID. Avoid overwriting profiles when multiple requests run simultaneously.
- [ ] **Use trigger-based profiling**: Configure `xdebug.mode=profile` via HTTP trigger (`XDEBUG_PROFILE=1` cookie/POST/GET) rather than always-on profiling. This avoids profiling every request.
- [ ] **Combine with source annotation**: In KCacheGrind, click a function â†’ "Source" tab shows cost per line. This pinpoints the exact line causing the bottleneck.
- [ ] Xdebug profiling configured in php.ini (`xdebug.mode=profile`)
- [ ] Output directory created with appropriate permissions
- [ ] Output name pattern configured with PID (`cachegrind.out.%p`)
- [ ] Trigger-based profiling enabled (cookie/GET/POST, not always-on)
- [ ] Cachegrind file generated for the target endpoint
- [ ] Xdebug configured with trigger-based profiling and PID-based filenames
- [ ] Cachegrind file generated and opened in KCacheGrind
- [ ] Hot path followed to leaf with high self time
- [ ] Source annotation identifies exact line-level bottleneck
- [ ] Files cleaned up after investigation
- [ ] Production configuration confirmed Xdebug-free
- [ ] Xdebug profiling configured (trigger-based, PID in filename)
- [ ] Cachegrind file generated for target endpoint
- [ ] File opened in KCacheGrind/QCacheGrind
- [ ] Source annotation viewed for line-level bottleneck
- [ ] Cachegrind files cleaned up after investigation

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Sampling vs Instrumentation**: Sampling profilers (Xdebug, Tideways, eBPF) have low overhead (1-3%) and are safe for production but provide statistical approximation. Instrumented profilers (Blackfire, Xdebug trace mode) provide exact measurements but have 10-30% overhead Ã¢â‚¬â€ development/staging only.
- [ ] **Production vs Staging profiling**: Profile in production for authentic results but with sampling only. Use heavier instrumentation in staging with production-like traffic. The production profile is the ground truth Ã¢â‚¬â€ always validate staging findings against production.
- [ ] **Request-scoped profiling**: Xdebug profiles one request at a time. Each request generates one cachegrind file. No aggregation across requests â€” this is manual.
- [ ] **File-based output**: Cachegrind files are written to disk by the Xdebug extension. Ensure sufficient disk space and write permissions in `output_dir`.
- [ ] **Tooling chain**: Xdebug â†’ cachegrind file â†’ KCacheGrind/QCacheGrind/WebGrind/PHPStorm â†’ call tree â†’ hot path identification â†’ source code â†’ fix â†’ re-profile
- [ ] **No daemon or agent**: Unlike Tideways/Blackfire, Xdebug has no daemon. Data is written directly to disk by the PHP process.
- [ ] Document and follow through on architectural decision: Xdebug profiling usage
- [ ] Document and follow through on architectural decision: Xdebug in production vs development
- [ ] Ensure architecture aligns with core concept: **Setup**: `xdebug.mode=profile`, `xdebug.output_dir=/tmp/profiling`, `xdebug.profiler_output_name=cachegrind.out.%p`. Restart PHP-FPM. Trigger a request. Output file appears in configured directory.
- [ ] Ensure architecture aligns with core concept: **cachegrind format**: Flat text format: `fl=file.php`, `fn=functionName`, `cfn=caller`, `calls=N`, line numbers with inclusive/exclusive time. Readable but best viewed in GUI tools.
- [ ] Ensure architecture aligns with core concept: **KCacheGrind / QCacheGrind**: Visualize as call graph (callee map), flat profile (sorted by inclusive/exclusive time), call tree (parent-child cost), source annotation (cost per line).
- [ ] Ensure architecture aligns with core concept: **Inclusive vs exclusive time**: Inclusive = time inside function INCLUDING its callees. Exclusive = time only inside function, excluding callees. Hotspots are functions with high inclusive time AND high exclusive time.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Never enable Xdebug profiling in production**: The 50-200% overhead makes profiles unreliable and degrades user experience. Use sampling profilers (Tideways, SPX, eBPF) for production.
- [ ] **Cachegrind output naming**: Use `xdebug.profiler_output_name=cachegrind.out.%p` to include PID. Avoid overwriting profiles when multiple requests run simultaneously.
- [ ] **Use trigger-based profiling**: Configure `xdebug.mode=profile` via HTTP trigger (`XDEBUG_PROFILE=1` cookie/POST/GET) rather than always-on profiling. This avoids profiling every request.
- [ ] **Combine with source annotation**: In KCacheGrind, click a function â†’ "Source" tab shows cost per line. This pinpoints the exact line causing the bottleneck.

# Performance Checklist (from 04/06)
- [ ] Overhead: 50-200% â€” highest of all profiling approaches â€” development/staging only
- [ ] Cachegrind file size: 100KB-10MB depending on request complexity and call depth
- [ ] Disk I/O: Each profiled request writes a cachegrind file synchronously â€” adds latency to the request
- [ ] Multiple concurrent profiled requests: Disk I/O contention and file naming conflicts if output name pattern is not unique
- [ ] No overhead for non-profiled requests when using trigger-based mode
- [ ] Xdebug (sampling)
- [ ] Blackfire
- [ ] Tideways
- [ ] eBPF

# Security Checklist (from 04/06 - only if relevant)
- [ ] Cachegrind files contain full function names, file paths, and call counts â€” may reveal business logic and internal architecture
- [ ] Store cachegrind files with restricted permissions (not world-readable)
- [ ] Never serve cachegrind files via web server â€” attackers could analyze application internals
- [ ] Clean up cachegrind files regularly â€” they accumulate quickly in shared environments

# Reliability Checklist (from 04/05/06)
- [ ] **Observer effect**: Profiling overhead alters application behavior. Symptom: Production profiling with heavy tools shows different performance profile than normal. Mitigation: Use low-overhead (<3%) profilers for production. Accept statistical approximation.
- [ ] **Profiling bias**: Timing signals in sampling profilers correlate with application intervals. Symptom: Under- or over-representation of certain code paths. Mitigation: Use random sampling intervals, vary sampling frequency.
- [ ] **Flame graph misinterpretation**: Wide bottom frames misidentified as bottlenecks. Symptom: Optimizing the wrong function. Mitigation: Always check whether width is self-time or inclusive. Wide bottom frame with many children = potentially architectural.
- [ ] **Production profiling safety**: Use sampling profilers (1-3% overhead) in production. Never use instrumentation profilers on live traffic. eBPF is ideal for production-zero overhead.
- [ ] **Alert-driven profiling**: Trigger flame graph capture automatically when latency crosses threshold. Store profiles for post-mortem analysis.
- [ ] **Profiling cadence**: Continuous profiling (Tideways/Blackfire) for baseline. On-demand deep profiling (Xdebug) for specific investigations.
- [ ] **Data retention**: Store flame graphs for 30 days minimum. Correlate with deploy events to identify performance regressions.

# Testing Checklist (from 04/06)
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
- [ ] Xdebug configured with trigger-based profiling and PID-based filenames
- [ ] Cachegrind file generated and opened in KCacheGrind
- [ ] Source annotation identifies exact line-level bottleneck
- [ ] Files cleaned up after investigation
- [ ] Production configuration confirmed Xdebug-free
- [ ] Xdebug profiling configured (trigger-based, PID in filename)
- [ ] Cachegrind file generated for target endpoint
- [ ] File opened in KCacheGrind/QCacheGrind
- [ ] Source annotation viewed for line-level bottleneck

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Never enable Xdebug profiling in production**: The 50-200% overhead makes profiles unreliable and degrades user experience. Use sampling profilers (Tideways, SPX, eBPF) for production.
- [ ] **Cachegrind output naming**: Use `xdebug.profiler_output_name=cachegrind.out.%p` to include PID. Avoid overwriting profiles when multiple requests run simultaneously.
- [ ] **Use trigger-based profiling**: Configure `xdebug.mode=profile` via HTTP trigger (`XDEBUG_PROFILE=1` cookie/POST/GET) rather than always-on profiling. This avoids profiling every request.
- [ ] **Combine with source annotation**: In KCacheGrind, click a function â†’ "Source" tab shows cost per line. This pinpoints the exact line causing the bottleneck.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Xdebug profiler in production
- [ ] Avoid: Overwriting cachegrind files
- [ ] Avoid: Always-on profiling
- [ ] Avoid: Ignoring source annotation
- [ ] Avoid anti-pattern: **Xdebug as primary profiler**: Xdebug is for staging/debugging only. Relying on it as the team's main profiling tool means you're never profiling production.
- [ ] Avoid anti-pattern: **Profiling without cleaning up**: Cachegrind files accumulate quickly. Without cleanup, they consume disk space and can be accidentally served or committed.
- [ ] Avoid anti-pattern: **Comparing Xdebug profiles with production profilers**: Xdebug's overhead alters timing. A profile from Xdebug cannot be meaningfully compared with a Tideways or Blackfire profile of the same endpoint.
- [ ] Guard against anti-pattern: Production Profiling Without Overhead Control
- [ ] Guard against anti-pattern: Firefighting Without Flame Graphs
- [ ] Guard against anti-pattern: Observability Without Traces
- [ ] Guard against anti-pattern: Dashboards Without Actionable Alerts
- [ ] Guard against anti-pattern: Ignoring Memory Profiling (CPU-Only Focus)
- [ ] Sampling rate <= 10%
- [ ] Profiler CPU < 3%

# Production Readiness Checklist
- [ ] Configure monitoring and alerting
- [ ] Set up logging with appropriate verbosity levels
- [ ] Document operational runbooks
- [ ] **Production profiling safety**: Use sampling profilers (1-3% overhead) in production. Never use instrumentation profilers on live traffic. eBPF is ideal for production-zero overhead.
- [ ] **Alert-driven profiling**: Trigger flame graph capture automatically when latency crosses threshold. Store profiles for post-mortem analysis.
- [ ] **Profiling cadence**: Continuous profiling (Tideways/Blackfire) for baseline. On-demand deep profiling (Xdebug) for specific investigations.
- [ ] **Data retention**: Store flame graphs for 30 days minimum. Correlate with deploy events to identify performance regressions.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **Setup**: `xdebug.mode=profile`, `xdebug.output_dir=/tmp/profiling`, `xdebug.profiler_output_name=cachegrind.out.%p`. Restart PHP-FPM. Trigger a request. Output file appears in configured directory., **cachegrind format**: Flat text format: `fl=file.php`, `fn=functionName`, `cfn=caller`, `calls=N`, line numbers with inclusive/exclusive time. Readable but best viewed in GUI tools., **KCacheGrind / QCacheGrind**: Visualize as call graph (callee map), flat profile (sorted by inclusive/exclusive time), call tree (parent-child cost), source annotation (cost per line)., **Inclusive vs exclusive time**: Inclusive = time inside function INCLUDING its callees. Exclusive = time only inside function, excluding callees. Hotspots are functions with high inclusive time AND high exclusive time.
**Skills:** Inclusive vs Exclusive Time Analysis, Callgraph Analysis Techniques, Flame Graph Generation and Interpretation, SPX Self-Hosted Profiling
**Decision Trees:** Xdebug profiling usage, Xdebug in production vs development
**Anti-Patterns:** Production Profiling Without Overhead Control, Firefighting Without Flame Graphs, Observability Without Traces, Dashboards Without Actionable Alerts, Ignoring Memory Profiling (CPU-Only Focus)
**Related Topics:** Inclusive vs Exclusive Time Analysis, Callgraph Analysis Techniques, Blackfire Installation and Triggered Profiling, SPX Self-Hosted Profiling, Flame Graph Generation and Interpretation

