# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** agentic-workflows
**Knowledge Unit:** queued-agent-execution
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Async/Await for AI
- [ ] Chained processing
- [ ] Error recovery
- [ ] Fire-and-forget
- [ ] Notification on completion
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Ensure Agent is Serializable
- [ ] Use ->queue() for Long-Running Agents Only
- [ ] Use Dedicated Queue Connection for AI Workloads
- [ ] `$tries` and `$timeout` configured appropriately
- [ ] `catch()` callback handles failures gracefully
- [ ] `then()` callback handles successful completion
- [ ] AI queue isolation prevents interference with other job types
- [ ] Completion callbacks notify users or trigger next workflow step
- [ ] Error callbacks handle failures with retry or graceful degradation

---

# Architecture Checklist

- [ ] Promise
- [ ] SDK
- [ ] Serialize full agent vs. re
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom

---

# Implementation Checklist

- [ ] Async/Await for AI
- [ ] Chained processing
- [ ] Error recovery
- [ ] Fire-and-forget
- [ ] Notification on completion
- [ ] Queue job for AI
- [ ] Ensure Agent is Serializable
- [ ] Use ->queue() for Long-Running Agents Only
- [ ] Use Dedicated Queue Connection for AI Workloads
- [ ] Dedicated vs shared queue
- [ ] Promise callbacks vs custom job classes
- [ ] Synchronous vs queued

---

# Performance Checklist

- [ ] Callback chaining complexity
- [ ] Callback jobs add additional queue entries â€” 2 queue jobs per agent execution (main + callback)
- [ ] Long-running agents (>30s) should use dedicated queue with `--queue=ai` for worker isolation
- [ ] Queue job serialization adds ~10-50ms depending on agent complexity
- [ ] Queue overhead
- [ ] Serialization limits
- [ ] Worker concurrency affects throughput â€” allocate sufficient queue workers for AI workload
- [ ] Callback jobs add additional queue entries â€” 2 jobs per agent execution

---

# Security Checklist

- [ ] Configure `queue.after_commit` on AI jobs â€” prevent job dispatch if transaction rolls back
- [ ] Implement job middleware for AI queue: rate limiting, retry delay, failure handling
- [ ] Log job UUID for tracing agent execution across queue and application logs
- [ ] Monitor AI queue depth and worker saturation â€” long agent execution blocks other jobs
- [ ] Set `$tries` and `$timeout` on agent execution via attributes or config
- [ ] Use dedicated queue connection for AI workloads â€” separate from email, notification queues
- [ ] Implement job middleware for AI queue: rate limiting, retry delay, failure handling

---

# Reliability Checklist

- [ ] Forgetting to start queue workers in production â€” jobs queue but never execute
- [ ] Not handling callback exceptions â€” `->catch()` is not set â†’ failures silently swallowed
- [ ] Overloading a single queue with AI + non-AI jobs â€” AI jobs block throughput for other operations
- [ ] Serializing non-serializable constructor parameters (Eloquent models with loaded relations)
- [ ] Using `queue()` for trivial agents (<2s) â€” synchronous `prompt()` is simpler for fast operations
- [ ] Ensure Agent is Serializable

---

# Testing Checklist

- [ ] `$tries` and `$timeout` configured appropriately
- [ ] `catch()` callback handles failures gracefully
- [ ] `then()` callback handles successful completion
- [ ] Agent constructor parameters are serializable (no Eloquent models with relations, no closures)
- [ ] AI queue depth monitoring in place with alerting
- [ ] AI queue isolation prevents interference with other job types
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Completion callbacks notify users or trigger next workflow step
- [ ] Core concepts are understood and applied correctly.

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Queue Without Notification â€” User Never Knows Agent Completed]
- [ ] [Synchronous poll() Instead of Webhook/Broadcast Notification]
- [ ] [Queue Timeout Too Short â€” Agent Killed Mid-Execution]
- [ ] [No Retry on Queued Agent Failure]
- [ ] [Queue Workers Not Sized for Agent Workload]
- [ ] Callback failure
- [ ] Job timeout
- [ ] Memory exhaustion
- [ ] Queue backpressure
- [ ] Serialization failure

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Log job UUID for tracing across queue and application logs
- [ ] Monitor AI queue depth and worker saturation â€” long agents block other jobs

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


