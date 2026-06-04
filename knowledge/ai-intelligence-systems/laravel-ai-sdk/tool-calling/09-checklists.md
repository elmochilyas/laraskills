# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** laravel-ai-sdk
**Knowledge Unit:** tool-calling
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Controlled delegation
- [ ] Function calling for LLMs
- [ ] Middleware for AI
- [ ] One Tool, One Query
- [ ] Read-Only Connections
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Avoid Overlapping Tool Descriptions
- [ ] Limit Tool Output Size
- [ ] One Tool, One Query
- [ ] Return Sensible Error Messages to the LLM
- [ ] Scope User Context via Constructor Injection
- [ ] `#[MaxSteps]` set on agent (10-50 depending on depth)
- [ ] Each tool's `handle()` unit tested independently with fixtures
- [ ] Error messages returned to LLM (not exceptions thrown) for recoverable errors
- [ ] Create one `Tool` class per specific query or action
- [ ] Define `handle($input)` method with scoped, bounded behavior
- [ ] Define `jsonSchema()` with name, description, and parameter schema
- [ ] Agent completes within `#[MaxSteps]` limit

---

# Architecture Checklist

- [ ] Automatic tool execution vs. manual approval â†’ Automatic with configurable `MaxSteps`. Reason: Most use cases don't need human
- [ ] Tool as PHP class vs. invokable â†’ Dedicated class per tool. Reason: Schema definition, DI support, testability, documentation via method signatures
- [ ] Tool results as conversation messages vs. transient â†’ Results appended to conversation history. Reason: LLM needs tool output for subsequent reasoning; context
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom

---

# Implementation Checklist

- [ ] Controlled delegation
- [ ] Function calling for LLMs
- [ ] Middleware for AI
- [ ] One Tool, One Query
- [ ] Read-Only Connections
- [ ] Result Limiting
- [ ] Scoped Tools via Constructor
- [ ] SimilaritySearch Tool
- [ ] Create one `Tool` class per specific query or action
- [ ] Define `handle($input)` method with scoped, bounded behavior
- [ ] Define `jsonSchema()` with name, description, and parameter schema
- [ ] Implement tools on the agent via `tools()` method returning `Tool` instances

---

# Performance Checklist

- [ ] `MaxSteps` default 10 â€” adjust per agent based on expected tool chain length
- [ ] Automatic execution vs. security
- [ ] Each tool call adds full result to context â€” token consumption grows linearly with steps
- [ ] Schema validation overhead is negligible (<1ms) per tool call
- [ ] Slow tools (HTTP calls, large DB queries) block the agent loop â€” offload to queue, return pending status
- [ ] Synchronous tools vs. queued
- [ ] Tool results in context vs. truncated
- [ ] Use read-only database connections in query tools (defense in depth)

---

# Security Checklist

- [ ] Always scope tools to the authenticated user via constructor â€” never trust LLM-provided user identifiers
- [ ] Implement rate limiting on tool execution per session
- [ ] Log all tool invocations with inputs and outputs â€” audit trail for security and debugging
- [ ] Set `MaxSteps` appropriate to the workflow â€” too low interrupts valid multi-step reasoning
- [ ] Set database-level read-only roles for query tools
- [ ] Test tools independently from the LLM â€” unit test `handle()` with fixture inputs
- [ ] Never accept user identifiers as LLM-provided arguments (prompt injection risk)
- [ ] Set `#[MaxSteps]` to prevent unbounded token consumption

---

# Reliability Checklist

- [ ] No `MaxSteps` limit â€” agent loops indefinitely on complex requests
- [ ] Not limiting result set size â€” massive output blows context window and token budget
- [ ] Passing `$userId` from prompt instead of constructor â€” vulnerable to prompt injection
- [ ] Registering tools that the LLM can't correctly choose (overlapping descriptions) â€” causes hallucinated tool calls
- [ ] Returning entire Eloquent models as tool output â€” serializes all attributes, including sensitive ones
- [ ] Agent can't recover
- [ ] Agent loops infinitely
- [ ] Context-window overflow
- [ ] Cross-user data access
- [ ] SQL injection via tool

---

# Testing Checklist

- [ ] `#[MaxSteps]` set on agent (10-50 depending on depth)
- [ ] Agent completes within `#[MaxSteps]` limit
- [ ] All tools have independent unit tests with fixture inputs
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Each tool's `handle()` unit tested independently with fixtures
- [ ] Error messages returned to LLM (not exceptions thrown) for recoverable errors
- [ ] Errors are returned to LLM for self-correction
- [ ] One tool per specific query (no generic query-builder tools)

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Passing User ID as Tool Argument (Prompt Injection Vector)]
- [ ] [Returning Entire Eloquent Model as Tool Output]
- [ ] [No Result Set Size Limiting â€” Context Window Overflow]
- [ ] [Overlapping Tool Descriptions â€” LLM Hallucinates Wrong Tool]
- [ ] [No MaxSteps Limit â€” Runaway Tool Chain]
- [ ] Runaway tool chain
- [ ] Schema mismatch
- [ ] Tool argument injection
- [ ] Tool not found
- [ ] Tool timeout

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Log all tool invocations for audit trail

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


