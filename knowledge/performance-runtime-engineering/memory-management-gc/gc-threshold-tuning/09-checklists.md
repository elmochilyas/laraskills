# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Memory Management & Garbage Collection
**Knowledge Unit:** # GC Threshold Tuning â€” gc_threshold Dynamic Adjustment, Collection Frequency, Root Buffer Sizing
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Read gc_status() and verify current threshold value.
- [ ] Change threshold to 5000 and verify gc_status() shows the new value.
- [ ] Measure GC frequency and pause duration at different threshold values.
- [ ] Monitor root_buf_entries over time â€” verify threshold prevents unbounded growth.
- [ ] Test gc_protect/gc_unprotect in a critical section.
- [ ] GC CPU usage reduced to <1% while memory remains stable
- [ ] root_buffer_length stays within acceptable range (never exceeds threshold by 2x)
- [ ] No memory growth from uncollected cycles
- [ ] Threshold configuration documented with telemetry data
- [ ] Baseline GC telemetry collected (runs, collected, threshold, root_buffer)
- [ ] GC CPU usage measured
- [ ] Threshold adjusted based on workload pattern (web vs batch vs long-running)
- [ ] After-tuning telemetry confirms improvement
- [ ] Memory usage stable over 24 hours
- [ ] Configuration documented
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Performance vs operational complexity**: The highest-performance settings (validate_timestamps=0, aggressive memory sizing) require more operational discipline. Choose based on team maturity and deployment automation.
- [ ] **One-size-fits-all vs per-application tuning**: Default settings are designed for compatibility, not performance. Each application requires measurement-based tuning.
- [ ] **Threshold semantics**: The threshold is the number of root buffer entries before automatic GC is triggered. It is NOT a time interval. GC runs when the count of potential cycle roots reaches this number.
- [ ] **Buffer growth pattern**: In a typical Laravel Octane worker, the root buffer grows by 10â€“50 entries per request. At 10,000 threshold, GC runs every 200â€“1000 requests. Each run collects 10â€“100 cycles.
- [ ] **Collection during GC**: While GC is running, new potential cycle roots are tracked but not processed. They are processed in the next GC run.
- [ ] **Threshold and memory relationship**: A higher threshold means more memory is consumed before GC runs. Ensure available memory can accommodate the accumulation between GC runs.
- [ ] **gc_protect/gc_unprotect**: These protect the root buffer from collection during critical sections (e.g., during a database transaction where inline processing would cause latency). Use sparingly â€” they defer collection, not eliminate it.
- [ ] Document and follow through on architectural decision: GC threshold value adjustment
- [ ] Document and follow through on architectural decision: Whether to disable GC in specific scenarios
- [ ] Ensure architecture aligns with core concept: **Root buffer size (default 10,000)**: Number of potential cycle roots tracked before automatic GC triggers. Configurable via `gc_threshold()`.
- [ ] Ensure architecture aligns with core concept: **gc_threshold(int $threshold)**: Sets the root buffer size. When the buffer reaches this size, GC runs automatically. Returns the previous threshold.
- [ ] Ensure architecture aligns with core concept: **gc_status()['threshold']**: Reports the current threshold value. Combined with `roots` field, shows how close the buffer is to triggering GC.
- [ ] Ensure architecture aligns with core concept: **Collection frequency vs pause duration**: Lower threshold â†’ more frequent, shorter GC runs. Higher threshold â†’ less frequent, longer GC runs per run.
- [ ] Ensure architecture aligns with core concept: **Buffer overflow**: If the root buffer exceeds the threshold while a GC run is in progress, the new roots wait for the next collection cycle.
- [ ] Ensure architecture aligns with core concept: **gc_protect()/gc_unprotect()**: Temporarily protects/unprotects the root buffer from collection. Used around critical sections.
- [ ] Ensure architecture aligns with core concept: **Dynamic adjustment**: The threshold can be changed at runtime based on system state â€” e.g., increase during peak traffic (fewer pauses), decrease during off-peak (more thorough cleanup).

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Monitor GC activity: `$gc = gc_status();` â€” record runs, collected, threshold, and root_buffer_length over 24 hours
- [ ] If GC runs consume >5% CPU (profiling data) AND root_buffer_length is consistently low (<1000), GC is running too frequently
- [ ] Increase gc_divisor (default 100) to reduce probability: `gc_divisor = 1000` reduces GC frequency by 10x
- [ ] If memory usage grows because GC is not collecting frequently enough AND root_buffer_length is high (>10000), decrease gc_divisor or set explicit gc_threshold
- [ ] For PHP 8.3+: set `gc_threshold = 5000` to trigger collection when root buffer reaches 5000 entries (default is 10000)
- [ ] For batch processing jobs: call `gc_collect_cycles()` explicitly after the batch, not during
- [ ] After tuning, monitor for 24 hours: verify CPU decreased AND memory did not grow unbounded
- [ ] Document the selected thresholds with rationale

# Performance Checklist (from 04/06)
- [ ] GC pause duration at default threshold (10,000 roots): ~50â€“500Âµs. At a threshold of 100,000: ~500â€“5000Âµs (proportional to root count).
- [ ] GC frequency at default threshold: ~once every 200â€“1000 requests in an Octane worker. At a threshold of 5,000: ~twice as frequent.
- [ ] CPU cost of GC: collector_time / application_time ratio. >5% indicates excessive collection. Tune threshold to reduce frequency.
- [ ] Memory cost of deferred GC: each uncollected root entry holds memory for potential cycles. A full root buffer (10,000 entries) holds approximately 1â€“10MB of data that could be freed.
- [ ] Trade-off: halving the threshold doubles GC frequency but halves memory held by uncollected cycles.
- [ ] Higher memory allocation
- [ ] validate_timestamps=0
- [ ] Larger hash table

