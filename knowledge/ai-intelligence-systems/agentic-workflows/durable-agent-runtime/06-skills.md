# Skill: Implement Durable Agent Workflows with Checkpointing
## Purpose
Build resilient, long-running agent workflows that survive process restarts via state checkpointing, enabling pause/resume, fork/replay, and human-in-the-loop interruptions.
## When To Use
- Long-running research workflows that iterate for hours
- Customer onboarding with multi-day approval cycles
- Compliance workflows requiring audit trails of every agent decision
- High-value transactions where crash recovery is critical
## When NOT To Use
- Simple linear chains that complete in seconds
- Stateless request-response patterns
- Prototypes where durability overhead isn't justified
## Prerequisites
- Laravel application with queue workers
- Database (PostgreSQL preferred) for checkpoint storage
- Agent or workflow definition with identifiable state boundaries
- Understanding of serialization and state management
## Inputs
- Workflow/agent definition with state schema
- Checkpoint storage configuration (DB table schema)
- Checkpoint strategy (every-node, interval, or manual)
- State TTL configuration
## Workflow (numbered)
1. Define typed state schema for what gets preserved across checkpoints
2. Choose checkpoint strategy: every-node (max durability), interval (balanced), or manual (fine-grained)
3. Implement checkpoint serialization — strip or encrypt sensitive data before persistence
4. Configure checkpoint storage (DB default for ACID guarantees, Redis for performance-critical)
5. Implement state TTL — delete checkpoints for completed/abandoned workflows after configured duration
6. Test crash recovery — simulate worker process kills at various execution points
7. Implement pause/resume for human-in-the-loop approval gates
8. Add workflow-level timeout to abandon workflows exceeding max duration
9. Log checkpoint operations (save, load, fork) for observability
## Validation Checklist
- [ ] Checkpoint strategy is defined (every-node, interval, or manual)
- [ ] Sensitive data sanitized before serialization (PII, API keys stripped)
- [ ] State TTL configured with automated cleanup
- [ ] Crash recovery tested — workflow resumes from last checkpoint after simulated crash
- [ ] Workflow-level timeout prevents infinite execution
- [ ] Checkpoint storage growth is monitored with alerting
- [ ] Fork/replay works — cloning checkpoint for what-if analysis
- [ ] State schema versioned — migrations handle checkpoint format changes
## Common Failures
- Checkpointing sensitive data (PII, API keys) in state
- Non-deterministic tool calls that break replay — cache external API responses
- Infinite checkpoint growth — conversation state accumulates without pruning
- Not testing crash recovery paths — discovered during production outage
- Over-checkpointing fast nodes — serialization overhead exceeds execution time
## Decision Points
- **Every-node vs interval vs manual**: Every-node for zero progress loss; interval for reduced overhead; manual for fine-grained control
- **DB vs Redis checkpoint storage**: DB (PostgreSQL) for ACID durability; Redis for performance with acceptable data loss
- **Full state snapshot vs event sourcing**: Full snapshot for simpler implementation and faster recovery; event sourcing for replay capability
## Performance Considerations
- Serialization overhead: 5-50ms per checkpoint (JSON) depending on state size
- State size grows with conversation history — implement pruning or summary compression
- Storage: 10K workflows x 20 steps x 10KB = ~2GB
- Recovery: load single row — <10ms typically
- Fork/replay: clone checkpoint row, create new execution ID
## Security Considerations
- Strip or encrypt sensitive data before checkpoint serialization
- Implement state TTL — delete old checkpoints to limit exposure
- Version state schemas — deploy migrations for existing checkpoints
- Log checkpoint operations for audit trail
- Checkpoint in transactions for atomicity (prevent partial state on crash)
## Related Rules (from 05-rules.md)
- Implement State TTL for Checkpoints
- Sanitize Sensitive Data Before Checkpointing
- Test Crash Recovery with Simulated Worker Kills
## Related Skills
- Design and Implement Graph-Based Workflows
- Implement Multi-Agent Patterns
- Create a Single-Responsibility Agent Class
## Success Criteria
- Workflow survives process crash and resumes from last checkpoint
- Checkpoint storage does not grow unboundedly (TTL enforced)
- Sensitive data is never stored raw in checkpoints
- Fork/replay enables debugging of complex agent decisions
- Human-in-the-loop pauses are durable across server restarts
