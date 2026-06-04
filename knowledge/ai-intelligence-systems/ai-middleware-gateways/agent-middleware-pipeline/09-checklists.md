# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** ai-middleware-gateways
**Knowledge Unit:** agent-middleware-pipeline
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Assembly Line
- [ ] Async middleware
- [ ] Conditional middleware
- [ ] Global middleware
- [ ] HTTP Middleware for AI
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Rules for Agent Middleware Pipeline

---

# Architecture Checklist

- [ ] Middleware can short
- [ ] Middleware stack on Agent only vs. global pipeline â†’ Per
- [ ] Separate pre
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure provider selection via environment variables
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization
- [ ] Implement auto-scaling and queue-based processing for peak loads

---

# Implementation Checklist

- [ ] Assembly Line
- [ ] Async middleware
- [ ] Conditional middleware
- [ ] Global middleware
- [ ] HTTP Middleware for AI
- [ ] Middleware groups
- [ ] Registration via `middleware()` method
- [ ] Security Checkpoint
- [ ] Rules for Agent Middleware Pipeline

---

# Performance Checklist

- [ ] Each middleware adds latency â€” injection detection via regex is ~1ms, but PII redaction using a local model can be 10-50ms
- [ ] Global middleware on every agent call multiplies latency across all AI interactions in the application
- [ ] Middleware order matters: put fast-fail middleware (injection pattern scan) before expensive middleware (PII pseudonymization)
- [ ] Post-receive middleware runs after the LLM has already consumed tokens â€” middleware that rejects responses wastes the entire generation cost

---

# Security Checklist

- [ ] Consider middleware failover: if PII redaction service is down, fall through to a no-op rather than failing the agent call
- [ ] Implement middleware timeouts â€” a stuck middleware should not hang the entire agent call
- [ ] Log middleware execution duration â€” unexpectedly slow middleware degrades user experience
- [ ] Test middleware in isolation with `AgentRequest` and `AgentResponse` factories
- [ ] Use middleware metrics: count blocked requests, track which middleware is triggered most frequently
- [ ] Version middleware configurations â€” changes to middleware stack can break existing agent behaviors

---

# Reliability Checklist

- [ ] Forgetting post-receive PII reinsertion â€” redacted PII is lost from the response, breaking functionality that needs the original data
- [ ] Not testing middleware independently â€” middleware bugs break all agent calls silently
- [ ] Over-using middleware for business logic â€” middleware is for cross-cutting concerns; move domain-specific logic to tools
- [ ] Placing PII redaction before injection detection â€” redacted content may hide injection patterns (e.g., `[REDACTED]` bypasses keyword filters)
- [ ] Writing stateful middleware that leaks data between requests â€” middleware instances may be reused; reset state in `handle()`

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

- [ ] [Monolithic Middleware â€” Single Class Handles All Concerns]
- [ ] [Order-Dependent Middleware â€” Pipeline Order Changes Behavior]
- [ ] [Middleware Modifying Request After Processing Started]
- [ ] [No Short-Circuit Logic â€” All Middleware Runs Even on Error]
- [ ] [Side Effects in Middleware Without Logging]
- [ ] Injection detector false positive
- [ ] Middleware order misconfiguration
- [ ] Middleware timeout
- [ ] PII redactor crashes
- [ ] Synthetic response inconsistency

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


