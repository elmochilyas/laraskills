# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** ai-safety-security
**Knowledge Unit:** pii-pseudonymization
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Audit trail
- [ ] Data masking for AI
- [ ] Entity-aware replacement
- [ ] Post-receive de-pseudonymization
- [ ] Pre-send pseudonymization
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Rules for PII Pseudonymization

---

# Architecture Checklist

- [ ] Middleware vs. agent
- [ ] Pre
- [ ] Reversible pseudonymization vs. anonymization â†’ Reversible (pseudonymization) for agents that need to reference user data in responses. Anonymization for agents that don't need identity context
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom

---

# Implementation Checklist

- [ ] Audit trail
- [ ] Data masking for AI
- [ ] Entity-aware replacement
- [ ] Post-receive de-pseudonymization
- [ ] Pre-send pseudonymization
- [ ] Selective pseudonymization
- [ ] Template variables
- [ ] Rules for PII Pseudonymization

---

# Performance Checklist

- [ ] Cache token mapping with short TTL (5-60 minutes depending on session)
- [ ] PII detection: 5-50ms per prompt (regex) or 50-200ms (NER model)
- [ ] Response de-tokenization: <1ms (simple string replacement)
- [ ] Token mapping storage: negligible (cached in Redis)

---

# Security Checklist

- [ ] GDPR: pseudonymization is a recommended data protection measure by design
- [ ] Handle partial PII (e.g., "my card ends in 1234") â€” pattern detection for fragments
- [ ] HIPAA: pseudonymized PHI is still PHI if the token mapping exists â€” mapping must be protected
- [ ] Implement token expiration â€” mapping should not persist beyond session lifetime
- [ ] Never store original PII in LLM request logs â€” only store pseudonymized version
- [ ] Test PII detection accuracy on your domain â€” generic patterns may miss industry-specific identifiers
- [ ] Use encrypted token mapping storage â€” mapping leak would expose all PII

---

# Reliability Checklist

- [ ] Assuming pseudonymization = full data protection (reversible â€” mapping must be secured)
- [ ] Inconsistent pseudonymization â€” same PII gets different tokens across requests
- [ ] Logging original prompts with PII for debugging â€” defeats pseudonymization
- [ ] Not handling PII in tool results â€” tool outputs containing PII bypass pseudonymization
- [ ] Not pseudonymizing retrieved RAG context â€” documents may contain PII that leaks to provider
- [ ] Over-pseudonymizing â€” replacing "John" when it refers to a product name, not a person

---

# Testing Checklist

- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Performance implications are accounted for in the design.
- [ ] Production deployment follows recommended practices.
- [ ] Related KUs are consulted for additional guidance.
- [ ] Security considerations are addressed.

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Raw PII Sent to LLM Provider â€” Compliance Violation]
- [ ] [No PII Detection Before Prompt Construction]
- [ ] [Pseudonymization Not Reversible for Debugging]
- [ ] [Same Pseudonym for All Users â€” Cross-User Correlation]
- [ ] [No PII Logging Controls â€” Pseudonymized Data in Logs]
- [ ] Mapping loss
- [ ] Response mapping failure
- [ ] Token collision
- [ ] Token injection
- [ ] Undetected PII

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


