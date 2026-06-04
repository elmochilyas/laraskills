# Skill: Enable Huge Code Pages for OpCache Performance

## Purpose

Configure Linux transparent or explicit huge pages for OpCache shared memory to reduce TLB (Translation Lookaside Buffer) pressure and improve memory access latency.

## When To Use

- High-traffic PHP servers with large OpCache memory allocation (256MB+)
- Production environments on Linux with NUMA architecture
- CPU profiling shows high TLB miss rates
- Benchmarking shows >10% improvement from huge pages

## When NOT To Use

- For small OpCache allocations (<128MB) where benefit is negligible
- On systems without huge page support or with memory fragmentation
- For development or staging environments
- In containers without huge page capability

## Prerequisites

- Linux with huge page support (check /proc/meminfo for HugePages_Total)
- Root access for system configuration
- OpCache memory_consumption >= 128MB
- Understanding that huge pages reduce TLB pressure but have trade-offs

## Inputs

- Current OpCache memory_consumption value
- System huge page configuration
- CPU architecture and NUMA topology
- Container host capabilities (if containerized)

## Workflow (numbered steps)

1. Check current huge page configuration: `cat /proc/meminfo | grep HugePages`
2. Calculate the number of huge pages needed: `opcache.memory_consumption / huge_page_size` (default huge page size is 2MB)
3. Configure huge pages: `echo 256 > /proc/sys/vm/nr_hugepages` (for 512MB OpCache)
4. For persistent configuration: add `vm.nr_hugepages=256` to `/etc/sysctl.conf`
5. Enable `opcache.huge_code_pages=1` in php.ini
6. Restart PHP-FPM to apply
7. Verify OpCache is using huge pages: check `cat /proc/meminfo | grep HugePages` — free count should decrease
8. Benchmark throughput with and without huge pages to measure impact
9. If improvement <5%, consider disabling (huge pages are a constrained resource)
10. Document the configuration and benchmark results

## Validation Checklist

- [ ] Huge page support verified on the system
- [ ] nr_hugepages set to accommodate OpCache memory + headroom
- [ ] sysctl.conf updated for persistence
- [ ] opcache.huge_code_pages=1 configured
- [ ] PHP-FPM restarted
- [ ] Huge page usage confirmed (free count decreased)
- [ ] Benchmark completed (should show 5-15% improvement for large caches)
- [ ] Configuration documented

## Common Failures

- **Over-allocating huge pages**: Reserving too many huge pages wastes RAM (each 2MB page is reserved even if unused)
- **Not checking NUMA topology**: On NUMA systems, huge pages should be allocated on the node where PHP-FPM runs
- **Missing sysctl persistence**: nr_hugepages resets on reboot without sysctl.conf entry
- **Fragmentation preventing allocation**: System memory fragmentation may prevent contiguous 2MB pages — may need to reboot

## Decision Points

- If OpCache memory <128MB: huge pages likely provide minimal benefit
- If OpCache memory 128-512MB: moderate benefit (5-10% throughput improvement)
- If OpCache memory >512MB: significant benefit (10-15%+ throughput improvement)
- If system has plenty of reserved huge pages: enable regardless of OpCache size

## Performance Considerations

- Huge pages reduce TLB misses by mapping large memory regions with single TLB entries
- 2MB huge pages require 512x fewer TLB entries than 4KB pages
- TLB miss reduction translates to 5-15% throughput improvement for OpCache-heavy workloads
- Each 2MB huge page is reserved contiguous physical memory — cannot be used by other processes

## Security Considerations

- Huge pages are a reserved kernel resource — ensure sufficient pages for all applications
- Container environments may not support huge pages — check container runtime documentation
- No direct security impact from huge page usage

## Related Rules (from 05-rules.md)

- Enable Huge Code Pages for Large OpCache Allocations
- Monitor Huge Page Usage After Configuration
- Benchmark Before and After Huge Page Enablement

## Related Skills

- OpCache Memory Sizing
- Production Hardening Settings
- OpCache Overview and Configuration

## Success Criteria

- Huge pages configured and allocated for OpCache
- OpCache using huge pages confirmed
- Benchmark shows measurable improvement (or confirms minimal impact)
- Configuration persisted via sysctl.conf
- Documentation created with configuration details
