# Anti-Patterns: Log Context & Correlation

## AP-LCC-01: Global Static Context

**Description:** Using static class properties, `$_REQUEST`, or service container singletons to store request-scoped metadata instead of the Context facade.

**Why It Happens:** Developers reach for the simplest mechanism — a static property — without considering process longevity. In traditional PHP (CGI/FastCGI), each request is a fresh process, so static state resets naturally. In modern setups (Octane, Swoole, RoadRunner), processes live for thousands of requests and static state persists.

**Consequences:**
- Context leaks between requests in long-running processes
- Queue jobs inherit stale context from previous job execution
- Non-deterministic debugging — context may or may not be present
- Impossible to reproduce production issues reliably

**Detection:** Review code for `public static $context`, `$_REQUEST['correlation_id']`, or singleton classes storing request-scoped arrays.

**Remediation:** Replace with `Illuminate\Log\Context\Context::add()` (Laravel 11+) or queue-safe middleware for earlier versions.

---

## AP-LCC-02: Context Over-Injection

**Description:** Automatically adding every available data point (all request headers, all session data, all model attributes, server variables) to the log context.

**Why It Happens:** The desire for "maximum debuggability" leads developers to add everything, reasoning that "more data is better." Context facade makes it easy to batch-add data.

**Consequences:**
- Log entries balloon to 10KB-1MB each, dramatically increasing storage costs
- Log aggregator search performance degrades as every entry's indexed fields grow
- Signal-to-noise ratio collapses — the important fields are buried in noise
- GDPR compliance risk if user data is automatically included

**Detection:** Measure average log entry size. If JSON log entries exceed 2KB for typical requests, over-injection is likely. Review `Context::add()` calls for non-essential fields.

**Remediation:** Define a strict allowlist of 10-15 fields. Include only: correlation ID, user ID, trace ID, session ID, request method, request path, response status code, queue job class, and 3-5 domain-specific identifiers (order ID, team ID, organization ID).

---

## AP-LCC-03: Missing Async Context Propagation

**Description:** Correlating only HTTP requests while queue jobs, scheduled commands, broadcast events, and console commands lack any correlation context.

**Why It Happens:** The natural entry point (HTTP middleware) is where developers focus. Async paths are often an afterthought — the correlation context is never initialized for them.

**Consequences:**
- Queue job failures cannot be traced back to the HTTP request that triggered them
- Scheduled command logs are isolated from the system events they process
- Debugging async workflows requires matching timestamps across unrelated log entries

**Detection:** Check if `Context::add()` or equivalent correlation setup exists in: queue job `handle()` method base class or middleware, scheduled command base class, console command `Kernel` handler, broadcast event handler.

**Remediation:** Create a `HasLogContext` trait or base class that initializes correlation context at the start of every async execution path. Apply it to all job classes, command classes, and event listeners.

---

## AP-LCC-04: Manual traceparent Construction

**Description:** Building W3C `traceparent` header values via string concatenation, `sprintf()`, or string interpolation instead of using the OpenTelemetry SDK.

**Why It Happens:** The traceparent format looks simple — `00-{trace_id}-{span_id}-{flags}` — leading developers to skip the SDK dependency and construct it manually.

**Consequences:**
- Incorrect hex encoding (missing leading zeros, uppercase vs lowercase)
- Wrong trace flags value (sampled vs not-sampled inverted)
- Breakage on W3C specification updates (version byte changes)
- Cannot propagate vendor-specific tracestate data

**Detection:** Search for string patterns matching `sprintf('00-%s-%s-01'` or similar `traceparent` construction in source code.

**Remediation:** Use `OpenTelemetry\API\Globals::getPropagator()` to inject trace context into outgoing requests. The SDK handles formatting, encoding, and tracestate propagation correctly.
