# ECC Anti-Patterns — Durable Agent Runtime

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Agentic Workflows |
| **Knowledge Unit** | Durable Agent Runtime |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Long-Running Agent Without Queue — Blocks Worker
2. No State Persistence Between Agent Resumptions
3. No Timeout on Agent Execution
4. Tools Without Timeout in Durable Runtime
5. No Retry Policy for Transient Failures

---

## Repository-Wide Anti-Patterns

- Worker pool not sized for agent workloads
- Agent state stored in memory between resumptions

---

## Anti-Pattern 1: Long-Running Agent Without Queue

### Category
Performance

### Description
Durable agent workflow executed synchronously with `prompt()` — blocks PHP worker for minutes.

### Preferred Alternative
Use `->queue()` for durable agent execution. Configure appropriate queue worker pool.

### Detection Checklist
- [ ] prompt() for long-running agent
- [ ] Worker blocked for >30s
- [ ] Queue not used

---

## Anti-Pattern 2: No State Persistence Between Resumptions

### Category
Reliability

### Description
Durable agent loses state on worker restart or failure — must restart from beginning.

### Preferred Alternative
Persist agent state (step number, partial results, context) in database or cache.

### Detection Checklist
- [ ] State lost on restart
- [ ] Agent restarts from scratch on failure
- [ ] No checkpoint mechanism
