# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** ai-safety-security
**Knowledge Unit:** psalm-taint-analysis
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Explicit trust boundary
- [ ] Sanitization boundary
- [ ] Static analysis for XSS
- [ ] Taint-aware middleware
- [ ] Tool result sanitization
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Rules for Psalm/PHPStan Taint Analysis

---

# Architecture Checklist

- [ ] LLM response as auto
- [ ] Psalm
- [ ] Taint on response object vs. string â†’ String level (when `__toString` is called). Reason: Most sinks expect strings; response object wrapping would miss many flows
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom

---

# Implementation Checklist

- [ ] Explicit trust boundary
- [ ] Sanitization boundary
- [ ] Static analysis for XSS
- [ ] Taint-aware middleware
- [ ] Tool result sanitization
- [ ] Type system for security
- [ ] Rules for Psalm/PHPStan Taint Analysis

---

# Performance Checklist

- [ ] No runtime performance cost â€” analysis is static
- [ ] Psalm static analysis: adds ~30 seconds to CI pipeline for taint checks
- [ ] Sanitization functions add negligible runtime overhead

---

# Security Checklist

- [ ] Add Psalm taint analysis to CI pipeline â€” block PRs with taint violations
- [ ] Create `@psalm-taint-sink` annotations for custom operations that consume LLM output
- [ ] Define project-specific sanitization functions and whitelist them in Psalm config
- [ ] Start with baseline violations count, gradually reduce to zero
- [ ] Train team on taint analysis â€” interpret violations correctly (false positives vs. real vulnerabilities)

---

# Reliability Checklist

- [ ] Assuming LLM output is safe â€” LLM responses are tainted by nature (prompt injection)
- [ ] Clearing taint without actual sanitization â€” defeats the purpose
- [ ] Ignoring false positives â€” investigate each before whitelisting
- [ ] Not updating sanitization rules as new sinks are added to codebase
- [ ] Only checking direct query sinks â€” indirect flows (cached responses, queued jobs) also need protection

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

- [ ] [No Static Analysis for AI Code â€” Taint Flows Undetected]
- [ ] [Taint Sources Not Configured (LLM Output as Taint Source)]
- [ ] [Taint Sinks Not Configured (DB, File, Shell)]
- [ ] [Taint Warnings Ignored â€” Suppressed Without Review]
- [ ] [No CI Enforcement of Taint Checks]
- [ ] Configuration gap
- [ ] False negative
- [ ] False positive
- [ ] Plugin incompatibility
- [ ] Taint evasion

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


