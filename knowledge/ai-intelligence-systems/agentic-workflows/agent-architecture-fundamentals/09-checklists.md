# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** agentic-workflows
**Knowledge Unit:** agent-architecture-fundamentals
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Agent as Component
- [ ] Agent as Controller
- [ ] Agent as Service Class
- [ ] Agent composition
- [ ] Attribute-driven configuration
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Include Promptable Trait
- [ ] One Agent, One Responsibility
- [ ] Register Agents as Singletons When Stateless
- [ ] Test Agents Using Ai::fake()
- [ ] Use Attributes for Configuration, Methods for Behavior
- [ ] `Ai::fake()` called in every test that invokes AI
- [ ] `preventStrayPrompts()` active (ideally in base TestCase)
- [ ] `Promptable` trait is applied
- [ ] Adding a new capability requires creating a new agent class, not modifying existing ones
- [ ] Agent can be used via `prompt()`, `stream()`, or `queue()` interchangeably
- [ ] Agent produces focused, high-quality output for its domain

---

# Architecture Checklist

- [ ] Attributes vs. methods for configuration â†’ Attributes for static config (provider, model), methods for dynamic config (instructions, tools, schema). Reason: Static analysis support, readability, separation of concerns
- [ ] Class
- [ ] Fluent prompt interface vs. constructor parameters â†’ `prompt($input)` accepts string input; context via constructor. Reason: Clean API design â€” what changes per call vs. what's fixed per agent
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom

---

# Implementation Checklist

- [ ] Agent as Component
- [ ] Agent as Controller
- [ ] Agent as Service Class
- [ ] Agent composition
- [ ] Attribute-driven configuration
- [ ] Constructor injection for context
- [ ] Single-responsibility agents
- [ ] Include Promptable Trait
- [ ] One Agent, One Responsibility
- [ ] Register Agents as Singletons When Stateless
- [ ] Test Agents Using Ai::fake()
- [ ] Use Attributes for Configuration, Methods for Behavior

---

# Performance Checklist

- [ ] `MaxSteps` attribute limits iterations â€” prevents runaway token consumption
- [ ] Agent class resolution via container â€” cached in production
- [ ] Conversation history loading â€” for long histories, consider summarization or sliding window
- [ ] Tool execution â€” synchronous tools block agent loop; queue long-running tools
- [ ] Agent class resolution via container â€” cached in production
- [ ] Conversation history loading â€” consider summarization or sliding window for long histories
- [ ] Fake responses are instant â€” no network latency
- [ ] Tool execution â€” synchronous tools block agent loop; queue long-running tools

---

# Security Checklist

- [ ] Configure `AI_PROVIDER` per environment â€” Ollama in dev, Anthropic in production
- [ ] Log agent execution for observability and debugging
- [ ] Monitor conversation table size â€” implement pruning jobs
- [ ] Register agents as singletons in container if stateless (no constructor parameters)
- [ ] Test with `Ai::fake()` and `preventStrayPrompts()` â€” catch unintended API calls in test suite
- [ ] `MaxSteps` attribute limits iterations â€” prevents runaway token consumption
- [ ] Avoid committing API keys to CI â€” fakes eliminate the need for provider credentials in CI
- [ ] No rate limits, no cost, no flakiness from network failures

---

# Reliability Checklist

- [ ] Creating monolithic agents handling multiple domains â€” violates single responsibility, degrades output quality
- [ ] Forgetting `Promptable` trait â€” prompts, stream, queue methods won't be available
- [ ] Not using `MaxSteps` â€” agent loops indefinitely on complex tool chains
- [ ] Passing mutable state via constructor â€” agent lifetime may be longer than expected
- [ ] Testing without fakes â€” real API calls in CI, accruing costs and flaky tests

---

# Testing Checklist

- [ ] `Ai::fake()` called in every test that invokes AI
- [ ] `preventStrayPrompts()` active (ideally in base TestCase)
- [ ] `Promptable` trait is applied
- [ ] Adding a new capability requires creating a new agent class, not modifying existing ones
- [ ] Agent can be used via `prompt()`, `stream()`, or `queue()` interchangeably
- [ ] Agent follows single-responsibility (one domain, one purpose)
- [ ] Agent produces focused, high-quality output for its domain
- [ ] Agent tested with `Ai::fake()` â€” no real API calls in unit tests
- [ ] All AI feature tests run deterministically without network calls
- [ ] Architecture guidelines are implemented.

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date
- [ ] Agent as Service Class
- [ ] Attribute-driven configuration

---

# Anti-Pattern Prevention Checklist

- [ ] [Monolithic Agent Handling Multiple Domains]
- [ ] [No MaxSteps â€” Agent Loops Indefinitely]
- [ ] [Passing Mutable State via Constructor]
- [ ] [Forgetting Promptable Trait]
- [ ] [Testing Without Ai::fake() â€” Real API Calls]
- [ ] Agent loop
- [ ] Context window overflow
- [ ] Provider timeout
- [ ] Tool exception

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Monitor conversation table size â€” implement pruning jobs

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


