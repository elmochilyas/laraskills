# Anti-Pattern 1: The Kitchen Sink Dashboard

**Name:** All metrics on one dashboard

**Problem:** A single dashboard with 40+ panels covering every available metric from every service. Operators cannot find relevant panels during incidents. Dashboard load time is >10 seconds due to query volume.

**Detection:** Dashboard JSON size >100KB. Scroll bar on the dashboard view. Operators complain they "can never find the panel they need."

**Remediation:** Split into focused dashboards: Operations (12 panels), Database (8 panels), Queue (6 panels), Business (10 panels). Each dashboard has a clear purpose.

**Prevention:** Define dashboard purpose before adding panels. If a panel doesn't directly serve that purpose, put it on another dashboard.

# Anti-Pattern 2: Raw Counter Display

**Name:** Counter metric without rate

**Problem:** Displaying `http_requests_total` as a raw counter value in a Time Series panel. The graph shows a monotonically increasing line that drops to zero on restart. Operators cannot distinguish between "no traffic" and "post-restart."

**Detection:** Time series panel shows steadily increasing line. Line drops to zero periodically (process restarts). No rate, increase, or irate function applied.

**Remediation:** Wrap counter metrics in `rate(metric[5m])` or `increase(metric[5m])`. Use Stat panels for total counts if absolute numbers are needed.

**Prevention:** Never display a counter metric directly. Always use `rate()`, `increase()`, or `irate()` for meaningful per-time values.

# Anti-Pattern 3: Hardcoded Service Names

**Name:** No template variables

**Problem:** Panel queries hardcode service name: `http_requests_total{service="api"}`. To view another service's dashboard, operators must edit the query. Duplicate dashboards are created per service.

**Detection:** Service-specific dashboards: "API Dashboard", "Worker Dashboard", "Web Dashboard". All queries contain literal service names. Changing scope requires editing panels.

**Remediation:** Replace hardcoded values with `$service` template variable. Create one dashboard with service filter. All teams use the same dashboard.

**Prevention:** Always use template variables for environment, service, and region from the start. A dashboard without template variables is non-reusable.

# Anti-Pattern 4: Dashboard Without Context

**Name:** Panels missing descriptions, legends, or units

**Problem:** A Stat panel showing "137" with no unit or description. Is 137 milliseconds? Percent? Requests per second? A multi-line Time Series panel with no legend. Operators cannot identify which line is which.

**Detection:** Stat panels have no unit configured. Time series panels show multiple colored lines with no legend. Hover tooltip shows raw metric name, not human-readable description.

**Remediation:** Add unit to every Stat/Time Series panel. Enable legend on multi-series graphs. Add panel descriptions explaining what the panel shows and what healthy thresholds look like.

**Prevention:** Every panel should answer "What is this?" without requiring the operator to examine the query. Units, legends, and descriptions are mandatory, not optional.
