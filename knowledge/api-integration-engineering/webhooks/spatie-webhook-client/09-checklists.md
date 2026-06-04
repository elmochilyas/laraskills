# Metadata

**Domain:** api-integration-engineering
**Subdomain:** webhooks
**Knowledge Unit:** spatie-webhook-client
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Failed processing monitored and alerted
- [ ] Package updated for security patches
- [ ] Provider-specific profile classes defined
- [ ] Configure Queue Connection for Async Processing
- [ ] Define One Profile Class Per External Provider
- [ ] Keep Package Updated for Security Patches
- [ ] Leverage Webhook Model for Audit and Replay
- [ ] Monitor Failed Webhook Processing
- [ ] Package installed and config published
- [ ] Processor dispatches appropriate jobs
- [ ] Route registered using `Route::webhooks()`
- [ ] Configure profile in `config/webhook-client.php`
- [ ] Create a `WebhookModel` (or use default) for storing webhook data
- [ ] Create a `WebhookProcessor` to handle successful verifications

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Configure profile in `config/webhook-client.php`
- [ ] Create a `WebhookModel` (or use default) for storing webhook data
- [ ] Create a `WebhookProcessor` to handle successful verifications
- [ ] Create a `WebhookProfile` class to decide which requests to process
- [ ] Create a `WebhookSignatureValidator` class for signature verification
- [ ] Install package and publish config: `php artisan vendor:publish --provider="Spatie\WebhookClient\WebhookClientServiceProvider"`
- [ ] Register the route: `Route::webhooks('webhook-url', 'profile-class')`
- [ ] Test webhook endpoint with valid and invalid signatures
- [ ] Configure Queue Connection for Async Processing
- [ ] Define One Profile Class Per External Provider
- [ ] Keep Package Updated for Security Patches
- [ ] Leverage Webhook Model for Audit and Replay

---

# Performance Checklist

- [ ] Config caching improves profile class resolution
- [ ] Eloquent insert for webhook model adds ~5ms
- [ ] Package overhead ~1ms per webhook beyond underlying HTTP handling
- [ ] Queue dispatch overhead negligible

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Ignoring package version updates for security patches
- [ ] Missing profile class per provider (all treated identically)
- [ ] Not configuring queue connection (sync processing in webhook controller)
- [ ] Not handling webhook model cleanup (table growth)
- [ ] Using global secret for all providers (no isolation)

---

# Testing Checklist

- [ ] Failed processing monitored and alerted
- [ ] Package installed and config published
- [ ] Package updated for security patches
- [ ] Processor dispatches appropriate jobs
- [ ] Provider-specific profile classes defined
- [ ] Queue connection configured for async processing
- [ ] Route registered using `Route::webhooks()`
- [ ] Secrets stored per provider in config/vault
- [ ] Signature validator configured for provider's scheme
- [ ] Valid and invalid signature scenarios tested

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Single Profile Class for All Providers]
- [ ] [Signing Secrets Hardcoded in Config]
- [ ] [No Queue Connection Configured (Sync Processing)]
- [ ] [Deleting WebhookCall After Processing (No Audit Trail)]
- [ ] [No Failure Monitoring on Webhook Processing]
- [ ] [Outdated Package Version (Unpatched Vulnerabilities)]

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


