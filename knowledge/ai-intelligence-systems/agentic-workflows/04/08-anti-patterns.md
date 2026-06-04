# ECC Anti-Patterns — Agent Memory Strategies

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Agentic Workflows |
| **Knowledge Unit** | Agent Memory Strategies |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. DB-Backed Memory for Ephemeral Stateless Agents — Unnecessary Migrations
2. No Memory for Multi-Turn Agents
3. Memory Without TTL — Unbounded Growth
4. Cross-Tenant Memory Leak — Wrong Scope
5. Relying on LLM Context Window as Only Memory

---

## Repository-Wide Anti-Patterns

- Memory storage not aligned with agent lifecycle
- No memory eviction strategy for long-running agents

---

## Anti-Pattern 1: DB-Backed Memory for Stateless Agents

### Category
Performance

### Description
Using `RemembersConversations` for agents that only handle single-turn requests — unnecessary DB writes and migrations.

### Preferred Alternative
Use DB-backed memory only for multi-turn agents. Stateless agents use no memory trait.

### Detection Checklist
- [ ] RemembersConversations on single-turn agent
- [ ] Unnecessary DB writes per request
- [ ] Migration overhead for stateless use case

---

## Anti-Pattern 2: No Memory for Multi-Turn Agents

### Category
Reliability

### Description
Multi-turn agent without any memory mechanism — user must repeat context every turn.

### Preferred Alternative
Apply appropriate memory strategy: `RemembersConversations`, session-scoped context, or summary-based memory.

### Detection Checklist
- [ ] Agent expected to remember across turns
- [ ] Context lost between prompts
- [ ] No memory trait applied
