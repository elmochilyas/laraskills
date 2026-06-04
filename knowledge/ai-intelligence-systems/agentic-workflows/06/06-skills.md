# Skills

## Skill 1: Implement agent memory with ephemeral and persistent storage separation

### Purpose
Separate agent memory into ephemeral (current context window) and persistent (stored facts, preferences, history) with conversation memory, semantic memory via vector embeddings, working memory for task execution, and proactive summarization to prevent context bloat.

### When To Use
- Use when agents need to remember information across multiple conversation turns
- Use when you need long-term memory for user preferences, learned facts, and history
- Use when implementing semantic memory via vector embeddings for similarity-based retrieval
- Use when working memory needs to persist tool results and intermediate calculations during task execution

### When NOT To Use
- Do NOT use for stateless single-turn agents that don't need to remember context
- Do NOT use without memory consolidation — persisting raw conversation history causes unbounded growth
- Do NOT use when context window is sufficient for the entire task (no external memory needed)

### Prerequisites
- Laravel AI SDK with conversation management support
- Database or Redis for persistent memory storage
- Vector database for semantic memory (optional)
- Understanding of memory consolidation and retrieval patterns

### Inputs
- Conversation messages (current turn)
- Past conversation history (from persistent storage)
- User preferences and learned facts (semantic memory)
- Working memory state (tool results, partial plans)

### Workflow
1. Separate memory types:
   - Ephemeral: current conversation history in context window
   - Conversation memory: persisted message history across sessions
   - Semantic memory: vector-embedded facts retrieved via similarity search
   - Working memory: temporary state during single task execution
2. Implement conversation memory:
   - Store messages in database with session_id, role, content, timestamp
   - Load recent N turns into context on each request
   - Summarize older turns when approaching context limit
3. Implement semantic memory:
   - Extract salient facts from conversations via LLM summarization
   - Embed facts and store in vector database
   - Retrieve relevant facts on each new conversation turn
4. Implement memory consolidation:
   - Periodically extract key information from working/ephemeral memory
   - Store consolidated facts in persistent memory
   - Discard raw conversation history after consolidation
5. Implement memory retrieval:
   - Query semantic memory for relevant facts before each turn
   - Load conversation memory summary for session continuity
6. Never persist entire raw message history without summarization

### Validation Checklist
- [ ] Ephemeral and persistent memory are explicitly separated
- [ ] Conversation memory is persisted across sessions with session_id
- [ ] Semantic memory stores vector-embedded facts
- [ ] Memory consolidation extracts key info and discards raw history
- [ ] Memory retrieval injects relevant context into current window
- [ ] Working memory persists tool results during task execution
- [ ] Context window is managed proactively (summarize before limit)
- [ ] Memory storage has bounded growth (summarization prevents bloat)
- [ ] User can control what the agent remembers (delete/preferences)

### Common Failures
- **Persisting raw history**: Every message stored verbatim forever — unbounded storage, context bloat
- **No memory consolidation**: Agent remembers everything equally — can't distinguish important facts from chit-chat
- **Semantic memory not used**: No vector search for relevant facts — user says "as I mentioned before" and agent doesn't remember
- **Working memory lost**: Tool results not persisted between steps — next turn loses context
- **No memory control**: User can't delete what agent remembers — privacy concerns

### Decision Points
- **Memory backend**: Database (MySQL/Postgres) for conversation, Redis for working, Vector DB for semantic
- **Consolidation strategy**: Per-turn extraction (detailed, expensive) vs. periodic batch (efficient, delayed)
- **Retention policy**: Session-based (auto-expire) vs. permanent (user-controlled) — match compliance needs
- **Summary granularity**: Full conversation summary vs. extracted facts only — facts are more useful

### Performance Considerations
- Memory retrieval adds latency (DB query: 5-50ms, vector search: 10-100ms)
- Conversation history loading increases prompt token count — limit to last N turns
- Memory consolidation is expensive (requires LLM call) — run asynchronously
- Semantic memory vector search is fast with ANN indexes (>10ms for 1M vectors)
- Cache frequent memory retrievals for identical contexts

### Security Considerations
- User memory data is sensitive — encrypt at rest and in transit
- Users should be able to view, export, and delete stored memories
- Don't persist sensitive PII in memory — pseudonymize before storage
- Agent should not access other users' memories — enforce session isolation
- Memory retention policies should comply with GDPR, CCPA, etc.

### Related Rules
- R1: Separate Ephemeral from Persistent Memory — never persist raw history without summarization

### Related Skills
- Design multi-agent systems with strict tool boundaries
- Implement agent planning and reasoning strategies
- Implement conversation memory with Laravel AI SDK
- Build agent orchestration frameworks with async execution

### Success Criteria
- Agent recalls information from earlier turns in the same session
- Agent recalls learned facts across sessions (semantic memory)
- Conversation memory has bounded growth (summarization prevents bloat)
- Working memory persists tool results during task execution
- Memory consolidation extracts and stores important facts efficiently
- Users can view, export, and delete their stored memories
