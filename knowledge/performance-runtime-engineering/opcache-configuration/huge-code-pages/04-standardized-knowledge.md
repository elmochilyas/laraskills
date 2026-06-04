# OpCache Huge Code Pages — opcache.huge_code_pages, TLB Pressure Reduction, Memory Mapping

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | OpCache Configuration & Preloading |
| Knowledge Unit | OpCache Huge Code Pages — opcache.huge_code_pages, TLB Pressure Reduction, Memory Mapping |
| Difficulty | Advanced |
| Last Updated | 2026-06-02 |

## Overview

`opcache.huge_code_pages` enables mapping OpCache's shared memory using 2MB huge pages instead of the standard 4KB pages. Huge pages reduce TLB (Translation Lookaside Buffer) pressure by covering the same virtual memory range with fewer entries. For large OpCache allocations (256MB+), this reduces TLB misses by up to 99%, improving CPU cache efficiency and reducing memory access latency. Huge pages require OS-level configuration (`/sys/kernel/mm/hugepages/`) and are available only on Linux. The performance benefit is typically 1–3% in CPU-bound workloads, with higher gains for applications with large OpCache memory footprints.

## Core Concepts

- **Huge pages**: Memory pages of 2MB (or 1GB on some architectures) instead of the default 4KB. Reduces page table size and TLB pressure.
- **TLB (Translation Lookaside Buffer)**: CPU cache that maps virtual addresses to physical addresses. Limited in size (~64–1024 entries for 4KB pages). With 4KB pages, a 256MB OpCache needs 65,536 page table entries — exceeds TLB capacity, causing frequent misses.
- **TLB miss**: When a virtual address is not in the TLB, the CPU must walk the page table — an expensive operation (~10–100ns). With huge pages, the same 256MB OpCache needs only 128 entries (2MB pages) — fits comfortably in the TLB.
- **TLB coverage**: The amount of virtual memory that can be mapped without TLB misses. 4KB pages with 64 TLB entries = 256KB. 2MB pages with 64 TLB entries = 128MB.
- **opcache.huge_code_pages**: Boolean setting (On/Off). When enabled, OpCache attempts to allocate its shared memory from the huge page pool.
- **OS configuration**: Huge pages must be pre-allocated by the OS. Configure via `/sys/kernel/mm/hugepages/nr_hugepages` or kernel boot parameters.
- **Transparent Huge Pages (THP)**: An alternative to explicit huge pages. Linux can automatically promote eligible memory to huge pages. THP is less predictable than explicit huge pages and may cause memory fragmentation.

## When To Use

- You have a large OpCache memory allocation (256MB+).
- Your PHP application is CPU-bound and memory-access intensive.
- You are running on Linux with huge page support.
- You have dedicated servers or VMs where you can configure kernel parameters.
- You have already tuned OpCache memory, preloading, and JIT and want additional gains.
- You are running in a performance-critical environment (high-frequency trading, real-time APIs).

## When NOT To Use

- Your OpCache allocation is small (<128MB) — TLB pressure is not significant.
- Your application is I/O-bound — huge pages only affect CPU memory access, not I/O performance.
- You are on shared hosting or containers without access to kernel parameters.
- You are running on Windows or macOS — huge pages are Linux-only.
- You haven't first tuned basic OpCache settings (memory, files, timestamps). Huge pages are a secondary optimization.
- You cannot allocate huge pages (insufficient contiguous physical memory).

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Allocate enough huge pages for the full OpCache | Each huge page is 2MB. A 256MB OpCache needs 128 huge pages. `echo 128 > /sys/kernel/mm/hugepages/nr_hugepages`. |
| Configure huge pages at boot via kernel parameters | Early allocation ensures contiguous physical memory. `hugepages=128` in kernel cmdline. |
| Verify huge page allocation after configuration | `cat /proc/meminfo | grep HugePages` shows total and free huge pages. Ensure `HugePages_Free` > 0. |
| Combine with THP for other PHP allocations | Transparent Huge Pages benefit the Zend MM and other PHP structures. Enable THP + explicit huge pages for OpCache. |
| Monitor TLB performance | `perf stat -e dTLB-load-misses,iTLB-load-misses` shows TLB miss rates before and after enabling huge pages. |
| Use 1GB huge pages for very large OpCache (>1GB) | If OpCache exceeds 1GB, 1GB huge pages (where available) reduce TLB pressure further. Requires CPU support and kernel config. |
| Test in staging before production | Huge page allocation failures cause OpCache to fall back to 4KB pages (no crash, just no benefit). Verify the feature is active. |

## Architecture Guidelines

- **Explicit vs transparent huge pages**: Explicit huge pages (configured via `nr_hugepages`) are pre-allocated and guaranteed. Transparent Huge Pages (THP) are managed by the kernel and may be split back to 4KB pages under memory pressure. Explicit pages are recommended for OpCache.
- **Memory pinning**: Explicit huge pages are pinned in physical memory — they cannot be swapped. This guarantees performance but also means the memory is always occupied, even when OpCache is not fully utilized.
- **Cache layout on huge pages**: When `opcache.huge_code_pages=On`, OpCache maps the entire shared memory segment onto huge pages. The segment includes the hash table, op_array structures, and interned strings — not just the opcodes.
- **Huge page allocation at startup**: OpCache requests huge pages during PHP-FPM startup. If sufficient huge pages are not available, OpCache falls back to 4KB pages. The fallback is silent — verify with `opcache_get_status()`.
- **Contiguous memory requirement**: Huge pages require contiguous physical memory. On systems with fragmented memory, allocation may fail even if `nr_hugepages` is set. Reserve huge pages early (boot time) for best results.
- **Container support**: Huge pages can be used in containers with `--privileged` or `--cap-add=IPC_LOCK` and host-level huge page configuration.