# Security Checklist (from 04/06 - only if relevant)
- [ ] GC pauses are too short (<1ms) to be a meaningful timing side channel. Threshold tuning does not affect security posture.
- [ ] Memory exhaustion: a threshold set too high in a memory-constrained environment could allow cycles to accumulate until OOM. Always set safety margins.
- [ ] gc_protect should not be called indefinitely â€” it prevents collection and can mask memory leaks.

# Reliability Checklist (from 04/05/06)
- [ ] **Cache thrashing**: Undersized memory causes constant eviction/recompilation. Symptom: hit rate below 95%. Mitigation: Increase memory.
- [ ] **Stale code serving**: validate_timestamps=0 without deployment automation. Symptom: Code changes don't take effect. Mitigation: Automate opcache_reset().
- [ ] **OOM from oversized cache**: Memory allocated to OpCache is permanently reserved. Oversizing can starve other processes.
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Testing Checklist (from 04/06)
- [ ] Read gc_status() and verify current threshold value.
- [ ] Change threshold to 5000 and verify gc_status() shows the new value.
- [ ] Measure GC frequency and pause duration at different threshold values.
- [ ] Monitor root_buf_entries over time â€” verify threshold prevents unbounded growth.
- [ ] Test gc_protect/gc_unprotect in a critical section.
- [ ] Verify threshold change takes effect immediately (no restart needed).
- [ ] Document the chosen threshold and the reasoning based on monitoring data.
- [ ] GC CPU usage reduced to <1% while memory remains stable
- [ ] root_buffer_length stays within acceptable range (never exceeds threshold by 2x)
- [ ] No memory growth from uncollected cycles
- [ ] Threshold configuration documented with telemetry data
- [ ] Baseline GC telemetry collected (runs, collected, threshold, root_buffer)
- [ ] GC CPU usage measured
- [ ] Threshold adjusted based on workload pattern (web vs batch vs long-running)
- [ ] After-tuning telemetry confirms improvement
- [ ] Memory usage stable over 24 hours
- [ ] Configuration documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Setting threshold very low (<1000)
- [ ] Avoid: Setting threshold very high (>100000)
- [ ] Avoid: Changing threshold without monitoring
- [ ] Avoid: Forgetting that PHP-FPM resets the heap
- [ ] Avoid anti-pattern: **Setting threshold to 0**: This disables automatic collection (gc_threshold(0) sets threshold to 0). Only do this if you manage collection manually via gc_collect_cycles(). Risk of unbounded root buffer growth.
- [ ] Avoid anti-pattern: **Changing threshold on every request**: Threshold changes are cheap but unnecessary. Set once per process based on monitoring data.
- [ ] Avoid anti-pattern: **Assuming threshold tuning replaces manual collection**: Manual gc_collect_cycles() at request boundaries complements threshold-based automatic collection. Both should be configured.
- [ ] Avoid anti-pattern: **Tuning before measuring**: Threshold tuning without gc_status() data is guesswork. Always measure first.
- [ ] Guard against anti-pattern: Ignoring zval Memory Overhead for Scalars vs Compounds
- [ ] Guard against anti-pattern: Copy-On-Write Violation - Unnecessary Array Duplication
- [ ] Guard against anti-pattern: Ignoring Cyclic Garbage Collection Overhead
- [ ] Guard against anti-pattern: Memory Leak in Long-Running Workers
- [ ] Guard against anti-pattern: Oversized Memory Limit Masking Waste
- [ ] Hot-path data uses scalars

# Production Readiness Checklist
- [ ] Configure monitoring and alerting
- [ ] Set up logging with appropriate verbosity levels
- [ ] Document operational runbooks
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **Root buffer size (default 10,000)**: Number of potential cycle roots tracked before automatic GC triggers. Configurable via `gc_threshold()`., **gc_threshold(int $threshold)**: Sets the root buffer size. When the buffer reaches this size, GC runs automatically. Returns the previous threshold., **gc_status()['threshold']**: Reports the current threshold value. Combined with `roots` field, shows how close the buffer is to triggering GC., **Collection frequency vs pause duration**: Lower threshold â†’ more frequent, shorter GC runs. Higher threshold â†’ less frequent, longer GC runs per run., **Buffer overflow**: If the root buffer exceeds the threshold while a GC run is in progress, the new roots wait for the next collection cycle.
**Rules:**
- General: Protect Critical Sections with gc_protect, Not Threshold Changes
**Skills:** GC Algorithm and Cycle Collection, GC Telemetry and Root Buffer, Memory Leak Detection Patterns
**Decision Trees:** GC threshold value adjustment, Whether to disable GC in specific scenarios
**Anti-Patterns:** Ignoring zval Memory Overhead for Scalars vs Compounds, Copy-On-Write Violation - Unnecessary Array Duplication, Ignoring Cyclic Garbage Collection Overhead, Memory Leak in Long-Running Workers, Oversized Memory Limit Masking Waste
**Related Topics:** Cycle Collection â€” Bacon-Rajan Algorithm, GC Enable/Disable Patterns, gc_collect_cycles() Strategic Calling, GC Telemetry and Root Buffer Monitoring, Memory Leak Detection Patterns

