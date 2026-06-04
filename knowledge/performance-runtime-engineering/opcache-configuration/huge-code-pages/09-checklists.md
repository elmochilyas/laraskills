# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** # OpCache Huge Code Pages â€” opcache.huge_code_pages, TLB Pressure Reduction, Memory Mapping
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Configure `nr_hugepages` on the host system: `echo N | sudo tee /sys/kernel/mm/hugepages/nr_hugepages`.
- [ ] Verify `HugePages_Total` and `HugePages_Free` in `/proc/meminfo`.
- [ ] Enable `opcache.huge_code_pages=1` in php.ini.
- [ ] Restart PHP-FPM and verify: `opcache_get_status()['huge_pages']` should be true.
- [ ] Measure TLB misses before/after: `perf stat -e dTLB-load-misses,iTLB-load-misses`.
- [ ] Huge pages configured and allocated for OpCache
- [ ] OpCache using huge pages confirmed
- [ ] Benchmark shows measurable improvement (or confirms minimal impact)
- [ ] Configuration persisted via sysctl.conf
- [ ] Documentation created with configuration details
- [ ] Huge page support verified on the system
- [ ] nr_hugepages set to accommodate OpCache memory + headroom
- [ ] sysctl.conf updated for persistence
- [ ] opcache.huge_code_pages=1 configured
- [ ] PHP-FPM restarted
- [ ] Huge page usage confirmed (free count decreased)
- [ ] Benchmark completed (should show 5-15% improvement for large caches)
- [ ] Configuration documented
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Performance vs operational complexity**: The highest-performance settings (validate_timestamps=0, aggressive memory sizing) require more operational discipline. Choose based on team maturity and deployment automation.
- [ ] **One-size-fits-all vs per-application tuning**: Default settings are designed for compatibility, not performance. Each application requires measurement-based tuning.
- [ ] **Explicit vs transparent huge pages**: Explicit huge pages (configured via `nr_hugepages`) are pre-allocated and guaranteed. Transparent Huge Pages (THP) are managed by the kernel and may be split back to 4KB pages under memory pressure. Explicit pages are recommended for OpCache.
- [ ] **Memory pinning**: Explicit huge pages are pinned in physical memory â€” they cannot be swapped. This guarantees performance but also means the memory is always occupied, even when OpCache is not fully utilized.
- [ ] **Cache layout on huge pages**: When `opcache.huge_code_pages=On`, OpCache maps the entire shared memory segment onto huge pages. The segment includes the hash table, op_array structures, and interned strings â€” not just the opcodes.
- [ ] **Huge page allocation at startup**: OpCache requests huge pages during PHP-FPM startup. If sufficient huge pages are not available, OpCache falls back to 4KB pages. The fallback is silent â€” verify with `opcache_get_status()`.
- [ ] **Contiguous memory requirement**: Huge pages require contiguous physical memory. On systems with fragmented memory, allocation may fail even if `nr_hugepages` is set. Reserve huge pages early (boot time) for best results.
- [ ] **Container support**: Huge pages can be used in containers with `--privileged` or `--cap-add=IPC_LOCK` and host-level huge page configuration.
- [ ] Document and follow through on architectural decision: Huge code pages for OpCache
- [ ] Ensure architecture aligns with core concept: **Huge pages**: Memory pages of 2MB (or 1GB on some architectures) instead of the default 4KB. Reduces page table size and TLB pressure.
- [ ] Ensure architecture aligns with core concept: **TLB (Translation Lookaside Buffer)**: CPU cache that maps virtual addresses to physical addresses. Limited in size (~64â€“1024 entries for 4KB pages). With 4KB pages, a 256MB OpCache needs 65,536 page table entries â€” exceeds TLB capacity, causing frequent misses.
- [ ] Ensure architecture aligns with core concept: **TLB miss**: When a virtual address is not in the TLB, the CPU must walk the page table â€” an expensive operation (~10â€“100ns). With huge pages, the same 256MB OpCache needs only 128 entries (2MB pages) â€” fits comfortably in the TLB.
- [ ] Ensure architecture aligns with core concept: **TLB coverage**: The amount of virtual memory that can be mapped without TLB misses. 4KB pages with 64 TLB entries = 256KB. 2MB pages with 64 TLB entries = 128MB.
- [ ] Ensure architecture aligns with core concept: **opcache.huge_code_pages**: Boolean setting (On/Off). When enabled, OpCache attempts to allocate its shared memory from the huge page pool.
- [ ] Ensure architecture aligns with core concept: **OS configuration**: Huge pages must be pre-allocated by the OS. Configure via `/sys/kernel/mm/hugepages/nr_hugepages` or kernel boot parameters.
- [ ] Ensure architecture aligns with core concept: **Transparent Huge Pages (THP)**: An alternative to explicit huge pages. Linux can automatically promote eligible memory to huge pages. THP is less predictable than explicit huge pages and may cause memory fragmentation.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Check current huge page configuration: `cat /proc/meminfo | grep HugePages`
- [ ] Calculate the number of huge pages needed: `opcache.memory_consumption / huge_page_size` (default huge page size is 2MB)
- [ ] Configure huge pages: `echo 256 > /proc/sys/vm/nr_hugepages` (for 512MB OpCache)
- [ ] For persistent configuration: add `vm.nr_hugepages=256` to `/etc/sysctl.conf`
- [ ] Enable `opcache.huge_code_pages=1` in php.ini
- [ ] Restart PHP-FPM to apply
- [ ] Verify OpCache is using huge pages: check `cat /proc/meminfo | grep HugePages` â€” free count should decrease
- [ ] Benchmark throughput with and without huge pages to measure impact
- [ ] If improvement <5%, consider disabling (huge pages are a constrained resource)
- [ ] Document the configuration and benchmark results

