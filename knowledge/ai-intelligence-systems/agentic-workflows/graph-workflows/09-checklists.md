# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** agentic-workflows
**Knowledge Unit:** graph-workflows
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Approval gate
- [ ] Conditional branching
- [ ] Directed acyclic graph (DAG) for AI workflows
- [ ] Error subgraph
- [ ] Finite state machine
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Define Catch-All Edges for Conditional Branches
- [ ] Set Max Iteration Guards on All Loops
- [ ] Test All Graph Branches Exhaustively
- [ ] Use Graph Workflows Only When Necessary
- [ ] All graph branches tested exhaustively (not just happy path)
- [ ] All loops have max iteration guards
- [ ] Checkpoint strategy configured (every-node recommended for production)
- [ ] All conditional branches have defined transitions (no stuck workflows)
- [ ] Complex multi-step workflows execute reliably with proper error handling
- [ ] Graph visualization aids debugging and team communication

---

# Architecture Checklist

- [ ] Explicit graph vs. implicit (code
- [ ] State schema vs. free
- [ ] Synchronous vs. async execution â†’ Both supported. Synchronous for predictable flows; async for long
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom

---

# Implementation Checklist

- [ ] Approval gate
- [ ] Conditional branching
- [ ] Directed acyclic graph (DAG) for AI workflows
- [ ] Error subgraph
- [ ] Finite state machine
- [ ] Loop with guard
- [ ] Parallel fan-out
- [ ] Sequential pipeline
- [ ] State machine for AI
- [ ] Define Catch-All Edges for Conditional Branches
- [ ] Set Max Iteration Guards on All Loops
- [ ] Test All Graph Branches Exhaustively

---

# Performance Checklist

- [ ] Checkpoint serialization adds latency per node boundary â€” batch checkpoint every N nodes for high-throughput workflows
- [ ] Graph compilation is done once per workflow definition â€” cache compiled graph
- [ ] Parallel fan-out execution bounded by queue worker concurrency
- [ ] State object size grows as workflow progresses â€” prune unnecessary state before checkpointing
- [ ] Checkpoint serialization adds latency per node boundary â€” batch checkpoint for high-throughput workflows
- [ ] Graph compilation done once per workflow definition â€” cache compiled graph
- [ ] Implement dead letter queues for failed workflows
- [ ] Parallel fan-out bounded by queue worker concurrency

---

# Security Checklist

- [ ] Define max execution time per workflow â€” prevent runaway graph traversal
- [ ] Human-in-the-loop requires webhook/API â€” implement timeout for approval waiting
- [ ] Implement dead letter queues for failed workflows â€” inspect and retry
- [ ] Monitor checkpoint storage size â€” growing state objects indicate missing cleanup
- [ ] Test graph edges exhaustively â€” conditional branches are common failure points
- [ ] Version graph definitions â€” breaking changes to state schema require migration

---

# Reliability Checklist

- [ ] Conditional edges that don't cover all cases â€” workflow gets stuck
- [ ] Ignoring state schema evolution â€” changing state object breaks existing checkpoints
- [ ] Not defining max iterations on loops â€” infinite loops consume tokens indefinitely
- [ ] Parallel nodes with shared mutable state â€” race conditions in state updates
- [ ] Using graph workflows when a simple chain would suffice (over-engineering)

---

# Testing Checklist

- [ ] All conditional branches have defined transitions (no stuck workflows)
- [ ] All graph branches tested exhaustively (not just happy path)
- [ ] All loops have max iteration guards
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Checkpoint strategy configured (every-node recommended for production)
- [ ] Complex multi-step workflows execute reliably with proper error handling
- [ ] Core concepts are understood and applied correctly.
- [ ] Error subgraph or error handling exists for node failures
- [ ] Every conditional branch has a catch-all/default edge

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Linear Chain Using Graph Framework (Over-engineering)]
- [ ] [Cyclic Graph Without Loop Detection]
- [ ] [All Nodes on Single Provider â€” No Provider Diversity]
- [ ] [No Error Handling Per Graph Node]
- [ ] [Graph State Not Persisted for Resumption]
- [ ] Checkpoint corruption
- [ ] Deadlock
- [ ] Human-in-the-loop timeout
- [ ] Resource leak
- [ ] Stuck workflow

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Monitor checkpoint storage size â€” growing state objects indicate missing cleanup

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


