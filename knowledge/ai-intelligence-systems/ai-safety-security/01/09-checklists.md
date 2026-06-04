# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** ai-safety-security
**Knowledge Unit:** ku-01
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Apply least privilege to the LLM:
- [ ] Implement a "confirm" step
- [ ] Use role-based prompt structuring:
- [ ] Validate user input
- [ ] Wrap user input in delimiters
- [ ] Defense-in-depth approach is documented and tested.
- [ ] Injection attempts are logged and alerted.
- [ ] Input sanitization is one layer (not the only layer) of defense.
- [ ] Rules for Prompt Injection Defense
- [ ] Defense-in-depth approach is documented and tested
- [ ] Injection attempts are logged and alerted
- [ ] Input sanitization is one layer (not the only layer) of defense
- [ ] **Implement first detection layer (regex)**: Create a pattern-based filter that catches known injection patterns: "ignore previous instructions", "you are now free", "system prompt", base64 encoded commands. Run on every input. Fast (<1ms).
- [ ] **Implement output validation**: After receiving the LLM response, check for signs of compromise (refusal patterns, injected instructions, unexpected format changes). This catches successful injections that weren't blocked upstream.
- [ ] **Implement second detection layer (LLM classifier)**: For inputs that pass the regex filter, use a secondary (smaller/cheaper) LLM classifier to detect novel or obfuscated injection attempts. Run only when regex flags are ambiguous or for high-risk operations.
- [ ] Injection attempts are logged with >99% accuracy (low false positive rate)
- [ ] Multi-layer detection catches >95% of known injection techniques in testing
- [ ] Output validation catches any injections that bypass upstream detection

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

- [ ] Apply least privilege to the LLM:
- [ ] Implement a "confirm" step
- [ ] Use role-based prompt structuring:
- [ ] Validate user input
- [ ] Wrap user input in delimiters
- [ ] **Implement first detection layer (regex)**: Create a pattern-based filter that catches known injection patterns: "ignore previous instructions", "you are now free", "system prompt", base64 encoded commands. Run on every input. Fast (<1ms).
- [ ] **Implement output validation**: After receiving the LLM response, check for signs of compromise (refusal patterns, injected instructions, unexpected format changes). This catches successful injections that weren't blocked upstream.
- [ ] **Implement second detection layer (LLM classifier)**: For inputs that pass the regex filter, use a secondary (smaller/cheaper) LLM classifier to detect novel or obfuscated injection attempts. Run only when regex flags are ambiguous or for high-risk operations.
- [ ] **Log and alert on injection attempts**: Log all detected injection attempts with input content (redacted), detection layer that caught it, and action taken (blocked, flagged, allowed). Alert on repeated attempts from the same user/IP.
- [ ] **Structure prompts by role**: Always use distinct message roles: `system` for instructions, `user` for user input, `tool` for function results. Never concatenate user input into the system message.
- [ ] **Test injection resistance**: Regularly run penetration tests against known jailbreak techniques. Maintain a test suite of injection attempts that should be blocked. Update detection patterns as new techniques emerge.
- [ ] **Validate RAG context**: Before injecting retrieved documents into the prompt, run them through the same injection detection pipeline. Treat all external data (retrieved docs, API responses, tool results) as untrusted.

---

# Performance Checklist

- [ ] Injection detection models add inference cost. Cache results for identical inputs when safe.
- [ ] Input sanitization is typically <1ms (regex-based). ML-based detection adds 10-50ms.
- [ ] Output validation with a secondary LLM doubles latency. Use it only for high-risk operations.
- [ ] Prompt structuring (role-based separation) has zero performance cost.
- [ ] Cache detection results for identical inputs (with short TTL)
- [ ] Output validation with secondary LLM: adds latency â€” use only for high-stakes outputs

---

# Security Checklist

- [ ] Adversarial robustness:
- [ ] Consider the supply chain:
- [ ] Defense in depth:
- [ ] Don't rely on the LLM to self-police.
- [ ] Monitor for injection attempts
- [ ] Attackers constantly evolve injection techniques. Regularly update detection patterns and test against known jailbreaks.
- [ ] Consider the supply chain: third-party plugins, models, and tools may introduce injection vectors.
- [ ] Defense in depth: no single layer is sufficient. Combine prompt hardening, input detection, output validation.

---

# Reliability Checklist

- [ ] Concatenating user input directly into the system prompt â€” the most common and dangerous mistake.
- [ ] Not testing injection resistance â€” assuming it works without dedicated security testing.
- [ ] Not treating retrieved documents as untrusted â€” indirect injection attacks are on the rise.
- [ ] Relying solely on the LLM's alignment training to reject injection attempts.
- [ ] Using only input filtering (blacklist) without structural defenses (role separation, delimiters).

---

# Testing Checklist

- [ ] Defense-in-depth approach is documented and tested
- [ ] Defense-in-depth approach is documented and tested.
- [ ] Injection attempts are logged and alerted
- [ ] Injection attempts are logged and alerted.
- [ ] Injection attempts are logged with >99% accuracy (low false positive rate)
- [ ] Input sanitization is one layer (not the only layer) of defense
- [ ] Input sanitization is one layer (not the only layer) of defense.
- [ ] Multi-layer detection catches >95% of known injection techniques in testing
- [ ] Output validation catches any injections that bypass upstream detection
- [ ] Output validation detects if the model was compromised

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [[User Input in System Prompt](#1-user-input-in-system-prompt)]
- [ ] [[Single-Layer Defense Reliance](#2-single-layer-defense-reliance)]
- [ ] [[Cat-and-Mouse Blocklisting](#3-cat-and-mouse-blocklisting)]
- [ ] [[Ignoring Indirect Injection Vectors](#4-ignoring-indirect-injection-vectors)]
- [ ] [[Trusting the LLM to Self-Police](#5-trusting-the-llm-to-self-police)]
- [ ] Cat-and-Mouse Blocklisting:
- [ ] Security Through Obscurity:
- [ ] Single-Layer Defense:
- [ ] Trusting Tool Outputs:

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Monitor injection attempts as security incidents (they indicate active attacks, not just bugs).

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


