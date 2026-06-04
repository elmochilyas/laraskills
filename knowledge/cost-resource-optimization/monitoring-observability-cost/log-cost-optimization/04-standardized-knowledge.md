# Log Cost Optimization

## Metadata
- **ID**: KU-01-LOG-COST-OPTIMIZATION
- **Subdomain**: monitoring-observability-cost
- **Domain**: cost-resource-optimization
- **Topic**: Log Cost Optimization
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
Log costs (CloudWatch Logs, Datadog Logs, New Relic Logs) scale with ingestion volume, storage, and search. For Laravel applications, verbose logging (debug-level in production, uncontrolled frameworks logs, verbose access logs) can generate terabytes of log data monthly, costing thousands of dollars. Structured logging, log levels, sampling, and retention policies dramatically reduce log costs while maintaining observability.

## Core Concepts
- **Log ingestion cost**: $0.50/GB (CloudWatch Logs), $0.10-0.50/GB (Datadog), varies by provider
- **Log storage cost**: $0.03/GB/month (CloudWatch), included in ingestion for most providers up to retention period
- **Log search cost**: CloudWatch Logs Insights $0.005/GB scanned; Datadog/New Relic include search in plan
- **Log levels**: DEBUG, INFO, WARNING, ERROR, CRITICAL; each level should be filtered differently
- **Structured logging**: JSON logs with schema; enables selective ingestion and efficient search
- **Log sampling**: Store 1/10 of high-volume logs; retain 100% of errors
- **Log retention**: 7-30 days for operational logs; 1-7 years for compliance logs

## When To Use
- Log level filtering: Block DEBUG/INFO in production; keep WARNING and above
- Structured logging: Always; enables parsing, filtering, and cost attribution per service
- Log sampling: High-traffic apps generating >10GB/day of logs
- Retention shortening: Reduce from "forever" to 30 days for operational logs
- Dedicated log shipping: Use CloudWatch agent or Vector/fluentd for compression + batch shipping
- Log cost monitoring: Set budget alerts when log costs exceed 5% of total infrastructure spend

## When NOT To Use
- Removing all DEBUG logs: DEBUG logs are essential for troubleshooting; sample them rather than drop entirely
- Aggressive retention for compliance: If PCI/HIPAA requires 1-year retention, don't delete
- Log sampling for error logs: Never sample ERROR/CRITICAL logs; retain 100% for incident response
- Self-managed logging for small scale: CloudWatch is fine for <50GB/month; ELK stack adds ops cost

## Best Practices
- **Set log level to WARNING in production**: Configure `LOG_LEVEL=warning` in `.env`; use DEBUG only in development (WHY: DEBUG logs are 10-100x more verbose than WARNING; each log line costs $0.50/GB to ingest; an app generating 10GB/day at DEBUG generates 100MB/day at WARNING)
- **Use structured logging**: Laravel 11+ native structured logging with `Log::channel('stack')->write()` (WHY: unstructured logs can't be filtered or searched efficiently; structured JSON logs enable selective ingestion, 50% compression, and targeted searching)
- **Sample high-volume logs**: Log 1:10 for INFO level endpoint logs; always log 100% of errors (WHY: 90% of log volume comes from 5% of endpoints (health checks, status pings); sampling reduces volume by 90% while preserving signal)
- **Set retention to 30 days for operational logs**: Move compliance logs to S3 Glacier after 30 days (WHY: CloudWatch doesn't delete logs older than retention; keeping 1 year of 100GB/month logs = $360/year storage; 30-day retention = $90/year)
- **Use log compression at source**: Configure `logging.channels.sqs` or ship via Kinesis Firehose with compression (WHY: uncompressed logs are 3-5x larger than compressed; CloudWatch charges $0.50/GB for uncompressed ingestion)
- **Filter health check and cron logs**: Exclude `/health` endpoint and scheduled task logs from ingestion (WHY: health checks generate 50%+ of log volume in many apps; filtering them reduces ingestion by 60-80% with zero observability loss)

## Architecture Guidelines
- Use Laravel's logging channels: `single` for development, `cloudwatch`/`stderr` for production
- Consider DataDog/New Relic for unified log + metric + trace observability (higher cost, simpler setup)
- Use dedicated log shipper (Vector, fluentd) for batch compression and delivery
- Route compliance logs (financial transactions) to S3 directly (not through log aggregator)
- Set up log-based alerts only for ERROR/CRITICAL level; reduce noise
- Tag logs with service name and environment for cost attribution

## Performance Considerations
- Logging adds 1-5ms per log call (sync writes); use async logging in production
- Log batch shipping reduces API calls by 100x (single batch vs per-line delivery)
- Compression reduces network transfer by 3-5x
- Log level filtering at source (not at aggregator) reduces CPU and network overhead
- CloudWatch Logs agent uses ~2-5% CPU for high-volume log delivery

## Security Considerations
- Never log PII, passwords, tokens, or credit card numbers
- Configure Laravel's `App\Exceptions\Handler` to mask sensitive data in logs
- Use Logstash or Fluentd filtering to redact sensitive fields
- Log access to sensitive data (GDPR/CCPA compliance)
- Encrypt logs at rest and in transit

## Common Mistakes
1. **DEBUG logging in production**: `LOG_LEVEL=debug` generating 50GB/day of logs (Cause: copying `.env.example` without changing; Consequence: surprise $1000+/month CloudWatch bill; Better: set `LOG_LEVEL=warning` in production)
2. **No log retention policy**: CloudWatch retains logs "forever" by default; 2 years of logs at 100GB/month = 2.4TB stored (Cause: default retention is "never expire"; Consequence: $75/month storage cost that grows unbounded; Better: set retention to 30 days via CloudWatch or Terraform)
3. **Logging request/response bodies for all endpoints**: Logging full request/response for every API call (Cause: "debugging transparency"; Consequence: each log entry is 1-10KB instead of 100 bytes; log volume increases 100x; Better: log only request IDs and status codes for INFO level; log bodies only for errors)

## Anti-Patterns
- **Dumping Laravel log file to CloudWatch as-is**: No structure, no filtering, no sampling
- **Not monitoring log costs**: Log cost hidden in AWS bill; surprise monthly charges
- **Excessive log retention**: Keeping 2 years of "200 OK" health check logs
- **Logging in tight loops**: `Log::info()` inside a foreach processing 1M items (blocking, expensive)

## Examples
- **Before**: DEBUG logging, 50GB/month, $600/year CloudWatch cost
- **After**: WARNING level, structured JSON, 30-day retention, 3GB/month, $36/year
- **Health check filter**: Exclude `/api/health` endpoint from logging; saves 60% of log volume
- **Log sampling config**: `Log::channel('sampled')->info(...);` with 1:10 sampling in logging channel config

## Related Topics
- Metric Cost Optimization (ku-02)
- Sampling Strategies (ku-04)
- Data Retention Tiering (ku-05)
- CloudWatch vs Datadog vs New Relic

## AI Agent Notes
- Default: production LOG_LEVEL = warning
- Default: structured JSON logging
- Default: 30-day retention for operational logs
- Sample high-volume logs; never sample errors

## Verification
- [ ] LOG_LEVEL set to warning in production
- [ ] Structured logging (JSON) configured
- [ ] Log retention set to 30 days (operational)
- [ ] Health check and cron logs filtered
- [ ] High-volume logs sampled (1:10)
- [ ] Log cost < 5% of total infrastructure spend
- [ ] No PII or sensitive data in logs
