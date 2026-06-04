# Anti-Pattern 1: No Memory Limiter

**Name:** Collector OOM during data spikes

**Problem:** Collector deployed without memory_limiter processor. During normal traffic, memory usage is stable at 100MB. During a deployment (thousands of new spans simultaneously), memory spikes to 500MB and the Collector is OOM-killed. All telemetry data is lost during the deployment.

**Detection:** Collector pods restart during deployments. Telemetry data has gaps coinciding with deployments. Collector logs show "OOMKilled" exit code.

**Remediation:** Add memory_limiter processor with limit_mib set to 80% of available memory. Configure spike_limit_mib to handle sudden increases.

**Prevention:** Every Collector in production must have memory_limiter configured. Test with a traffic spike simulation before production deployment.

# Anti-Pattern 2: No Batching

**Name:** Per-span export

**Problem:** Collector pipeline does not include a batch processor. Every span, metric point, and log record is exported individually. Export API calls overwhelm the backend. Network overhead is 100x higher than necessary.

**Detection:** Backend logs show high rate of small ingestion requests. Network monitor shows high packet count but low throughput from Collector.

**Remediation:** Add batch processor with timeout: 200ms, send_batch_size: 8192. This combines individual exports into efficient batches.

**Prevention:** Batching is not optional. Always include batch processor in every Collector pipeline. The only exception is real-time features requiring <50ms latency.

# Anti-Pattern 3: No Health Check

**Name:** Silent Collector failure

**Problem:** Collector deployed without health check or monitoring. The Collector crashes or becomes unresponsive. Application telemetry is buffered (application-side exporter queue) and eventually dropped. No one notices because there is no Collector health monitoring.

**Detection:** Hours later, someone checks Grafana and notices the dashboard hasn't updated. Investigation reveals the Collector has been down for hours.

**Remediation:** Enable health_check extension on port 13133. Add Prometheus metrics exporter on port 8888. Create Grafana dashboard for Collector. Set alerts for Collector down.

**Prevention:** Before deploying Collector, configure its monitoring. The Collector monitors the application — something must monitor the Collector.

# Anti-Pattern 4: Direct SDK-to-Backend Export

**Name:** Application bypasses Collector

**Problem:** Development team configures OTel SDK to export directly to the backend without a Collector. This works in development but causes issues in production: no batching, no retry, no filtering, no multi-backend export. Backend changes require application redeployment.

**Detection:** No Collector infrastructure exists. Application configuration has backend URL and API key hardcoded.

**Remediation:** Deploy a Collector gateway. Update SDK configuration to export OTLP to Collector. Remove backend configuration from application.

**Prevention:** The Collector must be part of the initial OTel deployment plan. Direct SDK-to-backend export is acceptable for development environments only.
