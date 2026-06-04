# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** ecosystem-packages
**Knowledge Unit:** 14-ecosystem-packages
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `composer audit` shows zero vulnerabilities
- [ ] All community packages have active maintenance (commits within last 3 months)
- [ ] Community package configuration is documented in a central location
- [ ] Rules for Ecosystem Packages
- [ ] `composer audit` shows zero vulnerabilities
- [ ] Configuration unified in central config/ai.php
- [ ] Integration uses middleware pattern over provider replacement
- [ ] Community middleware integrates as transparent layer in agent pipeline
- [ ] Community package fills verified gap without overlap
- [ ] Configuration centralized and documented for team reference

---

# Architecture Checklist

- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization
- [ ] Implement auto-scaling and queue-based processing for peak loads
- [ ] Implement defense layers: input validation, output guarding, and content filtering

---

# Implementation Checklist

- [ ] Rules for Ecosystem Packages
- [ ] Community vs build in-house
- [ ] Config unification
- [ ] Facade conflicts
- [ ] Middleware order
- [ ] Middleware vs provider replacement
- [ ] Single comprehensive vs multiple specialized

---

# Performance Checklist

- [ ] Adding 2-3 packages adds 15-45ms overhead per AI call in middleware
- [ ] Budget enforcement: 2-5ms per call (cached Eloquent check)
- [ ] Graph node transition: 10-30ms per node (LaraGraph, state persistence)
- [ ] Local LLM (Ollama, 8B model, CPU): 100-500ms per token â€” only suitable for dev or async
- [ ] Package autoloading overhead: ~5-15ms additional Composer class loading
- [ ] Security middleware (Aegis): 5-15ms per call (pattern matching, PII replacement)
- [ ] Adding 2-3 packages adds 15-45ms overhead per AI call in middleware
- [ ] Budget enforcement: 2-5ms per call (cached Eloquent check)

---

# Security Checklist

- [ ] Check that security packages don't log sensitive prompt/response data by default
- [ ] Community packages may introduce transitive vulnerabilities â€” vet dependencies
- [ ] Packages with WebSocket servers (AI Bridge) need proper authentication and rate limiting
- [ ] Security middleware packages (Aegis, Guardrail) are not a replacement for input validation â€” they complement it
- [ ] Some packages register API routes â€” test in isolated environment
- [ ] Verify community package encryption/storage of API keys
- [ ] Middleware that modifies prompts (PII redaction) must not break prompt structure
- [ ] Packages with WebSocket servers need proper authentication and rate limiting

---

# Reliability Checklist

- [ ] Assuming all packages support the same PHP/Laravel version range
- [ ] Installing 3+ packages that do the same thing (e.g., 3 RAG packages, 3 security packages)
- [ ] Not checking package license â€” some are AGPL with commercial restrictions
- [ ] Not reading CHANGELOG before updating â€” breaking changes are frequent
- [ ] Overlooking package test coverage â€” 0% coverage means unknown regressions
- [ ] Using a package that hasn't been updated in >6 months for AI SDK integration

---

# Testing Checklist

- [ ] `composer audit` shows zero vulnerabilities
- [ ] All community packages have active maintenance (commits within last 3 months)
- [ ] Community middleware integrates as transparent layer in agent pipeline
- [ ] Community package configuration is documented in a central location
- [ ] Community package fills verified gap without overlap
- [ ] Community packages are pinned to specific minor versions in composer.json
- [ ] Configuration centralized and documented for team reference
- [ ] Configuration unified in central config/ai.php
- [ ] Integration test suite passes with package installed
- [ ] Integration uses middleware pattern over provider replacement

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Abandonware Dependency:
- [ ] Fork Fragmentation:
- [ ] Ignoring Deprecation Warnings:
- [ ] Package Sprawl:
- [ ] Version Fear:

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Check that packages don't log sensitive prompt/response data by default
- [ ] Logging middleware must redact sensitive data before persistence
- [ ] Order middleware so expensive checks (logging) don't run if cheap checks (security) fail early

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


