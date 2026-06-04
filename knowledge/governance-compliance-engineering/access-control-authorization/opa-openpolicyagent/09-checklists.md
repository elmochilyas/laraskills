# Metadata

**Domain:** governance-compliance-engineering
**Subdomain:** access-control-authorization
**Knowledge Unit:** opa-openpolicyagent
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] OPA server deployed and integrated as external policy decision point
- [ ] Rego policies written for cross-service authorization rules
- [ ] Input structure designed to pass user attributes, resource context, and action
- [ ] Bundle API configured for OPA policy distribution
- [ ] Partial evaluation evaluated for performance optimization of repeated queries

---

# Architecture Checklist

- [ ] OPA positioned as external policy engine; Gates/Policies remain for app-level auth
- [ ] Policy decisions cached locally to avoid OPA latency for every request
- [ ] Rego policies versioned alongside application code in same repository
- [ ] Bundle API used to push policies to OPA, not manual SCP or config maps
- [ ] Partial evaluation used for pre-computing policy decisions where input varies slowly

---

# Implementation Checklist

- [ ] Rego policy files organized by domain (`authz/`, `compliance/`, `data-access/`)
- [ ] OPA client library (or HTTP client) integrated into Laravel service provider
- [ ] Input document includes user ID, roles, resource type, resource ID, and action
- [ ] Bundle server (e.g., S3 with OPA bundle format) configured for policy distribution
- [ ] Health check endpoint monitored for OPA service availability

---

# Performance Checklist

- [ ] OPA query latency measured per request; P99 should be under 10ms
- [ ] In-memory cache for OPA decisions with TTL based on policy change frequency
- [ ] Partial evaluation results cached and invalidated on policy updates
- [ ] Rego rule complexity reviewed for nested iteration and rule recursion
- [ ] Bundle download performance tested under network constraints

---

# Security Checklist

- [ ] Rego policies validated against schema to prevent unexpected input injection
- [ ] OPA API authenticated with bearer token or mTLS
- [ ] Policy bundle signed to prevent tampered policy distribution
- [ ] Default-deny rule applied as safety net for unhandled authorization scenarios
- [ ] OPA server access restricted to application tier via network policy

---

# Reliability Checklist

- [ ] OPA unavailability fallback defined: deny-closed or allow with degraded mode
- [ ] Retry with exponential backoff configured for OPA query failures
- [ ] Health check endpoint monitored; alert triggered if OPA unreachable
- [ ] Bundle push failure handling: continue serving last known good policies

---

# Testing Checklist

- [ ] Rego policy unit tests written using `opa test` command
- [ ] Integration tests verify OPA decision integration from Laravel
- [ ] Fallback behavior tested when OPA is unreachable
- [ ] Partial evaluation output tested against full evaluation equivalence
- [ ] Bundle signature verification tested with invalid signature scenario

---

# Maintainability Checklist

- [ ] Rego policies documented with `package` and `import` conventions
- [ ] Rego test coverage tracked; minimum 80% coverage required
- [ ] OPA version pinned in deployment manifests
- [ ] Policy bundle CI pipeline includes Rego linting (`opa fmt --check`)
- [ ] Related skills (Gates & Policies, Spatie Permission) referenced as complementary layers

---

# Anti-Pattern Prevention Checklist

- [ ] No business logic encoded in Rego that duplicates Laravel Gates/Policies
- [ ] No synchronous OPA calls in hot paths without caching
- [ ] No hardcoded secrets in Rego rule bodies
- [ ] No OPA as the sole authorization layer; app-level Gates/Policies still enforced
- [ ] No policy bundle deployed without signature verification

---

# Production Readiness Checklist

- [ ] OPA deployment monitored for latency and error rate
- [ ] Policy bundle version tracked and rollback-capable
- [ ] OPA decision logs ingested into centralized logging (Datadog, Splunk)
- [ ] Alert configured for OPA service down or high error rate
- [ ] Load test performed with expected peak traffic to OPA

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: OPA for cross-service, Gates for app-level auth
- [ ] Security requirements satisfied: default-deny, auth'd API, signed bundles
- [ ] Performance requirements satisfied: caching configured, latency within P99 10ms
- [ ] Testing requirements satisfied: Rego tests, integration tests, fallback tested
- [ ] Anti-pattern checks passed: no logic duplication, no synchronous hot-path calls
- [ ] Production readiness verified: monitoring, alerting, logging, load tested

---

# Related References

- GCE-ACC-001 (laravel-gates-policies) — Application-level authorization
- GCE-ACC-002 (spatie-permission) — Role/permission data layer
- GCE-COM-001 (cicd-policy-gates) — OPA for CI/CD policy evaluation
- GCE-DCS-001 (three-tier-classification) — Policy-based data access controls
