# Standardized Knowledge: RoadRunner Architecture and Goridge

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Alternative PHP Runtimes |
| Knowledge Unit | RoadRunner Architecture and Goridge |
| Difficulty | Foundation |
| Lifecycle | Design, Evaluate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

RoadRunner separates concerns: the Go runtime manages HTTP/gRPC/queue connections via goroutines, while PHP workers execute application logic. Goroutines handle I/O multiplexing efficiently (thousands of concurrent connections). PHP workers receive serialized requests and return serialized responses via the Goridge binary protocol. This hybrid model combines Go's networking efficiency with PHP's ecosystem.

## Core Concepts

- **Go Goroutine Scheduler**: M:N threading model — M goroutines multiplexed onto N OS threads. ~4KB per goroutine stack. Handles 10,000+ concurrent connections efficiently.
- **PHP Worker Pool**: Pre-forked PHP processes. Each worker handles one request at a time. Pool size determined by available memory and desired concurrency.
- **Goridge Relay**: Communication channel supporting TCP, Unix socket, and in-process pipe. Stdout pipe is the default. ~1µs latency per message.
- **Worker Lifecycle**: Idle in pool → receive request → process → send response → return to pool. No process spawn per request (unlike FPM).

## When To Use

- High-throughput API workloads with mixed I/O profiles (1-50ms per request)
- Laravel Octane deployments where stability and enterprise-proven stack are priorities
- Applications requiring gRPC, WebSocket (Centrifugo), or queue plugins
- Teams that want performance gains without PHP extension dependencies

## When NOT To Use

- Single-worker deployment (benefits diminish with low concurrency)
- Memory-constrained environments where the Go binary + PHP workers overhead exceeds FPM
- Applications requiring coroutine-level concurrency within PHP (use Swoole instead)
- Development environments without proper worker auto-reloading configuration

## Best Practices

- **Match worker pool to memory budget**: Calculate `num_workers = (available_RAM - Go_overhead) / avg_worker_RSS`. Each PHP worker consumes ~30-80MB RSS.
- **Configure max_jobs for recycling**: Set `max_jobs: 500-2000` to prevent memory drift. This is RoadRunner's equivalent of `pm.max_requests`.
- **Use Unix socket for Goridge relay**: Lower latency and higher throughput than TCP for local communication.
- **Monitor listen queue**: RoadRunner's Go scheduler queue depth is the earliest indicator of pool saturation.
- **Enable RPC plugin**: Use RoadRunner's RPC interface for worker health checks and metrics without HTTP overhead.

## Architecture Guidelines

- **No PHP Extension Required**: RoadRunner uses standard PHP CLI binaries. No ZTS compilation, no extension conflicts, no SAPI-specific bugs.
- **Process-Level Isolation**: Each PHP worker is a separate OS process. A crash in one worker doesn't affect others. This matches FPM's isolation model.
- **Bottleneck Location Shift**: RoadRunner eliminates bootstrap overhead, shifting the bottleneck to PHP execution and worker pool sizing.
- **Plugin Ecosystem**: RoadRunner's plugin system adds gRPC, queues, WebSocket (Centrifugo), Temporal, and metrics without additional infrastructure.

## Performance Considerations

- 41-111% throughput improvement over PHP-FPM in benchmarks (varies by I/O profile)
- Goroutine scheduler efficient even with minimal I/O — RoadRunner doesn't degrade under sub-1ms queries
- Bottleneck shifts from bootstrap to PHP worker count — adding workers increases both throughput and memory
- Goridge binary protocol adds ~1μs per message — negligible compared to application logic

## Security Considerations

- PHP workers communicate with the Go process via pipes. Ensure file permissions on Unix sockets are restricted.
- RoadRunner's RPC interface should not be exposed to external networks.
- Worker pool isolation prevents one request's security failure from compromising other workers.
- The Go binary should run under an unprivileged user account with restricted filesystem access.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Running RoadRunner without OpCache | Assuming persistent workers don't need OpCache | 10-20% unnecessary CPU overhead on worker operations | Always enable and tune OpCache alongside RoadRunner |
| Over-provisioning PHP workers | Setting num_workers > memory budget | OOM kills from excessive PHP worker RSS | Calculate workers from P95 RSS × safety factor |
| Ignoring max_jobs configuration | Not configuring worker recycling | Memory drift causes gradual performance degradation | Set max_jobs to 500-2000 based on memory behavior |
| Exposing Goridge TCP port to network | Convenience for debugging | External attackers could inject malicious requests | Use Unix sockets or restrict TCP to localhost |

## Anti-Patterns

- **Running RoadRunner without Process Supervision**: RoadRunner is a single Go binary. Use Supervisor or systemd to restart it on crash.
- **Treating PHP workers as stateless**: Workers persist across requests. Static properties, globals, and singletons accumulate state.
- **Mixing RoadRunner with Swoole for same application**: The two runtimes have incompatible process and concurrency models.
- **Skipping warm-up in CI/CD**: RoadRunner workers need bootstrap before handling traffic. Add warm-up requests in deployment scripts.

## Examples

```yaml
# .rr.yaml — RoadRunner configuration
version: '3'
server:
  command: "php worker.php"
  env:
    - APP_ENV: production
http:
  address: "0.0.0.0:8080"
  pool:
    num_workers: 8
    max_jobs: 1000
    allocate_timeout: 60s
    supervisor:
      max_worker_memory: 100
rpc:
  listen: tcp://127.0.0.1:6001
```

```php
<?php
// worker.php — RoadRunner PHP worker
require 'vendor/autoload.php';
$worker = \Spiral\Goridge\StreamRelay::createDefault();
$psr7 = new \Nyholm\Psr7\Factory\Psr17Factory();
$worker = new \Spiral\RoadRunner\Http\HttpWorker($worker, $psr7);
while ($req = $worker->waitRequest()) {
    $resp = handleRequest($req); // your application logic
    $worker->respond($resp);
}
```

## Related Topics

- RoadRunner Installation and Configuration
- RoadRunner Benchmark Performance
- Laravel Octane Driver Selection
- Runtime Comparison Overview

## AI Agent Notes

- RoadRunner does NOT require a PHP extension. This is its key advantage over Swoole for teams avoiding extension complexity.
- Goridge uses a binary protocol — don't attempt to inspect it with text-based tools. Use `rr` CLI or RPC for debugging.
- RoadRunner's `.rr.yaml` has changed formats across major versions (v2 vs v3). Check the version-specific schema.
- The `supervisor` section in `.rr.yaml` configures worker process supervision (memory limits, TTL) not system process supervision.

## Verification

- [ ] RoadRunner binary installed (`./rr --version`)
- [ ] `.rr.yaml` configured with appropriate num_workers and max_jobs
- [ ] PHP worker script properly implements Goridge relay
- [ ] OpCache configured and verified working
- [ ] Worker pool memory budget calculated from P95 RSS
- [ ] Goridge relay using Unix socket (or restricted TCP)
- [ ] Process supervision configured for RoadRunner binary
- [ ] Warm-up requests included in deployment pipeline
