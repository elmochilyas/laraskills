# KU-01-LOG-COST-OPTIMIZATION: Log Cost Optimization

## Metadata
- **ID**: KU-01-LOG-COST-OPTIMIZATION
- **Subdomain**: Monitoring & Observability Cost
- **Topic**: Log Cost Optimization
- **Source**: Monitoring & Observability Cost, AWS Documentation, Industry Research
- **Reliability**: High

## Executive Summary
Log costs (CloudWatch Logs, Datadog Logs, New Relic Logs) scale with ingestion volume, storage, and search. For Laravel applications, verbose logging (debug-level in production, uncontrolled frameworks logs, verbose access logs) can generate terabytes of log data monthly, costing thousands of dollars. Structured logging, log levels, sampling, and retention policies dramatically reduce log costs while maintaining observability.

## Core Concepts
- **Log ingestion cost**: $0.50/GB (CloudWatch Logs), $0.10-0.50/GB (Datadog), varies by provider
- **Log storage cost**: $0.03/GB/month (CloudWatch), included in ingestion for most providers up to retention period
- **Log search cost**: CloudWatch Logs Insights $0.005/GB scanned; Datadog/New Relic include search in plan
- **Log levels**: DEBUG, INFO, WARNING, ERROR, CRITICAL; each level should be filtered differently
- **Structured logging**: JSON logs with schema; enables selective ingestion and efficient search
- **Log sampling**: Store 1/10 of high-volume logs; retain 100% of errors
- **Log retention**: 7-30 days for operational logs; 1-7 years for compliance logs

## Mental Models
- Default: production LOG_LEVEL = warning
- Default: structured JSON logging
- Default: 30-day retention for operational logs
- Sample high-volume logs; never sample errors

## Internal Mechanics
- Logging adds 1-5ms per log call (sync writes); use async logging in production
- Log batch shipping reduces API calls by 100x (single batch vs per-line delivery)
- Compression reduces network transfer by 3-5x
- Log level filtering at source (not at aggregator) reduces CPU and network overhead
- CloudWatch Logs agent uses ~2-5% CPU for high-volume log delivery

## Patterns
- Set log level to WARNING in production
- Use structured logging
- Sample high-volume logs
- Set retention to 30 days for operational logs
- Use log compression at source
- Filter health check and cron logs

## Architectural Decisions
- Use Laravel's logging channels: `single` for development, `cloudwatch`/`stderr` for production
- Consider DataDog/New Relic for unified log + metric + trace observability (higher cost, simpler setup)
- Use dedicated log shipper (Vector, fluentd) for batch compression and delivery
- Route compliance logs (financial transactions) to S3 directly (not through log aggregator)
- Set up log-based alerts only for ERROR/CRITICAL level; reduce noise
- Tag logs with service name and environment for cost attribution

## Tradeoffs
**When To Use:**
- Log level filtering: Block DEBUG/INFO in production; keep WARNING and above
- Structured logging: Always; enables parsing, filtering, and cost attribution per service
- Log sampling: High-traffic apps generating >10GB/day of logs
- Retention shortening: Reduce from "forever" to 30 days for operational logs
- Dedicated log shipping: Use CloudWatch agent or Vector/fluentd for compression + batch shipping
- Log cost monitoring: Set budget alerts when log costs exceed 5% of total infrastructure spend

**When NOT To Use:**
- Removing all DEBUG logs: DEBUG logs are essential for troubleshooting; sample them rather than drop entirely
- Aggressive retention for compliance: If PCI/HIPAA requires 1-year retention, don't delete
- Log sampling for error logs: Never sample ERROR/CRITICAL logs; retain 100% for incident response
- Self-managed logging for small scale: CloudWatch is fine for <50GB/month; ELK stack adds ops cost

## Performance Considerations
- Logging adds 1-5ms per log call (sync writes); use async logging in production
- Log batch shipping reduces API calls by 100x (single batch vs per-line delivery)
- Compression reduces network transfer by 3-5x
- Log level filtering at source (not at aggregator) reduces CPU and network overhead
- CloudWatch Logs agent uses ~2-5% CPU for high-volume log delivery

## Production Considerations
- Never log PII, passwords, tokens, or credit card numbers
- Configure Laravel's `App\Exceptions\Handler` to mask sensitive data in logs
- Use Logstash or Fluentd filtering to redact sensitive fields
- Log access to sensitive data (GDPR/CCPA compliance)
- Encrypt logs at rest and in transit

## Common Mistakes
- **DEBUG logging in production**: `LOG_LEVEL=debug` generating 50GB/day of logs (Cause: copying `.env.example` without changing; Consequence: surprise $1000+/month CloudWatch bill; Better: set `LOG_LEVEL=warning` in production)
- **No log retention policy**: CloudWatch retains logs "forever" by default; 2 years of logs at 100GB/month = 2.4TB stored (Cause: default retention is "never expire"; Consequence: $75/month storage cost that grows unbounded; Better: set retention to 30 days via CloudWatch or Terraform)
- **Logging request/response bodies for all endpoints**: Logging full request/response for every API call (Cause: "debugging transparency"; Consequence: each log entry is 1-10KB instead of 100 bytes; log volume increases 100x; Better: log only request IDs and status codes for INFO level; log bodies only for errors)

## Failure Modes
- **Dumping Laravel log file to CloudWatch as-is**: No structure, no filtering, no sampling
- **Not monitoring log costs**: Log cost hidden in AWS bill; surprise monthly charges
- **Excessive log retention**: Keeping 2 years of "200 OK" health check logs
- **Logging in tight loops**: `Log::info()` inside a foreach processing 1M items (blocking, expensive)

## Ecosystem Usage
- **Before**: DEBUG logging, 50GB/month, $600/year CloudWatch cost
- **After**: WARNING level, structured JSON, 30-day retention, 3GB/month, $36/year
- **Health check filter**: Exclude `/api/health` endpoint from logging; saves 60% of log volume
- **Log sampling config**: `Log::channel('sampled')->info(...);` with 1:10 sampling in logging channel config

## Related Knowledge Units
- Metric Cost Optimization (ku-02)
- Sampling Strategies (ku-04)
- Data Retention Tiering (ku-05)
- CloudWatch vs Datadog vs New Relic

## Research Notes
Derived from Monitoring & Observability Cost, AWS Documentation, Industry Research. See 04-standardized-knowledge.md for complete research details.