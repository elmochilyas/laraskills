# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** agentic-workflows
**Knowledge Unit:** ku-01
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Implement idempotency keys
- [ ] Keep system prompts concise.
- [ ] Log the full message history
- [ ] Set iteration limits.
- [ ] Validate tool schemas rigorously.
- [ ] Agent loop has a configurable max iteration limit (default â‰¤15).
- [ ] Agent orchestration is separated from business logic (no tool implementations inside the loop).
- [ ] Every tool call has an idempotency key or the mutation is safe to replay.
- [ ] Always Set Max Iteration Limit
- [ ] Implement Idempotency Keys for Side-Effect Tools
- [ ] Keep System Prompts Concise
- [ ] Log Full Message History for Debugging
- [ ] Return Structured Error Messages to the LLM
- [ ] Agent loop has configurable max iteration limit (default â‰¤15)
- [ ] Agent orchestration separated from business logic
- [ ] Full message history logged per iteration
- [ ] Agent completes tasks within configured iteration limit
- [ ] Full message history logged enables debugging and replay
- [ ] Side-effect idempotency prevents duplicate operations

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

- [ ] Implement idempotency keys
- [ ] Keep system prompts concise.
- [ ] Log the full message history
- [ ] Set iteration limits.
- [ ] Validate tool schemas rigorously.
- [ ] Always Set Max Iteration Limit
- [ ] Implement Idempotency Keys for Side-Effect Tools
- [ ] Keep System Prompts Concise
- [ ] Log Full Message History for Debugging
- [ ] Return Structured Error Messages to the LLM
- [ ] Separate Orchestration from Business Logic
- [ ] Validate Tool Call Arguments Server-Side

---

# Performance Checklist

- [ ] Cache tool results where possible. If a tool reads data that hasn't changed, return cached value.
- [ ] Each agent iteration adds 300-1500ms latency (LLM inference time). Total latency = iterations Ã— per-call latency.
- [ ] Implement **early stop detection**: if two consecutive responses are identical (no tool calls), break the loop.
- [ ] Token consumption grows linearly with iterations (input: all prior messages; output: tool call + final answer).
- [ ] Use **streaming** for the final answer to give users perceptible progress during the last iteration.
- [ ] Cache tool results where possible for read-only tools
- [ ] Each iteration adds 300-1500ms latency (LLM inference time)

---

# Security Checklist

- [ ] Data leakage:
- [ ] Output sanitization:
- [ ] Prompt injection:
- [ ] Rate limiting:
- [ ] Tool authorization:
- [ ] Agent message history may contain sensitive data â€” encrypt at rest, redact PII in logs
- [ ] Apply rate limits at tool-execution layer
- [ ] Every tool call must verify authorization â€” never trust LLM's choice alone

---

# Reliability Checklist

- [ ] Forgetting to trim message history when approaching context limits, causing truncation errors.
- [ ] Mixing agent orchestration code with business logic, making it impossible to swap models or tool registries.
- [ ] Not setting a max iteration limit, leading to runaway costs.
- [ ] Over-trusting the LLM's JSON output â€” always validate tool call JSON against the schema before dispatch.
- [ ] Storing the full raw LLM response without validation, allowing malformed tool calls to crash the loop.
- [ ] Always Set Max Iteration Limit
- [ ] Return Structured Error Messages to the LLM

---

# Testing Checklist

- [ ] Agent completes tasks within configured iteration limit
- [ ] Agent loop has a configurable max iteration limit (default â‰¤15).
- [ ] Agent loop has configurable max iteration limit (default â‰¤15)
- [ ] Agent orchestration is separated from business logic (no tool implementations inside the loop).
- [ ] Agent orchestration separated from business logic
- [ ] Every tool call has an idempotency key or the mutation is safe to replay.
- [ ] Full message history logged enables debugging and replay
- [ ] Full message history logged per iteration
- [ ] Message history is logged for every iteration in structured format.
- [ ] Side-effect idempotency prevents duplicate operations

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Vague Instructions â€” LLM Guesses Intent]
- [ ] [Instructions Contradicting Each Other]
- [ ] [Instructions Mixed with Conversation Context]
- [ ] [No Output Format Specification]
- [ ] [Instructions Longer Than Model Context Window]
- [ ] Black Box Agent:
- [ ] God Agent:
- [ ] Hardcoded Tool Logic:
- [ ] Re-entrant Loops:

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Agent message history may contain sensitive data â€” encrypt at rest, redact PII in logs

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


