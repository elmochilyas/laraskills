# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** ai-safety-security
**Knowledge Unit:** ku-06
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Apply output-specific escaping.
- [ ] Implement red teaming
- [ ] Log output validation failures
- [ ] Never render raw LLM output as HTML
- [ ] Use allowlists for format enforcement.
- [ ] Content safety check is applied to LLM output (same as input moderation).
- [ ] HTML output is sanitized with an allowlist approach (strip unknown tags/attributes).
- [ ] LLM output is never rendered as raw HTML without sanitization.
- [ ] Rules for Psalm/PHPStan Taint Analysis
- [ ] Content safety check is applied to LLM output (same as input moderation)
- [ ] HTML output is sanitized with an allowlist approach (strip unknown tags/attributes)
- [ ] LLM output is never rendered as raw HTML without sanitization
- [ ] **Check content safety**: Run output through the same moderation pipeline as input (ku-02). Detect harmful content (hate, violence, self-harm, sexual) that the model may have generated. Block or flag based on policy.
- [ ] **Check for PII leakage**: Apply PII detection patterns to the output. If the model regurgitated PII from training data or context, redact it before returning to the user.
- [ ] **Detect hallucinations (high-stakes only)**: For domain-specific outputs (medical, legal, financial), extract claims and verify against a trusted knowledge base using semantic similarity. Flag unverifiable claims.
- [ ] >99% of harmful LLM outputs caught by content safety check
- [ ] Format validation prevents malformed outputs from reaching consuming code
- [ ] Hallucination detection (for high-stakes outputs) flags unverifiable claims before they reach users

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

- [ ] Apply output-specific escaping.
- [ ] Implement red teaming
- [ ] Log output validation failures
- [ ] Never render raw LLM output as HTML
- [ ] Use allowlists for format enforcement.
- [ ] Validate structure before content.
- [ ] **Check content safety**: Run output through the same moderation pipeline as input (ku-02). Detect harmful content (hate, violence, self-harm, sexual) that the model may have generated. Block or flag based on policy.
- [ ] **Check for PII leakage**: Apply PII detection patterns to the output. If the model regurgitated PII from training data or context, redact it before returning to the user.
- [ ] **Detect hallucinations (high-stakes only)**: For domain-specific outputs (medical, legal, financial), extract claims and verify against a trusted knowledge base using semantic similarity. Flag unverifiable claims.
- [ ] **Detect refusal patterns**: Check if the output contains refusal text ("I cannot", "I'm sorry, but", "As an AI") disguised as normal content. If detected, return a consistent application-level error.
- [ ] **Implement safe rendering**: Never render raw LLM output without sanitization. Use template engines with auto-escaping (Blade). Set Content-Security-Policy headers to prevent inline script execution.
- [ ] **Log output validation failures**: Log every validation failure (format, safety, PII, hallucination) with the output content (redacted) and action taken. Alert on increasing failure rates.

---

# Performance Checklist

- [ ] Cache validation results: if the same output is generated for different users, validate once.
- [ ] Hallucination detection with a secondary LLM adds significant latency (500ms+) and cost. Use it only for high-stakes outputs.
- [ ] HTML sanitization adds 1-5ms depending on content length.
- [ ] JSON schema validation adds <0.5ms for small payloads.
- [ ] Per-chunk streaming sanitization is harder to implement but adds minimal latency (sub-millisecond per chunk).
- [ ] Cache validation results: same output for different users only needs one validation
- [ ] Format validation (JSON schema): <0.5ms for small payloads

---

# Security Checklist

- [ ] Code execution:
- [ ] Data exfiltration:
- [ ] HTML/JS injection:
- [ ] Markdown injection:
- [ ] SSRF via output:
- [ ] Cache validation results: same output for different users only needs one validation
- [ ] Format validation (JSON schema): <0.5ms for small payloads
- [ ] HTML/JS injection is the most common LLM output vulnerability â€” always sanitize HTML

---

# Reliability Checklist

- [ ] Assuming LLM output is safe because the model is aligned â€” alignment is not a security control.
- [ ] Not handling streaming output differently â€” validation that works for complete responses may miss issues in partial chunks.
- [ ] Only validating output format, not content â€” a valid JSON response can contain malicious data.
- [ ] Rendering LLM output as raw HTML without sanitization â€” the most common and dangerous mistake.
- [ ] Skipping output validation for authenticated/admin users â€” admins are also vulnerable to injection attacks.

---

# Testing Checklist

- [ ] >99% of harmful LLM outputs caught by content safety check
- [ ] Content safety check is applied to LLM output (same as input moderation)
- [ ] Content safety check is applied to LLM output (same as input moderation).
- [ ] Format validation prevents malformed outputs from reaching consuming code
- [ ] Hallucination detection (for high-stakes outputs) flags unverifiable claims before they reach users
- [ ] HTML output is sanitized with an allowlist approach (strip unknown tags/attributes)
- [ ] HTML output is sanitized with an allowlist approach (strip unknown tags/attributes).
- [ ] LLM output is never rendered as raw HTML without sanitization
- [ ] LLM output is never rendered as raw HTML without sanitization.
- [ ] Output format is validated against a schema before returning to the client

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date
- [ ] Validate structure before content.

---

# Anti-Pattern Prevention Checklist

- [ ] [[Trust-by-Default Output Handling](#1-trust-by-default-output-handling)]
- [ ] [[Output Used as Security Authority](#2-output-used-as-security-authority)]
- [ ] [[Same Treatment for All Output Formats](#3-same-treatment-for-all-output-formats)]
- [ ] [[Client-Side-Only Sanitization](#4-client-side-only-sanitization)]
- [ ] [[No Streaming Output Validation](#5-no-streaming-output-validation)]
- [ ] Client-Side-Only Sanitization:
- [ ] Output as Authority:
- [ ] Same Treatment for All Output:
- [ ] Trust-by-Default:

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


