# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** ai-safety-security
**Knowledge Unit:** output-guarding-validation
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Content filter
- [ ] Hard blocks
- [ ] Responsible disclosure
- [ ] Retry on violation
- [ ] Soft warnings
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Rules for Output Guarding & Validation

---

# Architecture Checklist

- [ ] Guard orientation â†’ Post
- [ ] Hard block vs. soft warning â†’ Hard block for high
- [ ] LLM
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom

---

# Implementation Checklist

- [ ] Content filter
- [ ] Hard blocks
- [ ] Responsible disclosure
- [ ] Retry on violation
- [ ] Soft warnings
- [ ] Streaming guard
- [ ] WAF for AI responses
- [ ] Rules for Output Guarding & Validation

---

# Performance Checklist

- [ ] Content moderation API: 200-500ms â€” significant latency addition
- [ ] Guard failures trigger retry path â€” additional LLM call + guard check
- [ ] LLM-based semantic checks: 300-1000ms â€” use selectively (sample rate, high-risk paths only)
- [ ] Pattern-based checks: <1ms per check â€” suitable for every response
- [ ] Streaming guard: check each chunk â€” cumulative overhead proportional to response length

---

# Security Checklist

- [ ] A/B test guard configurations â€” false positives frustrate users, false negatives create risk
- [ ] Handle streaming guard violations â€” cut off mid-stream, inform user
- [ ] Implement guard bypass review process â€” security team reviews each incident
- [ ] Log all guard violations with violation type and context (not full prompt/response)
- [ ] Monitor guard hit rate per violation type â€” identify patterns in injection attempts
- [ ] Test guards with adversarial prompts (red teaming) â€” validate detection accuracy

---

# Reliability Checklist

- [ ] Guard false positives blocking legitimate responses â€” tune sensitivity, implement soft warnings
- [ ] Guarding only in development, disabled in production â€” overhead concern rationalization
- [ ] No output guarding at all â€” most common security gap in Laravel AI applications
- [ ] Not guarding streaming responses â€” check only final response, mid-stream injection succeeds
- [ ] Relying solely on provider content moderation â€” it only catches egregious violations
- [ ] Storing full prompts/responses in guard violation logs â€” defeats pseudonymization

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

- [ ] [No Output Validation â€” LLM Output Trusted Unconditionally]
- [ ] [No Content Moderation â€” Harmful Content Reaches Users]
- [ ] [No PII Detection in LLM Output]
- [ ] [Output Used Directly in SQL/HTML Without Sanitization]
- [ ] [No Output Length Limits â€” Massive Output DOS]
- [ ] False negative
- [ ] False positive
- [ ] Guard bypass
- [ ] Guard outage
- [ ] Streaming guard race

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


