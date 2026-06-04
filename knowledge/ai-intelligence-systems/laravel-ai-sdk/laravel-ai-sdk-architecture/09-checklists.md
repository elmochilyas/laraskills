# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** laravel-ai-sdk
**Knowledge Unit:** laravel-ai-sdk-architecture
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Agent as Controller
- [ ] Agent-as-Class pattern
- [ ] Attribute-driven configuration
- [ ] Constructor Injection for Context
- [ ] Eloquent for AI
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Include Promptable Trait on Every Agent
- [ ] Inject User Context via Constructor, Never via Prompt
- [ ] One Agent Class Per Capability
- [ ] Register Stateless Agents as Singletons
- [ ] Set MaxSteps to Prevent Runaway Loops
- [ ] `#[MaxSteps]` set on agents with tool access
- [ ] `Ai::fake()` used in all tests with `preventStrayPrompts()`
- [ ] `Promptable` trait applied to every agent
- [ ] Apply the `Promptable` trait to every agent class
- [ ] Create one agent class per distinct capability (single responsibility)
- [ ] Declare static configuration as PHP attributes: `#[Provider]`, `#[Model]`, `#[Temperature]`
- [ ] Agent classes are focused (one per capability)

---

# Architecture Checklist

- [ ] Attribute
- [ ] Bundle Prism PHP vs. write from scratch â†’ Bundled Prism as low
- [ ] Native pgvector support vs. abstract vector store interface â†’ Native pgvector with `SimilaritySearch` tool. Reason: pgvector covers 95% of Laravel RAG workloads; abstraction added later if demand justifies it
- [ ] Separate tables for conversation storage vs. generic JSON column â†’ Dedicated `agent_conversations` and `agent_conversation_messages` tables with migrations. Reason: Enables querying, pruning, and analysis of conversation data
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure provider selection via environment variables
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization

---

# Implementation Checklist

- [ ] Agent as Controller
- [ ] Agent-as-Class pattern
- [ ] Attribute-driven configuration
- [ ] Constructor Injection for Context
- [ ] Eloquent for AI
- [ ] Fake-Driven Testing
- [ ] Provider as Database Driver
- [ ] Apply the `Promptable` trait to every agent class
- [ ] Create one agent class per distinct capability (single responsibility)
- [ ] Declare static configuration as PHP attributes: `#[Provider]`, `#[Model]`, `#[Temperature]`
- [ ] Inject user context (userId, tenantId) via constructor, never via prompt
- [ ] Register stateless agents as singletons in the service container

---

# Performance Checklist

- [ ] Agent class resolution via container is cached in production (no repeated reflection)
- [ ] Conversation history grows unbounded â€” configure `agent_conversations` TTL or implement pruning
- [ ] Streaming holds PHP-FPM worker for duration â€” use dedicated worker pools for streaming endpoints
- [ ] Tool call execution is synchronous within the agent loop â€” offload slow tools to queues
- [ ] Long-running agents (>5s) must use `->queue()` or `->stream()`
- [ ] Register stateless agents as singletons to reduce resolution overhead
- [ ] Use read-only database connections in agent tools

---

# Security Checklist

- [ ] Cache embedding vectors â€” avoid regenerating for unchanged content
- [ ] Configure `AI_PROVIDER` and `AI_MODEL` env vars per environment
- [ ] Monitor `agent_conversations` table size and implement retention policies
- [ ] Publish config and migrations via `php artisan vendor:publish --provider="Laravel\Ai\AiServiceProvider"`
- [ ] Register `AiServiceProvider` in `bootstrap/providers.php`
- [ ] Set `MaxSteps` to prevent runaway agent loops (default 10, adjust per use case)
- [ ] Use `->queue()` for any agent call exceeding 5 seconds expected runtime
- [ ] Set `#[MaxSteps]` to prevent unbounded token consumption

---

# Reliability Checklist

- [ ] Forgetting to set `AI_PROVIDER` env var â€” SDK silently fails or uses wrong provider
- [ ] Not implementing `MaxSteps` â€” agent loops indefinitely on complex tool chains
- [ ] Testing without `Ai::fake()` â€” real API calls during test suite, accruing costs and flakiness
- [ ] Using `prompt()` for requests exceeding 30s â€” blocks worker; use `stream()` or `queue()`
- [ ] Using agent without `RemembersConversations` trait but expecting multi-turn persistence
- [ ] `prompt()` method not found
- [ ] Agent loops infinitely
- [ ] High latency per request
- [ ] Poor output quality
- [ ] Privilege escalation

---

# Testing Checklist

- [ ] `#[MaxSteps]` set on agents with tool access
- [ ] `Ai::fake()` used in all tests with `preventStrayPrompts()`
- [ ] `Promptable` trait applied to every agent
- [ ] Agent classes are focused (one per capability)
- [ ] All tests use `Ai::fake()` without real API calls
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Configuration is inspectable via PHP attributes
- [ ] Core concepts are understood and applied correctly.
- [ ] Long-running agents don't block PHP workers

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date
- [ ] Agent-as-Class pattern
- [ ] Attribute-driven configuration

---

# Anti-Pattern Prevention Checklist

- [ ] [Monolithic Agent Class Handling Multiple Domains]
- [ ] [Using Properties Instead of Attributes for Static Configuration]
- [ ] [Testing Without Ai::fake() â€” Real API Calls in Test Suite]
- [ ] [Using prompt() for Long-Running Requests (>5s)]
- [ ] [Not Setting MaxSteps â€” Runaway Agent Loops]
- [ ] Conversation table bloat
- [ ] Provider credential failure
- [ ] Token limit exceeded
- [ ] Tool execution timeout

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


