# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** agentic-workflows
**Knowledge Unit:** ku-04
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Explicitly request reasoning in the system prompt
- [ ] Limit reasoning depth:
- [ ] Prefer ReAct over Plan-Ahead
- [ ] Separate reasoning from acting in the prompt template:
- [ ] Validate that tool results match the plan's expectations.
- [ ] A maximum reasoning depth/steps is configured and enforced.
- [ ] Agent uses a defined reasoning strategy (ReAct, Plan-Ahead, Reflection) â€” not just raw tool calling.
- [ ] Reasoning is output in a parseable format (structured JSON or delimited tags).
- [ ] Implement Strategy Pattern for Reasoning Plugins
- [ ] Limit Reasoning Depth to Bound Cost
- [ ] Never Expose Raw Reasoning Traces to End Users
- [ ] Output Reasoning in Parseable Format
- [ ] Use a Defined Reasoning Strategy

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

- [ ] Explicitly request reasoning in the system prompt
- [ ] Limit reasoning depth:
- [ ] Prefer ReAct over Plan-Ahead
- [ ] Separate reasoning from acting in the prompt template:
- [ ] Validate that tool results match the plan's expectations.
- [ ] Implement Strategy Pattern for Reasoning Plugins
- [ ] Limit Reasoning Depth to Bound Cost
- [ ] Never Expose Raw Reasoning Traces to End Users
- [ ] Output Reasoning in Parseable Format
- [ ] Use a Defined Reasoning Strategy
- [ ] Validate Tool Results Against Plan Expectations

---

# Performance Checklist

- [ ] Cache reasoning traces for similar queries â€” many planning problems share common sub-steps.
- [ ] Consider **distilled reasoning**: use a smaller, cheaper model for the reasoning trace and a larger model for the final answer.
- [ ] CoT multiplies output tokens by 2-5x (reasoning traces are long). This increases cost proportionally for pay-per-token models.
- [ ] Reflection doubles cost (generate + critique + regenerate). Use it only for high-value tasks.
- [ ] ToT complexity grows exponentially with branching factor. Limit branches to 2-3 and depth to 3-4.

---

# Security Checklist

- [ ] Plan validation:
- [ ] Reasoning injection:
- [ ] Reasoning traces may leak sensitive information
- [ ] Replanning can be exploited:
- [ ] Token-based DoS:

---

# Reliability Checklist

- [ ] Expecting small models to produce reliable reasoning. Reasoning quality scales with model size.
- [ ] Implementing reasoning without a fallback â€” when the LLM's reasoning is wrong, the agent should retry with a different strategy.
- [ ] Not instructing the LLM to output reasoning in a parseable format â€” free-text reasoning cannot be validated or debugged.
- [ ] Storing reasoning traces with PII or sensitive data exposed.
- [ ] Using Plan-Ahead in highly dynamic environments (tool results change frequently). Leads to brittle plans that fail at step 2.
- [ ] Never Expose Raw Reasoning Traces to End Users

---

# Testing Checklist

- [ ] A maximum reasoning depth/steps is configured and enforced.
- [ ] Agent uses a defined reasoning strategy (ReAct, Plan-Ahead, Reflection) â€” not just raw tool calling.
- [ ] Reasoning is output in a parseable format (structured JSON or delimited tags).
- [ ] Reasoning traces are logged separately from tool execution logs.
- [ ] The reasoning strategy can be swapped at configuration time without code changes.
- [ ] Tool results are compared against plan expectations before continuing.
- [ ] User-facing output never includes raw reasoning traces.

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [DB-Backed Memory for Ephemeral Stateless Agents â€” Unnecessary Migrations]
- [ ] [No Memory for Multi-Turn Agents]
- [ ] [Memory Without TTL â€” Unbounded Growth]
- [ ] [Cross-Tenant Memory Leak â€” Wrong Scope]
- [ ] [Relying on LLM Context Window as Only Memory]
- [ ] Hardcoded Plans:
- [ ] Ignoring Tool Results:
- [ ] Infinite Reflection:
- [ ] Reasoning Theater:

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


