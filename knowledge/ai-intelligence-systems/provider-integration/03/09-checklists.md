# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** provider-integration
**Knowledge Unit:** ku-03
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Always call `supports()` before using a capability.
- [ ] Define standard capability names
- [ ] Document capability gaps
- [ ] Provide fallback implementations
- [ ] Test capabilities in CI.
- [ ] Capability detection (`supports()`) is implemented for all provider adapters.
- [ ] Capability matrix is documented and tested in CI.
- [ ] Capability names are standardized (enum or constants) across providers.
- [ ] Always Check supports() Before Using Provider-Specific Features
- [ ] Define Capability Names as Enums
- [ ] Document Capability Gaps per Provider
- [ ] Provide Fallback Implementations for Common Capabilities
- [ ] `supports()` is implemented for all provider adapters
- [ ] `supports()` returns boolean from static matrix, not runtime API call
- [ ] Capability matrix is documented and tested in CI
- [ ] Adding a new provider requires only implementing its capability array
- [ ] Application uses `supports()` before every capability-dependent code path
- [ ] Capability matrix is accurate and updated when providers change APIs

---

# Architecture Checklist

- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure provider selection via environment variables
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization
- [ ] Implement auto-scaling and queue-based processing for peak loads
- [ ] Implement defense layers: input validation, output guarding, and content filtering
- [ ] Implement input validation, output sanitization, and PII handling
- [ ] Implement response caching with appropriate TTL and invalidation strategy

---

# Implementation Checklist

- [ ] Always call `supports()` before using a capability.
- [ ] Define standard capability names
- [ ] Document capability gaps
- [ ] Provide fallback implementations
- [ ] Test capabilities in CI.
- [ ] Always Check supports() Before Using Provider-Specific Features
- [ ] Define Capability Names as Enums
- [ ] Document Capability Gaps per Provider
- [ ] Provide Fallback Implementations for Common Capabilities
- [ ] Acceptable quality
- [ ] Enum vs string
- [ ] Error surface

---

# Performance Checklist

- [ ] Capability detection adds <0.01ms â€” negligible. Cache the result per provider instance.
- [ ] Capability fallback (e.g., client-side JSON validation) adds application-layer overhead vs. provider-native support.
- [ ] Some provider-specific features (context caching, prompt caching) are explicitly designed to improve performance â€” use them.
- [ ] Structured output may add latency (provider post-processes the response). Test with and without for your use case.
- [ ] Vision inputs add significant latency and token cost (images are tokenized). Use only when necessary.
- [ ] Cache fallback results if the same provider/capability combination is checked frequently
- [ ] Capability detection adds <0.01ms â€” negligible; cache result per provider instance
- [ ] Capability fallback adds application-layer overhead vs provider-native support

---

# Security Checklist

- [ ] Capability-based routing:
- [ ] Context caching security:
- [ ] Feature misuse:
- [ ] Structured output validation:
- [ ] Vision input security:
- [ ] Apply rate limits per capability to prevent feature misuse
- [ ] Client-side JSON validation: <1ms vs provider native JSON mode (included in response time)
- [ ] Client-side PII detection: 10-50ms depending on regex complexity

---

# Reliability Checklist

- [ ] Assuming capability names are standardized across providers â€” each provider may call the same feature differently.
- [ ] Calling a provider-specific method without checking `supports()` first â€” runtime error on unsupported providers.
- [ ] Forgetting that enabling a capability may change the response format (e.g., structured output changes finish_reason).
- [ ] Not implementing capability detection for new adapters â€” `supports()` returns false for everything by default.
- [ ] Not testing capabilities with real provider responses â€” mock tests may not reflect actual behavior.
- [ ] Always Check supports() Before Using Provider-Specific Features
- [ ] Provide Fallback Implementations for Common Capabilities

---

# Testing Checklist

- [ ] `supports()` is implemented for all provider adapters
- [ ] `supports()` returns boolean from static matrix, not runtime API call
- [ ] Adding a new provider requires only implementing its capability array
- [ ] Application uses `supports()` before every capability-dependent code path
- [ ] Capability detection (`supports()`) is implemented for all provider adapters.
- [ ] Capability matrix is accurate and updated when providers change APIs
- [ ] Capability matrix is documented and tested in CI
- [ ] Capability matrix is documented and tested in CI.
- [ ] Capability names are standardized (enum or constants) across providers.
- [ ] Capability names are standardized as enums, not string literals

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Calling a Provider-Specific Feature Without Checking supports() First]
- [ ] [Feature Leakage â€” Exposing Provider-Specific Names in the Application Layer]
- [ ] [Capability Creep â€” Supporting Every Minor Provider-Specific Feature]
- [ ] [False Equivalence â€” Claiming Support When Implementation Differs Functionally]
- [ ] [All-or-Nothing Capabilities â€” Treating Capabilities as Binary]
- [ ] All-or-Nothing Capabilities:
- [ ] Capability Creep:
- [ ] Capability Silo:
- [ ] False Equivalence:
- [ ] Feature Leakage:

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Fallback logic may introduce new attack surface (e.g., regex DoS)
- [ ] Log fallback activations for security monitoring â€” may indicate attempted provider restriction bypass

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


