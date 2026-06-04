# Decomposition: Agent Memory & State

## Topic Overview

Agent memory refers to how an agent persists and retrieves information beyond the current context window. While the LLM's context window serves as working memory (limited to ~4K-200K tokens depending on model), long-running agents need persistent storage for facts, conversation history, learned preferences, and task progress. State management covers the lifecycle of agent state â€” creation, mutation, persistence, and cleanup. In the Laravel ecosystem, memory backends are implemented as Eloquent models, Redis stores, or vector databases.

## Decomposition Strategy

This Knowledge Unit is atomic. It covers a single well-bounded concept with independent decisions, tradeoffs, and architecture guidance.

## Proposed Folder Structure
```
ku-06/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
```

## Knowledge Unit Inventory

### Agent Memory & State
- **Purpose:** Agent memory refers to how an agent persists and retrieves information beyond the current context window. While the LLM's context window serves as working memory (limited to ~4K-200K tokens depending on model), long-running agents need persistent storage for facts, conversation history, learned preferences, and task progress. State management covers the lifecycle of agent state â€” creation, mutation, persistence, and cleanup. In the Laravel ecosystem, memory backends are implemented as Eloquent models, Redis stores, or vector databases.
- **Difficulty:** Intermediate
- **Dependencies:** ku-01, ku-02, ku-04, ku-01, ku-01

## Dependency Graph
**Depends on:**
- ku-01
- ku-02
- ku-04
- ku-01
- ku-01

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- **Ephemeral Memory (Context Window):** The current conversation history. Lost when the session ends. Limited by model context length.
- **Conversation Memory:** Persisted message history that spans multiple sessions. Stored in a database or cache, loaded into context on each turn.
- **Semantic Memory:** Vector-embedded facts and knowledge about the user, domain, or past interactions. Retrieved via similarity search.
- **Working Memory:** Temporary state during a single task execution (tool results, partial plans, intermediate calculations).
- **Memory Consolidation:** The process of extracting salient information from working memory and storing it in long-term memory.
- **Memory Retrieval:** Querying long-term memory to inject relevant context into the current window (e.g., "user prefers concise answers").
- **State Machine:** The agent's status lifecycle (idle â†’ processing â†’ waiting_for_tool â†’ completed â†’ failed). Transitions triggered by events.

**Out of scope:**
- ku-01 topics covered in their respective KUs
- ku-02 topics covered in their respective KUs
- ku-04 topics covered in their respective KUs
- ku-01 topics covered in their respective KUs
- ku-01 topics covered in their respective KUs

## Future Expansion Opportunities
The topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

- No Knowledge Unit is overloaded
- No major concept is missing
- Boundaries are clear
- Future phases can operate on individual units
- The structure can scale without reorganization

