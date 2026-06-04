# Rule 1: Design for Glanceability

**Condition:** Building a Grafana dashboard for operational use.

**Action:** Place the four most important metrics (error rate, request rate, latency p95, saturation) at the top of the dashboard. Use Stat panels with threshold-based coloring. The dashboard should answer "Is there a problem?" within 5 seconds of viewing.

**Consequence:** Glanceable dashboards reduce Mean Time To Detection. Operators can identify anomalies immediately without scanning panel-by-panel.

# Rule 2: Limit to 8-12 Panels Per Dashboard

**Condition:** Adding panels to a dashboard.

**Action:** Keep total panels between 8 and 12 per dashboard. If more panels are needed, create a focused sub-dashboard for a specific domain (Database dashboard, Queue dashboard, Business metrics dashboard).

**Consequence:** Focused dashboards reduce cognitive load during incidents. Operators find relevant panels quickly instead of hunting through 50 panels.

# Rule 3: Use Template Variables for Reusability

**Condition:** Building dashboards that will be used across multiple services or environments.

**Action:** Add template variables for `$service`, `$env`, `$region`, and `$datasource`. Use these variables in all panel queries. Never hardcode service names or environment identifiers in queries.

**Consequence:** Template variables make a single dashboard reusable across services and environments. One dashboard for all services instead of one per service.

# Rule 4: Apply Consistent Color Coding

**Condition:** Setting display options on Stat, Time Series, and other panels.

**Action:** Use green for healthy (<1% error rate, <200ms latency), yellow for warning (1-5% error rate, 200-500ms), red for critical (>5% error rate, >1000ms). Apply thresholds consistently across all panels.

**Consequence:** Consistent color coding builds operator intuition. Red always means bad, green always means good — regardless of which panel they're looking at.

# Rule 5: Annotate Deployments

**Condition:** Dashboard shows time-series data that may be affected by deployments.

**Action:** Configure Grafana annotation from deployment events. Use CI/CD pipeline to send deployment annotations. Include version, commit hash, and deployer in each annotation.

**Consequence:** Annotations answer "What changed?" when latency spikes or error rate jumps. Operators immediately see if a deployment correlates with the change.

# Rule 6: Set Default Time Range to 6 Hours

**Condition:** Configuring dashboard default settings.

**Action:** Set the default time range to "Last 6 hours". Add quick-range buttons for Last 30m, Last 1h, Last 6h, Last 24h, Last 7d. Longer time ranges for default mean slower load times.

**Consequence:** Last 6 hours balances context with performance. Default longer ranges (30 days) are slow to load and rarely useful at a glance.

# Rule 7: Do Not Mix Data Sources in a Single Panel

**Condition:** Panels that need data from Prometheus and Loki or other sources.

**Action:** Create separate panels for metric data (Prometheus) and log data (Loki). Use dashboard-level annotations or links to correlate between panels. Do not attempt to query multiple data sources in a single panel.

**Consequence:** Separate panels per data source keep queries simple and maintainable. Mixed-source panels are fragile and hard to debug.

# Rule 8: Add Panel Descriptions

**Condition:** Each panel on a shared or team dashboard.

**Action:** Set the panel description to explain what the panel shows, the PromQL query intent, and what healthy/unhealthy thresholds are. Descriptions appear as tooltips on hover.

**Consequence:** Panel descriptions make dashboards self-documenting. New team members can understand each panel without asking the dashboard author.
