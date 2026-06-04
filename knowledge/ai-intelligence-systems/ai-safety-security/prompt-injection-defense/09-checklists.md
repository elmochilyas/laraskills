# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** ai-safety-security
**Knowledge Unit:** prompt-injection-defense
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Delimiter isolation
- [ ] Instruction reinforcement
- [ ] Least-privilege tools
- [ ] Principle of least privilege
- [ ] Read-only tools
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Rules for Prompt Injection Defense

---

# Architecture Checklist

- [ ] Built
- [ ] Pattern
- [ ] Pre
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom

---

# Implementation Checklist

- [ ] Delimiter isolation
- [ ] Instruction reinforcement
- [ ] Least-privilege tools
- [ ] Principle of least privilege
- [ ] Read-only tools
- [ ] SQL injection for LLMs
- [ ] Tool argument validation
- [ ] XSS for AI
- [ ] Rules for Prompt Injection Defense

---

# Performance Checklist

- [ ] Output guarding: 10-100ms for LLM-based response evaluation
- [ ] Pattern detection: 5-50ms depending on number of patterns and input length
- [ ] Tool argument validation: <1ms (local validation)
- [ ] Total defense overhead: ~20-200ms per request â€” acceptable for most applications

---

# Security Checklist

- [ ] Implement emergency kill switch â€” disable AI features if injection attack is detected at scale
- [ ] Layer defenses â€” no single layer is sufficient
- [ ] Log all blocked prompts for analysis â€” improve detection patterns based on real attacks
- [ ] Monitor injection detection rate â€” rising rate indicates active attack
- [ ] Stay current with OWASP LLM Top 10 â€” new attack vectors emerge quarterly
- [ ] Test defenses with adversarial prompts (red teaming)

---

# Reliability Checklist

- [ ] Assuming a managed API (OpenAI, Anthropic) handles injection defense â€” they do not
- [ ] No input sanitization on retrieved documents â€” indirect injection via RAG is the most common attack vector
- [ ] No output scanning â€” successful injections go undetected until damage is done
- [ ] Relying solely on prompt engineering for injection defense â€” LLMs cannot reliably distinguish instructions from data
- [ ] Tool schemas without validation â€” LLM can inject arbitrary function arguments
- [ ] Whitelisting instead of blacklisting â€” attackers bypass blacklists with novel patterns

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

- [ ] [No Injection Defense â€” Raw User Input in Prompts]
- [ ] [Relying Only on LLM Self-Defense ("Ignore Injection Attempts")]
- [ ] [Same Defense for All User Roles]
- [ ] [No Input Sanitization â€” Malicious Characters Reach Provider]
- [ ] [No Injection Monitoring â€” Don't Know If Attack Is Occurring]
- [ ] Defense bypass via RAG
- [ ] False negative
- [ ] False positive
- [ ] Multimodal injection
- [ ] Tool chain injection

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


