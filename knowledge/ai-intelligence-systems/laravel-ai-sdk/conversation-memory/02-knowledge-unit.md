# Knowledge Unit: Conversation Memory

## Metadata

- **ID:** KU-007
- **Subdomain:** LLM Provider Abstraction & Integration
- **Slug:** conversation-memory
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

The Laravel AI SDK provides persistent conversation memory via the `RemembersConversations` trait. Adding this trait to an agent class automatically stores and retrieves conversation history from the database. Memory is session-scoped (per conversation ID), supports multi-turn context, and integrates with the agent's tool-calling and streaming. Conversations are stored in `agent_conversations` and `agent_conversation_messages` tables.

## Core Concepts

- `RemembersConversations` trait: Enables automatic DB-backed conversation persistence
- `agent_conversations` table: Stores conversation metadata (context, user identifier, created_at)
- `agent_conversation_messages` table: Stores individual messages with role (user/assistant/tool) and content
- Conversation ID: Scopes messages to a specific conversation session
- Context retention: Previous turns are included in subsequent prompts for coherent multi-turn interaction
- Pruning: Old conversations should be archived or deleted to prevent table bloat

## Mental Models

- **Session for AI**: Like Laravel session management but scoped to AI conversations — persist state across turns without manual message passing.
- **Chat history array**: The trait manages what you'd otherwise build as a `$messages[]` array — appending user/assistant pairs across requests.

## Internal Mechanics

When `RemembersConversations` is applied:
1. On first prompt, SDK creates a new conversation record (or resumes existing one via conversation ID)
2. User message is stored in `agent_conversation_messages`
3. Agent response (including tool calls and results) is stored
4. On subsequent calls with same conversation ID, SDK loads all prior messages and includes them in context
5. Context truncation: SDK respects model context window — oldest messages are dropped first when exceeding token limit
6. Message limit: configurable max messages per conversation (default: unlimited)

## Patterns

- **Conversation ID from route**: Pass conversation ID via URL parameter for multi-page chat experiences
- **User-scoped conversations**: Store conversation ID in session or associate with authenticated user
- **Temporary conversations**: Generate new conversation ID for stateless interactions, persist only for response
- **Context budget**: Implement manual context management — truncate or summarize old turns to stay within token limits

## Architectural Decisions

- **Decision**: Database storage vs. cache → Database (with migration). Reason: Durable, queryable, scalable, supports per-conversation TTL and analytics.
- **Decision**: Separate tables vs. JSON column → Dedicated tables with proper relational schema. Reason: Enables querying, filtering, prunability, and future migration to vector storage for conversational RAG.
- **Decision**: Automatic context management vs. manual → SDK handles context window limits by dropping oldest messages. Reason: Simplifies agent development; advanced users can implement custom context strategies.

## Tradeoffs

| Tradeoff | Pro | Con |
|----------|-----|-----|
| DB persistence | Durable, queryable, scalable | Requires migration, disk storage |
| Automatic context truncation | Prevents token overflow | May drop important context from early conversation |
| Per-conversation tables | Clean separation, easy pruning | More tables, more joins |

## Performance Considerations

- Messages table grows with conversation length — implement TTL or archival after 30/90 days
- Loading full conversation history on every request — for long conversations, consider summarization or sliding window
- Index `conversation_id` and `created_at` columns for efficient queries
- For high-traffic agents, consider Redis for ephemeral memory with DB archiving for persistence

## Production Considerations

- Run `php artisan migrate` to create memory tables before using `RemembersConversations`
- Implement conversation pruning: scheduled job deleting conversations older than N days
- Associate conversations with authenticated users for retrieval and privacy compliance
- Monitor `agent_conversation_messages` table size — grows proportionally to usage
- Consider summarization for very long conversations — periodically compress old turns into a summary message
- Export conversation data for model improvement / compliance if needed

## Common Mistakes

- Not including the `RemembersConversations` trait but expecting multi-turn memory
- Never pruning old conversations — table grows indefinitely, slowing queries
- Associating all conversations with a generic ID — mixes user contexts, leaks data
- Relying on automatic context management for very long conversations — old critical context may be silently dropped
- Not passing the same conversation ID on subsequent requests — creates new conversations instead of resuming

## Failure Modes

- **Context window overflow**: Long conversations exceed model token limit — implement sliding window or summary
- **Message table bloat**: Millions of rows degrade query performance — implement TTL and archiving
- **Cross-user data leakage**: Missing user scoping in conversation ID — always scope to authenticated user
- **Conversation corruption**: Manual message injection or deletion breaks conversation flow — validate message sequence

## Ecosystem Usage

- Customer support chatbots with persistent session history
- Interview/assessment agents that need context across questions
- Long-running document analysis with iterative refinement
- Multi-turn tool-using agents that build context over several interactions

## Related Knowledge Units

- KU-001: Laravel AI SDK Architecture
- KU-011: Agent Architecture Fundamentals
- KU-015: Queued Agent Execution

## Research Notes

- Laravel AI SDK v0.1.0+ includes `RemembersConversations`
- Tables: `agent_conversations` (id, context, user_identifier, created_at, updated_at) and `agent_conversation_messages` (id, conversation_id, role, content, metadata, created_at)
- No built-in conversation summarization — application layer must implement
- SDK uses database session, but custom memory drivers could be implemented (not documented)
