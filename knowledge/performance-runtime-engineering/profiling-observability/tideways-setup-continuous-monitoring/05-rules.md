## Set 10-20% sample rate for production Tideways profiling — 100% only during targeted debugging
---
Category: Configuration
---
Configure TIDEWAYS_SAMPLE_RATE between 10-20% for production environments and only enable 100% sampling during short, targeted debugging windows.
---
Reason: At 10-20% sampling, Tideways provides statistically valid performance data for all endpoints with <3% overhead. At 100% sampling, overhead increases to 5-15% and the data volume grows 5-10x. For a 1000 RPS application, 20% sampling captures 200 profiles/second — more than enough for p95/p99 analysis. The only reason for 100% is during focused investigations of low-traffic endpoints or specific requests where statistical sampling may miss the target.
---
Bad Example:
```bash
# 100% sampling in production — unnecessary overhead
TIDEWAYS_SAMPLE_RATE=100  # 5-15% overhead on all requests
```

Good Example:
```bash
# 20% sampling in production — sufficient for analysis
TIDEWAYS_SAMPLE_RATE=20  # <3% overhead, statistically valid
```
---
Exceptions: Low-traffic environments (<10 RPS) where 20% sampling produces too few profiles may use higher rates.
---
Consequences Of Violation: 5-15% unnecessary CPU overhead on all production requests, 5-10x more data storage than needed, no improvement in analysis quality.

## Always install the Tideways daemon alongside the PHP extension — never connect PHP directly to Tideways cloud
---
Category: Architecture
---
Run the `tideways-daemon` process on each host alongside the Tideways PHP extension — PHP processes should never make outbound connections to Tideways cloud directly.
---
Reason: The Tideways daemon architecture isolates outbound traffic. PHP workers write profiles to local memory, the daemon reads them, batches them, and sends them to Tideways cloud via HTTPS. Without the daemon, each PHP worker must make its own HTTPS connection to send profile data, adding network latency to every sampled request and creating a thundering herd of connections under load. The daemon handles batching, compression, retry, and connection pooling efficiently.
---
Bad Example:
```bash
# No daemon — PHP workers make outbound connections
# Each sampled request adds network latency for HTTPS upload
```

Good Example:
```bash
# Daemon present
# PHP workers write profiles locally (no network)
# Daemon batches and uploads efficiently (reduced connections)
```
---
Exceptions: Serverless or ephemeral environments where a persistent daemon cannot run may configure direct upload with careful capacity planning.
---
Consequences Of Violation: Increased request latency on sampled requests from HTTPS uploads, connection contention under load, higher risk of profile data loss.

## Store Tideways API key in environment variables — never hardcode in application code or version control
---
Category: Security
---
Set the TIDEWAYS_API_KEY environment variable in deployment configuration — never commit it to version control or hardcode it in configuration files.
---
Reason: The Tideways API key grants access to upload profiling data and potentially to query the Tideways API. Hardcoded keys in version control are exposed to all repository users, CI logs, and deployment artifacts. Environment variables keep the key out of the codebase while allowing per-environment configuration, easy rotation, and audit trails through secrets management systems.
---
Bad Example:
```bash
# API key in config file — committed to version control
TIDEWAYS_API_KEY=abc123def456  # In Git forever
```

Good Example:
```bash
# API key in environment variable
export TIDEWAYS_API_KEY=abc123def456  # Not in version control
```
---
Exceptions: Docker Compose files for local development excluded from Git via .gitignore may include the key for developer convenience.
---
Consequences Of Violation: API key exposure in version control, unauthorized profile uploads, potential data exfiltration through the Tideways API.

## Avoid excessive tracepoints — instrument only relevant SQL and HTTP calls
---
Category: Configuration
---
Configure TIDEWAYS_TRACEPOINTS to instrument only the SQL queries and HTTP calls relevant to current investigation targets — never enable all available tracepoints indiscriminately.
---
Reason: Each tracepoint adds a callback that fires on every matching operation. Instrumenting all available tracepoints (SQL, HTTP, cache, Redis, filesystem, etc.) can increase profiling overhead from <3% to 5-10%. Most of the data from excessive tracepoints is never viewed — it's collected, transmitted, stored, and ignored. Tracepoints should target specific hypotheses: if investigating slow database queries, enable SQL tracepoints only. If investigating HTTP API calls, enable HTTP tracepoints.
---
Bad Example:
```bash
# All tracepoints — unnecessary overhead and data volume
TIDEWAYS_TRACEPOINTS=sql,http,cache,redis,filesystem,queue
```

Good Example:
```bash
# Targeted tracepoints — only what's needed
TIDEWAYS_TRACEPOINTS=sql,http  # Investigating database and API issues
```
---
Exceptions: Initial setup and exploration may enable more tracepoints temporarily to discover what data is available.
---
Consequences Of Violation: 2-5x more overhead than necessary, 10x more data transmitted and stored, most collected data never viewed.

## Use endpoint-level sampling — higher rates for low-traffic endpoints, lower for high-traffic ones
---
Category: Configuration
```
Configure endpoint-level sampling rules in the Tideways dashboard to sample high-traffic endpoints at lower rates (5-10%) and low-traffic but critical endpoints at higher rates (50-100%).
---
Reason: High-traffic endpoints generate thousands of requests per minute — even 5% sampling produces 50+ profiles per minute, enough for reliable p95/p99 analysis. Low-traffic endpoints (admin pages, reporting, webhooks) may generate only 1-10 requests per minute — 10% sampling captures one profile every 1-10 minutes, producing insufficient data. Sampling each endpoint at its appropriate rate balances data quality with overhead across the application.
---
Bad Example:
```bash
# Single rate for all endpoints — poor coverage for low-traffic
TIDEWAYS_SAMPLE_RATE=10  # 10% for everything
# Low-traffic webhook: 5 req/min → 0.5 profiles/min — insufficient
```

Good Example:
```bash
# Endpoint-specific rates
# /api/products (1000 req/min): 5% sampling
# /admin/reports (2 req/min): 100% sampling
```
---
Exceptions: Small applications with uniformly low traffic may use a single higher rate for all endpoints.
---
Consequences Of Violation: Insufficient profiling data for low-traffic but critical endpoints, inability to detect regressions in those code paths.
