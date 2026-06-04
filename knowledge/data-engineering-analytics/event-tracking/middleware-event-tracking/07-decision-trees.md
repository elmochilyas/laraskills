# Decision Trees: Middleware-Based Event Tracking Patterns

## Decision: Middleware Hook Selection

**Q: Does the middleware need to modify the response?**
- Yes → Use `handle()` (but this adds latency)
- No → Use `terminate()` for all analytics

**Q: Is the application high-traffic (>100 req/s)?**
- Yes → Queue dispatch from terminate
- No → Synchronous dispatch acceptable; still prefer queue for fault isolation

## Decision: Middleware Scope

**Q: How many routes need tracking?**
- All routes → Consider registering as global middleware with skip logic
- Specific route groups → Route-specific middleware assignment
- Single route → Apply directly in route definition

**Q: Are there internal paths to exclude?**
- Yes → Implement skip logic for debug bars, health checks, admin tools
- No → No skip logic needed; every route is meaningful

## Decision: Context Extraction Strategy

**Q: Is the request object needed downstream?**
- Yes → Extract required fields into a DTO before dispatch
- No → Extract and serialize event data as an array

**Q: Are enrichment calls needed (geo-IP, user-agent parsing)?**
- Yes → Enrich in queue job, not middleware
- No → Full capture in middleware; store directly
