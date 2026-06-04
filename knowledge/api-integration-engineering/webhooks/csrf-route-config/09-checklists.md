# Metadata

**Domain:** api-integration-engineering
**Subdomain:** webhooks
**Knowledge Unit:** csrf-route-config
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Alternative authentication on webhook routes (signature)
- [ ] Exclusion list minimal and documented
- [ ] Exclusion uses path pattern, not full URL
- [ ] Always Add Webhook Routes to CSRF Exception List
- [ ] Implement Compensating Security (Signature Verification)
- [ ] Never Disable CSRF Globally
- [ ] Register Webhook Routes as Route::post() Only
- [ ] Use API Routes for Webhook Endpoints (Preferred)
- [ ] Considered using `routes/api.php` for webhook routes
- [ ] Non-webhook routes still CSRF-protected
- [ ] Webhook paths added to `$except` array in `VerifyCsrfToken`
- [ ] Add paths to `$except` array in `VerifyCsrfToken` middleware
- [ ] Consider using `routes/api.php` instead for webhooks (no CSRF)
- [ ] Identify webhook URL paths in `routes/web.php`

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Add paths to `$except` array in `VerifyCsrfToken` middleware
- [ ] Consider using `routes/api.php` instead for webhooks (no CSRF)
- [ ] Identify webhook URL paths in `routes/web.php`
- [ ] Test webhook endpoint with POST without CSRF token
- [ ] Use exact path or wildcard: `webhook/*`
- [ ] Verify webhook routes appear in `$except` array
- [ ] Always Add Webhook Routes to CSRF Exception List
- [ ] Implement Compensating Security (Signature Verification)
- [ ] Never Disable CSRF Globally
- [ ] Register Webhook Routes as Route::post() Only
- [ ] Use API Routes for Webhook Endpoints (Preferred)
- [ ] Use Route Prefix to Group Webhook Endpoints for Targeted Exclusion

---

# Performance Checklist

- [ ] CSRF middleware adds ~0.5ms per request
- [ ] Excluded routes skip middleware entirely
- [ ] No performance impact from proper exclusion

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Adding webhook routes to api.php to avoid CSRF (wrong semantics)
- [ ] Excluding entire route groups with overly broad patterns
- [ ] Excluding routes without adding alternative auth
- [ ] Forgetting to exclude webhook routes â†’ 419 expired errors
- [ ] Hardcoding full URLs instead of path-based exclusion
- [ ] Always Add Webhook Routes to CSRF Exception List
- [ ] Never Disable CSRF Globally

---

# Testing Checklist

- [ ] Alternative authentication on webhook routes (signature)
- [ ] Considered using `routes/api.php` for webhook routes
- [ ] Exclusion list minimal and documented
- [ ] Exclusion uses path pattern, not full URL
- [ ] Non-webhook routes still CSRF-protected
- [ ] Non-webhook routes still have CSRF protection
- [ ] Webhook paths added to `$except` array in `VerifyCsrfToken`
- [ ] Webhook POST tested without CSRF token
- [ ] Webhook routes excluded from CSRF protection
- [ ] Wildcards used correctly for multiple webhook paths

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [419 Silent Failure â€” Webhook Routes Not Excluded from CSRF]
- [ ] [Global CSRF Disable â€” All Routes Vulnerable]
- [ ] [Individual Path Exclusion Without Route Prefix]
- [ ] [CSRF Exemption Without Compensating Auth]
- [ ] [Webhook Routes on Route::any() â€” Expanded Attack Surface]

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


