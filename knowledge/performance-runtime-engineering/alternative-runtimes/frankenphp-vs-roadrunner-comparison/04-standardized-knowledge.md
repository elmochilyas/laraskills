# Standardized Knowledge: FrankenPHP vs RoadRunner

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Alternative PHP Runtimes |
| Knowledge Unit | FrankenPHP vs RoadRunner — Configuration Translation, Benchmark Comparison |
| Difficulty | Intermediate |
| Lifecycle | Evaluate, Design |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

FrankenPHP and RoadRunner serve the same market but differ fundamentally: FrankenPHP is a single binary with embedded PHP (simplicity), RoadRunner is a Go application server with separate PHP workers (flexibility). FrankenPHP offers 3-5x throughput vs FPM with minimal ops overhead. RoadRunner offers 41-111% improvement with a richer plugin ecosystem. Choice depends on operational priorities.

## Core Concepts

| Aspect | FrankenPHP | RoadRunner |
|--------|-----------|------------|
| Architecture | Single binary (Caddy + PHP via CGO) | Go binary + PHP workers via Goridge |
| PHP requirement | ZTS compilation | Standard PHP (no ZTS needed) |
| Configuration | Caddyfile | .rr.yaml |
| Concurrency | Thread pool | Goroutines + PHP worker pool |
| Throughput vs FPM | 3-5x | 1.4-2.1x |
| Plugins | Caddy modules | gRPC, queues, WebSocket, Temporal |
| Container image | 150-300MB | 80-200MB (PHP workers + Go binary) |
| Complexity | Low | Medium |

## When To Use

- **Choose FrankenPHP when**: Simplicity matters most, team lacks devops expertise, containerized environment, need HTTP/3 + automatic HTTPS
- **Choose RoadRunner when**: Need gRPC/WebSocket integration, want no PHP extension/ZTS dependency, need enterprise-proven stability, running complex multi-service architecture

## When NOT To Use

- FrankenPHP is not suitable when Nginx-specific features or ZTS-incompatible extensions are required
- RoadRunner is not suitable when maximum operational simplicity is the top priority
- Neither runtime is suitable when the application cannot be adapted to memory-resident execution (state leak issues)

## Best Practices

- **Match runtime to team expertise**: FrankenPHP's single binary is easier for ops teams; RoadRunner's YAML configuration is familiar to devops engineers.
- **Benchmark both with your workload**: Published benchmarks show different runtimes winning under different I/O profiles. Always test your specific application.
- **Consider migration path**: FrankenPHP to RoadRunner migration requires moving from Caddyfile to .rr.yaml. RoadRunner to FrankenPHP requires ZTS compilation and thread safety verification.
- **Evaluate plugin ecosystem**: If you need gRPC or Temporal integration, RoadRunner's built-in plugin support may save significant development time.
- **Test ZTS compatibility early**: If considering FrankenPHP, test all PHP extensions with ZTS before committing to the migration.

## Architecture Guidelines

- **CGO Overhead**: FrankenPHP's CGO boundary adds 5-10% overhead vs pure Go/PHP runtimes. This is offset by eliminating Nginx/FPM intermediary latency.
- **Process Isolation**: RoadRunner's separate PHP processes provide stronger isolation than FrankenPHP's threads. A PHP crash in RoadRunner kills one worker; in FrankenPHP it can crash the entire server.
- **Plugin Architecture**: RoadRunner's plugin system (gRPC, queues, WebSocket, Temporal) is more mature than FrankenPHP's. FrankenPHP relies on Caddy modules for non-HTTP functionality.
- **Deployment Simplicity**: FrankenPHP's single binary means one artifact to deploy, one process to monitor. RoadRunner requires the Go binary + PHP workers + configuration.

## Performance Considerations

- RoadRunner: 41-111% throughput improvement over FPM; efficient scheduler even with minimal I/O
- FrankenPHP: 3-5x throughput vs FPM; CGO boundary adds 5-10% overhead vs pure Go/PHP runtimes
- Swoole is best for high-latency I/O (50ms+ DB queries); RoadRunner best for mixed workloads
- Match runtime to workload I/O profile, team expertise, and deployment infrastructure

## Security Considerations

- FrankenPHP's CGO bridge and ZTS requirements add unique security considerations (memory pinning, thread safety)
- RoadRunner's process isolation provides stronger security boundaries between requests
- Both runtimes inherit their web server's security model — Caddy (FrankenPHP) or Go HTTP server (RoadRunner)
- Plugin ecosystems (especially gRPC and WebSocket) expand attack surface in both runtimes

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Choosing runtime based on benchmarks alone | Reading published benchmarks without testing own workload | Suboptimal performance or operational issues | Benchmark YOUR specific application with both runtimes |
| Ignoring deployment complexity differences | Focusing only on performance numbers | Team struggles with operational requirements | Factor operations expertise into runtime decision |
| Not planning rollback path | Assuming migration is always correct | Can't revert if runtime doesn't work for workload | Maintain parallel FPM deployment for rollback |
| Missing ZTS verification for FrankenPHP | Forgetting to check extension compatibility | Segfaults in production | Test all extensions with ZTS before committing |

## Anti-Patterns

- **Running FrankenPHP and RoadRunner simultaneously**: Both are application servers for the same application. Pick one per deployment.
- **Migrating between runtimes without performance regression testing**: Runtime changes affect performance characteristics. Always benchmark before and after.
- **Assuming FrankenPHP's simplicity means zero tuning**: Thread pool sizing, GOMEMLIMIT, and ZTS verification are still required.
- **Assuming RoadRunner's complexity means better performance**: FrankenPHP's 3-5x advantage often exceeds RoadRunner's 1.4-2.1x in raw throughput.

## Examples

```caddy
# FrankenPHP Caddyfile
localhost:8080 {
    root * /app/public
    php_server {
        worker {
            num_threads 4
            max_threads 8
        }
    }
}
```

```yaml
# RoadRunner .rr.yaml
version: '3'
server:
  command: "php worker.php"
http:
  address: "0.0.0.0:8080"
  pool:
    num_workers: 8
    max_jobs: 1000
```

## Related Topics

- Runtime Comparison Overview
- Architecture Model Differences
- Runtime Selection Decision Tree
- Laravel Octane Driver Selection

## AI Agent Notes

- FrankenPHP's 3-5x throughput advantage over FPM is higher than RoadRunner's 1.4-2.1x in published benchmarks, but this gap narrows with application-specific testing.
- FrankenPHP requires ZTS-compiled PHP; RoadRunner does not. This is often the deciding factor for teams with custom PHP extensions.
- RoadRunner's plugin ecosystem (gRPC, queues, Temporal) is more mature. FrankenPHP relies on Caddy modules for similar functionality.
- Migration between the two involves complete configuration rewriting (Caddyfile ↔ .rr.yaml), not just parameter changes.

## Verification

- [ ] Both runtimes benchmarked with application-specific workload
- [ ] ZTS compatibility verified before FrankenPHP commitment
- [ ] Plugin requirements mapped to runtime capabilities
- [ ] Deployment complexity assessed against team expertise
- [ ] Rollback path documented (FPM or alternate runtime)
- [ ] Configuration files translated correctly if migrating
- [ ] Performance regression testing completed after migration