## Performance Considerations

- TLB miss reduction: For a 256MB OpCache, TLB misses are reduced by ~99% (from 65,536 entries to 128 entries).
- CPU-bound workload improvement: 1–3% throughput increase from reduced memory access latency.
- Memory access latency: Huge pages reduce L2/L3 cache miss penalties by improving TLB coverage.
- Benchmark variability: Gains depend on CPU architecture, memory speed, and OpCache size. Newer CPUs (Zen 4, Intel 12th gen+) have larger TLBs, reducing the benefit.
- NO impact on I/O or network performance: Huge pages only benefit CPU memory access patterns.

## Security Considerations

- Memory isolation: Huge pages are pinned in RAM and cannot be swapped. This reduces the attack surface for swap-based data leakage but increases baseline memory pressure.
- Privilege requirements: Configuring huge pages requires root or `CAP_IPC_LOCK`. In containers, this may require security policy adjustments.
- Memory exhaustion: Allocating too many huge pages leaves less memory for other processes. Huge pages are not reclaimable by the kernel (they are pinned). Allocate only what OpCache needs.
- Container security: Using huge pages in containers may require privileged mode. Evaluate the security trade-off.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Enabling `huge_code_pages` without OS configuration | OpCache cannot allocate huge pages and silently falls back to 4KB. | Not knowing that huge pages require OS-level setup. | The setting has no effect, but no error is reported. | Configure `nr_hugepages` on the host. Verify with `HugePages_Total`. |
| Allocating too few huge pages | OpCache needs N huge pages. Fewer are available. | Underestimating the number of pages needed. | Partial allocation — some OpCache uses huge pages, some uses 4KB. | Allocate `ceil(memory_consumption / 2MB)` huge pages. |
| Allocating too many huge pages | Reserving 2GB of huge pages for a 256MB OpCache. | Oversizing without calculation. | 1.75GB of RAM permanently reserved and unused. Huge pages cannot be reclaimed for other uses. | Allocate exactly the number needed for OpCache. |
| Using huge pages on memory-constrained systems | Huge pages are pinned and never swapped. | Not understanding pinning semantics. | If system runs low on memory, huge pages cannot be reclaimed, causing OOM. | Only use huge pages when you have adequate spare RAM. |
| Not verifying the feature is active | Silent fallback to 4KB pages. | Enabling the setting and assuming it works. | No performance benefit, but no warning. | Check `opcache_get_status()['huge_pages']` — should be true. |

## Anti-Patterns

- **Enabling huge pages on shared hosting**: You don't control the kernel parameters. The setting silently does nothing. Don't enable it.
- **Relying solely on THP for OpCache**: THP may demote huge pages back to 4KB under memory pressure. Explicit huge pages are guaranteed. Use explicit pages for OpCache.
- **Configuring huge pages without monitoring TLB misses**: The 1–3% gain is small. Measure before/after with `perf` to confirm the benefit.
- **Allocating huge pages late (at runtime, not boot)**: Late allocation may fail due to memory fragmentation. Pre-allocate at boot for reliability.

## Examples

```bash
# Configure 256 huge pages (512MB) at boot
# Add to /etc/default/grub: GRUB_CMDLINE_LINUX="hugepages=256"
sudo update-grub

# Or at runtime
echo 256 | sudo tee /sys/kernel/mm/hugepages/nr_hugepages

# Verify allocation
grep HugePages /proc/meminfo
# HugePages_Total: 256
# HugePages_Free: 128  (128 used by OpCache)
# Hugepagesize: 2048 kB

# Monitor TLB misses
perf stat -e dTLB-load-misses,iTLB-load-misses php artisan inspire
```

```ini
; php.ini
opcache.huge_code_pages=1
opcache.memory_consumption=256
```

```php
// Verify huge pages are active
$status = opcache_get_status(false);
if ($status['huge_pages']) {
    echo "Huge pages are enabled for OpCache";
} else {
    echo "OpCache is using 4KB pages (huge pages not available)";
}
```

## Related Topics

- OpCache Memory Consumption
- OpCache Configuration Overview
- JIT Compilation Buffer Sizing
- Zend Memory Manager
- PHP-FPM Performance Tuning

## AI Agent Notes

- Huge code pages are a specialist optimization. The 1–3% gain is real but modest. Only configure after all other OpCache optimizations are in place.
- The most common failure mode: enabling the setting without OS configuration, getting no benefit, and not noticing because OpCache silently falls back.
- The performance benefit scales with OpCache size. At 128MB, the benefit may be <1%. At 1GB+, it's more significant.
- In containerized environments, huge pages add operational complexity (privileged mode, host kernel config). Evaluate the 1–3% gain against this complexity.

## Verification

- [ ] Configure `nr_hugepages` on the host system: `echo N | sudo tee /sys/kernel/mm/hugepages/nr_hugepages`.
- [ ] Verify `HugePages_Total` and `HugePages_Free` in `/proc/meminfo`.
- [ ] Enable `opcache.huge_code_pages=1` in php.ini.
- [ ] Restart PHP-FPM and verify: `opcache_get_status()['huge_pages']` should be true.
- [ ] Measure TLB misses before/after: `perf stat -e dTLB-load-misses,iTLB-load-misses`.
- [ ] Benchmark throughput with and without huge pages.
- [ ] Document the huge page configuration and expected benefit.
