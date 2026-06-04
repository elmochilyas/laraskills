# Metadata
Domain: API Integration Engineering
Subdomain: HTTP Client & API Consumption Patterns
Knowledge Unit: Concurrency Control with Pools and Async Requests
Difficulty Level: Advanced
Last Updated: 2026-06-02

## Executive Summary
Concurrent HTTP requests reduce total wall-clock time for multiple independent API calls by executing them in parallel. Laravel's Http facade provides `pool()` for concurrent GET requests using Guzzle's underlying curl multi-handle, and SaloonPHP extends this with its own pool API. Proper concurrency control prevents resource exhaustion, respects upstream rate limits, and handles partial failures gracefully.

## Core Concepts
- **Connection Pooling**: Reusing TCP connections across requests to the same host reduces handshake overhead
- **Concurrent Requests**: Multiple HTTP requests in-flight simultaneously via curl multi-handle
- **Response Aggregation**: Collecting and correlating responses from parallel requests back to their originating request
- **Partial Failure Handling**: Individual request failures in a pool don't affect other concurrent requests
- **Concurrency Limits**: Maximum simultaneous connections per host (default 6 in cURL, configurable)
- **Request Promise**: Each request returns a promise that resolves when its response arrives

## Mental Models
- **Fork-Join Pattern**: Fork multiple requests simultaneously, join when all complete (or collect as they arrive)
- **Pipeline Parallelization**: Like assembly line workers each handling a different task in parallel
- **Amdahl's Law**: Speedup limited by the serial portion; concurrency benefits independent requests most

## Internal Mechanics
- Laravel `Http::pool()` uses `GuzzleHttp\Pool` which wraps `Each::of()` from Guzzle's promise library
- The pool creates a generator of promises, iterates with configurable concurrency, and collects named results
- Guzzle's `CurlMultiHandler` uses `curl_multi_exec()` with `curl_multi_select()` for non-blocking I/O
- Concurrency limit is set via the `GuzzleHttp\Pool` constructor's `concurrency` option (default 25)
- Each failed request in a pool rejects its own promise; others continue unaffected
- Response aggregation returns all results (successful and failed) for caller-side handling

## Patterns
- **Fan-Out**: Dispatch multiple independent requests simultaneously, aggregate results
- **Scatter-Gather**: Send requests to multiple providers/services for the same data, use first successful response
- **Batch Processing**: Process a list of items by dispatching concurrent requests in chunks
- **Throttled Concurrency**: Limit pool concurrency to respect upstream rate limits
- **Timeout Per Pool**: Set a total pool timeout to bound overall execution time
- **Result Collection by Key**: Use associative array keys in `Http::pool()` to map results back to requests

## Architectural Decisions
- Use concurrent requests for independent calls only (no data dependency between them)
- Use sequential requests when each request depends on data from the previous response
- Prefer `Http::pool()` over manual promise handling for simpler code
- Set conservative concurrency limits (5-10) for rate-limited APIs, higher (25-50) for internal services
- Implement circuit breakers around pools to handle upstream service degradation

## Tradeoffs
- Concurrency increases throughput but also increases load on both client and server
- Error handling is more complex: individual errors vs aggregate pool failure
- Memory usage scales with concurrent in-flight requests and their response bodies
- Debugging concurrent requests is harder than sequential (race conditions, non-deterministic ordering)
- Pool timeout (total) vs per-request timeout: trade between bounded latency and individual request fairness

## Performance Considerations
- Wall-clock time for N independent requests with concurrency C is approximately `ceil(N/C) * avg_latency`
- TCP connection pooling provides 1-2 RTT savings per host for subsequent requests
- Each concurrent connection uses a file descriptor; monitor for `EMFILE` limits
- Response buffering: all pool response bodies are held in memory until consumed
- cURL multi-handle select timeout (default 1s) affects responsiveness when streams are idle

## Production Considerations
- Set maximum concurrency limits that respect both your infrastructure's outbound connection capacity and upstream rate limits
- Implement timeout for the entire pool to prevent runaway requests
- Log pool completion metrics: total time, individual response times, failures
- Use separate pools per upstream service to isolate failure domains
- Monitor for socket/port exhaustion when running long-lived workers with high concurrency
- Configure DNS caching at the OS level to avoid DNS resolution becoming a bottleneck for concurrent requests

## Common Mistakes
- Using concurrency for requests that have data dependencies (results in indeterminate ordering bugs)
- Setting concurrency too high for rate-limited upstream APIs, causing 429 errors
- Not handling individual pool request errors, leading to uncaught promise rejections
- Collecting all results synchronously after pool, defeating the purpose of concurrent execution
- Assuming pool response order matches request order (use named keys, not numeric indices)
- Concurrency on sequential-dependent requests (Amdahl's law: limited benefit)

## Failure Modes
- Upstream server connection limits exceeded when concurrency is too high
- Socket/port exhaustion in long-running processes with high-concurrency pools
- Memory exhaustion from buffering large response bodies for all concurrent requests
- DNS throttling when resolving many different hosts concurrently
- Connection pool starvation: one slow connection blocks the pool slot
- Partial pool failure: some requests succeed, some fail; callers must handle incomplete data

## Ecosystem Usage
- Laravel Http facade `pool()` is used for concurrent API data fetching in dashboard applications
- SaloonPHP provides `Saloon::pool()` for Connector-based concurrent requests with plugin support
- Guzzle `Pool` class is the underlying implementation used by both Laravel and Saloon
- Gateway aggregation services use concurrency to compose responses from multiple upstream APIs
- Webhook delivery systems use limited concurrency to dispatch webhooks to multiple subscribers

## Related Knowledge Units
- K001: Laravel Http Facade API (pool method implementation)
- K002: Guzzle HTTP Client Internals (curl multi-handle, promise system)
- K008: Rate Limiting Algorithms (concurrency must respect rate limits)
- K005: Retry Strategies (concurrent retry considerations)

## Research Notes
- Guzzle's `Pool` defaults to 25 concurrent requests; adjust per upstream capability
- Laravel's `Http::pool()` does not support POST requests natively (GET only) in some versions
- cURL 7.68+ has better multi-handle performance with `curl_multi_select()` improvements
- PHP 8.1+ fibers could theoretically replace promise-based concurrency but are not yet adopted in Guzzle
- Connection reuse across requests requires the same Guzzle client instance; always reuse connectors
