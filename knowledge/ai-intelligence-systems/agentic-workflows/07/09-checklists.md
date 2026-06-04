# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** agentic-workflows
**Knowledge Unit:** ku-07
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Define agents declaratively.
- [ ] Implement a consistent error taxonomy.
- [ ] Support dry-run mode.
- [ ] Use middleware in the orchestrator.
- [ ] Version agent definitions.
- [ ] Agent definitions are declarative (config or code-first) and versioned.
- [ ] Agent lifecycle events (start, turn, tool call, complete, fail) are emitted for observability.
- [ ] Agent state serialization is efficient and supports horizontal scaling.
- [ ] Define Agents Declaratively
- [ ] Emit Agent Lifecycle Events
- [ ] Implement Configurable Error Handling
- [ ] Implement Human-in-the-Loop for Sensitive Actions
- [ ] Run Agents Asynchronously via Queue

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

- [ ] Define agents declaratively.
- [ ] Implement a consistent error taxonomy.
- [ ] Support dry-run mode.
- [ ] Use middleware in the orchestrator.
- [ ] Version agent definitions.
- [ ] Define Agents Declaratively
- [ ] Emit Agent Lifecycle Events
- [ ] Implement Configurable Error Handling
- [ ] Implement Human-in-the-Loop for Sensitive Actions
- [ ] Run Agents Asynchronously via Queue

---

# Performance Checklist

- [ ] Consider **agent pre-warming**: pre-loading agent definitions, tool registries, and system prompts into cache to reduce cold start latency.
- [ ] Framework overhead is dominated by LLM inference time, not the framework itself. Optimize LLM calls, not the orchestrator loop.
- [ ] Serialization of agent state (message history, tool results) at each turn adds overhead. Use efficient serialization (JSON with short keys, or binary).
- [ ] The orchestrator should be **stateless** â€” scale horizontally by running multiple queue workers consuming agent jobs.
- [ ] Token usage tracking should be async â€” log token counts to a queue, not synchronously in the agent loop.

---

# Security Checklist

- [ ] Agent definition validation:
- [ ] Audit logging:
- [ ] HITL authorization:
- [ ] Job isolation:
- [ ] Orchestrator API protection:

---

# Reliability Checklist

- [ ] Hardcoding model names in agent definitions â€” use environment-specific config or a model registry.
- [ ] Inadequate observability â€” when an agent produces a wrong answer, no trace exists to debug.
- [ ] Not implementing agent timeout â€” an agent stuck in a loop blocks queue workers indefinitely.
- [ ] Running agents synchronously in web requests (timeout, poor UX). Always use queue jobs.
- [ ] Tight coupling between orchestrator and agent definitions â€” makes it hard to have agents with different configurations.
- [ ] Implement Configurable Error Handling

---

# Testing Checklist

- [ ] Agent definitions are declarative (config or code-first) and versioned.
- [ ] Agent lifecycle events (start, turn, tool call, complete, fail) are emitted for observability.
- [ ] Agent state serialization is efficient and supports horizontal scaling.
- [ ] Error handling is configurable: retry with backoff, escalate, or fail per error type.
- [ ] HITL integration exists for sensitive actions with role-based authorization.
- [ ] Middleware chain supports logging, rate limiting, metrics, and authorization.
- [ ] Orchestrator runs agents asynchronously (queue jobs), not in web requests.

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [No Agent Execution Logging â€” Black Box Behavior]
- [ ] [Logging Full Prompt Content Including PII]
- [ ] [No Token Usage Tracking Per Agent Call]
- [ ] [No Error Rate Alerting on Agent Failures]
- [ ] [Not Correlating Agent Calls with User Requests]
- [ ] Agent Sprawl:
- [ ] Orchestrator-as-Monolith:
- [ ] Over-Engineering:
- [ ] Untested Agent Definitions:

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


