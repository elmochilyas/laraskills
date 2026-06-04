# Metadata

**Domain:** api-integration-engineering
**Subdomain:** api-versioning
**Knowledge Unit:** backward-compatibility
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Consumer contract tests pass against new API version
- [ ] Default behavior preserved for all existing consumers
- [ ] Documentation explicitly marks what is deprecated vs removed
- [ ] Add Only Optional New Fields with Defaults
- [ ] Document Migration Paths for Breaking Changes
- [ ] Never Change Response Format as a "Bug Fix"
- [ ] Never Remove Fields Within a Version
- [ ] Use Postel's Law: Accept What You Don't Expect
- [ ] Additive-only changes in existing API versions
- [ ] Breaking changes only in new major version
- [ ] Deprecation warnings via headers or docs
- [ ] Add `X-API-Warning` header for deprecated usage
- [ ] Add new endpoints without modifying existing ones
- [ ] Add new fields as optional with defaults

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Add `X-API-Warning` header for deprecated usage
- [ ] Add new endpoints without modifying existing ones
- [ ] Add new fields as optional with defaults
- [ ] Document breaking changes and migration paths
- [ ] Follow additive-only rule: never remove or modify existing fields
- [ ] Maintain old versions until deprecation window expires
- [ ] Support old request formats alongside new ones
- [ ] Test old consumers against new API version
- [ ] Add Only Optional New Fields with Defaults
- [ ] Document Migration Paths for Breaking Changes
- [ ] Never Change Response Format as a "Bug Fix"
- [ ] Never Remove Fields Within a Version

---

# Performance Checklist

- [ ] Accepting unknown fields has no performance cost (JSON decoder ignores them)
- [ ] Backward compatibility validation adds CI time (spec diff: 1-5s) but zero runtime overhead
- [ ] Contract test execution adds 2-10s per consumer in CI
- [ ] Default behavior preservation via parameter defaults is zero-cost

---

# Security Checklist

- [ ] Backward-compatible changes should never weaken authentication or authorization
- [ ] Deprecated fields removed in a new version must be communicated clearly to prevent security gaps
- [ ] New optional parameters must not bypass existing security controls
- [ ] Old versions may not have the latest security features; document these limitations

---

# Reliability Checklist

- [ ] Never Change Response Format as a "Bug Fix"
- [ ] Never Remove Fields Within a Version

---

# Testing Checklist

- [ ] Additive-only changes in existing API versions
- [ ] Breaking changes only in new major version
- [ ] Consumer contract tests pass against new API version
- [ ] Default behavior preserved for all existing consumers
- [ ] Deprecation warnings via headers or docs
- [ ] Documentation explicitly marks what is deprecated vs removed
- [ ] New fields optional with documented defaults
- [ ] No fields removed or made required within a version
- [ ] Old consumer tests pass against new API
- [ ] Old request/response formats still supported

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [[Breaking with Semantics](#1-breaking-with-semantics)]
- [ ] [[Covert Breakage via Bug Fixes](#2-covert-breakage-via-bug-fixes)]
- [ ] [[Versionless Evolution](#3-versionless-evolution)]
- [ ] [[Consumer-Specific Compatibility](#4-consumer-specific-compatibility)]
- [ ] Breaking with semantics
- [ ] Consumer-specific compatibility
- [ ] Covert breakage
- [ ] Versionless evolution

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


