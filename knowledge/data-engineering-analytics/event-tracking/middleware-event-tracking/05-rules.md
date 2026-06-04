# Rules: Middleware-Based Event Tracking Patterns

## Rule MID-01: Use terminate() for All Analytics
Analytics tracking middleware MUST use `terminate()` not `handle()`. The user must never wait for analytics instrumentation to complete before receiving the response.

## Rule MID-02: Extract Context Before Dispatch
Request context MUST be extracted and serialized into a DTO before queue dispatch. The `Request` object is not serializable and will cause job failures if passed directly.

## Rule MID-03: Keep terminate() I/O-Free
The `terminate()` method MUST perform no I/O beyond queue dispatch. Database writes, API calls, and file operations in terminate block the worker from accepting the next request.

## Rule MID-04: Route-Specific Middleware Assignment
Analytics middleware MUST be assigned to specific route groups, not registered globally. Global middleware tracks unnecessary routes and increases storage costs.

## Rule MID-05: Middleware Order Preservation
Analytics middleware MUST execute after authentication and GDPR consent middleware. Configure priority in `Kernel.php` to ensure user context and consent status are available.

## Rule MID-06: Never Log Raw Request Bodies
Tracking middleware MUST NOT log or store raw request bodies, passwords, tokens, or sensitive headers. Extract only the fields required for analytics.

## Rule MID-07: Skip Internal Paths
Analytics middleware MUST skip tracking for internal paths (_debugbar, telescope, horizon, health checks). These paths generate noise and inflate event counts.

## Rule MID-08: Sanitize Input
All request data captured in middleware MUST be validated and sanitized before storage. Attackers can inject malicious payloads via user agent, referrer, or URL parameters.

## Rule MID-09: Dispatch Async for High Traffic
Applications serving more than 100 requests per second MUST use queue-based dispatch from middleware. Synchronous tracking blocks terminate and reduces worker availability.

## Rule MID-10: Duration Tracking
Middleware SHOULD capture request duration using `LARAVEL_START` constant. Duration data is essential for performance analytics and cannot be accurately added later.
