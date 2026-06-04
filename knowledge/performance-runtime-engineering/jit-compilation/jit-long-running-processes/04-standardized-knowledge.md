# Standardized Knowledge: JIT for Long-Running Processes

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | JIT Compilation |
| Knowledge Unit | JIT for Long-Running Processes |
| Difficulty | Advanced |
| Lifecycle | Configure, Operate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

In long-running processes (Octane workers, Swoole servers, FrankenPHP threads), JIT compilation latency is incurred once per function per process lifetime, then amortized over thousands of requests. This makes JIT more attractive in persistent-worker architectures than in PHP-FPM, where worker recycling (pm.max_requests) periodically resets the JIT buffer's value.

## Core Concepts

- **Compilation Amortization**: In PHP-FPM with pm.max_requests=500, JIT compilation cost is spread across at most 500 requests per worker. In Octane, it's spread across 5000-10000+ requests.
- **JIT Buffer Persistence**: In PHP-FPM, each worker has its own JIT buffer when using separate processes. In FrankenPHP, threads share a single JIT buffer within the process.
- **Warm-Up Time**: JIT compilation happens on first encounter of hot code. Workers need ~100-500 requests before JIT reaches steady-state performance.
- **Memory Fragmentation Over Time**: Long-running processes accumulate compiled code fragments. PHP 8.4+ improved buffer compaction to reduce fragmentation.

## When To Use

- Optimizing JIT for Octane, Swoole, RoadRunner, or FrankenPHP deployments
- Reducing warm-up latency in long-running workers
- Managing JIT buffer fragmentation over extended process lifetimes
- Evaluating JIT benefit for persistent-worker architectures

## When NOT To Use

- PHP-FPM with low pm.max_requests (JIT benefit diminishes)
- Short-lived CLI scripts where compilation overhead isn't amortized
- Environments where workers restart frequently

## Best Practices

- **Pre-warm JIT**: Execute representative requests after worker start but before accepting traffic. Triggers JIT compilation of hot paths, reducing cold-start latency variance.
- **Lower hot-path thresholds**: In long-running processes, lower jit_hot_func and jit_hot_loop to accelerate warm-up. The compilation cost is a one-time investment amortized over thousands of requests.
- **Monitor buffer fragmentation**: In long-running processes, fragmentation reduces effective capacity. Monitor compaction count and eviction rate. Increase buffer if fragmentation is high.
- **Use Tracing JIT for less fragmentation**: Tracing JIT fragments 40-50% less than Function JIT. For processes running 24h+, tracing is preferred.
- **Schedule periodic worker recycling**: Even in long-running processes, occasional recycling (every 5000-10000 requests) prevents fragmentation from degrading performance.

## Architecture Guidelines

- **JIT in Octane**: Octane workers persist across requests. JIT buffer persists within each worker. JIT compilation cost is incurred once per worker per function. After warm-up, all hot code runs compiled.
- **JIT in FrankenPHP**: Threads within a FrankenPHP process share the same OpCache and JIT buffer. JIT compilation in one thread benefits all threads.
- **JIT in PHP-FPM**: Each worker has independent JIT buffer. Worker recycling (pm.max_requests) periodically resets the buffer. JIT warm-up is repeated for each worker.
- **Fragmentation Management**: PHP 8.4+ buffer compaction rearranges compiled code to consolidate free space. Triggered when free space < 20%.

## Performance Considerations

- JIT benefit amplifies in long-running workers: 3-8% additional gain over FPM+JIT for CPU-heavy endpoints
- JIT compilation overhead (~1-5% of total CPU) is negligible in long-running processes
- Buffer fragmentation reduces capacity by 15-30% over 24h in Function JIT mode
- Pre-warming reduces cold-start latency from ~100 requests to ~10 requests

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Not pre-warming JIT in Octane | Assuming immediate optimization | First 100+ requests run un-optimized | Execute warm-up requests after worker start |
| Using same thresholds as FPM | Copying configuration | Slow warm-up in long-running processes | Lower thresholds for faster compilation |
| Ignoring fragmentation over time | Short monitoring window | Gradual performance degradation | Monitor compaction count and eviction rate |
| Function JIT in 24h+ processes | Preference for function mode | Increased fragmentation, more compaction overhead | Use Tracing JIT for long-running processes |

## Anti-Patterns

- **Frequent worker recycling in Octane**: Recycling Octane workers every 100 requests defeats JIT warm-up. Use 5000-10000 max_requests for long-running workers.
- **Assuming JIT doesn't benefit long-running processes**: JIT benefit amplifies in persistent workers due to amortization. It's MORE important, not less.
- **Not monitoring buffer over process lifetime**: Fragmentation develops over hours. Monitor throughout, not just at startup.

## Examples

```php
// Octane warm-up script — triggers JIT compilation
$warmupUrls = ['/', '/api/health', '/api/products'];
foreach ($warmupUrls as $url) {
    $this->call('GET', $url); // Triggers JIT compilation
}
```

## Related Topics

- JIT Buffer Sizing Guidelines
- JIT Memory Layout and Fragmentation
- JIT Configuration for Production
- Laravel Octane Performance

## AI Agent Notes

- JIT benefit is amplified in long-running processes (Octane, Swoole, FrankenPHP) due to compilation amortization.
- Pre-warming JIT after worker start significantly reduces cold-start latency.
- Tracing JIT is preferred for long-running processes due to 40-50% less fragmentation.
- Monitor buffer fragmentation over process lifetime, not just at startup.
- Lower hot-path thresholds in long-running processes for faster warm-up.

## Verification

- [ ] Pre-warming configured for long-running workers
- [ ] JIT thresholds adjusted for persistent processes
- [ ] Tracing JIT used for 24h+ processes
- [ ] Buffer fragmentation monitored over process lifetime
- [ ] Compaction count tracked for fragmentation pressure
- [ ] Worker recycling interval balanced (5000-10000 requests)
- [ ] JIT enabled on all queue/cron workers
