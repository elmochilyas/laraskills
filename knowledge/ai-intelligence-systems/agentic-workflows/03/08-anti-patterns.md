# ECC Anti-Patterns — Agent State & Context Management

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Agentic Workflows |
| **Knowledge Unit** | Agent State & Context Management |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Full Conversation History Sent Every Request — Context Window Overflow
2. No Sliding Window or Summarization for Long Histories
3. Storing State in Global/Session Instead of Agent Context
4. Not Pruning Tool Results from Context
5. Loading All Conversation History Synchronously

---

## Repository-Wide Anti-Patterns

- No context budget — total tokens per request unmonitored
- Context from previous unrelated conversation pollutes current request

---

## Anti-Pattern 1: Full Conversation History Every Request

### Category
Performance

### Description
Sending all prior messages on every turn — context grows until exceeding model limit.

### Preferred Alternative
Implement sliding window (last N messages) or summarization of older turns.

### Detection Checklist
- [ ] Full history sent every turn
- [ ] Context window overflow errors
- [ ] Token costs increase per turn

---

## Anti-Pattern 2: No Slack Window or Summarization

### Category
Reliability

### Description
Long conversations truncated at model limit — losing critical context from early turns.

### Preferred Alternative
Summarize old turns. Include summary + recent N messages verbatim.

### Detection Checklist
- [ ] History truncated at limit
- [ ] Agent forgets early context
- [ ] No summary mechanism
