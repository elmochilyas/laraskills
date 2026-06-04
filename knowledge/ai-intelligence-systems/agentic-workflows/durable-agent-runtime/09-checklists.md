# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** agentic-workflows
**Knowledge Unit:** durable-agent-runtime
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Database transaction log for AI
- [ ] Deterministic replay
- [ ] Every-node checkpoint
- [ ] Interval checkpoint
- [ ] Laravel queue with replay
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Implement State TTL for Checkpoints
- [ ] Sanitize Sensitive Data Before Checkpointing
- [ ] Test Crash Recovery with Simulated Worker Kills
- [ ] Checkpoint storage growth is monitored with alerting
- [ ] Checkpoint strategy is defined (every-node, interval, or manual)
- [ ] Crash recovery tested â€” workflow resumes from last checkpoint after simulated crash
- [ ] Checkpoint storage does not grow unboundedly (TTL enforced)
- [ ] Fork/replay enables debugging of complex agent decisions
- [ ] Human-in-the-loop pauses are durable across server restarts

---

# Architecture Checklist

- [ ] DB persistence vs. Redis â†’ DB default (PostgreSQL). Reason: ACID, joins, no data loss. Redis for performance
- [ ] Deterministic vs. flexible node execution â†’ Flexible (nodes can be non
- [ ] Full state serialization vs. event sourcing â†’ Full state snapshot. Reason: Simpler implementation, faster recovery (no event replay). Tradeoff: Larger storage per checkpoint, potential data duplication
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure provider selection via environment variables
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization
- [ ] Implement auto-scaling and queue-based processing for peak loads

---

# Implementation Checklist

- [ ] Database transaction log for AI
- [ ] Deterministic replay
- [ ] Every-node checkpoint
- [ ] Interval checkpoint
- [ ] Laravel queue with replay
- [ ] Manual checkpoint
- [ ] Video game save point
- [ ] Implement State TTL for Checkpoints
- [ ] Sanitize Sensitive Data Before Checkpointing
- [ ] Test Crash Recovery with Simulated Worker Kills
- [ ] DB vs Redis checkpoint storage
- [ ] Every-node vs interval vs manual

---

# Performance Checklist

- [ ] Fork/replay: clone checkpoint row, create new execution ID
- [ ] Recovery: load single row â€” <10ms typically
- [ ] Serialization overhead: 5-50ms per checkpoint (JSON) depending on state size
- [ ] State size: grows with conversation history â€” implement pruning or summary compression
- [ ] Storage: 10,000 workflows Ã— 20 steps Ã— 10KB = ~2GB â€” manageable but requires monitoring
- [ ] Recovery: load single row â€” <10ms typically
- [ ] Serialization overhead: 5-50ms per checkpoint (JSON) depending on state size

---

# Security Checklist

- [ ] Implement state TTL â€” workflows that completed or abandoned longer than X days, delete checkpoints
- [ ] Implement workflow-level timeout â€” abandon workflows exceeding max duration
- [ ] Log checkpoint operations (save, load, fork) for observability
- [ ] Monitor checkpoint storage growth â€” alert on per-workflow state size anomalies
- [ ] Test crash recovery â€” simulate worker kill, verify resume
- [ ] Version state schemas â€” deploy schema migrations for existing checkpoints
- [ ] Strip or encrypt sensitive data before checkpoint serialization

---

# Reliability Checklist

- [ ] Checkpointing sensitive data (PII, API keys) in state â€” always implement state sanitization before serialization
- [ ] Infinite checkpoint growth â€” conversation state accumulates every step without pruning
- [ ] Non-deterministic tool calls that break replay â€” cache external API responses in state
- [ ] Not testing crash recovery paths â€” discover broken resume during production outage
- [ ] Over-checkpointing fast nodes â€” serialization overhead > execution time for trivial operations

---

# Testing Checklist

- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Checkpoint storage does not grow unboundedly (TTL enforced)
- [ ] Checkpoint storage growth is monitored with alerting
- [ ] Checkpoint strategy is defined (every-node, interval, or manual)
- [ ] Core concepts are understood and applied correctly.
- [ ] Crash recovery tested â€” workflow resumes from last checkpoint after simulated crash
- [ ] Fork/replay enables debugging of complex agent decisions
- [ ] Fork/replay works â€” cloning checkpoint for what-if analysis
- [ ] Human-in-the-loop pauses are durable across server restarts

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Long-Running Agent Without Queue â€” Blocks Worker]
- [ ] [No State Persistence Between Agent Resumptions]
- [ ] [No Timeout on Agent Execution]
- [ ] [Tools Without Timeout in Durable Runtime]
- [ ] [No Retry Policy for Transient Failures]
- [ ] Checkpoint corruption
- [ ] Fork explosion
- [ ] Inconsistent state
- [ ] Recovery loop
- [ ] Storage exhaustion

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Log checkpoint operations for audit trail
- [ ] Recovery: load single row â€” <10ms typically
- [ ] Version state schemas â€” deploy migrations for existing checkpoints

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


