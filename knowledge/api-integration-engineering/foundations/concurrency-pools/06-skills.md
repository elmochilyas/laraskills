# Skill: Execute Concurrent HTTP Requests with Pools

## Purpose
Use Laravel's `Http::pool()` and Guzzle's concurrent request capabilities to execute multiple independent HTTP requests in parallel, reducing total wall-clock time.

## When To Use
- Multiple independent API calls that can be parallelized
- Fan-out patterns (send same data to multiple endpoints)
- Dashboard pages loading data from multiple sources
- Batch operations over multiple records

## When NOT To Use
- Sequential requests with data dependencies
- Single request calls (no benefit from pooling)
- When rate limits require sequential pacing

## Prerequisites
- Http facade or Guzzle Pool
- Multiple independent API calls

## Workflow
1. Identify requests that have no data dependencies on each other
2. Use `Http::pool()` with a pool factory callback
3. Define pool entries with `->as($key)` for response identification
4. Handle individual responses and failures separately
5. Set appropriate timeouts on pooled requests
6. For SaloonPHP: use `SaloonPool` for concurrent connector requests
7. Test pool behavior with mocked responses
8. Monitor total pool completion time vs sequential equivalent

## Validation Checklist
- [ ] Pool used for independent requests instead of sequential loops
- [ ] Pool entries identified with `->as($key)` for response mapping
- [ ] Each pooled request has timeouts configured
- [ ] Individual failure handling per pool entry
- [ ] Pool completion time measured and compared to sequential baseline
