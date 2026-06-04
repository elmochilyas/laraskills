# Metadata
Domain: API Integration Engineering
Subdomain: Observability & Monitoring
Knowledge Unit: Laravel Telescope Debugging for HTTP Client Calls
Difficulty Level: Intermediate
Last Updated: 2026-06-02

## Executive Summary
Laravel Telescope provides debug-level observability for HTTP client calls made through the Http facade and SaloonPHP, capturing request/response details, timing, headers, and error information. For API integrations, Telescope is the primary debugging tool for inspecting outbound requests, diagnosing response issues, and understanding integration behavior during development and production debugging. Telescope's watchers for HTTP client calls, queue jobs, exceptions, and logs provide a comprehensive view of API integration activity.

## Core Concepts
- **HTTP Client Watcher**: Captures every outbound HTTP request made through the Http facade
- **Request/Response Detail**: Full URL, method, headers, body, response status, response body, and duration
- **Timing Information**: Request duration in milliseconds captured for performance analysis
- **Exception Context**: HTTP exceptions (connection errors, 5xx, 4xx) with full request context
- **SaloonPHP Integration**: SaloonPHP Laravel plugin sends events that Telescope captures
- **Telescope Entries**: Searchable, filterable log of all watched activity with tag support
- **Environment-Aware**: Telescope runs in local/development; configurable for production with sampling

## Mental Models
- **Flight Recorder**: Telescope records every HTTP client call like a flight data recorder
- **Debugging Time Machine**: Go back and see exactly what requests were sent and what responses were received
- **X-Ray Vision**: See through the Http facade into the request/response details normally invisible to developers

## Internal Mechanics
- Telescope's `HttpClientWatcher` registers Guzzle middleware that captures request/response pairs
- On each request: middleware records URL, method, headers, body, start time
- On each response: middleware records status, headers, body, duration, and stores as a Telescope entry
- The watcher captures both successful and failed requests (exceptions are still recorded)
- Telescope entries are stored in configurable storage (MySQL, Redis, database) with pruning policies
- Entries are tagged for filtering: `Http::get('...')` → Telescope tags with URL domain and HTTP method
- SaloonPHP integration: `SentSaloonRequest` events are captured by Telescope's event watcher

## Patterns
- **Request Inspection**: Use Telescope to inspect exactly what payload and headers were sent to external APIs
- **Error Response Debugging**: View full error response bodies that may not be logged by application code
- **Timing Analysis**: Identify slow API calls by sorting Telescope entries by duration
- **Tag-Based Filtering**: Filter HTTP client entries by URL domain or service name for focused debugging
- **Production Sampling**: Enable Telescope in production with sampling (1/100 requests) for debugging without overhead
- **Webhook Call Tracking**: Telescope captures HTTP calls made by webhook dispatchers for delivery debugging

## Architectural Decisions
- Enable Telescope in local/staging environments with full data capture for debugging
- Enable Telescope in production with sampling (10-25% of requests) for performance issue detection
- Use Telescope's pruning configuration to manage storage (24-48 hour retention typical)
- Combine Telescope with Horizon for complete integration observability (Telescope for request details, Horizon for queue health)
- Configure Telescope authentication to prevent unauthorized access to debug data

## Tradeoffs
- Telescope captures detailed request/response data which may include sensitive information (API keys, tokens, PII)
- Full data capture in production can overwhelm storage (hundreds of MB per hour for high-traffic integrations)
- Enabling Telescope adds ~5-15ms overhead per HTTP request (middleware execution + storage write)
- Sampled production data is useful for trends but insufficient for debugging specific failures

## Performance Considerations
- HTTP watcher middleware: ~0.5-2ms overhead per request for data collection
- Storage write: ~10-50ms depending on storage backend and data size
- Response body storage: full response body stored, increasing storage proportionally to request volume
- Dashboard queries: time-range queries on large entries tables may be slow without proper indexing
- Pruning: scheduled deletion of old entries adds periodic write load (configurable frequency)

## Production Considerations
- Never enable Telescope with full data capture in production on high-traffic applications
- Use Telescope's `filter` callback to exclude specific URLs or response types from capture
- Implement automatic pruning to prevent unbounded storage growth
- Redact sensitive data from captured entries (API keys in headers, tokens in request body)
- Restrict Telescope dashboard access with authentication and authorization
- Log Telescope storage usage and entry count for capacity planning

## Common Mistakes
- Leaving Telescope enabled with full capture in production (storage overflow, performance degradation)
- Not pruning old entries (infinite storage growth)
- Capturing sensitive data (API keys in Authorization headers visible in Telescope entries)
- Using Telescope on file-based cache (Telescope writes to database, not cache; confusion about storage)
- Expecting Telescope to capture non-Http-facade HTTP calls (Guzzle direct, Saloon without Laravel plugin)
- Not filtering out health check or internal request noise from Telescope entries

## Failure Modes
- Telescope storage exhaustion: entries table fills up database, causing write failures
- Telescope middleware exception: HTTP call succeeds but Telescope fails to record it
- Data leakage: sensitive data in captured requests accessible via Telescope dashboard
- Slow dashboard: large entries table causes slow query performance
- Pruning failure: automated cleanup fails, storage grows unbounded

## Ecosystem Usage
- Standard Laravel debugging tool for HTTP client inspection; used by virtually all Laravel developers
- SaloonPHP Laravel plugin integrates natively: `SentSaloonRequest`/`SendingSaloonRequest` events captured
- Common workflow: reproduce integration issue → check Telescope for request/response details → fix
- Used alongside Horizon for complete integration lifecycle debugging
- Community practice: share Telescope screenshots when reporting integration issues

## Related Knowledge Units
- K028: Laravel Horizon Monitoring (complementary; Horizon for queue monitoring, Telescope for HTTP debugging)
- K001: Laravel Http Facade API (Telescope captures Http facade calls)
- K010: SaloonPHP Connector/Request/Response Pattern (Telescope captures Saloon requests via events)
- K011: Spatie laravel-webhook-client (Telescope captures webhook HTTP processing)
- K012: Spatie laravel-webhook-server (Telescope captures outgoing webhook delivery)

## Research Notes
- Laravel 13.x Telescope documentation covers HTTP client watcher configuration
- Telescope's `filter` callback accepts a `$entry` parameter for conditional capture
- SaloonPHP Laravel plugin v4 supports Telescope integration natively via event watchers
- Telescope stores entries in MySQL `telescope_entries` table; JSON columns for flexible data storage
- Production best practice: enable Telescope with `TELESCOPE_ENABLED=false` in production, enable on-demand via filter
