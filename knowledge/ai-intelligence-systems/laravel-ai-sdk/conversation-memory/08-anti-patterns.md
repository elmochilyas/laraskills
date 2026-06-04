# ECC Anti-Patterns — Conversation Memory

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Laravel AI SDK |
| **Knowledge Unit** | Conversation Memory |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Using Agent Without RemembersConversations Trait Expecting Multi-Turn Persistence
2. No Conversation Pruning — Unbounded History Growth
3. Storing Full Conversation History in a Single JSON Column
4. Not Scoping Conversations by User/Session
5. Relying on Conversation Memory for Large Context Beyond Model Limits

---

## Repository-Wide Anti-Patterns

- Conversation table bloat — no TTL or archiving on `agent_conversations` and `agent_conversation_messages`
- Cross-session context leakage from insufficient scoping

---

## Anti-Pattern 1: Using Agent Without RemembersConversations Trait Expecting Multi-Turn Persistence

### Category
Reliability

### Description
Agent class without `RemembersConversations` trait — every `prompt()` call starts a fresh conversation, losing context across turns.

### Why It Happens
Developers assume conversation persistence is automatic, not realizing the trait must be explicitly applied.

### Warning Signs
- Second prompt in same session doesn't remember first prompt
- Agent behaves like a new instance on every call
- Missing `use RemembersConversations;` in agent class

### Why It Is Harmful
Without the trait, the agent has no mechanism to persist or retrieve conversation history. Each `prompt()` call sends only the current user input to the LLM, with no prior context. The agent appears amnesiac — users must repeat information, the agent cannot reference previous answers, and multi-step workflows fail. This degrades user trust and requires workarounds like manual message injection.

### Preferred Alternative
Always apply `use RemembersConversations;` to agents that need multi-turn persistence. Pass a conversation ID for resumption.

### Detection Checklist
- [ ] Agent without RemembersConversations
- [ ] Context lost between prompts
- [ ] Manual message history tracking

### Related Rules
Apply RemembersConversations for Multi-Turn Agents (05-rules.md)

---

## Anti-Pattern 2: No Conversation Pruning — Unbounded History Growth

### Category
Performance

### Description
Conversation history accumulates indefinitely — millions of rows slow inserts, context window exceeds model limits.

### Preferred Alternative
Implement TTL, archiving, or sliding window pruning on conversation messages.

### Detection Checklist
- [ ] No pruning mechanism
- [ ] Growing `agent_conversations` table
- [ ] Context window exceeded errors

---

## Anti-Pattern 3: Storing Full History in a Single JSON Column

### Category
Performance

### Description
Storing the entire conversation as a JSON blob in one column — no querying, no partial loading, unbounded column growth.

### Preferred Alternative
Use the SDK's dedicated `agent_conversations` and `agent_conversation_messages` tables with individual message rows.

### Detection Checklist
- [ ] JSON column for conversation history
- [ ] Cannot query individual messages
- [ ] Column size grows unbounded

---

## Anti-Pattern 4: Not Scoping Conversations by User/Session

### Category
Security

### Description
All conversations share the same scope — User A sees User B's history or conversation ID collisions.

### Preferred Alternative
Scope conversations by a unique identifier (user ID, session ID, tenant ID) in the agent constructor.

### Detection Checklist
- [ ] Missing user ID scoping
- [ ] Cross-user conversation leakage
- [ ] Wrong history loaded per request

---

## Anti-Pattern 5: Relying on Memory for Context Beyond Model Limits

### Category
Reliability

### Description
Conversation grows to 200K tokens but model limit is 128K — truncation loses critical context or request fails.

### Preferred Alternative
Implement sliding window summarization. Summarize old turns and include only recent turns verbatim.

### Detection Checklist
- [ ] History regularly exceeds model limit
- [ ] Token limit errors on long conversations
- [ ] No summarization strategy
