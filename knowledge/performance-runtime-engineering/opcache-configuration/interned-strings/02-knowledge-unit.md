# Metadata

Domain: Performance & Runtime Engineering
Subdomain: OpCache Configuration & Preloading
Knowledge Unit: # OpCache Interned Strings â€” interned_strings_buffer, String Deduplication, Memory Savings
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary



---

# Core Concepts



---

# Patterns

**Core pattern**: Apply the principles consistently across all applicable code paths. Measure before and after each change.

---

# Performance Considerations



---

# Common Mistakes



---

# Related Knowledge Units



---

## Mental Models

**Systems thinking model**: Each configuration parameter interacts with others. Change one, measure the impact on all metrics. The system as a whole determines throughput, not any single setting.

---

## Internal Mechanics

PHP's internal mechanics determine the upper bound of what configuration can achieve. Understanding the interaction between memory allocation, hash table sizing, and shared memory segments enables precise tuning rather than guesswork.

---

## Architectural Decisions

- **Performance vs operational complexity**: The highest-performance settings (validate_timestamps=0, aggressive memory sizing) require more operational discipline. Choose based on team maturity and deployment automation.
- **One-size-fits-all vs per-application tuning**: Default settings are designed for compatibility, not performance. Each application requires measurement-based tuning.

---

## Tradeoffs

| Tradeoff | Benefit | Cost |
|----------|---------|------|
| Higher memory allocation | Fewer evictions, higher hit rate | Permanently reserved RAM |
| validate_timestamps=0 | 1-3% CPU savings | Requires deployment automation |
| Larger hash table | Fewer collisions, faster lookups | Slightly more memory per entry |

---

## Production Considerations

- **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- **Test in staging**: Tuning changes should be validated in a staging environment before production.

---

## Failure Modes

- **Cache thrashing**: Undersized memory causes constant eviction/recompilation. Symptom: hit rate below 95%. Mitigation: Increase memory.
- **Stale code serving**: validate_timestamps=0 without deployment automation. Symptom: Code changes don't take effect. Mitigation: Automate opcache_reset().
- **OOM from oversized cache**: Memory allocated to OpCache is permanently reserved. Oversizing can starve other processes.

---

## Ecosystem Usage

- **Laravel**: Heavily benefits from proper OpCache configuration due to 20K+ file count. Preloading recommended.
- **WordPress**: Smaller footprint but benefits from validate_timestamps=0 and basic memory tuning.
- **Magento**: Extremely large file count (50K+) requires aggressive max_accelerated_files and memory tuning.

---

## Research Notes

- PHP 8.5 introduced file_cache_read_only for container cold-start mitigation.
- Inheritance cache (PHP 8.1+) reduces class hierarchy resolution overhead by ~80% in framework apps.
- Community tools (cachetool CLI, opcache-gui) simplify production monitoring and management.

