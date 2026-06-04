# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** ai-safety-security
**Knowledge Unit:** owasp-llm-compliance
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Compliance baseline
- [ ] Compliance dashboard
- [ ] Continuous monitoring
- [ ] OWASP-by-default
- [ ] Penetration testing
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Rules for OWASP LLM Compliance

---

# Architecture Checklist

- [ ] Automated controls vs. manual review â†’ Automated controls for LLM01
- [ ] OWASP LLM 2025 as standard vs. custom framework â†’ OWASP LLM Top 10. Reason: Industry standard, auditor
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization

---

# Implementation Checklist

- [ ] Compliance baseline
- [ ] Compliance dashboard
- [ ] Continuous monitoring
- [ ] OWASP-by-default
- [ ] Penetration testing
- [ ] Risk-to-control mapping
- [ ] Security checklist for AI
- [ ] Rules for OWASP LLM Compliance

---

# Performance Checklist

- [ ] Caching and selective enforcement reduce overhead for low-risk requests
- [ ] Full OWASP LLM defense stack: ~100-500ms added latency per request
- [ ] Most latency from content moderation and LLM-based semantic checks
- [ ] Static controls (schema validation, tool scoping) add negligible latency

---

# Security Checklist

- [ ] Configure per-environment control strictness â€” dev may have looser controls than production
- [ ] Implement automated scanning for OWASP LLM controls in CI/CD pipeline
- [ ] Include OWASP LLM Top 10 compliance in security review checklist
- [ ] Maintain risk register â€” track which OWASP LLM risks are addressed and residual risk level
- [ ] Map each OWASP LLM risk to specific code controls and tests
- [ ] Train security team on OWASP LLM Top 10 â€” different from traditional web app security

---

# Reliability Checklist

- [ ] Assuming cloud AI provider handles security â€” provider handles infrastructure, not application-level risks
- [ ] Excessive agency (LLM06) â€” giving agents access to tools they don't need "just in case"
- [ ] No supply chain security for AI packages (LLM03) â€” third-party AI packages introduce risk
- [ ] Not updating controls for new OWASP LLM versions â€” the framework evolves
- [ ] Only addressing prompt injection (LLM01) and ignoring other 9 risks
- [ ] Treating OWASP LLM compliance as checkbox exercise without actual control implementation

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

- [ ] [OWASP LLM Top 10 Not Reviewed â€” Unaware of Risks]
- [ ] [No LLM01 (Prompt Injection) Mitigation]
- [ ] [No LLM02 (Insecure Output Handling) Mitigation]
- [ ] [No LLM06 (Sensitive Information Disclosure) Protection]
- [ ] [No LLM09 (Overreliance) Guardrails]
- [ ] Control bypass
- [ ] Control erosion
- [ ] Over-reliance on OWASP
- [ ] OWASP audit failure
- [ ] Risk evolution

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