# Performance Checklist (from 04/06)
- [ ] TLB miss reduction: For a 256MB OpCache, TLB misses are reduced by ~99% (from 65,536 entries to 128 entries).
- [ ] CPU-bound workload improvement: 1â€“3% throughput increase from reduced memory access latency.
- [ ] Memory access latency: Huge pages reduce L2/L3 cache miss penalties by improving TLB coverage.
- [ ] Benchmark variability: Gains depend on CPU architecture, memory speed, and OpCache size. Newer CPUs (Zen 4, Intel 12th gen+) have larger TLBs, reducing the benefit.
- [ ] NO impact on I/O or network performance: Huge pages only benefit CPU memory access patterns.
- [ ] Higher memory allocation
- [ ] validate_timestamps=0
- [ ] Larger hash table

# Security Checklist (from 04/06 - only if relevant)
- [ ] Memory isolation: Huge pages are pinned in RAM and cannot be swapped. This reduces the attack surface for swap-based data leakage but increases baseline memory pressure.
- [ ] Privilege requirements: Configuring huge pages requires root or `CAP_IPC_LOCK`. In containers, this may require security policy adjustments.
- [ ] Memory exhaustion: Allocating too many huge pages leaves less memory for other processes. Huge pages are not reclaimable by the kernel (they are pinned). Allocate only what OpCache needs.
- [ ] Container security: Using huge pages in containers may require privileged mode. Evaluate the security trade-off.

