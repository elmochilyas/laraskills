# Metadata

**Domain:** api-integration-engineering
**Subdomain:** webhooks
**Knowledge Unit:** spatie-webhook-server
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Delivery failure monitoring implemented
- [ ] Per-subscriber signing secrets configured
- [ ] Subscriber URL verification in place
- [ ] Always Dispatch Via Queue
- [ ] Implement Cleanup Strategy for Old WebhookCall Records
- [ ] Monitor Delivery Failure Rates
- [ ] Use Per-Subscriber Signing Secrets
- [ ] Use Tags for Subscriber-Grouped Notifications
- [ ] Delivery failures handled with retry
- [ ] Delivery status tracked and observable
- [ ] Package installed, migrated, configured
- [ ] Configure signing secret for each subscriber
- [ ] Dispatch webhook: `WebhookCall::create()->url($url)->payload($data)->doNotSign()->dispatch()`
- [ ] Handle delivery failures with retry callbacks

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Configure signing secret for each subscriber
- [ ] Dispatch webhook: `WebhookCall::create()->url($url)->payload($data)->doNotSign()->dispatch()`
- [ ] Handle delivery failures with retry callbacks
- [ ] Implement automatic retry for failed deliveries
- [ ] Install package and publish config/migration
- [ ] Monitor webhook delivery logs
- [ ] Run migration: `php artisan migrate`
- [ ] Track delivery status: pending, successful, failed
- [ ] Always Dispatch Via Queue
- [ ] Implement Cleanup Strategy for Old WebhookCall Records
- [ ] Monitor Delivery Failure Rates
- [ ] Use Per-Subscriber Signing Secrets

---

# Performance Checklist

- [ ] Eloquent insert/update for each attempt
- [ ] Multiple subscribers per event multiply total time
- [ ] Package overhead ~2ms per webhook beyond HTTP call
- [ ] Queue dispatch default (database sync adds latency)

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Dispatching webhooks synchronously in request lifecycle
- [ ] Not cleaning up webhook model records (table growth)
- [ ] Not handling subscriber URL changes (delivery to dead endpoints)
- [ ] Skipping tagging for subscriber-specific webhook sets
- [ ] Using same secret for all subscribers (no isolation)
- [ ] Always Dispatch Via Queue

---

# Testing Checklist

- [ ] Delivery failure monitoring implemented
- [ ] Delivery failures handled with retry
- [ ] Delivery status tracked and observable
- [ ] Package installed, migrated, configured
- [ ] Per-subscriber signing secrets configured
- [ ] Retry logic for failed deliveries implemented
- [ ] Signing secret configured per subscriber
- [ ] Subscriber URL verification in place
- [ ] Tags used for subscriber grouping
- [ ] Webhook calls dispatched asynchronously via queue

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Synchronous Webhook Dispatch via dispatchSync()]
- [ ] [Shared Signing Secret for All Subscribers]
- [ ] [No Tags on Webhook Calls (No Categorization)]
- [ ] [No Cleanup of Old WebhookCall Records]
- [ ] [No Delivery Failure Monitoring]
- [ ] [No Subscriber URL Verification]

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


