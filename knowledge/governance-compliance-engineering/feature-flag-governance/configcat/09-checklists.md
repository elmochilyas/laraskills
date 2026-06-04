# Metadata

**Domain:** governance-compliance-engineering
**Subdomain:** feature-flag-governance
**Knowledge Unit:** configcat
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] ConfigCat SDK integrated for CDN-delivered feature flags
- [ ] CDN-based flag delivery architecture understood for low-latency global access
- [ ] Cross-platform SDKs evaluated for multi-platform coverage
- [ ] Configuration management features reviewed
- [ ] Targeting rules configured for user segmentation

---

# Architecture Checklist

- [ ] CDN-based delivery chosen for high availability and low-latency flag access
- [ ] Flag rules distributed via CDN, providing availability even if ConfigCat API unreachable
- [ ] Cross-platform SDKs used for web, mobile, and backend consistency
- [ ] Configuration management separates flag values from application config
- [ ] Targeting rules apply to user segments, percentage rollouts, and environment overrides

---

# Implementation Checklist

- [ ] ConfigCat PHP SDK installed with SDK key
- [ ] Flag evaluation implemented with `Client::getValue()` in application code
- [ ] Targeting rules defined in ConfigCat dashboard per flag
- [ ] CDN cache invalidation understood for flag update propagation
- [ ] Environment overrides configured for dev/staging/production

---

# Performance Checklist

- [ ] CDN cache hit ratio monitored for flag evaluation
- [ ] SDK local cache configured for offline flag evaluation
- [ ] Flag evaluation latency measured globally (multiple CDN edge locations)
- [ ] SDK polling interval tuned for flag freshness vs network requests
- [ ] Percentage rollout evaluation consistent across distributed systems

---

# Security Checklist

- [ ] SDK key stored in environment variable, not source code
- [ ] Targeting rules do not expose user identifiers in CDN logs
- [ ] Production environment guarded by approval gate in ConfigCat
- [ ] Flag evaluation prevents user fingerprinting via targeting rules
- [ ] API access restricted to authorized team members

---

# Reliability Checklist

- [ ] SDK fallback values defined for ConfigCat service outage
- [ ] CDN edge failure does not block flag evaluation (local cache serve)
- [ ] Polling interval ensures timely flag updates without API overload
- [ ] Targeting rule evaluation consistent across SDK instances

---

# Testing Checklist

- [ ] Flag value retrieval tested with ConfigCat SDK
- [ ] Targeting rules tested with representative user samples
- [ ] Percentage rollout tested for distribution accuracy
- [ ] CDN cache invalidation test after flag update
- [ ] Fallback value test when ConfigCat API is unreachable

---

# Maintainability Checklist

- [ ] Flag naming conventions documented and consistent
- [ ] Targeting rules documented per flag in application docs
- [ ] Environment override configuration documented
- [ ] Cross-platform flag consistency verified per release
- [ ] Related skills (LaunchDarkly, GrowthBook) referenced

---

# Anti-Pattern Prevention Checklist

- [ ] No hardcoded SDK key in config files committed to repository
- [ ] No flag names that conflict across environments
- [ ] No percentage rollouts for security-critical feature toggles
- [ ] No SDK polling interval so short it overloads the API
- [ ] No flag evaluation without fallback default value

---

# Production Readiness Checklist

- [ ] CDN cache hit ratio baseline measured
- [ ] SDK key rotation procedure documented
- [ ] Flag change notification configured for production environment
- [ ] ConfigCat dashboard access reviewed quarterly
- [ ] Rollback plan for flag that negatively impacts traffic

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: CDN delivery, cross-platform SDKs
- [ ] Security requirements satisfied: SDK key secured, no user exposure in CDN logs
- [ ] Performance requirements satisfied: cache hit ratio OK, latency measured, polling tuned
- [ ] Testing requirements satisfied: flag retrieval, targeting, percent rollout, fallback
- [ ] Anti-pattern checks passed: no hardcoded key, consistent naming, fallback defined
- [ ] Production readiness verified: cache monitoring, key rotation, notifications

---

# Related References

- GCE-FFG-002 (launchdarkly) — Enterprise leader, similar SaaS model
- GCE-FFG-003 (growthbook) — Open-source alternative
