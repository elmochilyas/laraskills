# Decision Trees: Observability & Monitoring

## Monitoring Tool Selection

**Hosting platform:**
- Laravel Forge → Nightwatch (native integration, $10/server)
- Laravel Vapor → CloudWatch + Sentry
- Laravel Cloud → Built-in Cloud monitoring
- Kubernetes → Prometheus + Grafana + OpenTelemetry
- Self-managed → Datadog or New Relic

**Budget:**
- $0-50/month → Nightwatch or Pulse + Sentry Free
- $50-500/month → Datadog APM essentials
- $500+/month → Full Datadog or New Relic
