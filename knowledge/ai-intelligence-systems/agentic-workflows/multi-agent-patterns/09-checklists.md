# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** agentic-workflows
**Knowledge Unit:** multi-agent-patterns
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Microservices for AI
- [ ] Orchestrator checklist
- [ ] Orchestrator pattern
- [ ] Parallel aggregation
- [ ] Pipeline pattern
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Implement Quality Gates Between Chain Steps
- [ ] Start with a Single Agent Before Multi-Agent
- [ ] Timebox Each Agent Step
- [ ] Use Structured Output for Inter-Agent Communication
- [ ] Each agent has tuned `#[MaxTokens]` and `#[MaxSteps]`
- [ ] Error handling prevents cascade failures
- [ ] Inter-agent communication uses structured output, not raw text
- [ ] Cost and latency are within acceptable bounds for the use case
- [ ] Inter-agent communication is typed, validated, and debuggable
- [ ] Multi-agent workflow solves tasks a single agent cannot handle effectively

---

# Architecture Checklist

- [ ] Application
- [ ] Structured output for handoff vs. raw text â†’ Agents use `HasStructuredOutput` for inter
- [ ] Synchronous vs. parallel execution â†’ Pattern
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure provider selection via environment variables
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization
- [ ] Implement auto-scaling and queue-based processing for peak loads

---

# Implementation Checklist

- [ ] Microservices for AI
- [ ] Orchestrator checklist
- [ ] Orchestrator pattern
- [ ] Parallel aggregation
- [ ] Pipeline pattern
- [ ] Quality gates
- [ ] Route caching
- [ ] Router pattern
- [ ] Sub-agent factory
- [ ] Implement Quality Gates Between Chain Steps
- [ ] Start with a Single Agent Before Multi-Agent
- [ ] Timebox Each Agent Step

---

# Performance Checklist

- [ ] Context windows compound â€” each agent in a chain sees accumulated context from prior agents
- [ ] Each agent call costs tokens â€” multi-agent workflows cost 2-10x single agent
- [ ] Orchestrator coordination overhead: 1-3 additional LLM calls for planning and synthesis
- [ ] Parallel fan-out: total latency = max of individual latencies, but token cost multiplies
- [ ] Sequential chains: total latency = sum of individual agent latencies
- [ ] Parallel fan-out: total latency = max of individual latencies, but token cost multiplies
- [ ] Sequential chains: total latency = sum of individual agent latencies

---

# Security Checklist

- [ ] Implement circuit breakers per agent â€” one agent's failure shouldn't cascade
- [ ] Log inter-agent messages â€” critical for debugging multi-step failures
- [ ] Profile token usage per agent â€” identify cost outliers
- [ ] Start with a single agent â€” only add multi-agent complexity when justified
- [ ] Timebox each agent step â€” slow agents block the entire workflow
- [ ] Use structured output for agent handoffs â€” typed contracts prevent cascading errors
- [ ] Each agent call costs tokens â€” multi-agent costs 2-10x single agent
- [ ] Parallel fan-out: total latency = max of individual latencies, but token cost multiplies

---

# Reliability Checklist

- [ ] Agents with overlapping responsibilities (tool selection ambiguity)
- [ ] Ignoring cascading failures (one agent's bad output poisons downstream agents)
- [ ] Multi-agent before single-agent is validated (premature decomposition)
- [ ] No structured output between agents (raw text handoff causes misinterpretation)
- [ ] Overloading the orchestrator (giving it too many decisions reduces quality)

---

# Testing Checklist

- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Cost and latency are within acceptable bounds for the use case
- [ ] Each agent has tuned `#[MaxTokens]` and `#[MaxSteps]`
- [ ] Error handling prevents cascade failures
- [ ] Inter-agent communication is typed, validated, and debuggable
- [ ] Inter-agent communication uses structured output, not raw text
- [ ] Inter-agent messages logged for debugging
- [ ] Multi-agent workflow solves tasks a single agent cannot handle effectively

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date
- [ ] Microservices for AI
- [ ] Orchestrator pattern
- [ ] Pipeline pattern

---

# Anti-Pattern Prevention Checklist

- [ ] [Over-engineering â€” Multi-Agent Where Single Agent Suffices]
- [ ] [Raw Text Handoff Between Agents Instead of Structured Output]
- [ ] [No Quality Gates Between Chain Steps]
- [ ] [Orchestrator Mixing Planning and Execution Responsibilities]
- [ ] [No Route Caching for Classifier Agent]
- [ ] Cascade failure
- [ ] Context explosion
- [ ] Cost explosion
- [ ] Deadlock
- [ ] Orchestrator decision fatigue

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Log inter-agent messages critical for debugging multi-step failures

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


