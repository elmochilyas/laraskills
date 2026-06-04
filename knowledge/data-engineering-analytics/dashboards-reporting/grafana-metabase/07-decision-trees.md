# Decision Trees: Grafana/Metabase Read-Only Integration

## Decision: Grafana vs Metabase

**Q: What is the primary use case?**
- Operational dashboards / alerting → Grafana
- Self-service analytics / ad-hoc queries → Metabase

**Q: What data sources need to be visualized?**
- Time-series databases (Prometheus, InfluxDB) + SQL → Grafana
- SQL-only databases → Either tool works

## Decision: Read Replica vs Analytics Schema on Primary

**Q: Is a read replica available?**
- Yes → Use read replica (isolates load completely)
- No → Analytics schema on primary with strict resource limits

**Q: How critical is primary database performance?**
- Mission-critical → Read replica required
- Non-critical → Analytics schema on primary may be acceptable
