# Skill: Install and Configure Tideways for Continuous APM and Profiling

## Purpose
Install and configure Tideways PHP extension, daemon, and API key for continuous production profiling at 10-20% sample rate, configure endpoint-level sampling rules for balanced data quality vs overhead, enable tracepoints for SQL and HTTP call instrumentation, and correlate p50/p95/p99 metrics with deployment events for performance regression detection — maintaining <3% overhead.

## When To Use
- Continuous production profiling with minimal overhead
- Monitoring endpoint-level performance trends over time
- Identifying slow SQL queries and external HTTP calls in context
- Teams needing APM + profiling in a single SaaS solution
- Alert-driven profiling: trigger flame graph capture on latency threshold

## When NOT To Use
- Budget-constrained teams (Tideways is paid subscription)
- Air-gapped networks without Tideways on-premise option
- Teams needing per-request instrumentation (Tideways uses statistical sampling)

## Prerequisites
- Tideways subscription (API key)
- Root/sudo access on target servers
- Outbound HTTPS access to Tideways API

## Inputs
- Tideways API Key
- Target sample rate (10-20% for production)
- Endpoint list for sampling rules

## Workflow

### 1. Install Tideways Extension and Daemon
- Install PHP extension: `apt install tideways-php`
- Enable extension: `echo "extension=tideways.so" > /etc/php/8.X/mods-available/tideways.ini`
- Start daemon: `tideways-daemon --api-key=YOUR_API_KEY --host=default`
- Verify: `php -m | grep tideways` and `tideways-daemon --status`
- In Docker: run daemon as sidecar container

### 2. Configure Sample Rate
- Set `TIDEWAYS_SAMPLE_RATE=20` for production (10-20% is standard)
- At 10-20%: <3% overhead, statistically valid for p95/p99 analysis
- 100% only during short, targeted debugging windows (5-15% overhead)
- Low-traffic environments (<10 RPS): may need higher rates

### 3. Implement Endpoint-Level Sampling
- High-traffic endpoints: 5-10% sampling (still produces 50+ profiles/min)
- Low-traffic critical endpoints: 50-100% sampling (admin, webhooks)
- Configure via Tideways dashboard sampling rules
- Ensures sufficient data for all endpoints regardless of traffic volume

### 4. Configure Tracepoints
- Set `TIDEWAYS_TRACEPOINTS=sql,http` to instrument database and HTTP calls
- Avoid enabling all tracepoints indiscriminately (overhead increases to 5-10%)
- Instrument only what's relevant to current investigation targets
- Too many tracepoints = 2-5x more overhead, 10x more data

### 5. Store API Key Securely
- Set `TIDEWAYS_API_KEY` as environment variable
- Never hardcode in application code or version control
- Use secrets manager or `.env` file excluded from Git
- Container environments: use Kubernetes secrets or Docker secrets

### 6. Correlate with Deploy Events
- Tag deployments in Tideways dashboard
- Compare p50/p95/p99 metrics before and after each deploy
- Identify performance regressions within minutes of deployment
- Store profiles for 30+ days

## Validation Checklist
- [ ] Tideways extension installed (`php -m | grep tideways`)
- [ ] Daemon running and connected to Tideways cloud
- [ ] Sample rate configured at 10-20% for production
- [ ] Endpoint-level sampling rules configured
- [ ] Tracepoints set to relevant types only
- [ ] API key in environment variable, not hardcoded
- [ ] p50/p95/p99 metrics visible for critical endpoints
- [ ] Deploy events tagged for regression correlation
- [ ] Profiling overhead <3%

## Related Rules
- 10-20% sample rate for production (`05-rules.md:1`)
- Install daemon alongside extension (`05-rules.md:25`)
- API key in environment variables (`05-rules.md:50`)
- Avoid excessive tracepoints (`05-rules.md:74`)
- Endpoint-level sampling rules (`05-rules.md:98`)

## Related Skills
- Blackfire Installation and Triggered Profiling
- SPX Self-Hosted Profiling
- Flame Graph Generation and Interpretation
- Production Guardrails and Profiling Cost

## Success Criteria
- Tideways extension and daemon installed on all target hosts
- 10-20% sample rate with <3% overhead in production
- Endpoint-level sampling balances data quality across traffic volumes
- Tracepoints instrument only relevant SQL/HTTP calls
- API key stored securely in environment variables
- Performance regressions detected via deploy-event correlation
