# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** agentic-workflows
**Knowledge Unit:** specialized-agent-frameworks
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Chain composition
- [ ] LangChain for PHP
- [ ] Microservice architecture for AI
- [ ] Middleware pipeline
- [ ] Planner-executor
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Default to Laravel AI SDK Before Adding Community Frameworks
- [ ] Test Framework-Integrated Agents with Ai::fake()
- [ ] Use One Agent Framework per Application
- [ ] Framework choice documented with rationale
- [ ] Framework pinned to exact minor version
- [ ] Framework works with `Ai::fake()` (tested in CI)
- [ ] Framework choice documented with migration path to SDK when applicable
- [ ] Framework fills a verified gap not covered by laravel/ai SDK
- [ ] Framework tests pass with `Ai::fake()` in CI

---

# Architecture Checklist

- [ ] LangChain semantics (LarAgent) vs. Laravel
- [ ] Standalone vs. SDK
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization

---

# Implementation Checklist

- [ ] Chain composition
- [ ] LangChain for PHP
- [ ] Microservice architecture for AI
- [ ] Middleware pipeline
- [ ] Planner-executor
- [ ] Team-based agents
- [ ] Default to Laravel AI SDK Before Adding Community Frameworks
- [ ] Test Framework-Integrated Agents with Ai::fake()
- [ ] Use One Agent Framework per Application
- [ ] Build vs buy
- [ ] LangChain semantics vs Laravel-native vs focused
- [ ] Standalone vs SDK-integrated

---

# Performance Checklist

- [ ] AgentGraph checkpointing adds serialization cost per node
- [ ] Conductor middleware chain adds per-node overhead â€” keep middleware count low
- [ ] LarAgent's planner adds preprocessing step â€” increases latency but reduces wasted tool calls
- [ ] SuperAgent's team manager adds orchestration overhead (~1-2 additional LLM calls per task)
- [ ] Conductor middleware chain adds per-node overhead â€” keep middleware count low
- [ ] LarAgent planner adds preprocessing step â€” increases latency but reduces wasted tool calls

---

# Security Checklist

- [ ] Consider migration path â€” these packages may be absorbed into the SDK over time
- [ ] Document framework choice in team wiki â€” ensure consistent pattern usage
- [ ] Evaluate whether the Laravel AI SDK's built-in agent features cover your needs before adding a framework
- [ ] Monitor package maintenance â€” community packages may lag behind Laravel releases
- [ ] Test with `Ai::fake()` â€” verify these packages work with Laravel's testing fakes

---

# Reliability Checklist

- [ ] Assuming frameworks are compatible with each other or with Laravel AI SDK's agent system
- [ ] Installing multiple frameworks that overlap â€” use one agent framework per application
- [ ] Not testing framework-specific features (e.g., SuperAgent's team billing)
- [ ] Using a framework for simple agents (over-engineering)

---

# Testing Checklist

- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Framework choice documented with migration path to SDK when applicable
- [ ] Framework choice documented with rationale
- [ ] Framework fills a verified gap not covered by laravel/ai SDK
- [ ] Framework pinned to exact minor version
- [ ] Framework tests pass with `Ai::fake()` in CI
- [ ] Framework works with `Ai::fake()` (tested in CI)
- [ ] Migration path to SDK documented for when SDK catches up

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date
- [ ] Microservice architecture for AI

---

# Anti-Pattern Prevention Checklist

- [ ] [Vendor Lock-in â€” Using Framework-Specific Abstractions Instead of Laravel AI SDK]
- [ ] [Mixing Multiple Agent Frameworks in Same Codebase]
- [ ] [Framework Without Fake/Test Support â€” Tests Call Real APIs]
- [ ] [Custom Framework When Laravel AI SDK Meets Needs]
- [ ] [No Fallback Between Frameworks â€” Single Point of Failure]
- [ ] Feature overlap conflict
- [ ] Framework deprecation
- [ ] Incompatibility with Laravel version
- [ ] Performance overhead

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Monitor package maintenance â€” community packages may lag behind Laravel releases

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


