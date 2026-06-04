# Metadata

**Domain:** api-integration-engineering
**Subdomain:** saloonphp
**Knowledge Unit:** sdk-auto-generation
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Connector resolves correct base URL with authentication configured
- [ ] Generated error types capture API error responses
- [ ] Generated pagination handled correctly for multi-page endpoints
- [ ] Keep Generated SDKs in a Separate Package
- [ ] Never Modify Generated Code Directly
- [ ] Pin Generator Versions in CI
- [ ] Test Generated SDK Against Real API Fixtures
- [ ] Use Verified Specs as SDK Generation Source Only
- [ ] Automated spec download configured
- [ ] Documentation updated for regeneration procedure
- [ ] Generator runs in CI/CD pipeline
- [ ] Add SDK generation to pre-commit hook for local DX
- [ ] Commit regenerated SDK with spec changes
- [ ] Compare generated files to detect unexpected changes

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Add SDK generation to pre-commit hook for local DX
- [ ] Commit regenerated SDK with spec changes
- [ ] Compare generated files to detect unexpected changes
- [ ] Configure spec download: wget/curl to fetch latest spec
- [ ] Document regeneration procedure for on-call engineers
- [ ] Run Saloon generator command in CI/CD pipeline
- [ ] Test generated SDK with smoke tests (syntax, type checks)
- [ ] Version SDK changes alongside API spec versions
- [ ] Keep Generated SDKs in a Separate Package
- [ ] Never Modify Generated Code Directly
- [ ] Pin Generator Versions in CI
- [ ] Test Generated SDK Against Real API Fixtures

---

# Performance Checklist

- [ ] Generated code size: thousands of lines per spec; impacts build/deployment pipeline time
- [ ] Generated models/DTOs are more memory-intensive than raw arrays due to typed property overhead (~2x per object)
- [ ] Generated SDKs add negligible overhead (serialization/deserialization method calls, ~0.01ms per call)
- [ ] Generation time: small specs (10 endpoints) ~5s, large specs (200+ endpoints) ~30-120s
- [ ] Some generators add retry/logging middleware that duplicates Laravel's own infrastructure â€” disable generator middleware when using Laravel's retry/logging

---

# Security Checklist

- [ ] API keys and secrets must never be hardcoded in generated SDK configuration; use environment variables or vault injection
- [ ] Auto-generated error handling may leak stack traces or API internals â€” wrap in Laravel exception handling
- [ ] Generated SDKs may expose internal implementation details if generated from overly permissive specs â€” review generated output for information leakage
- [ ] Keep generated SDKs and their specs in private repositories if the API spec exposes sensitive endpoint details
- [ ] Review generated authentication code for security best practices (token storage, refresh handling)

---

# Reliability Checklist

- [ ] Never Modify Generated Code Directly

---

# Testing Checklist

- [ ] Automated spec download configured
- [ ] Connector resolves correct base URL with authentication configured
- [ ] Documentation updated for regeneration procedure
- [ ] Generated error types capture API error responses
- [ ] Generated pagination handled correctly for multi-page endpoints
- [ ] Generated Saloon SDK passes MockClient tests without real HTTP calls
- [ ] Generated SDK compiles without syntax errors
- [ ] Generator runs in CI/CD pipeline
- [ ] Pre-commit hook or CI job generates fresh SDK
- [ ] Regenerated files checked in with spec changes

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Generated SDK as God Package â€” No Service Layer Wrapping]
- [ ] [Modifying Generated Code Directly]
- [ ] [Trusting Unverified Specs for SDK Generation]
- [ ] [Unpinned Generator Versions â€” Non-Deterministic Output]
- [ ] [No Integration Tests Against Real API Fixtures]
- [ ] Generated SDK as God Package
- [ ] Manual SDK Therapy
- [ ] One-Size-Fits-All Generator
- [ ] Spec-First Without Spec Validation

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


