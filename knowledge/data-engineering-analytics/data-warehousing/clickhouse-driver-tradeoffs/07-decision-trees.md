# Decision Trees: HTTP-Based vs FFI-Based ClickHouse Driver Trade-offs

## Decision: Driver Selection

**Q: What is the expected query throughput?**
- < 100 queries/second → HTTP driver (simplest, well-documented)
- 100-1000 queries/second → HTTP with persistent connections
- 1000-10000 queries/second → Evaluate TCP driver
- > 10000 queries/second → FFI or cluster-level solution

**Q: Are sub-millisecond query latencies required?**
- Yes → FFI (experimental) or consider async query patterns
- No → HTTP or TCP

**Q: Is deployment simplicity important?**
- Yes → HTTP (no native extensions, no compilation)
- No → TCP (requires PHP extension or custom implementation)

## Decision: Connection Management

**Q: Is the ClickHouse cluster in the same datacenter?**
- Yes → HTTP keep-alive sufficient
- No → TCP native protocol (lower latency across regions)

**Q: Does the application use ClickHouse session features?**
- Yes → HTTP driver supports session via URL parameter
- No → Any driver works
