---
## Rule Name

Configure OS Huge Pages Before Enabling the Setting

## Category

Performance

## Rule

Never enable `opcache.huge_code_pages=1` without first allocating sufficient OS-level huge pages via `/sys/kernel/mm/hugepages/nr_hugepages`.

## Reason

The setting silently falls back to 4KB pages if huge pages are not available at the OS level. Without pre-allocation, the setting has no effect and produces no error — giving a false sense of optimization.

## Bad Example

```ini
; Enabled but no OS huge pages configured — silently does nothing
opcache.huge_code_pages=1
```

## Good Example

```bash
# 1. Allocate 128 huge pages (256MB) at OS level
echo 128 | sudo tee /sys/kernel/mm/hugepages/nr_hugepages
# 2. Verify allocation
grep HugePages /proc/meminfo
# 3. Then enable in php.ini
```

```ini
opcache.huge_code_pages=1
opcache.memory_consumption=256
```

## Exceptions

Linux systems with Transparent Huge Pages (THP) enabled and sufficient free memory for automatic page promotion.

## Consequences Of Violation

Zero performance gain despite enabling the setting, false confidence that huge pages are active.

---

## Rule Name

Allocate Exactly the Number of Huge Pages Needed

## Category

Performance

## Rule

Allocate exactly `ceil(opcache.memory_consumption / 2MB)` huge pages for OpCache. Do not overallocate.

## Reason

Explicit huge pages are pinned in physical memory and cannot be swapped or reclaimed by the kernel for other uses. Overallocation permanently reserves RAM that cannot be used by other processes, potentially causing OOM conditions.

## Bad Example

```bash
# Allocated 512 huge pages (1GB) for a 256MB OpCache
echo 512 > /sys/kernel/mm/hugepages/nr_hugepages
# 768MB of RAM permanently reserved and unused
```

## Good Example

```bash
# 256MB OpCache / 2MB per page = 128 huge pages
echo 128 > /sys/kernel/mm/hugepages/nr_hugepages
```

## Exceptions

Systems running multiple PHP-FPM pools where the total OpCache memory across all pools exceeds a single `memory_consumption` value.

## Consequences Of Violation

Permanent RAM reservation that cannot be reclaimed, reduced memory available for other processes, potential OOM under load.

---

## Rule Name

Verify Huge Pages Are Active After Configuration

## Category

Performance

## Rule

Always verify that huge pages are actively being used by OpCache after configuration, using `opcache_get_status()`.

## Reason

OpCache silently falls back to 4KB pages if huge page allocation fails (fragmented memory, insufficient pages, permission issues). Verification is the only way to confirm the optimization is working.

## Bad Example

```bash
# Configured and assumed it works — no verification
# Actually using 4KB pages due to memory fragmentation
```

## Good Example

```php
$status = opcache_get_status(false);
if ($status['huge_pages']) {
    echo "Huge pages active";
} else {
    echo "WARNING: Huge pages not active — check OS configuration";
}
```

## Exceptions

No common exceptions. Always verify the feature is active.

## Consequences Of Violation

Optimization not working silently, wasted configuration effort, undetected configuration gap.

---

## Rule Name

Treat Huge Pages as a Secondary Optimization

## Category

Performance

## Rule

Never configure huge code pages before tuning OpCache memory, preloading, and JIT settings.

## Reason

Huge pages provide at most 1–3% CPU-bound throughput gain — a small fraction of what OpCache memory tuning (avoiding cache evictions) or preloading (reducing cold-start) can deliver. Invest optimization effort proportionally to potential return.

## Bad Example

```bash
# Spent hours configuring huge pages while OpCache memory was undersized
# Hit rate was 85% — fixing memory_consumption would give 15%+ gain
# Huge pages gave 1%
```

## Good Example

```bash
# Optimization priority order:
# 1. OpCache enable + memory sizing (2-4x)
# 2. Preloading (cold-start reduction)
# 3. JIT for CPU-bound workloads (up to 95%)
# 4. Huge pages (1-3% if applicable)
```

## Exceptions

Systems where OpCache memory is already optimally tuned and every marginal gain is critical.

## Consequences Of Violation

Optimization effort spent on marginal gains while larger opportunities remain untapped.

---

## Rule Name

Use Huge Pages Only on Linux with Adequate RAM

## Category

Maintainability

## Rule

Never enable `opcache.huge_code_pages` on non-Linux systems or on memory-constrained servers.

## Reason

Huge pages are a Linux-specific kernel feature. On Windows or macOS, the setting has no effect. On memory-constrained Linux servers, reserving pinned huge pages reduces available memory for other processes and can cause OOM under load.

## Bad Example

```ini
; Enabled on a 1GB RAM server running PHP-FPM + MySQL
opcache.huge_code_pages=1
opcache.memory_consumption=256
# 256MB permanently pinned — 25% of RAM unavailable to other processes
```

## Good Example

```ini
; Only on Linux with ample RAM (8GB+)
opcache.huge_code_pages=1
```

## Exceptions

No common exceptions. Huge pages require Linux with sufficient physical RAM.

## Consequences Of Violation

On non-Linux: no effect (silent fallback). On memory-constrained Linux: reduced available RAM, OOM risk.

---

## Rule Name

Allocate Huge Pages at Boot for Reliability

## Category

Reliability

## Rule

Pre-allocate huge pages at system boot via kernel boot parameters rather than at runtime.

## Reason

Runtime allocation via `/sys/kernel/mm/hugepages/nr_hugepages` may fail if physical memory is fragmented. Boot-time allocation (via `hugepages=N` kernel parameter) reserves contiguous physical memory before fragmentation occurs, ensuring allocation succeeds.

## Bad Example

```bash
# Runtime allocation — may fail if memory is fragmented
echo 128 > /sys/kernel/mm/hugepages/nr_hugepages

```

## Good Example

```bash
# Boot-time allocation — guaranteed contiguous memory
# In /etc/default/grub: GRUB_CMDLINE_LINUX="hugepages=128"
sudo update-grub
```

```bash
# Verify at boot
grep HugePages_Total /proc/meminfo  # Should be 128
```

## Exceptions

Systems where boot parameter configuration is not possible (managed hosting, certain container environments).

## Consequences Of Violation

Huge page allocation failure at PHP-FPM startup, silent fallback to 4KB pages, optimization not active.
