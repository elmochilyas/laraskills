# Rule 1: Run Collector as Sidecar + Gateway

**Condition:** Production Collector deployment architecture.

**Action:** Deploy a sidecar Collector per application pod for initial processing (batching, memory limiting). Deploy a gateway Collector per cluster for centralized processing (sampling, multi-backend export, attribute enrichment).

**Consequence:** Sidecars provide telemetry isolation and resilience — one pod's telemetry spike does not affect others. Gateway provides centralized features like cross-service sampling decisions.

# Rule 2: Configure Memory Limiter Processor

**Condition:** Collector running in production.

**Action:** Configure `memory_limiter` processor with `check_interval: 1s`, `limit_mib: 200`, `spike_limit_mib: 50`. This prevents Collector OOM during telemetry spikes by dropping data when memory is exceeded.

**Consequence:** Memory limiter prevents Collector from exhausting memory and being OOM-killed. Without it, a telemetry spike during deployment causes complete telemetry loss for all services on the node.

# Rule 3: Use Batch Processor

**Condition:** Any Collector pipeline processing telemetry data.

**Action:** Add `batch` processor with `timeout: 200ms` and `send_batch_size: 8192`. Batching reduces exporter API calls by 10-100x compared to per-span exports.

**Consequence:** Batching dramatically reduces export overhead and backend load. The 200ms delay for telemetry availability is acceptable for all common use cases.

# Rule 4: Enable Health Check and Metrics on Collector

**Condition:** Collector deployed in production.

**Action:** Enable the `health_check` extension on port 13133. Enable Prometheus metrics exporter on port 8888. Add Collector to monitoring dashboards. Set alerts for Collector down or high error rate.

**Consequence:** Collector monitoring prevents silent telemetry loss. When the Collector fails, operators are alerted immediately rather than discovering missing data days later.

# Rule 5: Pin Collector Version

**Condition:** Managing Collector deployments.

**Action:** Specify exact Collector version in deployment configuration. Test upgrades in staging before production rollout. Review changelogs for breaking configuration changes between versions.

**Consequence:** Version pinning prevents unexpected configuration incompatibilities. OTel Collector evolves rapidly and configuration syntax changes between minor versions.

# Rule 6: Configure Fallback Exporter

**Condition:** Production Collector with single exporter target.

**Action:** Add a fallback exporter (second OTLP endpoint, file exporter, or logging exporter). If the primary backend is unavailable, data routes to the fallback.

**Consequence:** Fallback exporter ensures telemetry data is not lost during backend maintenance or outages. Without it, a backend failure causes complete data loss until the exporter queue drains.

# Rule 7: Apply Network Security to Collector

**Condition:** Collector receivers are accessible on the network.

**Action:** Restrict Collector OTLP receiver to accept data only from known sources. Use network policies (Kubernetes NetworkPolicy), firewall rules, or mTLS authentication. Never expose Collector to public internet.

**Consequence:** Network security prevents unauthorized telemetry injection and data exfiltration. The Collector processes all application telemetry data and must be treated as a sensitive service.

# Rule 8: Monitor Collector Resource Usage

**Condition:** Collector running alongside production applications.

**Action:** Set Prometheus alerts for Collector: CPU >80%, memory >80% of limit, queue size >10,000 spans, export error rate >1%. Use Collector's own internal metrics.

**Consequence:** Resource monitoring catches Collector performance issues before they cause data loss. A Collector running out of memory drops data silently.