# Reliability Checklist (from 04/05/06)
- [ ] **Cache thrashing**: Undersized memory causes constant eviction/recompilation. Symptom: hit rate below 95%. Mitigation: Increase memory.
- [ ] **Stale code serving**: validate_timestamps=0 without deployment automation. Symptom: Code changes don't take effect. Mitigation: Automate opcache_reset().
- [ ] **OOM from oversized cache**: Memory allocated to OpCache is permanently reserved. Oversizing can starve other processes.
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Testing Checklist (from 04/06)
- [ ] Configure `nr_hugepages` on the host system: `echo N | sudo tee /sys/kernel/mm/hugepages/nr_hugepages`.
- [ ] Verify `HugePages_Total` and `HugePages_Free` in `/proc/meminfo`.
- [ ] Enable `opcache.huge_code_pages=1` in php.ini.
- [ ] Restart PHP-FPM and verify: `opcache_get_status()['huge_pages']` should be true.
- [ ] Measure TLB misses before/after: `perf stat -e dTLB-load-misses,iTLB-load-misses`.
- [ ] Benchmark throughput with and without huge pages.
- [ ] Document the huge page configuration and expected benefit.
- [ ] Huge pages configured and allocated for OpCache
- [ ] OpCache using huge pages confirmed
- [ ] Benchmark shows measurable improvement (or confirms minimal impact)
- [ ] Configuration persisted via sysctl.conf
- [ ] Documentation created with configuration details
- [ ] Huge page support verified on the system
- [ ] nr_hugepages set to accommodate OpCache memory + headroom
- [ ] sysctl.conf updated for persistence
- [ ] opcache.huge_code_pages=1 configured
- [ ] PHP-FPM restarted
- [ ] Huge page usage confirmed (free count decreased)
- [ ] Benchmark completed (should show 5-15% improvement for large caches)
- [ ] Configuration documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Enabling `huge_code_pages` without OS configuration
- [ ] Avoid: Allocating too few huge pages
- [ ] Avoid: Allocating too many huge pages
- [ ] Avoid: Using huge pages on memory-constrained systems
- [ ] Avoid: Not verifying the feature is active
- [ ] Avoid anti-pattern: **Enabling huge pages on shared hosting**: You don't control the kernel parameters. The setting silently does nothing. Don't enable it.
- [ ] Avoid anti-pattern: **Relying solely on THP for OpCache**: THP may demote huge pages back to 4KB under memory pressure. Explicit huge pages are guaranteed. Use explicit pages for OpCache.
- [ ] Avoid anti-pattern: **Configuring huge pages without monitoring TLB misses**: The 1â€“3% gain is small. Measure before/after with `perf` to confirm the benefit.
- [ ] Avoid anti-pattern: **Allocating huge pages late (at runtime, not boot)**: Late allocation may fail due to memory fragmentation. Pre-allocate at boot for reliability.
- [ ] Guard against anti-pattern: Undersized OpCache Memory Allocation
- [ ] Guard against anti-pattern: Not Configuring max_accelerated_files
- [ ] Guard against anti-pattern: Disabling validate_timestamps in Development
- [ ] Guard against anti-pattern: Not Monitoring OpCache Hit Rate
- [ ] Guard against anti-pattern: Forgetting opcache_reset() After Deployment

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
**Core Concepts:** **Huge pages**: Memory pages of 2MB (or 1GB on some architectures) instead of the default 4KB. Reduces page table size and TLB pressure., **TLB (Translation Lookaside Buffer)**: CPU cache that maps virtual addresses to physical addresses. Limited in size (~64â€“1024 entries for 4KB pages). With 4KB pages, a 256MB OpCache needs 65,536 page table entries â€” exceeds TLB capacity, causing frequent misses., **TLB miss**: When a virtual address is not in the TLB, the CPU must walk the page table â€” an expensive operation (~10â€“100ns). With huge pages, the same 256MB OpCache needs only 128 entries (2MB pages) â€” fits comfortably in the TLB., **TLB coverage**: The amount of virtual memory that can be mapped without TLB misses. 4KB pages with 64 TLB entries = 256KB. 2MB pages with 64 TLB entries = 128MB., **opcache.huge_code_pages**: Boolean setting (On/Off). When enabled, OpCache attempts to allocate its shared memory from the huge page pool.
**Rules:**
- General: Allocate Huge Pages at Boot for Reliability
**Skills:** OpCache Memory Sizing, Production Hardening Settings, OpCache Overview and Configuration
**Decision Trees:** Huge code pages for OpCache
**Anti-Patterns:** Undersized OpCache Memory Allocation, Not Configuring max_accelerated_files, Disabling validate_timestamps in Development, Not Monitoring OpCache Hit Rate, Forgetting opcache_reset() After Deployment
**Related Topics:** OpCache Memory Consumption, OpCache Configuration Overview, JIT Compilation Buffer Sizing, Zend Memory Manager, PHP-FPM Performance Tuning

