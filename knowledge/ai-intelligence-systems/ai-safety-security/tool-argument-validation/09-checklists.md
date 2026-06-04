# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** ai-safety-security
**Knowledge Unit:** tool-argument-validation
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Allowed values enums
- [ ] Numeric bounds
- [ ] Prepared statement for AI
- [ ] Read-only DB connections
- [ ] Result truncation
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Rules for Tool Argument Validation

---

# Architecture Checklist

- [ ] Automatic rejection vs. LLM retry â†’ Automatic retry (return error to LLM). Reason: LLM can self
- [ ] Injection
- [ ] Schema validation vs. manual validation in `handle()` â†’ Schema validation (automatic before `handle()` called). Reason: Catches injection before any code executes; single declaration for validation and documentation
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom

---

# Implementation Checklist

- [ ] Allowed values enums
- [ ] Numeric bounds
- [ ] Prepared statement for AI
- [ ] Read-only DB connections
- [ ] Result truncation
- [ ] Sanitized API endpoint
- [ ] String length caps
- [ ] User context via constructor
- [ ] Rules for Tool Argument Validation

---

# Performance Checklist

- [ ] Constructor injection: no per-request cost â€” done at agent construction
- [ ] Read-only DB connections: no additional overhead
- [ ] Result truncation: prevents large data transfer between tool â†’ LLM context
- [ ] Schema validation: <1ms per tool call â€” negligible

---

# Security Checklist

- [ ] Always define `description` on tool parameters â€” improves LLM's ability to provide correct values
- [ ] Log all tool validation failures â€” indicates prompt injection attempts
- [ ] Set `maximum` on limit/count parameters â€” prevents DOS via extreme values
- [ ] Set `maxLength` on all string parameters â€” prevents injection via long strings
- [ ] Test tools with deliberately invalid inputs â€” verify validation catches edge cases
- [ ] Use `enum` for any parameter with a fixed set of valid values

---

# Reliability Checklist

- [ ] Allowing free-form string parameters where enums should be used
- [ ] No result size limit â€” LLM context window fills with tool output
- [ ] No schema validation on tool parameters â€” LLM can pass any value to `handle()`
- [ ] Returning full Eloquent models from tools â€” serializes all attributes including hidden/sensitive
- [ ] Tool `handle()` using user input for SQL queries without parameterization â€” SQL injection risk
- [ ] Trusting LLM-provided user IDs for authorization â€” user should be injected via constructor

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

- [ ] [No Schema Validation for Tool Arguments]
- [ ] [Accepting Arbitrary Arguments From LLM â€” Injection Vector]
- [ ] [Tool Arguments Not Sanitized Before Use]
- [ ] [No Type Validation â€” String Expected But Array Passed]
- [ ] [No Max Length on String Arguments â€” Buffer Overflow]
- [ ] Authorization bypass via tool
- [ ] LLM provides out-of-enum value
- [ ] Result overflow
- [ ] Schema too restrictive
- [ ] Tool argument injection via prompt

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


