# Metadata

**Domain:** api-integration-engineering
**Subdomain:** observability
**Knowledge Unit:** telescope-debugging
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Automatic pruning configured (24-48h retention)
- [ ] Dashboard secured with authentication
- [ ] Health check noise filtered from entries
- [ ] Combine Telescope with Horizon for Full Observability
- [ ] Enable Telescope with Full Capture in Local/Staging
- [ ] Filter Out Health Check Noise
- [ ] Implement Automatic Pruning (24-48h Retention)
- [ ] Redact Sensitive Data via Filter
- [ ] Exception context captured
- [ ] Filtering by integration tags configured
- [ ] Outbound HTTP requests visible in dashboard
- [ ] Batch entries with tags for filtering
- [ ] Configure watchers: `RequestWatcher`, `JobWatcher`, `ExceptionWatcher`, `LogWatcher`
- [ ] Examine exception context for integration errors

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Batch entries with tags for filtering
- [ ] Configure watchers: `RequestWatcher`, `JobWatcher`, `ExceptionWatcher`, `LogWatcher`
- [ ] Examine exception context for integration errors
- [ ] Filter specific integrations by tags or URL patterns
- [ ] Inspect outbound HTTP requests in Telescope dashboard
- [ ] Install Telescope: `composer require laravel/telescope --dev`
- [ ] Trace webhook job processing from queue to completion
- [ ] Use Telescope's `dump()` for targeted debugging
- [ ] Combine Telescope with Horizon for Full Observability
- [ ] Enable Telescope with Full Capture in Local/Staging
- [ ] Filter Out Health Check Noise
- [ ] Implement Automatic Pruning (24-48h Retention)

---

# Performance Checklist

- [ ] Dashboard queries on large tables may be slow without indexing
- [ ] HTTP watcher middleware: ~0.5-2ms overhead per request
- [ ] Pruning adds periodic write load
- [ ] Response body storage grows proportionally to request volume
- [ ] Storage write: ~10-50ms depending on storage backend

---

# Security Checklist

- [ ] Configure data retention policies for compliance
- [ ] Never enable full capture in production on high-traffic apps
- [ ] Redact sensitive data (Authorization, API keys) via filter
- [ ] Restrict Telescope dashboard access with authentication
- [ ] Telescope captures request/response data including sensitive headers

---

# Reliability Checklist

- [ ] Capturing sensitive data (API keys in Authorization headers visible)
- [ ] Expecting Telescope to capture non-Http-facade HTTP calls
- [ ] Leaving full capture enabled in production (storage overflow)
- [ ] Not filtering health check noise from Telescope entries
- [ ] Not pruning old entries (infinite storage growth)

---

# Testing Checklist

- [ ] Automatic pruning configured (24-48h retention)
- [ ] Dashboard secured with authentication
- [ ] Exception context captured
- [ ] Filtering by integration tags configured
- [ ] Health check noise filtered from entries
- [ ] Outbound HTTP requests visible in dashboard
- [ ] Production sampling configured (10-25%)
- [ ] Queue job tracing available
- [ ] Request, Job, Exception, Log watchers enabled
- [ ] Sensitive data redaction implemented via filter

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Production Full Data Capture on High-Traffic Applications]
- [ ] [No Sensitive Data Redaction in Captured Entries]
- [ ] [Telescope as Long-Term Monitoring Solution]
- [ ] [No Filtering of Health Check Noise]
- [ ] [Expecting Telescope to Capture Non-Http-Facade HTTP Calls]

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


