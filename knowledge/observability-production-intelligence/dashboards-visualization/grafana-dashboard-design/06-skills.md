```yaml
name: grafana-dashboard-creation
description: >
  Guide an AI agent through creating a production-quality Grafana dashboard
  for a Laravel application — structuring panels, adding template variables,
  setting thresholds, and enabling deployment annotations.
workflow:
  steps:
    - name: define-dashboard-purpose
      description: >
        Identify the dashboard persona and use case.
        - Operations dashboard: Error rate, latency, throughput, saturation
        - Business dashboard: Orders, revenue, active users
        - Database dashboard: Slow queries, connections, cache hit ratio
        Each dashboard has a single purpose.

    - name: gather-data-sources
      description: >
        Identify available data sources: Prometheus (metrics), Loki (logs),
        Tempo (traces), CloudWatch, or custom sources.
        Ensure each source is configured in Grafana.
        Create a datasource variable for independent panels.

    - name: create-top-row-stat-panels
      description: >
        Create 4 Stat panels at the dashboard top:
        - Error Rate (%): `sum(rate(http_errors_total[5m])) / sum(rate(http_requests_total[5m])) * 100`
        - Request Rate (rps): `sum(rate(http_requests_total[1m]))`
        - Latency p95 (ms): `histogram_quantile(0.95, sum(rate(http_request_duration_bucket[5m])) by (le))`
        - Active Users: Query from application metrics
        Add threshold coloring (green/yellow/red).

    - name: add-breakdown-panels
      description: >
        Add 4-6 middle panels showing breakdowns:
        - Error breakdown by endpoint (bar chart)
        - Latency by endpoint (table or bar gauge)
        - Top 5 slowest queries (table)
        - Queue depth over time (time series)

    - name: add-correlation-panels
      description: >
        Add 2-4 bottom panels for debugging:
        - Recent errors (table from Loki logs)
        - Trace ID search (text input linking to Tempo)
        - Recent deployments (annotation timeline)

    - name: configure-template-variables
      description: >
        Add template variables: $service, $env, $region.
        Link variables to data source label values.
        Use variables in all panel queries.

    - name: set-thresholds-and-alerts
      description: >
        Apply consistent thresholds: Green < threshold, Yellow warning,
        Red critical. Optionally configure alert rules based on
        panel queries.

  triggers:
    - User asks "How do I create a Grafana dashboard for my app?"
    - User asks "What should I put on a production dashboard?"
    - User reports "My dashboard is too slow to load"
```
