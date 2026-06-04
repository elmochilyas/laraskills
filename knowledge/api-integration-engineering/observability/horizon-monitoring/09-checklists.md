# Metadata

**Domain:** api-integration-engineering
**Subdomain:** observability
**Knowledge Unit:** horizon-monitoring
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Dashboard secured behind authentication
- [ ] Dedicated queue for integration jobs configured
- [ ] Horizon tags applied to all integration jobs
- [ ] Configure Notifications for Failure Rate Thresholds
- [ ] Monitor Queue Wait Time as Leading Indicator
- [ ] Route Integration Jobs to Dedicated Queues
- [ ] Set Worker Timeout Based on Max API Response Time
- [ ] Tag All Integration Jobs for Horizon Filtering
- [ ] Failure alert thresholds configured
- [ ] Horizon installed and configured
- [ ] Integration jobs tagged for dashboard filtering
- [ ] Configure balanced vs simple queue balancing
- [ ] Configure per-integration queues in `config/horizon.php`
- [ ] Install Horizon: `composer require laravel/horizon`

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Configure balanced vs simple queue balancing
- [ ] Configure per-integration queues in `config/horizon.php`
- [ ] Install Horizon: `composer require laravel/horizon`
- [ ] Monitor job throughput, failures, and runtime
- [ ] Set failure alert thresholds per integration queue
- [ ] Set supervisor per queue with worker count and timeout
- [ ] Tag integration jobs for filtering in Horizon dashboard
- [ ] Use `horizon:snapshot` for metrics to external monitoring
- [ ] Configure Notifications for Failure Rate Thresholds
- [ ] Monitor Queue Wait Time as Leading Indicator
- [ ] Route Integration Jobs to Dedicated Queues
- [ ] Set Worker Timeout Based on Max API Response Time

---

# Performance Checklist

- [ ] Dashboard polling: near-real-time (1-second refresh)
- [ ] Horizon Redis operations: ~1-5ms per job (negligible overhead)
- [ ] Snapshot storage: ~100 bytes per snapshot per queue
- [ ] Tag indexing: additional Redis memory proportional to unique tag values

---

# Security Checklist

- [ ] Horizon dashboard may expose job payloads with sensitive data
- [ ] Monitor Horizon's master supervisor for health
- [ ] Restrict access to integration queue monitoring to ops team
- [ ] Secure Horizon dashboard behind authentication (Horizon gates)
- [ ] Use environment-specific Horizon configs (production vs staging)

---

# Reliability Checklist

- [ ] Ignoring Horizon notifications (failure rate alerts go unhandled)
- [ ] Not configuring Horizon tags on integration jobs (hard to filter per-service)
- [ ] Not monitoring queue wait times (backpressure builds silently)
- [ ] Running all integration jobs on default queue (no isolation, no priority)
- [ ] Worker timeout too low for APIs that occasionally exceed limit
- [ ] Set Worker Timeout Based on Max API Response Time

---

# Testing Checklist

- [ ] Dashboard secured behind authentication
- [ ] Dedicated queue for integration jobs configured
- [ ] Failure alert thresholds configured
- [ ] Horizon installed and configured
- [ ] Horizon tags applied to all integration jobs
- [ ] Integration jobs tagged for dashboard filtering
- [ ] Job throughput, failures, and runtime monitored
- [ ] Metrics export configured for external monitoring
- [ ] Notifications configured for failure rate thresholds
- [ ] Per-integration queues configured with supervisors

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Single Queue for All Job Types]
- [ ] [No Tag Strategy for Job Filtering]
- [ ] [Worker Timeout Too Low for API Calls]
- [ ] [Unlimited Snapshot Retention Consuming Redis Memory]
- [ ] [Horizon Dashboard Accessible Without Authentication]

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


