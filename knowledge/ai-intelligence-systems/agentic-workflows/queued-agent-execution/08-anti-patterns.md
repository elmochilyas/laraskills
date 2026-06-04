# ECC Anti-Patterns — Queued Agent Execution

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Agentic Workflows |
| **Knowledge Unit** | Queued Agent Execution |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Queue Without Notification — User Never Knows Agent Completed
2. Synchronous poll() Instead of Webhook/Broadcast Notification
3. Queue Timeout Too Short — Agent Killed Mid-Execution
4. No Retry on Queued Agent Failure
5. Queue Workers Not Sized for Agent Workload

---

## Repository-Wide Anti-Patterns

- Queued agents not uniquely identifiable — can't correlate results
- Queue job payload too large (serialized agent with full history)

---

## Anti-Pattern 1: Queue Without Notification

### Category
UX

### Description
Agent dispatched via `->queue()` but user has no way to know when it completes.

### Preferred Alternative
Implement notification (broadcast event, email, webhook) when queued agent finishes.

### Detection Checklist
- [ ] queue() without notification
- [ ] User must guess when done
- [ ] Polling workaround

---

## Anti-Pattern 2: Queue Timeout Too Short

### Category
Reliability

### Description
Queue job timeout (default 60s) shorter than agent execution time — agent killed mid-response.

### Preferred Alternative
Set queue timeout appropriate to expected agent execution time. Monitor for timeouts.

### Detection Checklist
- [ ] Agent timeout > queue timeout
- [ ] Jobs killed mid-execution
- [ ] No timeout monitoring
