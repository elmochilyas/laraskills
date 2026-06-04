# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** agentic-workflows
**Knowledge Unit:** ku-02
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Agent failures propagate correctly: retry â†’ escalate to supervisor â†’ fail gracefully.
- [ ] Agent graph is defined as config (not hardcoded) and validated for cycles.
- [ ] All inter-agent communication is logged with source, target, type, and latency.
- [ ] Define Agent Roles with Strict Tool Boundaries
- [ ] Implement Timeout Per Agent Turn
- [ ] Keep the Orchestrator Deterministic for Control Flow
- [ ] Log Every Inter-Agent Message
- [ ] Use Structured Schemas for Inter-Agent Messages

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

- [ ] Define Agent Roles with Strict Tool Boundaries
- [ ] Implement Timeout Per Agent Turn
- [ ] Keep the Orchestrator Deterministic for Control Flow
- [ ] Log Every Inter-Agent Message
- [ ] Use Structured Schemas for Inter-Agent Messages
- [ ] Validate Inter-Agent Message Schemas at the Boundary

---

# Performance Checklist

- [ ] Consider **agent caching**: memoize agent outputs for identical inputs within a session.
- [ ] Multi-agent systems add latency proportional to the depth of the agent graph (each hop = one LLM call).
- [ ] Parallel fan-out reduces wall-clock time but increases total token spend (N agents Ã— prompt tokens).
- [ ] Sub-graph batching: group independent agents that share context to reduce redundant prompt processing.
- [ ] The orchestrator agent's context window grows with each sub-result; implement summarization or sliding-window trimming.

---

# Security Checklist

- [ ] Agent spoofing:
- [ ] Data isolation:
- [ ] Inter-agent message validation:
- [ ] Orchestrator is the trust boundary:
- [ ] Privilege separation:

---

# Reliability Checklist

- [ ] Letting agents communicate in free-text, making it impossible to validate or route messages programmatically.
- [ ] Making agents too granular (an agent per function call) creates overhead without benefit.
- [ ] Not implementing dead agent detection â€” a crashed worker stalls the entire pipeline.
- [ ] Overloading the supervisor agent â€” it becomes the bottleneck and its context window fills with all sub-results.
- [ ] Skipping error propagation â€” when a worker fails, the system should retry, escalate, or gracefully degrade.
- [ ] Implement Timeout Per Agent Turn

---

# Testing Checklist

- [ ] Agent failures propagate correctly: retry â†’ escalate to supervisor â†’ fail gracefully.
- [ ] Agent graph is defined as config (not hardcoded) and validated for cycles.
- [ ] All inter-agent communication is logged with source, target, type, and latency.
- [ ] Each agent has a single, well-defined role documented in its system prompt.
- [ ] Every agent turn has a timeout (default â‰¤30s for LLM, shorter for tools).
- [ ] Inter-agent messages use a schema-validated JSON format.
- [ ] No two agents share overlapping tool sets unless explicitly documented.

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Tools Returning Raw Eloquent Models with Sensitive Fields]
- [ ] [Tool That Lets LLM Construct Arbitrary Queries]
- [ ] [Overly Broad Tool Description â€” LLM Uses Wrong Tool]
- [ ] [No Tool Result Size Limit]
- [ ] [Tool Accepting User Identifiers from LLM Arguments]
- [ ] Broadcast-All:
- [ ] Circular Agent Dependencies:
- [ ] Orchestrator as God Object:
- [ ] Tightly Coupled Agents:

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


